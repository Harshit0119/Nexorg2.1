/**
 * Nexorg 2.1 Database & Domain Types
 * Enterprise Academic Resource Planning Type System
 */

export type UserRole = 'SUPER_ADMIN' | 'HEAD' | 'ADMIN' | 'FACULTY';
export type AcademicDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type RoomFacilityType = 'LECTURE_HALL' | 'SMART_CLASSROOM' | 'SEMINAR_HALL' | 'AUDITORIUM';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFER_NOT';
export type WorkloadComponent = 'LECTURE' | 'LAB_PRACTICAL' | 'TUTORIAL' | 'PROJECT_MENTORSHIP';
export type InstituteType = 'UNIVERSITY' | 'ENGINEERING_COLLEGE' | 'TECHNOLOGY_INSTITUTE' | 'AUTONOMOUS_CAMPUS' | 'BUSINESS_SCHOOL';
export type InstituteStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'ADJUNCT' | 'VISITING';
export type DegreeLevel = 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DOCTORATE' | 'DIPLOMA' | 'CERTIFICATE';
export type SubjectType = 'CORE' | 'ELECTIVE' | 'LAB' | 'SEMINAR' | 'OPEN_ELECTIVE';

export interface Institute {
  id: string;
  name: string;
  code: string;
  institute_type?: InstituteType;
  academic_year: string;
  timezone: string;
  address?: string;
  website?: string;
  logo_url?: string;
  status?: InstituteStatus;
  primary_brand_color?: string;
  secondary_brand_color?: string;
  subscription_tier: string;
  settings: {
    working_days: AcademicDay[];
    day_start_time: string;
    day_end_time: string;
    period_duration_minutes: number;
    max_consecutive_faculty_hours: number;
    default_faculty_max_hours: number;
  };
  created_at: string;
  updated_at: string;
}

export interface InstituteInvitation {
  id: string;
  institute_id: string;
  email: string;
  role: 'ADMIN' | 'FACULTY';
  department_ids: string[];
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  // Joined
  inviter?: User;
  departments?: Department[];
}

export interface User {
  id: string;
  institute_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  institute_id: string;
  code: string; // e.g. "CSE", "AIML", "IT"
  name: string;
  head_of_department_id?: string;
  contact_email?: string;
  building_block?: string;
  color_accent?: string;
  is_active: boolean;
  created_at: string;
}

export interface FacultyProfile {
  id: string;
  user_id: string;
  institute_id: string;
  employee_id: string;
  designation: string; // Professor, Associate Professor, Assistant Professor, Adjunct, Visiting
  qualification?: string;
  employment_type?: EmploymentType;
  joining_date?: string;
  contact_number?: string;
  max_weekly_hours: number;
  min_weekly_hours: number;
  cabin_number?: string;
  specializations: string[];
  is_active: boolean;
  created_at: string;
  // Computed / Joined relations
  user?: User;
  assigned_departments?: Department[];
  total_allocated_hours?: number;
}

export interface FacultyDepartmentAssignment {
  id: string;
  faculty_id: string;
  department_id: string;
  institute_id: string;
  is_primary_department: boolean;
  assigned_at: string;
  // Joined
  department?: Department;
  faculty?: FacultyProfile;
}

export interface Course {
  id: string;
  institute_id: string;
  department_id: string;
  code: string; // e.g. "BTECH-CSE", "MTECH-AI"
  name: string;
  degree_level: DegreeLevel;
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
  created_at: string;
  // Joined
  department?: Department;
}

export interface Semester {
  id: string;
  institute_id: string;
  course_id?: string;
  department_id?: string;
  name: string;
  academic_year: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_archived?: boolean;
  created_at: string;
  // Joined
  course?: Course;
  department?: Department;
}

export interface Section {
  id: string;
  institute_id: string;
  department_id: string;
  course_id?: string;
  semester_id: string;
  name: string; // e.g. "Section A", "Section B"
  student_strength: number;
  room_affinity_id?: string;
  is_active?: boolean;
  created_at: string;
  // Joined
  department?: Department;
  semester?: Semester;
  course?: Course;
  room_affinity?: Room;
}

export interface Subject {
  id: string;
  institute_id: string;
  department_id: string;
  course_id?: string;
  semester_id?: string;
  code: string;
  name: string;
  subject_type?: SubjectType;
  credits?: number;
  theory_hours?: number;
  practical_hours?: number;
  theory_credits: number;
  lab_credits: number;
  lecture_hours_per_week: number;
  lab_hours_per_week: number;
  tutorial_hours_per_week: number;
  preferred_facility?: string;
  is_active: boolean;
  created_at: string;
  // Joined
  department?: Department;
  course?: Course;
  semester?: Semester;
}

export interface SectionSubject {
  id: string;
  institute_id: string;
  department_id: string;
  section_id: string;
  subject_id: string;
  semester_id: string;
  created_at: string;
  // Joined
  section?: Section;
  subject?: Subject;
  department?: Department;
  semester?: Semester;
}

export interface FacultySubjectAssignment {
  id: string;
  faculty_id: string;
  subject_id: string;
  department_id: string;
  section_id?: string;
  semester_id?: string;
  institute_id: string;
  component: WorkloadComponent;
  hours_per_week: number;
  academic_year: string;
  is_lead_faculty?: boolean;
  created_at: string;
  // Joined
  subject?: Subject;
  faculty?: FacultyProfile;
  department?: Department;
  section?: Section;
  semester?: Semester;
}

export interface FacultyWorkloadSummary {
  faculty_id: string;
  total_weekly_hours: number;
  max_weekly_hours: number;
  min_weekly_hours: number;
  assigned_subjects_count: number;
  utilization_percentage: number;
  status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
  hours_by_department: Record<string, number>;
}

export interface FacultySubject {
  id: string;
  faculty_id: string;
  subject_id: string;
  institute_id: string;
  academic_year: string;
  is_lead_faculty: boolean;
  created_at: string;
  subject?: Subject;
  faculty?: FacultyProfile;
}

export type LabType = 
  | 'COMPUTER_SCIENCE' 
  | 'AI_DATA_SCIENCE' 
  | 'HARDWARE_EMBEDDED' 
  | 'NETWORKING_SECURITY' 
  | 'ELECTRONICS_CIRCUITS' 
  | 'GENERAL_PURPOSE';

export type ResourceSlotType = 'AVAILABLE' | 'MAINTENANCE' | 'LOCKED' | 'RESTRICTED';

export interface Room {
  id: string;
  institute_id: string;
  room_name?: string;
  name?: string;
  room_number: string;
  building: string;
  floor: number;
  capacity: number;
  facility_type: RoomFacilityType;
  has_projector: boolean;
  has_air_conditioning: boolean;
  is_shared_across_departments: boolean;
  owning_department_id?: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
  owning_department?: Department;
}

export interface Lab {
  id: string;
  institute_id: string;
  lab_number: string;
  lab_code?: string;
  name: string;
  lab_name?: string;
  building: string;
  floor: number;
  pc_count: number;
  capacity: number;
  lab_type?: LabType;
  specialized_hardware?: string;
  has_ups_backup: boolean;
  owning_department_id?: string;
  department_id?: string;
  is_shared: boolean;
  is_active: boolean;
  created_at: string;
  owning_department?: Department;
}

export interface RoomAvailability {
  id: string;
  institute_id: string;
  room_id: string;
  day_of_week: AcademicDay;
  start_time: string;
  end_time: string;
  slot_type: ResourceSlotType;
  reason?: string;
  is_recurring: boolean;
  created_at: string;
  room?: Room;
}

export interface LabAvailability {
  id: string;
  institute_id: string;
  lab_id: string;
  day_of_week: AcademicDay;
  start_time: string;
  end_time: string;
  slot_type: ResourceSlotType;
  reason?: string;
  is_recurring: boolean;
  created_at: string;
  lab?: Lab;
}

export interface FacultyAvailability {
  id: string;
  faculty_id: string;
  institute_id: string;
  day_of_week: AcademicDay;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  status: AvailabilityStatus;
  reason?: string;
  created_at: string;
}

export interface WorkloadAllocation {
  id: string;
  institute_id: string;
  faculty_id: string;
  department_id: string;
  subject_id: string;
  section_id?: string;
  component: WorkloadComponent;
  hours_per_week: number;
  academic_year: string;
  created_at: string;
  faculty?: FacultyProfile;
  department?: Department;
  subject?: Subject;
}

export interface TimetableSlot {
  id: string;
  institute_id: string;
  department_id: string;
  semester_id: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  room_id?: string;
  lab_id?: string;
  day_of_week: AcademicDay;
  start_time: string; // e.g. "10:00:00"
  end_time: string;   // e.g. "11:00:00"
  is_lab_session: boolean;
  academic_year: string;
  created_at: string;
  // Relations
  department?: Department;
  subject?: Subject;
  faculty?: FacultyProfile;
  room?: Room;
  lab?: Lab;
  section?: Section;
}

export interface ClashResult {
  has_clash: boolean;
  type: 'FACULTY_BUSY_IN_OTHER_DEPT' | 'ROOM_DOUBLE_BOOKED' | 'LAB_UNAVAILABLE' | 'WORKLOAD_EXCEEDED' | 'SECTION_OVERLAP';
  message: string;
  conflicting_entity: string;
  department_involved: string;
  time_window: string;
}

export type SlotType = 'LECTURE' | 'PRACTICAL' | 'LUNCH_BREAK' | 'RECESS' | 'ASSEMBLY';

export interface InstituteWorkingDay {
  id: string;
  institute_id: string;
  day_of_week: AcademicDay;
  is_working_day: boolean;
  day_order: number;
  created_at: string;
}

export interface InstituteTimeSlot {
  id: string;
  institute_id: string;
  slot_number: number;
  label: string;
  slot_type: SlotType;
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string;   // HH:MM:SS or HH:MM
  is_break: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FacultyUnavailableSlot {
  id: string;
  institute_id: string;
  faculty_id: string;
  day_of_week: AcademicDay;
  slot_id?: string;
  period_number: number;
  reason?: string;
  is_recurring: boolean;
  created_at: string;
  faculty?: FacultyProfile;
  time_slot?: InstituteTimeSlot;
}

export interface WorkloadRule {
  id: string;
  institute_id: string;
  department_id?: string;
  rule_name: string;
  max_hours_per_week: number;
  min_hours_per_week: number;
  max_lectures_per_day: number;
  max_consecutive_lectures: number;
  max_practical_hours_per_week: number;
  allow_saturday_teaching: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface WorkloadLimit {
  id: string;
  institute_id: string;
  faculty_id: string;
  rule_id?: string;
  max_weekly_hours: number;
  min_weekly_hours: number;
  max_lectures_per_day: number;
  max_consecutive_lectures: number;
  max_practical_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  faculty?: FacultyProfile;
  rule?: WorkloadRule;
}

export interface InstituteTimingConfig {
  working_days: AcademicDay[];
  college_start_time: string; // "09:00"
  college_end_time: string;   // "17:00"
  total_periods_per_day: number; // 8
  period_duration_minutes: number; // 50 or 60
  lunch_break_start: string; // "12:30"
  lunch_break_end: string;   // "13:30"
  lunch_after_period: number; // 4
}

export interface FacultyUtilizationMetric {
  faculty_id: string;
  faculty_name: string;
  employee_id: string;
  designation: string;
  department_names: string[];
  max_hours: number;
  min_hours: number;
  assigned_hours: number;
  available_hours: number;
  free_hours: number;
  utilization_percentage: number;
  status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
  unavailable_periods_count: number;
  allocated_subjects_count: number;
}

// ============================================================================
// CORE TIMETABLE ENGINE DATA MODELS
// ============================================================================

export type TimetableStatus = 'DRAFT' | 'GENERATING' | 'GENERATED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type TimetableTerm = 'ODD' | 'EVEN' | 'ANNUAL' | 'SUMMER';
export type TimetableEntryType = 'THEORY_LECTURE' | 'LAB_PRACTICAL' | 'TUTORIAL' | 'SEMINAR';
export type TimetableConflictType = 
  | 'FACULTY_CLASH' 
  | 'ROOM_CLASH' 
  | 'LAB_CLASH' 
  | 'DEPARTMENT_CLASH' 
  | 'SECTION_CLASH' 
  | 'WORKLOAD_OVERLOAD' 
  | 'AVAILABILITY_VIOLATION';
export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';
export type ConflictStatus = 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
export type TimetableViewMode = 'INSTITUTE' | 'DEPARTMENT' | 'FACULTY' | 'ROOM' | 'LAB' | 'SECTION';

export interface Timetable {
  id: string;
  institute_id: string;
  name: string;
  academic_year: string;
  term: TimetableTerm;
  status: TimetableStatus;
  health_score: number;
  total_slots: number;
  conflicts_count: number;
  generation_strategy: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Computed stats
  entries_count?: number;
}

export interface TimetableEntry {
  id: string;
  timetable_id: string;
  institute_id: string;
  department_id: string;
  course_id?: string;
  semester_id?: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  room_id?: string;
  lab_id?: string;
  day_of_week: AcademicDay;
  period_number: number;
  slot_id?: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  entry_type: TimetableEntryType;
  is_locked: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined relational data
  department?: Department;
  course?: Course;
  semester?: Semester;
  section?: Section;
  subject?: Subject;
  faculty?: FacultyProfile;
  room?: Room;
  lab?: Lab;
}

export interface TimetableRule {
  id: string;
  timetable_id?: string;
  institute_id: string;
  rule_type: 
    | 'FACULTY_MAX_HOURS'
    | 'FACULTY_DAILY_MAX'
    | 'FACULTY_CONSECUTIVE_LIMIT'
    | 'ROOM_CAPACITY'
    | 'LAB_CATEGORY_MATCH'
    | 'NO_CONCURRENT_SECTION'
    | 'NO_CONCURRENT_FACULTY_ACROSS_DEPTS'
    | 'PREFERRED_TIME_BONUS';
  rule_name: string;
  rule_config: Record<string, unknown>;
  is_hard_constraint: boolean;
  weight: number;
  is_active: boolean;
  created_at: string;
}

export interface TimetableConflict {
  id: string;
  timetable_id: string;
  institute_id: string;
  conflict_type: TimetableConflictType;
  severity: ConflictSeverity;
  description: string;
  primary_entry_id?: string;
  conflicting_entry_id?: string;
  faculty_id?: string;
  room_id?: string;
  lab_id?: string;
  section_id?: string;
  day_of_week: AcademicDay;
  period_number: number;
  status: ConflictStatus;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  // Joined objects for UI diagnostics
  faculty_name?: string;
  faculty_employee_id?: string;
  room_name?: string;
  room_number?: string;
  lab_name?: string;
  section_name?: string;
  department_code?: string;
  time_window?: string;
}

export interface GenerationLog {
  id: string;
  timetable_id: string;
  institute_id: string;
  run_id: string;
  log_level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface TimetableHealthMetrics {
  health_score: number; // 0-100
  total_slots: number;
  total_conflicts: number;
  faculty_conflicts: number;
  room_conflicts: number;
  lab_conflicts: number;
  section_conflicts: number;
  faculty_utilization_pct: number;
  room_utilization_pct: number;
  lab_utilization_pct: number;
}

export interface TimetableGenerationParams {
  timetableId: string;
  instituteId: string;
  departmentIds?: string[]; // If empty, all departments in institute
  academicYear: string;
  term: TimetableTerm;
  respectFacultyAvailability: boolean;
  respectWorkloadLimits: boolean;
  respectConsecutiveLimits: boolean;
  allowDepartmentCrossLocking: boolean;
  preferredTimeSlotBonus: boolean;
}

// ============================================================================
// PRODUCTION SAAS LAYER TYPES
// ============================================================================

export type SubscriptionPlanTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SubscriptionBillingInterval = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatusType = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'PAUSED';

export interface Subscription {
  id: string;
  institute_id: string;
  plan_tier: SubscriptionPlanTier;
  status: SubscriptionStatusType;
  billing_interval: SubscriptionBillingInterval;
  amount: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  max_departments: number;
  max_faculty: number;
  max_rooms: number;
  max_timetables: number;
  custom_branding_allowed: boolean;
  priority_support: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionEventType =
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PLAN_UPGRADE'
  | 'PLAN_DOWNGRADE'
  | 'RENEWAL'
  | 'CANCELLATION';

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  institute_id: string;
  event_type: SubscriptionEventType;
  from_plan?: SubscriptionPlanTier;
  to_plan?: SubscriptionPlanTier;
  amount: number;
  currency: string;
  invoice_number?: string;
  invoice_pdf_url?: string;
  notes?: string;
  created_at: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PlanConfig {
  tier: SubscriptionPlanTier;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  maxDepartments: number;
  maxFaculty: number;
  maxRooms: number;
  maxTimetables: number;
  features: string[];
  popular?: boolean;
}

export type AuditLogAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'DEPARTMENT_CREATE'
  | 'DEPARTMENT_UPDATE'
  | 'DEPARTMENT_DELETE'
  | 'FACULTY_CREATE'
  | 'FACULTY_UPDATE'
  | 'FACULTY_DELETE'
  | 'SUBJECT_ASSIGNMENT'
  | 'TIMETABLE_GENERATE'
  | 'TIMETABLE_PUBLISH'
  | 'TIMETABLE_APPROVE'
  | 'TIMETABLE_SLOT_MOVE'
  | 'SUBSCRIPTION_UPGRADE'
  | 'SUBSCRIPTION_DOWNGRADE'
  | 'SETTINGS_UPDATE'
  | 'INSTITUTE_STATUS_CHANGE';

export interface AuditLog {
  id: string;
  institute_id: string;
  user_id?: string;
  user_email: string;
  user_role: UserRole;
  action: AuditLogAction | string;
  entity_type: string;
  entity_id?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type NotificationType =
  | 'INVITATION_SENT'
  | 'INVITATION_ACCEPTED'
  | 'FACULTY_ASSIGNMENT'
  | 'TIMETABLE_PUBLISHED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'CONFLICT_DETECTED'
  | 'SYSTEM_ALERT';

export interface InAppNotification {
  id: string;
  institute_id: string;
  user_id?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  action_url?: string;
  is_read: boolean;
  email_sent: boolean;
  email_delivery_status: 'NOT_APPLICABLE' | 'QUEUED' | 'SENT' | 'FAILED';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PlanLimitCheckResult {
  is_allowed: boolean;
  current_count: number;
  max_limit: number;
  plan_tier: SubscriptionPlanTier;
  resource_type: 'DEPARTMENTS' | 'FACULTY' | 'ROOMS' | 'TIMETABLES';
}

// ============================================================================
// LEAVE MANAGEMENT & FACULTY SUBSTITUTION SYSTEM TYPES (MODULE 09)
// ============================================================================

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  institute_id: string;
  name: string;
  code: string; // e.g. 'CL', 'SL', 'EL', 'DL'
  description?: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_document: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacultyLeave {
  id: string;
  institute_id: string;
  faculty_profile_id: string;
  leave_type_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_days: number;
  reason: string;
  attachment_url?: string;
  status: LeaveStatus;
  affected_lectures_count: number;
  applicant_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  institute_id: string;
  faculty_profile_id: string;
  leave_type_id: string;
  academic_year: string;
  total_leaves: number;
  used_leaves: number;
  remaining_leaves: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveApproval {
  id: string;
  leave_id: string;
  approver_id?: string;
  approver_role: 'HEAD' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
  action_timestamp: string;
}

export type SubstituteStatus = 'PROPOSED' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';

export interface SubstituteAssignment {
  id: string;
  leave_id: string;
  timetable_entry_id?: string;
  original_faculty_id: string;
  substitute_faculty_id: string;
  date: string; // YYYY-MM-DD
  day_of_week: AcademicDay;
  time_slot_id?: string;
  start_time: string;
  end_time: string;
  subject_id?: string;
  room_id?: string;
  lab_id?: string;
  status: SubstituteStatus;
  match_score: number; // 0-100
  match_reasons: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type LeaveNotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'SUBSTITUTE_ASSIGNED'
  | 'SUBSTITUTE_REQUEST';

export interface LeaveNotification {
  id: string;
  institute_id: string;
  user_id?: string;
  leave_id?: string;
  type: LeaveNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  email_delivery_status: 'NOT_APPLICABLE' | 'QUEUED' | 'SENT' | 'FAILED';
  created_at: string;
}

export interface LeaveAuditLog {
  id: string;
  institute_id: string;
  user_id?: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AffectedLecture {
  date: string; // YYYY-MM-DD
  dayOfWeek: AcademicDay;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  departmentName: string;
  sectionId?: string;
  sectionName?: string;
  roomId?: string;
  roomName?: string;
  labId?: string;
  labName?: string;
  timetableEntryId: string;
}

export interface TimetableImpactSummary {
  facultyId: string;
  facultyName: string;
  facultyEmployeeId: string;
  startDate: string;
  endDate: string;
  totalClassesImpacted: number;
  affectedSubjects: {
    id: string;
    code: string;
    name: string;
    lectureCount: number;
  }[];
  affectedDepartments: {
    id: string;
    name: string;
    lectureCount: number;
  }[];
  affectedLectures: AffectedLecture[];
}

export interface SubstituteSuggestion {
  facultyId: string;
  facultyName: string;
  employeeId: string;
  designation: string;
  departmentName: string;
  matchScore: number; // 0 - 100
  isAvailable: boolean;
  hasSubjectExpertise: boolean;
  currentWeeklyHours: number;
  maxWeeklyHours: number;
  reasons: string[];
  rejectionReason?: string;
}




