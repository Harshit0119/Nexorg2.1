-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_semesters_institute ON public.semesters(institute_id);
CREATE INDEX IF NOT EXISTS idx_semesters_course ON public.semesters(course_id);
CREATE INDEX IF NOT EXISTS idx_semesters_dept ON public.semesters(department_id);

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

CREATE INDEX IF NOT EXISTS idx_sections_institute ON public.sections(institute_id);
CREATE INDEX IF NOT EXISTS idx_sections_semester ON public.sections(semester_id);
CREATE INDEX IF NOT EXISTS idx_sections_dept ON public.sections(department_id);

-- 4. EXTEND SUBJECTS TABLE WITH ACADEMIC HIERARCHY & DETAILED ATTRIBUTES
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subject_type VARCHAR(30) NOT NULL DEFAULT 'CORE'
    CHECK (subject_type IN ('CORE', 'ELECTIVE', 'LAB', 'SEMINAR', 'OPEN_ELECTIVE')),
ADD COLUMN IF NOT EXISTS credits NUMERIC(3, 1) NOT NULL DEFAULT 4.0,
ADD COLUMN IF NOT EXISTS theory_hours NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS practical_hours NUMERIC(3, 1) NOT NULL DEFAULT 2.0;

CREATE INDEX IF NOT EXISTS idx_subjects_course ON public.subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(semester_id);

-- 5. SECTION SUBJECTS BRIDGE TABLE (Curriculum mapped to active student cohorts)
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

CREATE INDEX IF NOT EXISTS idx_sec_subj_sec ON public.section_subjects(section_id);
CREATE INDEX IF NOT EXISTS idx_sec_subj_subj ON public.section_subjects(subject_id);

-- 6. EXTEND FACULTY SUBJECT ASSIGNMENTS WITH SECTION & SEMESTER RELATIONS
ALTER TABLE public.faculty_subject_assignments
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_fsa_section ON public.faculty_subject_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_fsa_semester ON public.faculty_subject_assignments(semester_id);

-- 7. ROW LEVEL SECURITY (RLS) FOR ACADEMIC STRUCTURE

-- A. Courses RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses: View in institute"
    ON public.courses FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Courses: Head full access"
    ON public.courses FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Courses: Admin manage own department"
    ON public.courses FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- B. Semesters RLS
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semesters: View in institute"
    ON public.semesters FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Semesters: Head full access"
    ON public.semesters FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Semesters: Admin manage department semesters"
    ON public.semesters FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- C. Sections RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections: View in institute"
    ON public.sections FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Sections: Head full access"
    ON public.sections FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Sections: Admin manage department sections"
    ON public.sections FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- D. Section Subjects RLS
ALTER TABLE public.section_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SectionSubjects: View in institute"
    ON public.section_subjects FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "SectionSubjects: Head manage all"
    ON public.section_subjects FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "SectionSubjects: Admin manage department"
    ON public.section_subjects FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- E. Subjects RLS Update (Ensure institute & dept isolation)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subjects: View within institute" ON public.subjects;
CREATE POLICY "Subjects: View within institute"
    ON public.subjects FOR SELECT
    USING (institute_id = public.current_user_institute_id());

DROP POLICY IF EXISTS "Subjects: Head full access" ON public.subjects;
CREATE POLICY "Subjects: Head full access"
    ON public.subjects FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

DROP POLICY IF EXISTS "Subjects: Admin manage department" ON public.subjects;
CREATE POLICY "Subjects: Admin manage department"
    ON public.subjects FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );
