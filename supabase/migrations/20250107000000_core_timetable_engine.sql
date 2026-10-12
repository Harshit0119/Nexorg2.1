-- ==============================================================================
-- NEXORG 2.1 - CORE TIMETABLE ENGINE SCHEMA & RLS POLICIES
-- Enterprise Clash-Free Timetable Generator, Multi-Department Cross-Locking,
-- Conflict Center, and Generation Logs Architecture
-- ==============================================================================

-- 1. TIMETABLES TABLE (Master Container for Academic Schedules)
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL DEFAULT 'ODD' CHECK (term IN ('ODD', 'EVEN', 'ANNUAL', 'SUMMER')),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
    health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    total_slots INTEGER NOT NULL DEFAULT 0,
    conflicts_count INTEGER NOT NULL DEFAULT 0,
    generation_strategy VARCHAR(50) NOT NULL DEFAULT 'CSP_BACKTRACKING',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetables_institute ON public.timetables(institute_id);
CREATE INDEX IF NOT EXISTS idx_timetables_status ON public.timetables(institute_id, status);

-- 2. TIMETABLE ENTRIES TABLE (Granular Class & Lab Assignments)
CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
    day_of_week academic_day NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 14),
    slot_id UUID REFERENCES public.institute_time_slots(id) ON DELETE SET NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    entry_type VARCHAR(30) NOT NULL DEFAULT 'THEORY_LECTURE' 
        CHECK (entry_type IN ('THEORY_LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'SEMINAR')),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_entry_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_te_timetable ON public.timetable_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_te_faculty_slot ON public.timetable_entries(faculty_id, day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_te_section_slot ON public.timetable_entries(section_id, day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_te_room_slot ON public.timetable_entries(room_id, day_of_week, period_number) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_te_lab_slot ON public.timetable_entries(lab_id, day_of_week, period_number) WHERE lab_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_te_department ON public.timetable_entries(department_id);

-- 3. TIMETABLE RULES TABLE (Dynamic Constraints Configuration)
CREATE TABLE IF NOT EXISTS public.timetable_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL 
        CHECK (rule_type IN (
            'FACULTY_MAX_HOURS',
            'FACULTY_DAILY_MAX',
            'FACULTY_CONSECUTIVE_LIMIT',
            'ROOM_CAPACITY',
            'LAB_CATEGORY_MATCH',
            'NO_CONCURRENT_SECTION',
            'NO_CONCURRENT_FACULTY_ACROSS_DEPTS',
            'PREFERRED_TIME_BONUS'
        )),
    rule_name VARCHAR(150) NOT NULL,
    rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_hard_constraint BOOLEAN NOT NULL DEFAULT TRUE,
    weight NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tr_institute ON public.timetable_rules(institute_id);

-- 4. TIMETABLE CONFLICTS TABLE (Conflict Center Diagnostics)
CREATE TABLE IF NOT EXISTS public.timetable_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL 
        CHECK (conflict_type IN (
            'FACULTY_CLASH',
            'ROOM_CLASH',
            'LAB_CLASH',
            'DEPARTMENT_CLASH',
            'SECTION_CLASH',
            'WORKLOAD_OVERLOAD',
            'AVAILABILITY_VIOLATION'
        )),
    severity VARCHAR(20) NOT NULL DEFAULT 'CRITICAL' 
        CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'WARNING')),
    description TEXT NOT NULL,
    primary_entry_id UUID REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
    conflicting_entry_id UUID REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty_profiles(id) ON DELETE SET NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    day_of_week academic_day NOT NULL,
    period_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNRESOLVED' 
        CHECK (status IN ('UNRESOLVED', 'RESOLVED', 'IGNORED')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tc_timetable ON public.timetable_conflicts(timetable_id);
CREATE INDEX IF NOT EXISTS idx_tc_status ON public.timetable_conflicts(timetable_id, status);

-- 5. GENERATION LOGS TABLE (Algorithmic Progress & Diagnostics Trace)
CREATE TABLE IF NOT EXISTS public.generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    run_id VARCHAR(64) NOT NULL,
    log_level VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    stage VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gl_run_id ON public.generation_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_gl_timetable ON public.generation_logs(timetable_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR TIMETABLE ENGINE
-- ==============================================================================

-- TIMETABLES RLS
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timetables: View in institute" 
ON public.timetables FOR SELECT 
USING (
    institute_id = public.current_user_institute_id() AND
    (status = 'PUBLISHED' OR public.current_user_role() IN ('HEAD', 'ADMIN'))
);

CREATE POLICY "Timetables: Head manage all" 
ON public.timetables FOR ALL 
USING (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() = 'HEAD'
);

CREATE POLICY "Timetables: Admin view and generate draft" 
ON public.timetables FOR INSERT 
WITH CHECK (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() IN ('HEAD', 'ADMIN')
);

-- TIMETABLE ENTRIES RLS
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entries: View in institute" 
ON public.timetable_entries FOR SELECT 
USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Entries: Head full access" 
ON public.timetable_entries FOR ALL 
USING (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() = 'HEAD'
);

CREATE POLICY "Entries: Admin manage department entries" 
ON public.timetable_entries FOR ALL 
USING (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() = 'ADMIN' AND
    department_id IN (
        SELECT fda.department_id 
        FROM public.faculty_department_assignments fda
        JOIN public.faculty_profiles fp ON fda.faculty_id = fp.id
        WHERE fp.user_id = auth.uid()
    )
);

-- TIMETABLE CONFLICTS RLS
ALTER TABLE public.timetable_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conflicts: View in institute" 
ON public.timetable_conflicts FOR SELECT 
USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Conflicts: Head manage" 
ON public.timetable_conflicts FOR ALL 
USING (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() = 'HEAD'
);

-- GENERATION LOGS RLS
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs: View in institute" 
ON public.generation_logs FOR SELECT 
USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Logs: Head & Admin create" 
ON public.generation_logs FOR INSERT 
WITH CHECK (
    institute_id = public.current_user_institute_id() AND 
    public.current_user_role() IN ('HEAD', 'ADMIN')
);

-- ==============================================================================
-- STORED FUNCTION: AUTOMATIC CONFLICT DETECTION & HEALTH CALCULATION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.calculate_timetable_health_score(p_timetable_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_conflicts INTEGER := 0;
    v_total_entries INTEGER := 0;
    v_health_score INTEGER := 100;
BEGIN
    SELECT COUNT(*) INTO v_total_conflicts
    FROM public.timetable_conflicts
    WHERE timetable_id = p_timetable_id AND status = 'UNRESOLVED';

    SELECT COUNT(*) INTO v_total_entries
    FROM public.timetable_entries
    WHERE timetable_id = p_timetable_id;

    IF v_total_entries = 0 THEN
        RETURN 100;
    END IF;

    -- Each critical clash deducts 15 points; minimum score is 0
    v_health_score := GREATEST(0, 100 - (v_total_conflicts * 15));

    UPDATE public.timetables
    SET health_score = v_health_score,
        conflicts_count = v_total_conflicts,
        total_slots = v_total_entries,
        updated_at = NOW()
    WHERE id = p_timetable_id;

    RETURN v_health_score;
END;
$$;
