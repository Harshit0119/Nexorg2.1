-- ==============================================================================
-- NEXORG 2.1 - ACADEMIC RESOURCE PLANNING PLATFORM
-- PRODUCTION POSTGRESQL & SUPABASE SCHEMA MIGRATION
-- Multi-Tenant Isolation, RBAC, Multi-Department Faculty M:N, Clash-Free Architecture
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Roles
CREATE TYPE user_role AS ENUM ('HEAD', 'ADMIN', 'FACULTY');

-- Room Types
CREATE TYPE room_facility_type AS ENUM ('LECTURE_HALL', 'SMART_CLASSROOM', 'SEMINAR_HALL', 'AUDITORIUM');

-- Availability Slot Types
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PREFER_NOT');

-- Days of the week (1 = Monday ... 6 = Saturday)
CREATE TYPE academic_day AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- Allocation Types
CREATE TYPE workload_component AS ENUM ('LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'PROJECT_MENTORSHIP');

-- ------------------------------------------------------------------------------
-- 2. CORE TENANCY: INSTITUTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "MIT-ENG", "STAN-TECH"
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC+05:30',
    address TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE',
    settings JSONB NOT NULL DEFAULT '{
        "working_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
        "day_start_time": "09:00:00",
        "day_end_time": "17:00:00",
        "period_duration_minutes": 60,
        "max_consecutive_faculty_hours": 3,
        "default_faculty_max_hours": 18
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. USERS & PROFILES (Linked to Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FACULTY',
    phone VARCHAR(30),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_institute ON public.users(institute_id);
CREATE INDEX idx_users_role ON public.users(role);

-- ------------------------------------------------------------------------------
-- 4. DEPARTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL, -- e.g. "CSE", "AIML", "IT"
    name VARCHAR(255) NOT NULL,
    head_of_department_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    contact_email VARCHAR(255),
    building_block VARCHAR(100),
    color_accent VARCHAR(20) DEFAULT '#4F46E5',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

CREATE INDEX idx_departments_institute ON public.departments(institute_id);

-- ------------------------------------------------------------------------------
-- 5. FACULTY PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL, -- e.g. "FAC-2024-001"
    designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor', -- 'Professor', 'Associate Professor', 'Assistant Professor'
    qualification VARCHAR(255),
    max_weekly_hours INTEGER NOT NULL DEFAULT 18,
    min_weekly_hours INTEGER NOT NULL DEFAULT 12,
    cabin_number VARCHAR(50),
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, employee_id)
);

CREATE INDEX idx_faculty_institute ON public.faculty_profiles(institute_id);
CREATE INDEX idx_faculty_user ON public.faculty_profiles(user_id);

-- ------------------------------------------------------------------------------
-- 6. CRITICAL MANY-TO-MANY: FACULTY <-> DEPARTMENT ASSIGNMENTS
-- Enables Rahul to teach across CSE, AIML, and IT simultaneously
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_department_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    is_primary_department BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, department_id)
);

CREATE INDEX idx_fda_faculty ON public.faculty_department_assignments(faculty_id);
CREATE INDEX idx_fda_dept ON public.faculty_department_assignments(department_id);
CREATE INDEX idx_fda_institute ON public.faculty_department_assignments(institute_id);

-- ------------------------------------------------------------------------------
-- 7. ACADEMIC CALENDAR: SEMESTERS & SECTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Fall 2025 (Sem 3, 5, 7)"
    academic_year VARCHAR(20) NOT NULL,
    term_number INTEGER NOT NULL, -- 1 to 8
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "Section A", "AIML-B"
    student_strength INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(department_id, semester_id, name)
);

-- ------------------------------------------------------------------------------
-- 8. SUBJECTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. "CS301", "AI402"
    name VARCHAR(255) NOT NULL,
    theory_credits INTEGER NOT NULL DEFAULT 3,
    lab_credits INTEGER NOT NULL DEFAULT 1,
    lecture_hours_per_week INTEGER NOT NULL DEFAULT 3,
    lab_hours_per_week INTEGER NOT NULL DEFAULT 2,
    tutorial_hours_per_week INTEGER NOT NULL DEFAULT 0,
    preferred_facility VARCHAR(50) DEFAULT 'LECTURE_HALL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

CREATE INDEX idx_subjects_department ON public.subjects(department_id);
CREATE INDEX idx_subjects_institute ON public.subjects(institute_id);

-- ------------------------------------------------------------------------------
-- 9. FACULTY <-> SUBJECT MAPPING (SUBJECT ALLOCATION)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    is_lead_faculty BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, subject_id, academic_year)
);

-- ------------------------------------------------------------------------------
-- 10. ROOMS (Classrooms & Lecture Halls)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL, -- e.g. "LH-101", "CR-304"
    building VARCHAR(100) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL DEFAULT 70,
    facility_type room_facility_type NOT NULL DEFAULT 'SMART_CLASSROOM',
    has_projector BOOLEAN NOT NULL DEFAULT TRUE,
    has_air_conditioning BOOLEAN NOT NULL DEFAULT TRUE,
    is_shared_across_departments BOOLEAN NOT NULL DEFAULT TRUE,
    owning_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, room_number)
);

-- ------------------------------------------------------------------------------
-- 11. LABS (Specialized Computing & Experimental Laboratories)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    lab_number VARCHAR(50) NOT NULL, -- e.g. "LAB-CS01", "GPU-CLUSTER-02"
    name VARCHAR(255) NOT NULL, -- e.g. "Deep Learning & AI Systems Lab"
    building VARCHAR(100) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 2,
    pc_count INTEGER NOT NULL DEFAULT 40,
    capacity INTEGER NOT NULL DEFAULT 40,
    specialized_hardware TEXT, -- e.g. "RTX 4090 Workstations, Cisco Routers"
    has_ups_backup BOOLEAN NOT NULL DEFAULT TRUE,
    owning_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, lab_number)
);

-- ------------------------------------------------------------------------------
-- 12. FACULTY AVAILABILITY MATRIX
-- Tracks day-wise time blocks & preferences across the whole institution
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'AVAILABLE',
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_faculty ON public.faculty_availability(faculty_id, day_of_week);

-- ------------------------------------------------------------------------------
-- 13. WORKLOAD ALLOCATIONS (Current load vs capacity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workload_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    component workload_component NOT NULL DEFAULT 'LECTURE',
    hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 3.0,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workload_faculty ON public.workload_allocations(faculty_id);
CREATE INDEX idx_workload_department ON public.workload_allocations(department_id);

-- ------------------------------------------------------------------------------
-- 14. TIMETABLE ARCHITECTURE & CLASH PREVENTION SLOTS
-- Prepares strong schema for future timetable generator & real-time conflict checker
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_lab_session BOOLEAN NOT NULL DEFAULT FALSE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_slot_window CHECK (end_time > start_time),
    CONSTRAINT location_provided CHECK (room_id IS NOT NULL OR lab_id IS NOT NULL)
);

CREATE INDEX idx_slot_clash_faculty ON public.timetable_slots(faculty_id, day_of_week, start_time, end_time);
CREATE INDEX idx_slot_clash_room ON public.timetable_slots(room_id, day_of_week, start_time, end_time);
CREATE INDEX idx_slot_clash_lab ON public.timetable_slots(lab_id, day_of_week, start_time, end_time);
CREATE INDEX idx_slot_clash_section ON public.timetable_slots(section_id, day_of_week, start_time, end_time);

-- ------------------------------------------------------------------------------
-- 15. POSTGRES STORED PROCEDURES FOR CROSS-DEPARTMENT CONFLICT DETECTION
-- Core engine: If Rahul is assigned in CSE 10:00-11:00, AIML and IT are locked!
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_faculty_clash(
    p_faculty_id UUID,
    p_day academic_day,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_slot_id UUID DEFAULT NULL
)
RETURNS TABLE (
    has_clash BOOLEAN,
    clashing_slot_id UUID,
    clashing_department_code VARCHAR(30),
    clashing_subject_code VARCHAR(50),
    clashing_start TIME,
    clashing_end TIME
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE AS has_clash,
        ts.id AS clashing_slot_id,
        d.code AS clashing_department_code,
        s.code AS clashing_subject_code,
        ts.start_time AS clashing_start,
        ts.end_time AS clashing_end
    FROM public.timetable_slots ts
    JOIN public.departments d ON ts.department_id = d.id
    JOIN public.subjects s ON ts.subject_id = s.id
    WHERE ts.faculty_id = p_faculty_id
      AND ts.day_of_week = p_day
      AND (p_exclude_slot_id IS NULL OR ts.id <> p_exclude_slot_id)
      AND (ts.start_time < p_end_time AND ts.end_time > p_start_time)
    LIMIT 1;
END;
$$;

-- ------------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Enforcement & RBAC (HEAD, ADMIN, FACULTY)
-- ------------------------------------------------------------------------------

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workload_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's institute
CREATE OR REPLACE FUNCTION public.current_user_institute_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT institute_id FROM public.users WHERE id = auth.uid();
$$;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role LANGUAGE sql STABLE AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- INSTITUTES POLICIES
CREATE POLICY "Institutes: Head full access"
    ON public.institutes FOR ALL
    USING (id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

CREATE POLICY "Institutes: Members can view own institute"
    ON public.institutes FOR SELECT
    USING (id = public.current_user_institute_id());

-- USERS POLICIES
CREATE POLICY "Users: View same institute users"
    ON public.users FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Users: Head manage all institute users"
    ON public.users FOR ALL
    USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

CREATE POLICY "Users: Self update profile"
    ON public.users FOR UPDATE
    USING (id = auth.uid());

-- DEPARTMENTS POLICIES
CREATE POLICY "Departments: Members view"
    ON public.departments FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Departments: Head full management"
    ON public.departments FOR ALL
    USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

CREATE POLICY "Departments: Admin manage own department"
    ON public.departments FOR UPDATE
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN' 
        AND head_of_department_id = auth.uid()
    );

-- FACULTY PROFILES & MULTI-DEPARTMENT ASSIGNMENTS
CREATE POLICY "FacultyProfiles: Institute members view"
    ON public.faculty_profiles FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "FacultyProfiles: Head & Admin manage"
    ON public.faculty_profiles FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

CREATE POLICY "FacultyDeptAssignments: View"
    ON public.faculty_department_assignments FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "FacultyDeptAssignments: Head & Admin manage"
    ON public.faculty_department_assignments FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- SUBJECTS POLICIES
CREATE POLICY "Subjects: Institute members view"
    ON public.subjects FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Subjects: Head & Admin manage"
    ON public.subjects FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- ROOMS & LABS POLICIES
CREATE POLICY "Rooms: View"
    ON public.rooms FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Rooms: Head & Admin manage"
    ON public.rooms FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

CREATE POLICY "Labs: View"
    ON public.labs FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Labs: Head & Admin manage"
    ON public.labs FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- FACULTY AVAILABILITY POLICIES
CREATE POLICY "Availability: View all in institute"
    ON public.faculty_availability FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Availability: Faculty manage own availability"
    ON public.faculty_availability FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND (
            faculty_id IN (SELECT id FROM public.faculty_profiles WHERE user_id = auth.uid())
            OR public.current_user_role() IN ('HEAD', 'ADMIN')
        )
    );

-- WORKLOAD ALLOCATIONS POLICIES
CREATE POLICY "Workload: View in institute"
    ON public.workload_allocations FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Workload: Head & Admin manage"
    ON public.workload_allocations FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- TIMETABLE SLOTS POLICIES
CREATE POLICY "Timetable: View in institute"
    ON public.timetable_slots FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Timetable: Head & Admin manage"
    ON public.timetable_slots FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );
