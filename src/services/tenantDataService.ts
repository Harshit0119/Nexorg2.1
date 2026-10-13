/**
 * Nexorg 2.1 - Multi-Tenant Centralized Data Service
 * Enforces strict multi-tenant isolation by institute_id.
 * Real institutes start completely empty and fetch from Supabase.
 * Demo data is strictly isolated to the demo institute.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Institute,
  Department,
  User,
  FacultyProfile,
  FacultyDepartmentAssignment,
  Subject,
  Room,
  Lab,
  WorkloadAllocation,
  TimetableSlot,
  FacultyAvailability,
  InstituteInvitation,
  Course,
  Semester,
  Section,
  SectionSubject,
  FacultySubjectAssignment,
  InstituteWorkingDay,
  InstituteTimeSlot,
  FacultyUnavailableSlot,
  WorkloadRule,
  WorkloadLimit,
  InstituteTimingConfig,
  Timetable,
  TimetableEntry,
  TimetableConflict,
  LeaveType,
  LeaveBalance,
  FacultyLeave,
  SubstituteAssignment,
  LeaveNotification,
  LeaveAuditLog,
  AcademicDay,
} from '../types/database';

export function createDefaultWorkingDays(instituteId: string): InstituteWorkingDay[] {
  const days: AcademicDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days.map((day, idx) => ({
    id: `iwd-${instituteId}-${day.toLowerCase()}`,
    institute_id: instituteId,
    day_of_week: day,
    is_working_day: day !== 'SATURDAY',
    day_order: idx + 1,
    created_at: new Date().toISOString(),
  }));
}

export function createDefaultTimeSlots(instituteId: string): InstituteTimeSlot[] {
  return [
    { id: `slot-${instituteId}-1`, institute_id: instituteId, slot_number: 1, label: 'Period 1', slot_type: 'LECTURE', start_time: '09:00', end_time: '10:00', is_break: false, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-2`, institute_id: instituteId, slot_number: 2, label: 'Period 2', slot_type: 'LECTURE', start_time: '10:00', end_time: '11:00', is_break: false, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-3`, institute_id: instituteId, slot_number: 3, label: 'Period 3', slot_type: 'LECTURE', start_time: '11:15', end_time: '12:15', is_break: false, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-4`, institute_id: instituteId, slot_number: 4, label: 'Period 4', slot_type: 'LECTURE', start_time: '12:15', end_time: '13:15', is_break: false, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-lunch`, institute_id: instituteId, slot_number: 5, label: 'Lunch Break', slot_type: 'LUNCH_BREAK', start_time: '13:15', end_time: '14:00', is_break: true, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-5`, institute_id: instituteId, slot_number: 6, label: 'Period 5', slot_type: 'LECTURE', start_time: '14:00', end_time: '15:00', is_break: false, is_active: true, created_at: new Date().toISOString() },
    { id: `slot-${instituteId}-6`, institute_id: instituteId, slot_number: 7, label: 'Period 6', slot_type: 'LECTURE', start_time: '15:00', end_time: '16:00', is_break: false, is_active: true, created_at: new Date().toISOString() },
  ];
}

export function createDefaultTimingConfig(): InstituteTimingConfig {
  return {
    working_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    college_start_time: '09:00',
    college_end_time: '16:00',
    total_periods_per_day: 6,
    period_duration_minutes: 60,
    lunch_break_start: '13:15',
    lunch_break_end: '14:00',
    lunch_after_period: 4,
  };
}

import {
  isDemoInstitute,
  DEMO_INSTITUTE,
  DEMO_DEPARTMENTS,
  DEMO_USERS,
  DEMO_FACULTY_PROFILES,
  DEMO_FACULTY_DEPT_ASSIGNMENTS,
  DEMO_COURSES,
  DEMO_SEMESTERS,
  DEMO_SECTIONS,
  DEMO_SUBJECTS,
  DEMO_SECTION_SUBJECTS,
  DEMO_FACULTY_SUBJECT_ASSIGNMENTS,
  DEMO_ROOMS,
  DEMO_LABS,
  DEMO_WORKLOADS,
  DEMO_TIMETABLE_SLOTS,
  DEMO_AVAILABILITIES,
  DEMO_INVITATIONS,
  DEMO_WORKING_DAYS,
  DEMO_TIME_SLOTS,
  DEMO_UNAVAILABLE_SLOTS,
  DEMO_WORKLOAD_RULES,
  DEMO_WORKLOAD_LIMITS,
  DEMO_TIMING_CONFIG,
  DEMO_TIMETABLES,
  DEMO_TIMETABLE_ENTRIES,
  DEMO_TIMETABLE_CONFLICTS,
  DEMO_LEAVE_TYPES,
  DEMO_LEAVE_BALANCES,
  DEMO_FACULTY_LEAVES,
  DEMO_SUBSTITUTES,
  DEMO_LEAVE_NOTIFICATIONS,
  DEMO_LEAVE_AUDIT_LOGS,
} from './demoData';

export interface TenantDataset {
  institute: Institute;
  departments: Department[];
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  subjects: Subject[];
  sectionSubjects: SectionSubject[];
  facultySubjectAssignments: FacultySubjectAssignment[];
  users: User[];
  facultyProfiles: FacultyProfile[];
  assignments: FacultyDepartmentAssignment[];
  rooms: Room[];
  labs: Lab[];
  workloads: WorkloadAllocation[];
  timetableSlots: TimetableSlot[];
  availabilities: FacultyAvailability[];
  invitations: InstituteInvitation[];
  workingDays: InstituteWorkingDay[];
  timeSlots: InstituteTimeSlot[];
  unavailableSlots: FacultyUnavailableSlot[];
  workloadRules: WorkloadRule[];
  workloadLimits: WorkloadLimit[];
  timingConfig: InstituteTimingConfig;
  timetables: Timetable[];
  timetableEntries: TimetableEntry[];
  timetableConflicts: TimetableConflict[];
  leaves: FacultyLeave[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  substitutes: SubstituteAssignment[];
  leaveNotifications: LeaveNotification[];
  leaveAuditLogs: LeaveAuditLog[];
}

function getTenantStorageKey(instituteId: string): string {
  return `nexorg_tenant_${instituteId}_v1`;
}

function loadTenantFromLocalStorage(instituteId: string): Partial<TenantDataset> | null {
  try {
    const raw = localStorage.getItem(getTenantStorageKey(instituteId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load tenant data from storage for ${instituteId}:`, e);
    return null;
  }
}

export function saveTenantToLocalStorage(instituteId: string, data: Partial<TenantDataset>): void {
  try {
    const existing = loadTenantFromLocalStorage(instituteId) || {};
    const merged = { ...existing, ...data };
    localStorage.setItem(getTenantStorageKey(instituteId), JSON.stringify(merged));
  } catch (e) {
    console.error(`Failed to save tenant data to storage for ${instituteId}:`, e);
  }
}

/**
 * Fetch all tenant academic data with strict multi-tenant isolation
 * Enforces institute_id filtering on every table.
 * If new real institute, returns empty collections (no preloaded data).
 */
export async function fetchTenantAcademicData(targetInstitute: Institute): Promise<TenantDataset> {
  const instituteId = targetInstitute.id;

  // 1. If DEMO institute, return the isolated Demo Environment data
  if (isDemoInstitute(instituteId)) {
    return {
      institute: DEMO_INSTITUTE,
      departments: [...DEMO_DEPARTMENTS],
      courses: [...DEMO_COURSES],
      semesters: [...DEMO_SEMESTERS],
      sections: [...DEMO_SECTIONS],
      subjects: [...DEMO_SUBJECTS],
      sectionSubjects: [...DEMO_SECTION_SUBJECTS],
      facultySubjectAssignments: [...DEMO_FACULTY_SUBJECT_ASSIGNMENTS],
      users: [...DEMO_USERS],
      facultyProfiles: [...DEMO_FACULTY_PROFILES],
      assignments: [...DEMO_FACULTY_DEPT_ASSIGNMENTS],
      rooms: [...DEMO_ROOMS],
      labs: [...DEMO_LABS],
      workloads: [...DEMO_WORKLOADS],
      timetableSlots: [...DEMO_TIMETABLE_SLOTS],
      availabilities: [...DEMO_AVAILABILITIES],
      invitations: [...DEMO_INVITATIONS],
      workingDays: [...DEMO_WORKING_DAYS],
      timeSlots: [...DEMO_TIME_SLOTS],
      unavailableSlots: [...DEMO_UNAVAILABLE_SLOTS],
      workloadRules: [...DEMO_WORKLOAD_RULES],
      workloadLimits: [...DEMO_WORKLOAD_LIMITS],
      timingConfig: { ...DEMO_TIMING_CONFIG },
      timetables: [...DEMO_TIMETABLES],
      timetableEntries: [...DEMO_TIMETABLE_ENTRIES],
      timetableConflicts: [...DEMO_TIMETABLE_CONFLICTS],
      leaves: [...DEMO_FACULTY_LEAVES],
      leaveTypes: [...DEMO_LEAVE_TYPES],
      leaveBalances: [...DEMO_LEAVE_BALANCES],
      substitutes: [...DEMO_SUBSTITUTES],
      leaveNotifications: [...DEMO_LEAVE_NOTIFICATIONS],
      leaveAuditLogs: [...DEMO_LEAVE_AUDIT_LOGS],
    };
  }

  // 2. Real Institute: Fetch from Supabase with strict institute_id filtering
  if (isSupabaseConfigured) {
    try {
      const [
        deptsRes,
        coursesRes,
        semestersRes,
        sectionsRes,
        subjectsRes,
        roomsRes,
        labsRes,
        timetablesRes,
        entriesRes,
        leavesRes,
      ] = await Promise.all([
        supabase.from('departments').select('*').eq('institute_id', instituteId),
        supabase.from('courses').select('*').eq('institute_id', instituteId),
        supabase.from('semesters').select('*').eq('institute_id', instituteId),
        supabase.from('sections').select('*').eq('institute_id', instituteId),
        supabase.from('subjects').select('*').eq('institute_id', instituteId),
        supabase.from('rooms').select('*').eq('institute_id', instituteId),
        supabase.from('labs').select('*').eq('institute_id', instituteId),
        supabase.from('timetables').select('*').eq('institute_id', instituteId),
        supabase.from('timetable_entries').select('*').eq('institute_id', instituteId),
        supabase.from('faculty_leaves').select('*').eq('institute_id', instituteId),
      ]);

      const localCache = loadTenantFromLocalStorage(instituteId) || {};

      return {
        institute: targetInstitute,
        departments: (deptsRes.data as Department[]) || localCache.departments || [],
        courses: (coursesRes.data as Course[]) || localCache.courses || [],
        semesters: (semestersRes.data as Semester[]) || localCache.semesters || [],
        sections: (sectionsRes.data as Section[]) || localCache.sections || [],
        subjects: (subjectsRes.data as Subject[]) || localCache.subjects || [],
        sectionSubjects: localCache.sectionSubjects || [],
        facultySubjectAssignments: localCache.facultySubjectAssignments || [],
        users: localCache.users || [],
        facultyProfiles: localCache.facultyProfiles || [],
        assignments: localCache.assignments || [],
        rooms: (roomsRes.data as Room[]) || localCache.rooms || [],
        labs: (labsRes.data as Lab[]) || localCache.labs || [],
        workloads: localCache.workloads || [],
        timetableSlots: localCache.timetableSlots || [],
        availabilities: localCache.availabilities || [],
        invitations: localCache.invitations || [],
        workingDays: localCache.workingDays || createDefaultWorkingDays(instituteId),
        timeSlots: localCache.timeSlots || createDefaultTimeSlots(instituteId),
        unavailableSlots: localCache.unavailableSlots || [],
        workloadRules: localCache.workloadRules || [],
        workloadLimits: localCache.workloadLimits || [],
        timingConfig: localCache.timingConfig || createDefaultTimingConfig(),
        timetables: (timetablesRes.data as Timetable[]) || localCache.timetables || [],
        timetableEntries: (entriesRes.data as TimetableEntry[]) || localCache.timetableEntries || [],
        timetableConflicts: localCache.timetableConflicts || [],
        leaves: (leavesRes.data as FacultyLeave[]) || localCache.leaves || [],
        leaveTypes: localCache.leaveTypes || [],
        leaveBalances: localCache.leaveBalances || [],
        substitutes: localCache.substitutes || [],
        leaveNotifications: localCache.leaveNotifications || [],
        leaveAuditLogs: localCache.leaveAuditLogs || [],
      };
    } catch (err) {
      console.warn('Supabase tenant fetch fallback to local storage:', err);
    }
  }

  // 3. Persistent Local Multi-Tenant Storage fallback (clean, completely empty for new institutes)
  const cached = loadTenantFromLocalStorage(instituteId);
  if (cached) {
    return {
      institute: targetInstitute,
      departments: cached.departments || [],
      courses: cached.courses || [],
      semesters: cached.semesters || [],
      sections: cached.sections || [],
      subjects: cached.subjects || [],
      sectionSubjects: cached.sectionSubjects || [],
      facultySubjectAssignments: cached.facultySubjectAssignments || [],
      users: cached.users || [],
      facultyProfiles: cached.facultyProfiles || [],
      assignments: cached.assignments || [],
      rooms: cached.rooms || [],
      labs: cached.labs || [],
      workloads: cached.workloads || [],
      timetableSlots: cached.timetableSlots || [],
      availabilities: cached.availabilities || [],
      invitations: cached.invitations || [],
      workingDays: cached.workingDays || createDefaultWorkingDays(instituteId),
      timeSlots: cached.timeSlots || createDefaultTimeSlots(instituteId),
      unavailableSlots: cached.unavailableSlots || [],
      workloadRules: cached.workloadRules || [],
      workloadLimits: cached.workloadLimits || [],
      timingConfig: cached.timingConfig || createDefaultTimingConfig(),
      timetables: cached.timetables || [],
      timetableEntries: cached.timetableEntries || [],
      timetableConflicts: cached.timetableConflicts || [],
      leaves: cached.leaves || [],
      leaveTypes: cached.leaveTypes || [],
      leaveBalances: cached.leaveBalances || [],
      substitutes: cached.substitutes || [],
      leaveNotifications: cached.leaveNotifications || [],
      leaveAuditLogs: cached.leaveAuditLogs || [],
    };
  }

  // 4. Default for a brand new real institute: COMPLETELY EMPTY
  return {
    institute: targetInstitute,
    departments: [],
    courses: [],
    semesters: [],
    sections: [],
    subjects: [],
    sectionSubjects: [],
    facultySubjectAssignments: [],
    users: [],
    facultyProfiles: [],
    assignments: [],
    rooms: [],
    labs: [],
    workloads: [],
    timetableSlots: [],
    availabilities: [],
    invitations: [],
    workingDays: createDefaultWorkingDays(instituteId),
    timeSlots: createDefaultTimeSlots(instituteId),
    unavailableSlots: [],
    workloadRules: [],
    workloadLimits: [],
    timingConfig: createDefaultTimingConfig(),
    timetables: [],
    timetableEntries: [],
    timetableConflicts: [],
    leaves: [],
    leaveTypes: [],
    leaveBalances: [],
    substitutes: [],
    leaveNotifications: [],
    leaveAuditLogs: [],
  };
}
