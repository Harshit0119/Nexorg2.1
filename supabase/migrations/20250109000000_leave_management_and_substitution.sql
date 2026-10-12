-- ==============================================================================
-- NEXORG 2.1 - LEAVE MANAGEMENT & FACULTY SUBSTITUTION SYSTEM SCHEMA & RLS
-- Migration 09: Complete Leave Types, Balances, Requests, Approvals,
-- Timetable Impact Analysis, and Substitute Assignment Engine
-- ==============================================================================

-- 1. LEAVE TYPES TABLE (Pre-populated + Custom Institute Types)
CREATE TABLE IF NOT EXISTS public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    default_days_per_year NUMERIC(4, 1) NOT NULL DEFAULT 12.0,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    requires_document BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leave_type_institute_code UNIQUE (institute_id, code)
);

CREATE INDEX IF NOT EXISTS idx_leave_types_institute ON public.leave_types(institute_id);

-- 2. FACULTY LEAVES TABLE (Leave Requests)
CREATE TYPE leave_status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS public.faculty_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_profile_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4, 1) NOT NULL DEFAULT 1.0,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status leave_status_type NOT NULL DEFAULT 'PENDING',
    affected_lectures_count INTEGER NOT NULL DEFAULT 0,
    applicant_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_faculty_leaves_faculty ON public.faculty_leaves(faculty_profile_id);
CREATE INDEX IF NOT EXISTS idx_faculty_leaves_institute ON public.faculty_leaves(institute_id);
CREATE INDEX IF NOT EXISTS idx_faculty_leaves_status ON public.faculty_leaves(status);
CREATE INDEX IF NOT EXISTS idx_faculty_leaves_dates ON public.faculty_leaves(start_date, end_date);

-- 3. LEAVE BALANCES TABLE (Per Faculty, Per Leave Type, Per Academic Year)
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_profile_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    total_leaves NUMERIC(4, 1) NOT NULL DEFAULT 12.0,
    used_leaves NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_leave_balance UNIQUE (faculty_profile_id, leave_type_id, academic_year),
    CONSTRAINT chk_positive_balances CHECK (total_leaves >= 0 AND used_leaves >= 0)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_faculty ON public.leave_balances(faculty_profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_institute ON public.leave_balances(institute_id);

-- 4. LEAVE APPROVALS TABLE (Audit History of Decisions)
CREATE TABLE IF NOT EXISTS public.leave_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES public.faculty_leaves(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approver_role VARCHAR(20) NOT NULL CHECK (approver_role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('APPROVED', 'REJECTED')),
    comments TEXT,
    action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_approvals_leave ON public.leave_approvals(leave_id);

-- 5. SUBSTITUTE ASSIGNMENTS TABLE (Lectures Reassigned During Leave)
CREATE TYPE substitute_status_type AS ENUM ('PROPOSED', 'CONFIRMED', 'REJECTED', 'COMPLETED');

CREATE TABLE IF NOT EXISTS public.substitute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES public.faculty_leaves(id) ON DELETE CASCADE,
    timetable_entry_id UUID REFERENCES public.timetable_entries(id) ON DELETE SET NULL,
    original_faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    substitute_faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot_id VARCHAR(50),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
    status substitute_status_type NOT NULL DEFAULT 'PROPOSED',
    match_score NUMERIC(5, 2) DEFAULT 85.00,
    match_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_substitute_leave ON public.substitute_assignments(leave_id);
CREATE INDEX IF NOT EXISTS idx_substitute_orig_fac ON public.substitute_assignments(original_faculty_id);
CREATE INDEX IF NOT EXISTS idx_substitute_sub_fac ON public.substitute_assignments(substitute_faculty_id);
CREATE INDEX IF NOT EXISTS idx_substitute_date ON public.substitute_assignments(date);

-- 6. LEAVE NOTIFICATIONS TABLE
CREATE TYPE leave_notif_type AS ENUM (
    'LEAVE_SUBMITTED',
    'LEAVE_APPROVED',
    'LEAVE_REJECTED',
    'SUBSTITUTE_ASSIGNED',
    'SUBSTITUTE_REQUEST'
);

CREATE TABLE IF NOT EXISTS public.leave_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_id UUID REFERENCES public.faculty_leaves(id) ON DELETE CASCADE,
    type leave_notif_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_delivery_status VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLICABLE' 
        CHECK (email_delivery_status IN ('NOT_APPLICABLE', 'QUEUED', 'SENT', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_notif_user ON public.leave_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_notif_unread ON public.leave_notifications(user_id, is_read);

-- 7. LEAVE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.leave_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'FACULTY_LEAVE',
    entity_id UUID,
    details JSONB DEFAULT '{}'::JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_audit_inst ON public.leave_audit_logs(institute_id);
CREATE INDEX IF NOT EXISTS idx_leave_audit_time ON public.leave_audit_logs(created_at DESC);

-- ==============================================================================
-- 8. TIMETABLE IMPACT ANALYSIS FUNCTION (SQL Stored Procedure)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.calculate_timetable_impact(
    p_faculty_profile_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_impacted_lectures INTEGER,
    impacted_subjects UUID[],
    impacted_departments UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER := 0;
    v_subjects UUID[];
    v_departments UUID[];
BEGIN
    SELECT 
        COUNT(*)::INTEGER,
        ARRAY_AGG(DISTINCT te.subject_id),
        ARRAY_AGG(DISTINCT te.department_id)
    INTO
        v_total,
        v_subjects,
        v_departments
    FROM public.timetable_entries te
    CROSS JOIN generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(day_date)
    WHERE te.faculty_id = p_faculty_profile_id
      AND TRIM(UPPER(TO_CHAR(d.day_date, 'DAY'))) = UPPER(te.day_of_week::TEXT);

    RETURN QUERY SELECT COALESCE(v_total, 0), COALESCE(v_subjects, ARRAY[]::UUID[]), COALESCE(v_departments, ARRAY[]::UUID[]);
END;
$$;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_audit_logs ENABLE ROW LEVEL SECURITY;

-- LEAVE TYPES POLICIES:
CREATE POLICY "Leave types viewable by institute members"
    ON public.leave_types FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Leave types manageable by HEAD and ADMIN"
    ON public.leave_types FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

-- FACULTY LEAVES POLICIES:
CREATE POLICY "Faculty can view their own leave requests"
    ON public.faculty_leaves FOR SELECT
    USING (
        faculty_profile_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
        OR
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Faculty can apply for their own leave"
    ON public.faculty_leaves FOR INSERT
    WITH CHECK (
        faculty_profile_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Faculty can cancel their pending leaves"
    ON public.faculty_leaves FOR UPDATE
    USING (
        faculty_profile_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
        AND status = 'PENDING'
    )
    WITH CHECK (
        status = 'CANCELLED'
    );

CREATE POLICY "HEAD and ADMIN can approve or reject leaves"
    ON public.faculty_leaves FOR UPDATE
    USING (
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

-- LEAVE BALANCES POLICIES:
CREATE POLICY "Faculty can view own balance, HEAD can view all"
    ON public.leave_balances FOR SELECT
    USING (
        faculty_profile_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
        OR
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "HEAD can manage leave balances"
    ON public.leave_balances FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'SUPER_ADMIN')
        )
    );

-- SUBSTITUTE ASSIGNMENTS POLICIES:
CREATE POLICY "Involved faculty and HEAD/ADMIN can view substitutions"
    ON public.substitute_assignments FOR SELECT
    USING (
        original_faculty_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
        OR
        substitute_faculty_id IN (
            SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid()
        )
        OR
        leave_id IN (
            SELECT fl.id FROM public.faculty_leaves fl
            JOIN public.users u ON u.institute_id = fl.institute_id
            WHERE u.id = auth.uid() AND u.role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "HEAD and ADMIN can manage substitute allocations"
    ON public.substitute_assignments FOR ALL
    USING (
        leave_id IN (
            SELECT fl.id FROM public.faculty_leaves fl
            JOIN public.users u ON u.institute_id = fl.institute_id
            WHERE u.id = auth.uid() AND u.role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

-- LEAVE NOTIFICATIONS POLICIES:
CREATE POLICY "Users can manage own leave notifications"
    ON public.leave_notifications FOR ALL
    USING (user_id = auth.uid());

-- LEAVE AUDIT LOGS POLICIES:
CREATE POLICY "HEAD and ADMIN can view leave audit logs"
    ON public.leave_audit_logs FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('HEAD', 'ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Authenticated users can create leave audit logs"
    ON public.leave_audit_logs FOR INSERT
    WITH CHECK (
        institute_id IN (
            SELECT institute_id FROM public.users WHERE id = auth.uid()
        )
    );
