/**
 * Nexorg 2.1 - Demo Environment Dataset
 * Completely separated from real institute multi-tenant data.
 * Demo data must never mix with real institute data.
 */

import {
  INITIAL_INSTITUTE,
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_FACULTY_PROFILES,
  INITIAL_FACULTY_DEPT_ASSIGNMENTS,
  INITIAL_SUBJECTS,
  INITIAL_ROOMS,
  INITIAL_LABS,
  INITIAL_WORKLOAD_ALLOCATIONS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_FACULTY_AVAILABILITY,
  INITIAL_INVITATIONS,
  INITIAL_COURSES,
  INITIAL_SEMESTERS,
  INITIAL_SECTIONS,
  INITIAL_SECTION_SUBJECTS,
  INITIAL_FACULTY_SUBJECT_ASSIGNMENTS,
  INITIAL_WORKING_DAYS,
  INITIAL_TIME_SLOTS,
  INITIAL_UNAVAILABLE_SLOTS,
  INITIAL_WORKLOAD_RULES,
  INITIAL_WORKLOAD_LIMITS,
  INITIAL_TIMING_CONFIG,
  INITIAL_TIMETABLES,
  INITIAL_TIMETABLE_ENTRIES,
  INITIAL_TIMETABLE_CONFLICTS,
  INITIAL_LEAVE_TYPES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_FACULTY_LEAVES,
  INITIAL_SUBSTITUTE_ASSIGNMENTS,
  INITIAL_LEAVE_NOTIFICATIONS,
  INITIAL_LEAVE_AUDIT_LOGS,
} from './academicData';

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
} from '../types/database';

export const DEMO_INSTITUTE_ID = 'inst-demo-apex';
export const DEMO_INSTITUTE_CODE = 'DEMO-APEX';

export function isDemoInstitute(instituteIdOrCode?: string): boolean {
  if (!instituteIdOrCode) return false;
  const upper = instituteIdOrCode.toUpperCase().trim();
  return (
    upper === DEMO_INSTITUTE_ID.toUpperCase() ||
    upper === DEMO_INSTITUTE_CODE ||
    upper === 'INST-DEMO-APEX' ||
    upper === 'INST-001' ||
    upper === 'APEX'
  );
}

// Demo Institute Record
export const DEMO_INSTITUTE: Institute = {
  ...INITIAL_INSTITUTE,
  id: DEMO_INSTITUTE_ID,
  code: DEMO_INSTITUTE_CODE,
  name: 'Apex Institute of Technology (Demo Sandbox)',
  website: 'https://demo.nexorg.edu',
};

// Demo departments scoped strictly to DEMO_INSTITUTE_ID
export const DEMO_DEPARTMENTS: Department[] = INITIAL_DEPARTMENTS.map((d) => ({
  ...d,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo users scoped strictly to DEMO_INSTITUTE_ID
export const DEMO_USERS: User[] = INITIAL_USERS.map((u) => ({
  ...u,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo faculty profiles scoped strictly to DEMO_INSTITUTE_ID
export const DEMO_FACULTY_PROFILES: FacultyProfile[] = INITIAL_FACULTY_PROFILES.map((f) => ({
  ...f,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo faculty department assignments
export const DEMO_FACULTY_DEPT_ASSIGNMENTS: FacultyDepartmentAssignment[] = INITIAL_FACULTY_DEPT_ASSIGNMENTS.map((a) => ({
  ...a,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo courses
export const DEMO_COURSES: Course[] = INITIAL_COURSES.map((c) => ({
  ...c,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo semesters
export const DEMO_SEMESTERS: Semester[] = INITIAL_SEMESTERS.map((s) => ({
  ...s,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo sections
export const DEMO_SECTIONS: Section[] = INITIAL_SECTIONS.map((sec) => ({
  ...sec,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo subjects
export const DEMO_SUBJECTS: Subject[] = INITIAL_SUBJECTS.map((s) => ({
  ...s,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo section subjects
export const DEMO_SECTION_SUBJECTS: SectionSubject[] = INITIAL_SECTION_SUBJECTS.map((ss) => ({
  ...ss,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo faculty subject assignments
export const DEMO_FACULTY_SUBJECT_ASSIGNMENTS: FacultySubjectAssignment[] = INITIAL_FACULTY_SUBJECT_ASSIGNMENTS.map((fsa) => ({
  ...fsa,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo rooms
export const DEMO_ROOMS: Room[] = INITIAL_ROOMS.map((r) => ({
  ...r,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo labs
export const DEMO_LABS: Lab[] = INITIAL_LABS.map((l) => ({
  ...l,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo workloads
export const DEMO_WORKLOADS: WorkloadAllocation[] = INITIAL_WORKLOAD_ALLOCATIONS.map((w) => ({
  ...w,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo timetable slots
export const DEMO_TIMETABLE_SLOTS: TimetableSlot[] = INITIAL_TIMETABLE_SLOTS.map((ts) => ({
  ...ts,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo faculty availability
export const DEMO_AVAILABILITIES: FacultyAvailability[] = INITIAL_FACULTY_AVAILABILITY.map((fa) => ({
  ...fa,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo invitations
export const DEMO_INVITATIONS: InstituteInvitation[] = INITIAL_INVITATIONS.map((inv) => ({
  ...inv,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo working days
export const DEMO_WORKING_DAYS: InstituteWorkingDay[] = INITIAL_WORKING_DAYS.map((wd) => ({
  ...wd,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo time slots
export const DEMO_TIME_SLOTS: InstituteTimeSlot[] = INITIAL_TIME_SLOTS.map((slot) => ({
  ...slot,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo unavailable slots
export const DEMO_UNAVAILABLE_SLOTS: FacultyUnavailableSlot[] = INITIAL_UNAVAILABLE_SLOTS.map((us) => ({
  ...us,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo workload rules & limits
export const DEMO_WORKLOAD_RULES: WorkloadRule[] = INITIAL_WORKLOAD_RULES.map((wr) => ({
  ...wr,
  institute_id: DEMO_INSTITUTE_ID,
}));

export const DEMO_WORKLOAD_LIMITS: WorkloadLimit[] = INITIAL_WORKLOAD_LIMITS.map((wl) => ({
  ...wl,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo timing config
export const DEMO_TIMING_CONFIG: InstituteTimingConfig = {
  ...INITIAL_TIMING_CONFIG,
};

// Demo timetables
export const DEMO_TIMETABLES: Timetable[] = INITIAL_TIMETABLES.map((tt) => ({
  ...tt,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo timetable entries
export const DEMO_TIMETABLE_ENTRIES: TimetableEntry[] = INITIAL_TIMETABLE_ENTRIES.map((entry) => ({
  ...entry,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo timetable conflicts
export const DEMO_TIMETABLE_CONFLICTS: TimetableConflict[] = INITIAL_TIMETABLE_CONFLICTS.map((c) => ({
  ...c,
  institute_id: DEMO_INSTITUTE_ID,
}));

// Demo leaves, balances, types
export const DEMO_LEAVE_TYPES: LeaveType[] = INITIAL_LEAVE_TYPES.map((lt) => ({
  ...lt,
  institute_id: DEMO_INSTITUTE_ID,
}));

export const DEMO_LEAVE_BALANCES: LeaveBalance[] = INITIAL_LEAVE_BALANCES.map((lb) => ({
  ...lb,
  institute_id: DEMO_INSTITUTE_ID,
}));

export const DEMO_FACULTY_LEAVES: FacultyLeave[] = INITIAL_FACULTY_LEAVES.map((fl) => ({
  ...fl,
  institute_id: DEMO_INSTITUTE_ID,
}));

export const DEMO_SUBSTITUTES: SubstituteAssignment[] = INITIAL_SUBSTITUTE_ASSIGNMENTS.map((sub) => ({
  ...sub,
}));

export const DEMO_LEAVE_NOTIFICATIONS: LeaveNotification[] = INITIAL_LEAVE_NOTIFICATIONS.map((n) => ({
  ...n,
  institute_id: DEMO_INSTITUTE_ID,
}));

export const DEMO_LEAVE_AUDIT_LOGS: LeaveAuditLog[] = INITIAL_LEAVE_AUDIT_LOGS.map((log) => ({
  ...log,
  institute_id: DEMO_INSTITUTE_ID,
}));
