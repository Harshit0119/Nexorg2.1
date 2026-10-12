-- ==============================================================================
-- NEXORG 2.1 - FACULTY MANAGEMENT MODULE
-- SQL MIGRATION & RLS POLICIES
-- Multi-Department M:N, Subject Allocation, Workload Balancing & Availability
-- ==============================================================================

-- 1. EXTEND FACULTY PROFILES WITH EMPLOYMENT ATTRIBUTES
ALTER TABLE public.faculty_profiles
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME'
CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'ADJUNCT', 'VISITING')),
ADD COLUMN IF NOT EXISTS joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30);

-- 2. FACULTY SUBJECT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.faculty_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    component workload_component NOT NULL DEFAULT 'LECTURE',
    hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 3.0,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    is_lead_faculty BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, subject_id, component, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_fsa_faculty ON public.faculty_subject_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fsa_dept ON public.faculty_subject_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_fsa_subject ON public.faculty_subject_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_fsa_institute ON public.faculty_subject_assignments(institute_id);

-- 3. WORKLOAD AGGREGATION VIEW FOR REPORTING & TIMETABLE PREPARATION
CREATE OR REPLACE VIEW public.faculty_workload_metrics AS
SELECT 
    fp.id AS faculty_id,
    fp.institute_id,
    fp.employee_id,
    u.full_name,
    fp.designation,
    fp.max_weekly_hours,
    fp.min_weekly_hours,
    COALESCE(SUM(fsa.hours_per_week), 0) AS total_weekly_hours,
    COUNT(DISTINCT fsa.subject_id) AS assigned_subjects_count,
    ROUND((COALESCE(SUM(fsa.hours_per_week), 0) / NULLIF(fp.max_weekly_hours, 0)) * 100, 1) AS utilization_percentage,
    CASE 
        WHEN COALESCE(SUM(fsa.hours_per_week), 0) > fp.max_weekly_hours THEN 'OVERLOAD'
        WHEN COALESCE(SUM(fsa.hours_per_week), 0) < fp.min_weekly_hours THEN 'UNDERLOAD'
        ELSE 'BALANCED'
    END AS workload_status
FROM public.faculty_profiles fp
JOIN public.users u ON fp.user_id = u.id
LEFT JOIN public.faculty_subject_assignments fsa ON fp.id = fsa.faculty_id
GROUP BY fp.id, fp.institute_id, fp.employee_id, u.full_name, fp.designation, fp.max_weekly_hours, fp.min_weekly_hours;

-- 4. RLS POLICIES FOR FACULTY SUBJECT ASSIGNMENTS
ALTER TABLE public.faculty_subject_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FacultySubjectAssignments: View in institute"
    ON public.faculty_subject_assignments FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "FacultySubjectAssignments: Head manage all"
    ON public.faculty_subject_assignments FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "FacultySubjectAssignments: Admin manage department"
    ON public.faculty_subject_assignments FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );
