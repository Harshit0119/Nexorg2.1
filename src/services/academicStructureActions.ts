/**
 * Nexorg 2.1 - Academic Structure & Subject Management Operations
 * Multi-tenant Courses, Semesters, Sections, Subjects & Faculty Allocations
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Course,
  Semester,
  Section,
  Subject,
  SectionSubject,
  FacultySubjectAssignment,
  WorkloadComponent,
  DegreeLevel,
  SubjectType
} from '../types/database';
import {
  courseSchema,
  editCourseSchema,
  semesterSchema,
  sectionSchema,
  academicSubjectSchema,
  assignFacultyToSectionSubjectSchema
} from '../lib/validations';

// ============================================================================
// 1. COURSE OPERATIONS
// ============================================================================

export async function createCourse(input: {
  instituteId: string;
  departmentId: string;
  code: string;
  name: string;
  degreeLevel?: DegreeLevel;
  durationYears?: number;
  totalSemesters?: number;
}): Promise<{ success: boolean; data?: Course; error?: string }> {
  const validation = courseSchema.safeParse({
    code: input.code.toUpperCase().trim(),
    name: input.name.trim(),
    department_id: input.departmentId,
    degree_level: input.degreeLevel || 'UNDERGRADUATE',
    duration_years: input.durationYears || 4,
    total_semesters: input.totalSemesters || 8,
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localCourse: Course = {
      id: `course-${input.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      institute_id: input.instituteId,
      department_id: input.departmentId,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      degree_level: input.degreeLevel || 'UNDERGRADUATE',
      duration_years: input.durationYears || 4,
      total_semesters: input.totalSemesters || 8,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localCourse };
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        institute_id: input.instituteId,
        department_id: input.departmentId,
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        degree_level: input.degreeLevel || 'UNDERGRADUATE',
        duration_years: input.durationYears || 4,
        total_semesters: input.totalSemesters || 8,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function updateCourse(
  courseId: string,
  input: {
    name?: string;
    degreeLevel?: DegreeLevel;
    durationYears?: number;
    totalSemesters?: number;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('courses')
      .update({
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.degreeLevel ? { degree_level: input.degreeLevel } : {}),
        ...(input.durationYears ? { duration_years: input.durationYears } : {}),
        ...(input.totalSemesters ? { total_semesters: input.totalSemesters } : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      })
      .eq('id', courseId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 2. SEMESTER OPERATIONS
// ============================================================================

export async function createSemester(input: {
  instituteId: string;
  courseId: string;
  departmentId: string;
  name: string;
  termNumber: number;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data?: Semester; error?: string }> {
  const academicYear = input.academicYear || '2025-2026';
  const startDate = input.startDate || new Date().toISOString().slice(0, 10);
  const endDate = input.endDate || new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const validation = semesterSchema.safeParse({
    name: input.name.trim(),
    course_id: input.courseId,
    department_id: input.departmentId,
    term_number: input.termNumber,
    academic_year: academicYear,
    start_date: startDate,
    end_date: endDate,
    is_current: true,
    is_archived: false,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localSemester: Semester = {
      id: `sem-${input.termNumber}-${Date.now().toString().slice(-4)}`,
      institute_id: input.instituteId,
      course_id: input.courseId,
      department_id: input.departmentId,
      name: input.name.trim(),
      academic_year: academicYear,
      term_number: input.termNumber,
      start_date: startDate,
      end_date: endDate,
      is_current: true,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localSemester };
  }

  try {
    const { data, error } = await supabase
      .from('semesters')
      .insert({
        institute_id: input.instituteId,
        course_id: input.courseId,
        department_id: input.departmentId,
        name: input.name.trim(),
        term_number: input.termNumber,
        academic_year: academicYear,
        start_date: startDate,
        end_date: endDate,
        is_current: true,
        is_archived: false,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function archiveSemester(semesterId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase
      .from('semesters')
      .update({ is_archived: true, is_current: false })
      .eq('id', semesterId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 3. SECTION OPERATIONS
// ============================================================================

export async function createSection(input: {
  instituteId: string;
  departmentId: string;
  courseId: string;
  semesterId: string;
  name: string;
  studentStrength?: number;
  roomAffinityId?: string;
}): Promise<{ success: boolean; data?: Section; error?: string }> {
  const validation = sectionSchema.safeParse({
    name: input.name.trim(),
    department_id: input.departmentId,
    course_id: input.courseId,
    semester_id: input.semesterId,
    student_strength: input.studentStrength || 60,
    room_affinity_id: input.roomAffinityId || '',
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localSection: Section = {
      id: `sec-${Date.now().toString().slice(-4)}`,
      institute_id: input.instituteId,
      department_id: input.departmentId,
      course_id: input.courseId,
      semester_id: input.semesterId,
      name: input.name.trim(),
      student_strength: input.studentStrength || 60,
      room_affinity_id: input.roomAffinityId,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localSection };
  }

  try {
    const { data, error } = await supabase
      .from('sections')
      .insert({
        institute_id: input.instituteId,
        department_id: input.departmentId,
        course_id: input.courseId,
        semester_id: input.semesterId,
        name: input.name.trim(),
        student_strength: input.studentStrength || 60,
        room_affinity_id: input.roomAffinityId || null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 4. SUBJECT OPERATIONS
// ============================================================================

export async function createSubject(input: {
  instituteId: string;
  departmentId: string;
  courseId?: string;
  semesterId?: string;
  code: string;
  name: string;
  subjectType?: SubjectType;
  credits?: number;
  theoryHours?: number;
  practicalHours?: number;
}): Promise<{ success: boolean; data?: Subject; error?: string }> {
  const credits = input.credits || 4;
  const theoryHours = input.theoryHours ?? 3;
  const practicalHours = input.practicalHours ?? 2;

  const validation = academicSubjectSchema.safeParse({
    code: input.code.toUpperCase().trim(),
    name: input.name.trim(),
    department_id: input.departmentId,
    course_id: input.courseId || '',
    semester_id: input.semesterId || '',
    subject_type: input.subjectType || 'CORE',
    credits,
    theory_hours: theoryHours,
    practical_hours: practicalHours,
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localSubject: Subject = {
      id: `sub-${input.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      institute_id: input.instituteId,
      department_id: input.departmentId,
      course_id: input.courseId,
      semester_id: input.semesterId,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      subject_type: input.subjectType || 'CORE',
      credits,
      theory_hours: theoryHours,
      practical_hours: practicalHours,
      theory_credits: Math.max(1, Math.round(credits * 0.75)),
      lab_credits: Math.round(credits * 0.25),
      lecture_hours_per_week: theoryHours,
      lab_hours_per_week: practicalHours,
      tutorial_hours_per_week: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localSubject };
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        institute_id: input.instituteId,
        department_id: input.departmentId,
        course_id: input.courseId || null,
        semester_id: input.semesterId || null,
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        subject_type: input.subjectType || 'CORE',
        credits,
        theory_hours: theoryHours,
        practical_hours: practicalHours,
        theory_credits: Math.max(1, Math.round(credits * 0.75)),
        lab_credits: Math.round(credits * 0.25),
        lecture_hours_per_week: theoryHours,
        lab_hours_per_week: practicalHours,
        tutorial_hours_per_week: 0,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 5. SUBJECT ASSIGNMENT (FACULTY → SECTION → SUBJECT)
// ============================================================================

export async function assignFacultyToSectionSubject(input: {
  facultyId: string;
  subjectId: string;
  sectionId: string;
  semesterId: string;
  departmentId: string;
  instituteId: string;
  component: WorkloadComponent;
  hoursPerWeek: number;
  academicYear?: string;
  isLeadFaculty?: boolean;
}): Promise<{ success: boolean; data?: FacultySubjectAssignment; error?: string }> {
  const validation = assignFacultyToSectionSubjectSchema.safeParse({
    faculty_id: input.facultyId,
    subject_id: input.subjectId,
    section_id: input.sectionId,
    semester_id: input.semesterId,
    department_id: input.departmentId,
    component: input.component,
    hours_per_week: input.hoursPerWeek,
    is_lead_faculty: input.isLeadFaculty || false,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localAssignment: FacultySubjectAssignment = {
      id: `fsa-${Date.now()}`,
      faculty_id: input.facultyId,
      subject_id: input.subjectId,
      section_id: input.sectionId,
      semester_id: input.semesterId,
      department_id: input.departmentId,
      institute_id: input.instituteId,
      component: input.component,
      hours_per_week: input.hoursPerWeek,
      academic_year: input.academicYear || '2025-2026',
      is_lead_faculty: input.isLeadFaculty || false,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localAssignment };
  }

  try {
    const { data, error } = await supabase
      .from('faculty_subject_assignments')
      .insert({
        faculty_id: input.facultyId,
        subject_id: input.subjectId,
        section_id: input.sectionId,
        semester_id: input.semesterId,
        department_id: input.departmentId,
        institute_id: input.instituteId,
        component: input.component,
        hours_per_week: input.hoursPerWeek,
        academic_year: input.academicYear || '2025-2026',
        is_lead_faculty: input.isLeadFaculty || false,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}
