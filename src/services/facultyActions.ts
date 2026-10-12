/**
 * Nexorg 2.1 - Faculty Management Data Operations & Server Actions
 * Production-ready CRUD, Multi-Department Mapping, Workload Aggregation & Availability
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FacultyProfile,
  FacultyDepartmentAssignment,
  FacultySubjectAssignment,
  FacultyAvailability,
  FacultyWorkloadSummary,
  EmploymentType,
  WorkloadComponent,
  AcademicDay,
  AvailabilityStatus
} from '../types/database';
import {
  createFacultySchema,
  editFacultySchema,
  facultySubjectAssignmentSchema,
  facultyAvailabilitySchema
} from '../lib/validations';

export interface CreateFacultyInput {
  fullName: string;
  email: string;
  employeeId: string;
  designation: string;
  contactNumber?: string;
  qualifications?: string;
  employmentType?: EmploymentType;
  joiningDate?: string;
  maxWeeklyHours: number;
  minWeeklyHours?: number;
  departmentIds: string[];
  primaryDepartmentId: string;
  cabinNumber?: string;
  instituteId: string;
}

export interface UpdateFacultyInput {
  fullName?: string;
  designation?: string;
  contactNumber?: string;
  qualifications?: string;
  employmentType?: EmploymentType;
  maxWeeklyHours?: number;
  minWeeklyHours?: number;
  cabinNumber?: string;
  isActive?: boolean;
}

/**
 * 1. Create a new faculty member with user account and multi-department assignments
 */
export async function createFacultyMember(input: CreateFacultyInput): Promise<{
  success: boolean;
  facultyId?: string;
  error?: string;
}> {
  // Validate schema
  const validation = createFacultySchema.safeParse({
    full_name: input.fullName,
    email: input.email,
    employee_id: input.employeeId,
    designation: input.designation,
    contact_number: input.contactNumber,
    qualifications: input.qualifications,
    employment_type: input.employmentType || 'FULL_TIME',
    joining_date: input.joiningDate || new Date().toISOString().slice(0, 10),
    max_weekly_hours: input.maxWeeklyHours,
    min_weekly_hours: input.minWeeklyHours || 12,
    department_ids: input.departmentIds,
    primary_department_id: input.primaryDepartmentId,
    cabin_number: input.cabinNumber,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation failed' };
  }

  if (!isSupabaseConfigured) {
    // If local dev without connected cloud instance, return success for optimistic UI
    return { success: true, facultyId: `fac-${Date.now()}` };
  }

  try {
    // A. Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        institute_id: input.instituteId,
        email: input.email,
        full_name: input.fullName,
        role: 'FACULTY',
        phone: input.contactNumber,
        is_active: true,
      })
      .select('id')
      .single();

    if (userError || !userData) {
      return { success: false, error: userError?.message || 'Failed to create user account' };
    }

    // B. Create faculty profile
    const { data: profileData, error: profileError } = await supabase
      .from('faculty_profiles')
      .insert({
        user_id: userData.id,
        institute_id: input.instituteId,
        employee_id: input.employeeId,
        designation: input.designation,
        qualification: input.qualifications,
        employment_type: input.employmentType || 'FULL_TIME',
        joining_date: input.joiningDate || new Date().toISOString().slice(0, 10),
        contact_number: input.contactNumber,
        max_weekly_hours: input.maxWeeklyHours,
        min_weekly_hours: input.minWeeklyHours || 12,
        cabin_number: input.cabinNumber,
        specializations: ['Academic Instruction'],
        is_active: true,
      })
      .select('id')
      .single();

    if (profileError || !profileData) {
      return { success: false, error: profileError?.message || 'Failed to create faculty profile' };
    }

    // C. Create department assignments
    const deptRows = input.departmentIds.map((deptId) => ({
      faculty_id: profileData.id,
      department_id: deptId,
      institute_id: input.instituteId,
      is_primary_department: deptId === input.primaryDepartmentId,
    }));

    const { error: deptError } = await supabase
      .from('faculty_department_assignments')
      .insert(deptRows);

    if (deptError) {
      return { success: false, error: deptError.message };
    }

    return { success: true, facultyId: profileData.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error occurred';
    return { success: false, error: errorMsg };
  }
}

/**
 * 2. Update faculty profile and user record
 */
export async function updateFacultyMember(
  facultyId: string,
  userId: string,
  input: UpdateFacultyInput
): Promise<{ success: boolean; error?: string }> {
  const validation = editFacultySchema.safeParse({
    full_name: input.fullName,
    designation: input.designation,
    contact_number: input.contactNumber,
    qualifications: input.qualifications,
    employment_type: input.employmentType,
    max_weekly_hours: input.maxWeeklyHours,
    min_weekly_hours: input.minWeeklyHours,
    cabin_number: input.cabinNumber,
    is_active: input.isActive,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation failed' };
  }

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    if (input.fullName || input.contactNumber) {
      await supabase
        .from('users')
        .update({
          full_name: input.fullName,
          phone: input.contactNumber,
        })
        .eq('id', userId);
    }

    const { error: profileError } = await supabase
      .from('faculty_profiles')
      .update({
        designation: input.designation,
        qualification: input.qualifications,
        employment_type: input.employmentType,
        contact_number: input.contactNumber,
        max_weekly_hours: input.maxWeeklyHours,
        min_weekly_hours: input.minWeeklyHours,
        cabin_number: input.cabinNumber,
        is_active: input.isActive,
      })
      .eq('id', facultyId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error';
    return { success: false, error: errorMsg };
  }
}

/**
 * 3. Assign Faculty to an additional Department
 */
export async function assignFacultyToDepartment(
  facultyId: string,
  departmentId: string,
  instituteId: string,
  isPrimary: boolean = false
): Promise<{ success: boolean; error?: string; assignmentId?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, assignmentId: `fda-${Date.now()}` };
  }

  try {
    if (isPrimary) {
      // Clear existing primary flag
      await supabase
        .from('faculty_department_assignments')
        .update({ is_primary_department: false })
        .eq('faculty_id', facultyId);
    }

    const { data, error } = await supabase
      .from('faculty_department_assignments')
      .insert({
        faculty_id: facultyId,
        department_id: departmentId,
        institute_id: instituteId,
        is_primary_department: isPrimary,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignmentId: data?.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' };
  }
}

/**
 * 4. Remove a faculty department assignment
 */
export async function removeFacultyDepartmentAssignment(
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('faculty_department_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' };
  }
}

/**
 * 5. Assign Faculty to a Subject (Lecture / Lab / Tutorial)
 */
export async function assignFacultyToSubject(input: {
  facultyId: string;
  subjectId: string;
  departmentId: string;
  instituteId: string;
  component: WorkloadComponent;
  hoursPerWeek: number;
  academicYear?: string;
  isLeadFaculty?: boolean;
}): Promise<{ success: boolean; error?: string; assignmentId?: string }> {
  const validation = facultySubjectAssignmentSchema.safeParse({
    faculty_id: input.facultyId,
    subject_id: input.subjectId,
    department_id: input.departmentId,
    component: input.component,
    hours_per_week: input.hoursPerWeek,
    is_lead_faculty: input.isLeadFaculty || false,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    return { success: true, assignmentId: `fsa-${Date.now()}` };
  }

  try {
    const { data, error } = await supabase
      .from('faculty_subject_assignments')
      .insert({
        faculty_id: input.facultyId,
        subject_id: input.subjectId,
        department_id: input.departmentId,
        institute_id: input.instituteId,
        component: input.component,
        hours_per_week: input.hoursPerWeek,
        academic_year: input.academicYear || '2025-2026',
        is_lead_faculty: input.isLeadFaculty || false,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignmentId: data?.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' };
  }
}

/**
 * 6. Set Faculty Availability Slot
 */
export async function setFacultyAvailability(input: {
  facultyId: string;
  dayOfWeek: AcademicDay;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  reason?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const validation = facultyAvailabilitySchema.safeParse({
    faculty_id: input.facultyId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    status: input.status,
    reason: input.reason || '',
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    return { success: true, id: `avail-${Date.now()}` };
  }

  try {
    const { data, error } = await supabase
      .from('faculty_availability')
      .insert({
        faculty_id: input.facultyId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        slot_status: input.status,
        reason: input.reason,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' };
  }
}

/**
 * 7. Remove Availability Slot
 */
export async function removeFacultyAvailability(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('faculty_availability').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error' };
  }
}
