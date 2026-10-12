import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  ShieldCheck,
  Table,
  Terminal,
  ExternalLink,
  Lock,
  Sparkles,
  Server,
  Zap
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

interface SupabaseStudioProps {
  onClose?: () => void;
}

export const SupabaseStudio: React.FC<SupabaseStudioProps> = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'rls' | 'connection'>('schema');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const sqlSchema = `-- ==============================================================================
-- NEXORG 2.1 - ACADEMIC RESOURCE PLANNING PLATFORM
-- PRODUCTION POSTGRESQL & SUPABASE SCHEMA MIGRATION
-- Multi-Tenant Isolation, RBAC, Multi-Department Faculty M:N, Clash-Free Architecture
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('HEAD', 'ADMIN', 'FACULTY');
CREATE TYPE room_facility_type AS ENUM ('LECTURE_HALL', 'SMART_CLASSROOM', 'SEMINAR_HALL', 'AUDITORIUM');
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PREFER_NOT');
CREATE TYPE academic_day AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');
CREATE TYPE workload_component AS ENUM ('LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'PROJECT_MENTORSHIP');

-- 1. INSTITUTES (Multi-Tenant Core)
CREATE TABLE public.institutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC+05:30',
    address TEXT,
    website VARCHAR(255),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USERS (RBAC linked to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FACULTY',
    phone VARCHAR(30),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEPARTMENTS
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    head_of_department_id UUID REFERENCES public.users(id),
    contact_email VARCHAR(255),
    building_block VARCHAR(100),
    color_accent VARCHAR(20) DEFAULT '#4F46E5',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

-- 4. FACULTY PROFILES
CREATE TABLE public.faculty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
    max_weekly_hours INTEGER NOT NULL DEFAULT 18,
    min_weekly_hours INTEGER NOT NULL DEFAULT 12,
    cabin_number VARCHAR(50),
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, employee_id)
);

-- 5. CRITICAL MANY-TO-MANY: FACULTY <-> DEPARTMENT ASSIGNMENTS
-- Rahul Sharma belongs to CSE, AIML, and IT simultaneously!
CREATE TABLE public.faculty_department_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    is_primary_department BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, department_id)
);

-- 6. SUBJECTS, ROOMS, LABS & TIMETABLE SLOTS ARCHITECTURE
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    theory_credits INTEGER NOT NULL DEFAULT 3,
    lab_credits INTEGER NOT NULL DEFAULT 1,
    lecture_hours_per_week INTEGER NOT NULL DEFAULT 3,
    lab_hours_per_week INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL DEFAULT 70,
    facility_type room_facility_type NOT NULL DEFAULT 'SMART_CLASSROOM',
    has_projector BOOLEAN NOT NULL DEFAULT TRUE,
    is_shared_across_departments BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, room_number)
);

CREATE TABLE public.labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    lab_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    pc_count INTEGER NOT NULL DEFAULT 40,
    capacity INTEGER NOT NULL DEFAULT 40,
    specialized_hardware TEXT,
    is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, lab_number)
);

CREATE TABLE public.faculty_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'AVAILABLE',
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workload_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    component workload_component NOT NULL DEFAULT 'LECTURE',
    hours_per_week NUMERIC(4, 1) NOT NULL DEFAULT 3.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL,
    section_id UUID NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty_profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id),
    lab_id UUID REFERENCES public.labs(id),
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CROSS-DEPARTMENT CLASH CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.check_faculty_clash(
    p_faculty_id UUID,
    p_day academic_day,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TABLE (
    has_clash BOOLEAN,
    clashing_department VARCHAR,
    clashing_start TIME,
    clashing_end TIME
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT TRUE, d.code, ts.start_time, ts.end_time
    FROM public.timetable_slots ts
    JOIN public.departments d ON ts.department_id = d.id
    WHERE ts.faculty_id = p_faculty_id
      AND ts.day_of_week = p_day
      AND (ts.start_time < p_end_time AND ts.end_time > p_start_time)
    LIMIT 1;
END;
$$;`;

  const [selectedMigration, setSelectedMigration] = useState<'all' | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09'>('all');

  const migration2 = `-- ==============================================================================
-- NEXORG 2.1 - INSTITUTE ONBOARDING, DEPARTMENT MANAGEMENT & INVITATIONS
-- SQL MIGRATION & RLS POLICIES
-- ==============================================================================

-- 1. ADD INSTITUTE TYPE
ALTER TABLE public.institutes 
ADD COLUMN IF NOT EXISTS institute_type VARCHAR(50) NOT NULL DEFAULT 'TECHNOLOGY_INSTITUTE';

-- 2. ENFORCE UNIQUE DEPARTMENT NAME WITHIN INSTITUTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_dept_name_per_institute'
    ) THEN
        ALTER TABLE public.departments 
        ADD CONSTRAINT unique_dept_name_per_institute UNIQUE (institute_id, name);
    END IF;
END $$;

-- 3. INVITATION SYSTEM TABLE
CREATE TABLE IF NOT EXISTS public.institute_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FACULTY',
    department_ids UUID[] DEFAULT ARRAY[]::UUID[],
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_inst ON public.institute_invitations(institute_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.institute_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.institute_invitations(token);

-- 4. ROW LEVEL SECURITY FOR INVITATIONS
ALTER TABLE public.institute_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations: Head full access"
    ON public.institute_invitations FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Invitations: Admin view"
    ON public.institute_invitations FOR SELECT
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );`;

  const migration3 = `-- ==============================================================================
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
    );`;

  const migration4 = `-- ==============================================================================
-- NEXORG 2.1 - ACADEMIC STRUCTURE & SUBJECT MANAGEMENT MODULE
-- SQL MIGRATION & RLS POLICIES
-- Courses, Semesters, Sections, Subjects & Section Faculty Assignments
-- ==============================================================================

-- 1. COURSES / DEGREE PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    degree_level VARCHAR(50) NOT NULL DEFAULT 'UNDERGRADUATE' 
        CHECK (degree_level IN ('UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORATE', 'DIPLOMA', 'CERTIFICATE')),
    duration_years INTEGER NOT NULL DEFAULT 4 CHECK (duration_years BETWEEN 1 AND 7),
    total_semesters INTEGER NOT NULL DEFAULT 8 CHECK (total_semesters BETWEEN 1 AND 14),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institute_id, code)
);

CREATE INDEX IF NOT EXISTS idx_courses_institute ON public.courses(institute_id);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON public.courses(department_id);

-- 2. SEMESTERS TABLE
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    term_number INTEGER NOT NULL CHECK (term_number BETWEEN 1 AND 14),
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '120 days'),
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, academic_year, term_number)
);

-- 3. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    student_strength INTEGER NOT NULL DEFAULT 60 CHECK (student_strength BETWEEN 1 AND 300),
    room_affinity_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(semester_id, name)
);

-- 4. EXTEND SUBJECTS WITH COURSE & SEMESTER
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subject_type VARCHAR(30) NOT NULL DEFAULT 'CORE'
    CHECK (subject_type IN ('CORE', 'ELECTIVE', 'LAB', 'SEMINAR', 'OPEN_ELECTIVE')),
ADD COLUMN IF NOT EXISTS credits NUMERIC(3, 1) NOT NULL DEFAULT 4.0,
ADD COLUMN IF NOT EXISTS theory_hours NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS practical_hours NUMERIC(3, 1) NOT NULL DEFAULT 2.0;

-- 5. SECTION SUBJECTS BRIDGE TABLE
CREATE TABLE IF NOT EXISTS public.section_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(section_id, subject_id)
);

-- 6. EXTEND FACULTY SUBJECT ASSIGNMENTS
ALTER TABLE public.faculty_subject_assignments
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE;

-- 7. RLS FOR ACADEMIC STRUCTURE
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses: View in institute" ON public.courses FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "Courses: Head full access" ON public.courses FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semesters: View in institute" ON public.semesters FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "Semesters: Head full access" ON public.semesters FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sections: View in institute" ON public.sections FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "Sections: Head full access" ON public.sections FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.section_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SectionSubjects: View in institute" ON public.section_subjects FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "SectionSubjects: Head manage all" ON public.section_subjects FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');`;

  const migration5 = `-- ==============================================================================
-- NEXORG 2.1 - RESOURCE MANAGEMENT MODULE
-- Classrooms, Specialized Laboratories, Room Allocation Rules & Resource Availability
-- ==============================================================================

-- 1. EXTEND ROOMS WITH ROOM NAME & NORMALIZED DEPARTMENT
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_room_per_building'
    ) THEN
        ALTER TABLE public.rooms 
        ADD CONSTRAINT unique_room_per_building UNIQUE (institute_id, building, room_number);
    END IF;
END $$;

-- 2. EXTEND LABS WITH LAB CODE & TYPE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lab_category') THEN
        CREATE TYPE lab_category AS ENUM (
            'COMPUTER_SCIENCE', 
            'AI_DATA_SCIENCE', 
            'HARDWARE_EMBEDDED', 
            'NETWORKING_SECURITY', 
            'ELECTRONICS_CIRCUITS', 
            'GENERAL_PURPOSE'
        );
    END IF;
END $$;

ALTER TABLE public.labs
ADD COLUMN IF NOT EXISTS lab_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS lab_type lab_category NOT NULL DEFAULT 'COMPUTER_SCIENCE',
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_lab_code_per_institute'
    ) THEN
        ALTER TABLE public.labs 
        ADD CONSTRAINT unique_lab_code_per_institute UNIQUE (institute_id, lab_code);
    END IF;
END $$;

-- 3. ROOM AVAILABILITY & MAINTENANCE LOCKS
CREATE TABLE IF NOT EXISTS public.room_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (slot_type IN ('AVAILABLE', 'MAINTENANCE', 'LOCKED', 'RESTRICTED')),
    reason VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LAB AVAILABILITY & EQUIPMENT MAINTENANCE
CREATE TABLE IF NOT EXISTS public.lab_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (slot_type IN ('AVAILABLE', 'MAINTENANCE', 'LOCKED', 'RESTRICTED')),
    reason VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RLS POLICIES FOR RESOURCES
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RoomAvail: View in institute" ON public.room_availability FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "RoomAvail: Head manage" ON public.room_availability FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.lab_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LabAvail: View in institute" ON public.lab_availability FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "LabAvail: Head manage" ON public.lab_availability FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');`;

  const migration6 = `-- ==============================================================================
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
    label VARCHAR(50) NOT NULL,
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

-- 3. FACULTY UNAVAILABLE SLOTS TABLE
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

-- 4. WORKLOAD RULES TABLE
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

-- 5. WORKLOAD LIMITS TABLE
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

-- 6. EXTEND FACULTY AVAILABILITY
ALTER TABLE public.faculty_availability
ADD COLUMN IF NOT EXISTS period_number INTEGER CHECK (period_number BETWEEN 1 AND 14),
ADD COLUMN IF NOT EXISTS preference_level VARCHAR(30) DEFAULT 'NEUTRAL'
    CHECK (preference_level IN ('PREFERRED', 'NEUTRAL', 'BLOCKED'));

-- 7. RLS POLICIES FOR AVAILABILITY & WORKLOAD RULES
ALTER TABLE public.institute_working_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WorkingDays: View in institute" ON public.institute_working_days FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "WorkingDays: Head manage" ON public.institute_working_days FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.institute_time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TimeSlots: View in institute" ON public.institute_time_slots FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "TimeSlots: Head manage" ON public.institute_time_slots FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.faculty_unavailable_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UnavailableSlots: View in institute" ON public.faculty_unavailable_slots FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "UnavailableSlots: Head full access" ON public.faculty_unavailable_slots FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');
CREATE POLICY "UnavailableSlots: Admin manage dept faculty" ON public.faculty_unavailable_slots FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'ADMIN');
CREATE POLICY "UnavailableSlots: Faculty manage own slots" ON public.faculty_unavailable_slots FOR ALL USING (institute_id = public.current_user_institute_id() AND faculty_id IN (SELECT fp.id FROM public.faculty_profiles fp WHERE fp.user_id = auth.uid()));

ALTER TABLE public.workload_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WorkloadRules: View in institute" ON public.workload_rules FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "WorkloadRules: Head manage all" ON public.workload_rules FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');
CREATE POLICY "WorkloadRules: Admin manage dept rules" ON public.workload_rules FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'ADMIN');

ALTER TABLE public.workload_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WorkloadLimits: View in institute" ON public.workload_limits FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "WorkloadLimits: Head manage all" ON public.workload_limits FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');
CREATE POLICY "WorkloadLimits: Admin manage" ON public.workload_limits FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'ADMIN');

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

    RETURN QUERY SELECT TRUE, 'Available for scheduling'::TEXT;
END;
$$;`;

  const migration7 = `-- ==============================================================================
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

-- RLS POLICIES FOR TIMETABLE ENGINE
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timetables: View in institute" ON public.timetables FOR SELECT USING (institute_id = public.current_user_institute_id() AND (status = 'PUBLISHED' OR public.current_user_role() IN ('HEAD', 'ADMIN')));
CREATE POLICY "Timetables: Head manage all" ON public.timetables FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entries: View in institute" ON public.timetable_entries FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "Entries: Head full access" ON public.timetable_entries FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.timetable_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conflicts: View in institute" ON public.timetable_conflicts FOR SELECT USING (institute_id = public.current_user_institute_id());
CREATE POLICY "Conflicts: Head manage" ON public.timetable_conflicts FOR ALL USING (institute_id = public.current_user_institute_id() AND public.current_user_role() = 'HEAD');

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs: View in institute" ON public.generation_logs FOR SELECT USING (institute_id = public.current_user_institute_id());
`;

  const migration8 = `-- ==============================================================================
-- NEXORG 2.1 - PRODUCTION SAAS LAYER SCHEMA & RLS POLICIES
-- Subscriptions, Billing History, Audit Logs, In-App Notifications,
-- Institute Tenant Lifecycle (Active/Suspended), and Super Admin Governance
-- ==============================================================================

DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.institutes
ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED')),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_brand_color VARCHAR(20) DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS secondary_brand_color VARCHAR(20) DEFAULT '#7C3AED';

CREATE TYPE subscription_plan_tier AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_billing_interval AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE subscription_status_type AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PAUSED');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE UNIQUE,
    plan_tier subscription_plan_tier NOT NULL DEFAULT 'STARTER',
    status subscription_status_type NOT NULL DEFAULT 'ACTIVE',
    billing_interval subscription_billing_interval NOT NULL DEFAULT 'MONTHLY',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 99.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    max_departments INTEGER NOT NULL DEFAULT 5,
    max_faculty INTEGER NOT NULL DEFAULT 50,
    max_rooms INTEGER NOT NULL DEFAULT 20,
    max_timetables INTEGER NOT NULL DEFAULT 3,
    custom_branding_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    priority_support BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    from_plan subscription_plan_tier,
    to_plan subscription_plan_tier,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    invoice_number VARCHAR(100),
    invoice_pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_ALERT',
    action_url VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_delivery_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS POLICIES FOR SAAS LAYER
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscriptions: Super Admin full access" ON public.subscriptions FOR ALL USING (public.current_user_role() = 'SUPER_ADMIN');
CREATE POLICY "Subscriptions: Head view own subscription" ON public.subscriptions FOR SELECT USING (institute_id = public.current_user_institute_id() AND public.current_user_role() IN ('HEAD', 'ADMIN'));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AuditLogs: Head and Admin view" ON public.audit_logs FOR SELECT USING (institute_id = public.current_user_institute_id() AND public.current_user_role() IN ('HEAD', 'ADMIN', 'SUPER_ADMIN'));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications: View own" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR (user_id IS NULL AND institute_id = public.current_user_institute_id()));
`;

  const migration9 = `-- ==============================================================================
-- NEXORG 2.1 - LEAVE MANAGEMENT & FACULTY SUBSTITUTION SYSTEM SCHEMA & RLS
-- Migration 09: Complete Leave Types, Balances, Requests, Approvals,
-- Timetable Impact Analysis, and Substitute Assignment Engine
-- ==============================================================================

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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    CONSTRAINT uq_faculty_leave_balance UNIQUE (faculty_profile_id, leave_type_id, academic_year)
);

CREATE TABLE IF NOT EXISTS public.leave_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES public.faculty_leaves(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approver_role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    comments TEXT,
    action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.leave_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_id UUID REFERENCES public.faculty_leaves(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_delivery_status VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLICABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- RLS POLICIES
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_audit_logs ENABLE ROW LEVEL SECURITY;
`;

  const allMigrations = `${sqlSchema}\n\n${migration2}\n\n${migration3}\n\n${migration4}\n\n${migration5}\n\n${migration6}\n\n${migration7}\n\n${migration8}\n\n${migration9}`;

  const currentDisplaySql =
    selectedMigration === '01'
      ? sqlSchema
      : selectedMigration === '02'
      ? migration2
      : selectedMigration === '03'
      ? migration3
      : selectedMigration === '04'
      ? migration4
      : selectedMigration === '05'
      ? migration5
      : selectedMigration === '06'
      ? migration6
      : selectedMigration === '07'
      ? migration7
      : selectedMigration === '08'
      ? migration8
      : selectedMigration === '09'
      ? migration9
      : allMigrations;

  const currentFilename =
    selectedMigration === '01'
      ? '20250101000000_nexorg_initial_schema.sql'
      : selectedMigration === '02'
      ? '20250102000000_institute_department_invitations.sql'
      : selectedMigration === '03'
      ? '20250103000000_faculty_management_module.sql'
      : selectedMigration === '04'
      ? '20250104000000_academic_structure_and_subjects.sql'
      : selectedMigration === '05'
      ? '20250105000000_resource_management_module.sql'
      : selectedMigration === '06'
      ? '20250106000000_faculty_availability_and_workload_rules.sql'
      : selectedMigration === '07'
      ? '20250107000000_core_timetable_engine.sql'
      : selectedMigration === '08'
      ? '20250108000000_production_saas_layer.sql'
      : selectedMigration === '09'
      ? '20250109000000_leave_management_and_substitution.sql'
      : 'All Migrations (Complete Nexorg 2.1 Database Schema)';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentDisplaySql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) return;
    setIsTesting(true);
    setConnectionTestResult(null);

    try {
      const client = getSupabaseClient(customUrl, customKey);
      const { data, error } = await client.from('institutes').select('count').limit(1);

      if (error) {
        setConnectionTestResult(`Connection response: ${error.message} (Code: ${error.code || 'UNKNOWN'})`);
      } else {
        setConnectionTestResult('Connection verified successfully! Your Supabase database is online.');
      }
    } catch (err: any) {
      setConnectionTestResult(`Failed to reach Supabase: ${err.message || 'Network error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Supabase Backend Architecture & DDL
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              PostgreSQL 16 + RLS
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Multi-tenant database schema, row-level security policies, and stored procedures for cross-department clash prevention.
          </p>
        </div>

        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'SQL Copied to Clipboard!' : 'Copy Complete SQL Migration'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'schema'
              ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span>Production SQL Schema & Functions</span>
        </button>
        <button
          onClick={() => setActiveTab('rls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'rls'
              ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="h-4 w-4 text-amber-400" />
          <span>Row Level Security (RLS) & RBAC</span>
        </button>
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'connection'
              ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Server className="h-4 w-4 text-cyan-400" />
          <span>Connect Your Supabase Project</span>
        </button>
      </div>

      {/* Tab: Schema */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          {/* Migration Version Picker */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-900/60 rounded-xl border border-white/[0.08]">
            <span className="text-[11px] text-zinc-400 font-medium px-2">Migrations:</span>
            <button
              onClick={() => setSelectedMigration('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              All Migrations (Complete)
            </button>
            <button
              onClick={() => setSelectedMigration('01')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '01'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              01 Core & M:N Schema
            </button>
            <button
              onClick={() => setSelectedMigration('02')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '02'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              02 Onboarding & Invitations
            </button>
            <button
              onClick={() => setSelectedMigration('03')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '03'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              03 Faculty Management
            </button>
            <button
              onClick={() => setSelectedMigration('04')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '04'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              04 Academic Structure & Subjects
            </button>
            <button
              onClick={() => setSelectedMigration('05')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '05'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              05 Resource Management
            </button>
            <button
              onClick={() => setSelectedMigration('06')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '06'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              06 Faculty Availability & Workload
            </button>
            <button
              onClick={() => setSelectedMigration('07')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '07'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              07 Timetable Engine & Conflicts
            </button>
            <button
              onClick={() => setSelectedMigration('08')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '08'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              08 Production SaaS Layer
            </button>
            <button
              onClick={() => setSelectedMigration('09')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMigration === '09'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              09 Leave & Substitution
            </button>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-4 relative font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] text-zinc-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-mono text-zinc-300">
                  {currentFilename}
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className={copied ? 'text-emerald-400 font-semibold' : ''}>
                  {copied ? 'Copied!' : 'Copy SQL'}
                </span>
              </button>
            </div>
            <pre className="text-zinc-300 overflow-x-auto max-h-[550px] p-2 leading-relaxed">
              {currentDisplaySql}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: RLS */}
      {activeTab === 'rls' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs space-y-2">
              <div className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>HEAD Role</span>
              </div>
              <p className="text-zinc-300">
                Full institutional tenancy ownership. Can create departments, onboard faculty across departments, modify institute operational parameters, and view institution-wide timetables.
              </p>
              <div className="text-[11px] font-mono text-indigo-400">
                RLS: institute_id = current_user_institute_id() AND role = 'HEAD'
              </div>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs space-y-2">
              <div className="font-bold text-[#06B6D4] text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>ADMIN (HoD) Role</span>
              </div>
              <p className="text-zinc-300">
                Departmental manager. Can manage department subjects, departmental room allocations, and local workload distribution. Cannot alter cross-department appointments without coordination.
              </p>
              <div className="text-[11px] font-mono text-cyan-400">
                RLS: department_id = user_assigned_dept_id OR is_shared = true
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs space-y-2">
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>FACULTY Role</span>
              </div>
              <p className="text-zinc-300">
                Individual professor perspective (e.g. Prof. Rahul). Can set personal availability constraints, view assigned subjects across all their joint departments, and see personal schedule.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                RLS: user_id = auth.uid() OR faculty_id = self
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Connect Custom Supabase */}
      {activeTab === 'connection' && (
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-6 space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Supabase Connection Testbed</h3>
              <p className="text-xs text-zinc-400">Connect to your Supabase project in real time</p>
            </div>
          </div>

          <form onSubmit={handleTestConnection} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                NEXT_PUBLIC_SUPABASE_URL
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? <Zap className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              <span>{isTesting ? 'Verifying Supabase Connection...' : 'Verify Live Supabase Connection'}</span>
            </button>
          </form>

          {connectionTestResult && (
            <div
              className={`p-3 rounded-lg text-xs font-mono ${
                connectionTestResult.includes('successfully')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
              }`}
            >
              {connectionTestResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
