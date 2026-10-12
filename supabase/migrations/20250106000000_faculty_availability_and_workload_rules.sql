-- ==============================================================================
-- NEXORG 2.1 - FACULTY AVAILABILITY & WORKLOAD MANAGEMENT MODULE
-- SQL MIGRATION & RLS POLICIES
-- Working Days, Period Slots, Unavailable Matrix, Workload Rules & Limits
-- ==============================================================================

-- 1. INSTITUTE WORKING DAYS CONFIGURATION
CREATE TABLE IF NOT EXISTS public.institute_working_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    day_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_iwd_institute ON public.institute_working_days(institute_id);

-- 2. INSTITUTE PERIOD & TIME SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.institute_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 14),
    label VARCHAR(50) NOT NULL, -- e.g. "Period 1", "Lunch Break", "Period 5"
    slot_type VARCHAR(30) NOT NULL DEFAULT 'LECTURE' 
        CHECK (slot_type IN ('LECTURE', 'PRACTICAL', 'LUNCH_BREAK', 'RECESS', 'ASSEMBLY')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, slot_number),
    CONSTRAINT valid_slot_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_its_institute ON public.institute_time_slots(institute_id);
CREATE INDEX IF NOT EXISTS idx_its_slot_num ON public.institute_time_slots(institute_id, slot_number);

-- 3. FACULTY UNAVAILABLE SLOTS TABLE (Per-Period Blocked Times)
CREATE TABLE IF NOT EXISTS public.faculty_unavailable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 14),
    slot_id UUID REFERENCES public.institute_time_slots(id) ON DELETE SET NULL,
    reason VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_fus_faculty ON public.faculty_unavailable_slots(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fus_day_period ON public.faculty_unavailable_slots(day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_fus_institute ON public.faculty_unavailable_slots(institute_id);

-- 4. WORKLOAD RULES TABLE (Institutional & Departmental Policies)
CREATE TABLE IF NOT EXISTS public.workload_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    rule_name VARCHAR(120) NOT NULL,
    max_hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 18.0 CHECK (max_hours_per_week BETWEEN 4 AND 40),
    min_hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 12.0 CHECK (min_hours_per_week BETWEEN 2 AND 30),
    max_lectures_per_day INTEGER NOT NULL DEFAULT 4 CHECK (max_lectures_per_day BETWEEN 1 AND 8),
    max_consecutive_lectures INTEGER NOT NULL DEFAULT 2 CHECK (max_consecutive_lectures BETWEEN 1 AND 5),
    max_practical_hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 8.0 CHECK (max_practical_hours_per_week BETWEEN 0 AND 20),
    allow_saturday_teaching BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_workload_hours_range CHECK (max_hours_per_week >= min_hours_per_week)
);

CREATE INDEX IF NOT EXISTS idx_wr_institute ON public.workload_rules(institute_id);
CREATE INDEX IF NOT EXISTS idx_wr_department ON public.workload_rules(department_id);

-- 5. WORKLOAD LIMITS TABLE (Specific Faculty Individual Overrides)
CREATE TABLE IF NOT EXISTS public.workload_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.workload_rules(id) ON DELETE SET NULL,
    max_weekly_hours NUMERIC(4, 1) NOT NULL DEFAULT 18.0 CHECK (max_weekly_hours BETWEEN 4 AND 40),
    min_weekly_hours NUMERIC(4, 1) NOT NULL DEFAULT 12.0 CHECK (min_weekly_hours BETWEEN 2 AND 30),
    max_lectures_per_day INTEGER NOT NULL DEFAULT 4 CHECK (max_lectures_per_day BETWEEN 1 AND 8),
    max_consecutive_lectures INTEGER NOT NULL DEFAULT 2 CHECK (max_consecutive_lectures BETWEEN 1 AND 5),
    max_practical_hours NUMERIC(4, 1) NOT NULL DEFAULT 8.0 CHECK (max_practical_hours BETWEEN 0 AND 20),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id),
    CONSTRAINT valid_faculty_workload_range CHECK (max_weekly_hours >= min_weekly_hours)
);

CREATE INDEX IF NOT EXISTS idx_wl_faculty ON public.workload_limits(faculty_id);
CREATE INDEX IF NOT EXISTS idx_wl_institute ON public.workload_limits(institute_id);

-- 6. EXTEND FACULTY AVAILABILITY IF NEEDED
ALTER TABLE public.faculty_availability
ADD COLUMN IF NOT EXISTS period_number INTEGER CHECK (period_number BETWEEN 1 AND 14),
ADD COLUMN IF NOT EXISTS preference_level VARCHAR(30) DEFAULT 'NEUTRAL'
    CHECK (preference_level IN ('PREFERRED', 'NEUTRAL', 'BLOCKED'));

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- A. Institute Working Days RLS
ALTER TABLE public.institute_working_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WorkingDays: View in institute"
    ON public.institute_working_days FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "WorkingDays: Head manage"
    ON public.institute_working_days FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

-- B. Institute Time Slots RLS
ALTER TABLE public.institute_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TimeSlots: View in institute"
    ON public.institute_time_slots FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "TimeSlots: Head manage"
    ON public.institute_time_slots FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

-- C. Faculty Unavailable Slots RLS
ALTER TABLE public.faculty_unavailable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UnavailableSlots: View in institute"
    ON public.faculty_unavailable_slots FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "UnavailableSlots: Head full access"
    ON public.faculty_unavailable_slots FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "UnavailableSlots: Admin manage dept faculty"
    ON public.faculty_unavailable_slots FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

CREATE POLICY "UnavailableSlots: Faculty manage own slots"
    ON public.faculty_unavailable_slots FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND faculty_id IN (
            SELECT fp.id FROM public.faculty_profiles fp 
            WHERE fp.user_id = auth.uid()
        )
    );

-- D. Workload Rules RLS
ALTER TABLE public.workload_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WorkloadRules: View in institute"
    ON public.workload_rules FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "WorkloadRules: Head manage all"
    ON public.workload_rules FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "WorkloadRules: Admin manage dept rules"
    ON public.workload_rules FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- E. Workload Limits RLS
ALTER TABLE public.workload_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WorkloadLimits: View in institute"
    ON public.workload_limits FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "WorkloadLimits: Head manage all"
    ON public.workload_limits FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "WorkloadLimits: Admin manage"
    ON public.workload_limits FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- 8. TIMETABLE CLASH CHECK UTILITY FUNCTION
CREATE OR REPLACE FUNCTION public.check_faculty_period_availability(
    p_faculty_id UUID,
    p_day academic_day,
    p_period INTEGER
)
RETURNS TABLE (
    is_available BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if marked unavailable in faculty_unavailable_slots
    IF EXISTS (
        SELECT 1 FROM public.faculty_unavailable_slots fus
        WHERE fus.faculty_id = p_faculty_id
          AND fus.day_of_week = p_day
          AND fus.period_number = p_period
    ) THEN
        RETURN QUERY
        SELECT FALSE, fus.reason::TEXT
        FROM public.faculty_unavailable_slots fus
        WHERE fus.faculty_id = p_faculty_id
          AND fus.day_of_week = p_day
          AND fus.period_number = p_period
        LIMIT 1;
        RETURN;
    END IF;

    -- Otherwise available
    RETURN QUERY SELECT TRUE, 'Available for scheduling'::TEXT;
END;
$$;
