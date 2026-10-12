import { z } from 'zod';

export const instituteTypeEnum = z.enum([
  'UNIVERSITY',
  'ENGINEERING_COLLEGE',
  'TECHNOLOGY_INSTITUTE',
  'AUTONOMOUS_CAMPUS',
  'BUSINESS_SCHOOL',
]);

export const academicDayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

export const userRoleEnum = z.enum(['SUPER_ADMIN', 'HEAD', 'ADMIN', 'FACULTY']);

export const instituteSettingsSchema = z.object({
  working_days: z.array(academicDayEnum).min(1, 'Select at least one working day'),
  day_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid start time format (HH:MM:SS)'),
  day_end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid end time format (HH:MM:SS)'),
  period_duration_minutes: z.number().int().min(30).max(180),
  max_consecutive_faculty_hours: z.number().int().min(1).max(6),
  default_faculty_max_hours: z.number().int().min(6).max(36),
});

export const instituteSetupSchema = z.object({
  name: z.string().trim().min(3, 'Institute name must be at least 3 characters').max(200),
  code: z.string().trim().min(2, 'Code must be at least 2 characters').max(20).regex(/^[A-Z0-9\-_]+$/, 'Code must be uppercase alphanumeric'),
  institute_type: instituteTypeEnum,
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2025-2026)'),
  timezone: z.string().min(2, 'Timezone is required'),
  address: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  settings: instituteSettingsSchema,
});

export const departmentSchema = z.object({
  code: z.string().trim().min(2, 'Department code must be 2-10 characters').max(10).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric (e.g. CSE)'),
  name: z.string().trim().min(3, 'Department name must be at least 3 characters').max(120),
  head_of_department_id: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid contact email format').optional().or(z.literal('')),
  building_block: z.string().max(100).optional().or(z.literal('')),
  color_accent: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Must be a valid hex color code'),
  is_active: z.boolean().default(true),
});

export const invitationSchema = z.object({
  email: z.string().trim().email('Please provide a valid institutional email address'),
  role: z.enum(['ADMIN', 'FACULTY']),
  department_ids: z.array(z.string()).default([]),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10, 'Valid token required'),
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
});

export const employmentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'ADJUNCT', 'VISITING']);

export const createFacultySchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Valid institutional email required'),
  employee_id: z.string().trim().min(2, 'Employee ID required').max(30).regex(/^[A-Za-z0-9\-_]+$/, 'Alphanumeric with hyphens'),
  designation: z.string().trim().min(2, 'Designation required'),
  contact_number: z.string().trim().optional().or(z.literal('')),
  qualifications: z.string().trim().min(2, 'Academic qualifications required (e.g. M.Tech, Ph.D)'),
  employment_type: employmentTypeEnum.default('FULL_TIME'),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date YYYY-MM-DD required'),
  max_weekly_hours: z.number().int().min(4).max(36).default(18),
  min_weekly_hours: z.number().int().min(2).max(24).default(12),
  department_ids: z.array(z.string()).min(1, 'Select at least one department for appointment'),
  primary_department_id: z.string().min(1, 'Primary department must be designated'),
  cabin_number: z.string().optional().or(z.literal('')),
});

export const editFacultySchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  designation: z.string().trim().min(2, 'Designation required'),
  contact_number: z.string().trim().optional().or(z.literal('')),
  qualifications: z.string().trim().optional().or(z.literal('')),
  employment_type: employmentTypeEnum.default('FULL_TIME'),
  max_weekly_hours: z.number().int().min(4).max(36),
  min_weekly_hours: z.number().int().min(2).max(24),
  cabin_number: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
});

export const facultySubjectAssignmentSchema = z.object({
  faculty_id: z.string().min(1, 'Faculty is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  department_id: z.string().min(1, 'Department is required'),
  component: z.enum(['LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'PROJECT_MENTORSHIP']),
  hours_per_week: z.number().min(0.5).max(16),
  is_lead_faculty: z.boolean().default(false),
});

export const facultyAvailabilitySchema = z.object({
  faculty_id: z.string().min(1, 'Faculty required'),
  day_of_week: academicDayEnum,
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PREFER_NOT']),
  reason: z.string().optional().or(z.literal('')),
});

// ACADEMIC STRUCTURE SCHEMAS

export const degreeLevelEnum = z.enum([
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'DOCTORATE',
  'DIPLOMA',
  'CERTIFICATE'
]);

export const subjectTypeEnum = z.enum([
  'CORE',
  'ELECTIVE',
  'LAB',
  'SEMINAR',
  'OPEN_ELECTIVE'
]);

export const courseSchema = z.object({
  code: z.string().trim().min(2, 'Course code must be 2-15 characters').max(15).regex(/^[A-Z0-9\-_]+$/, 'Code must be uppercase alphanumeric (e.g. BTECH-CSE)'),
  name: z.string().trim().min(3, 'Course name must be at least 3 characters').max(150),
  department_id: z.string().min(1, 'Department is required'),
  degree_level: degreeLevelEnum.default('UNDERGRADUATE'),
  duration_years: z.number().int().min(1).max(7).default(4),
  total_semesters: z.number().int().min(1).max(14).default(8),
  is_active: z.boolean().default(true),
});

export const editCourseSchema = z.object({
  name: z.string().trim().min(3, 'Course name must be at least 3 characters').max(150),
  degree_level: degreeLevelEnum,
  duration_years: z.number().int().min(1).max(7),
  total_semesters: z.number().int().min(1).max(14),
  is_active: z.boolean(),
});

export const semesterSchema = z.object({
  name: z.string().trim().min(2, 'Semester name required (e.g. Semester 5)'),
  course_id: z.string().min(1, 'Course is required'),
  department_id: z.string().min(1, 'Department is required'),
  term_number: z.number().int().min(1).max(14),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2025-2026)'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date YYYY-MM-DD required'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date YYYY-MM-DD required'),
  is_current: z.boolean().default(true),
  is_archived: z.boolean().default(false),
});

export const sectionSchema = z.object({
  name: z.string().trim().min(1, 'Section name is required (e.g. Section A)').max(50),
  department_id: z.string().min(1, 'Department is required'),
  course_id: z.string().min(1, 'Course is required'),
  semester_id: z.string().min(1, 'Semester is required'),
  student_strength: z.number().int().min(1).max(300).default(60),
  room_affinity_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export const academicSubjectSchema = z.object({
  code: z.string().trim().min(2, 'Code must be 2-15 characters').max(15).regex(/^[A-Z0-9\-_]+$/, 'Code must be uppercase alphanumeric (e.g. CS501)'),
  name: z.string().trim().min(2, 'Subject name must be at least 2 characters').max(150),
  department_id: z.string().min(1, 'Department is required'),
  course_id: z.string().optional().or(z.literal('')),
  semester_id: z.string().optional().or(z.literal('')),
  subject_type: subjectTypeEnum.default('CORE'),
  credits: z.number().min(0.5).max(12).default(4),
  theory_hours: z.number().min(0).max(12).default(3),
  practical_hours: z.number().min(0).max(12).default(2),
  preferred_facility: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export const assignFacultyToSectionSubjectSchema = z.object({
  faculty_id: z.string().min(1, 'Faculty is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  section_id: z.string().min(1, 'Section is required'),
  semester_id: z.string().min(1, 'Semester is required'),
  department_id: z.string().min(1, 'Department is required'),
  component: z.enum(['LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'PROJECT_MENTORSHIP']).default('LECTURE'),
  hours_per_week: z.number().min(0.5).max(16).default(3),
  is_lead_faculty: z.boolean().default(false),
});

// RESOURCE MANAGEMENT SCHEMAS

export const roomFacilityTypeEnum = z.enum([
  'LECTURE_HALL',
  'SMART_CLASSROOM',
  'SEMINAR_HALL',
  'AUDITORIUM'
]);

export const labCategoryEnum = z.enum([
  'COMPUTER_SCIENCE',
  'AI_DATA_SCIENCE',
  'HARDWARE_EMBEDDED',
  'NETWORKING_SECURITY',
  'ELECTRONICS_CIRCUITS',
  'GENERAL_PURPOSE'
]);

export const resourceSlotTypeEnum = z.enum([
  'AVAILABLE',
  'MAINTENANCE',
  'LOCKED',
  'RESTRICTED'
]);

export const roomSchema = z.object({
  room_name: z.string().trim().min(2, 'Room name must be at least 2 characters').max(100),
  room_number: z.string().trim().min(1, 'Room number required').max(30).regex(/^[A-Za-z0-9\-_]+$/, 'Alphanumeric with hyphens'),
  building: z.string().trim().min(2, 'Building is required').max(100),
  floor: z.number().int().min(0).max(20).default(1),
  capacity: z.number().int().min(10, 'Capacity must be at least 10').max(1000).default(60),
  facility_type: roomFacilityTypeEnum.default('SMART_CLASSROOM'),
  department_id: z.string().optional().or(z.literal('')),
  has_projector: z.boolean().default(true),
  has_air_conditioning: z.boolean().default(true),
  is_shared_across_departments: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const editRoomSchema = z.object({
  room_name: z.string().trim().min(2, 'Room name must be at least 2 characters'),
  building: z.string().trim().min(2, 'Building is required'),
  floor: z.number().int().min(0).max(20),
  capacity: z.number().int().min(10).max(1000),
  facility_type: roomFacilityTypeEnum,
  department_id: z.string().optional().or(z.literal('')),
  has_projector: z.boolean(),
  has_air_conditioning: z.boolean(),
  is_shared_across_departments: z.boolean(),
  is_active: z.boolean(),
});

export const labSchema = z.object({
  name: z.string().trim().min(2, 'Lab name must be at least 2 characters').max(120),
  lab_code: z.string().trim().min(2, 'Lab code required (e.g. LAB-AI-01)').max(30).regex(/^[A-Za-z0-9\-_]+$/, 'Alphanumeric with hyphens'),
  building: z.string().trim().min(2, 'Building is required').max(100),
  floor: z.number().int().min(0).max(20).default(2),
  capacity: z.number().int().min(5).max(300).default(40),
  pc_count: z.number().int().min(0).max(300).default(40),
  lab_type: labCategoryEnum.default('COMPUTER_SCIENCE'),
  department_id: z.string().optional().or(z.literal('')),
  specialized_hardware: z.string().optional().or(z.literal('')),
  has_ups_backup: z.boolean().default(true),
  is_shared: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const editLabSchema = z.object({
  name: z.string().trim().min(2, 'Lab name must be at least 2 characters'),
  building: z.string().trim().min(2, 'Building is required'),
  floor: z.number().int().min(0).max(20),
  capacity: z.number().int().min(5).max(300),
  pc_count: z.number().int().min(0).max(300),
  lab_type: labCategoryEnum,
  department_id: z.string().optional().or(z.literal('')),
  specialized_hardware: z.string().optional().or(z.literal('')),
  has_ups_backup: z.boolean(),
  is_shared: z.boolean(),
  is_active: z.boolean(),
});

export const resourceAvailabilitySchema = z.object({
  resource_id: z.string().min(1, 'Resource is required'),
  resource_type: z.enum(['ROOM', 'LAB']),
  day_of_week: academicDayEnum,
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  slot_type: resourceSlotTypeEnum.default('AVAILABLE'),
  reason: z.string().optional().or(z.literal('')),
  is_recurring: z.boolean().default(true),
});

export const slotTypeEnum = z.enum([
  'LECTURE',
  'PRACTICAL',
  'LUNCH_BREAK',
  'RECESS',
  'ASSEMBLY'
]);

export const instituteWorkingDaySchema = z.object({
  day_of_week: academicDayEnum,
  is_working_day: z.boolean(),
  day_order: z.number().int().min(1).max(7),
});

export const instituteTimeSlotSchema = z.object({
  slot_number: z.number().int().min(1, 'Slot number must be at least 1').max(14, 'Slot number cannot exceed 14'),
  label: z.string().trim().min(2, 'Label required (e.g. Period 1, Lunch Break)').max(50),
  slot_type: slotTypeEnum.default('LECTURE'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM format'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:MM format'),
  is_break: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const facultyUnavailableSlotSchema = z.object({
  faculty_id: z.string().min(1, 'Faculty is required'),
  day_of_week: academicDayEnum,
  period_number: z.number().int().min(1, 'Period must be 1 to 14').max(14),
  slot_id: z.string().optional(),
  reason: z.string().trim().min(2, 'Reason is required (e.g. Research, Head Duty)').max(200),
  is_recurring: z.boolean().default(true),
});

export const workloadRuleSchema = z.object({
  rule_name: z.string().trim().min(3, 'Rule name must be at least 3 characters').max(120),
  department_id: z.string().optional().nullable(),
  max_hours_per_week: z.number().min(4).max(40, 'Max weekly hours cannot exceed 40').default(18),
  min_hours_per_week: z.number().min(2).max(30, 'Min weekly hours cannot exceed 30').default(12),
  max_lectures_per_day: z.number().int().min(1).max(8).default(4),
  max_consecutive_lectures: z.number().int().min(1).max(5).default(2),
  max_practical_hours_per_week: z.number().min(0).max(20).default(8),
  allow_saturday_teaching: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const workloadLimitSchema = z.object({
  faculty_id: z.string().min(1, 'Faculty is required'),
  rule_id: z.string().optional().nullable(),
  max_weekly_hours: z.number().min(4).max(40).default(18),
  min_weekly_hours: z.number().min(2).max(30).default(12),
  max_lectures_per_day: z.number().int().min(1).max(8).default(4),
  max_consecutive_lectures: z.number().int().min(1).max(5).default(2),
  max_practical_hours: z.number().min(0).max(20).default(8),
  notes: z.string().optional(),
});

export const instituteTimingConfigSchema = z.object({
  working_days: z.array(academicDayEnum).min(1, 'At least 1 working day is required'),
  college_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  college_end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  total_periods_per_day: z.number().int().min(4).max(12).default(8),
  period_duration_minutes: z.number().int().min(30).max(120).default(50),
  lunch_break_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  lunch_break_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM'),
  lunch_after_period: z.number().int().min(1).max(8).default(4),
});

// ============================================================================
// TIMETABLE ENGINE VALIDATIONS
// ============================================================================

export const timetableSchema = z.object({
  name: z.string().min(3, 'Timetable name must be at least 3 characters'),
  academic_year: z.string().min(4, 'Academic year is required (e.g. 2025-2026)'),
  term: z.enum(['ODD', 'EVEN', 'ANNUAL', 'SUMMER']).default('ODD'),
  status: z.enum(['DRAFT', 'GENERATING', 'GENERATED', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  generation_strategy: z.string().default('CSP_BACKTRACKING'),
});

export const timetableEntrySchema = z.object({
  timetable_id: z.string().min(1, 'Timetable ID is required'),
  department_id: z.string().min(1, 'Department ID is required'),
  section_id: z.string().min(1, 'Section ID is required'),
  subject_id: z.string().min(1, 'Subject ID is required'),
  faculty_id: z.string().min(1, 'Faculty ID is required'),
  room_id: z.string().optional().nullable(),
  lab_id: z.string().optional().nullable(),
  day_of_week: academicDayEnum,
  period_number: z.number().int().min(1).max(14),
  slot_id: z.string().optional().nullable(),
  start_time: z.string().min(4, 'Start time is required'),
  end_time: z.string().min(4, 'End time is required'),
  entry_type: z.enum(['THEORY_LECTURE', 'LAB_PRACTICAL', 'TUTORIAL', 'SEMINAR']).default('THEORY_LECTURE'),
  is_locked: z.boolean().default(false),
  notes: z.string().optional(),
});

export const timetableConflictResolutionSchema = z.object({
  conflict_id: z.string().min(1, 'Conflict ID is required'),
  resolution_type: z.enum(['SWAP_SLOT', 'REASSIGN_FACULTY', 'REASSIGN_ROOM', 'REASSIGN_LAB', 'IGNORE']),
  target_day: academicDayEnum.optional(),
  target_period: z.number().int().min(1).max(14).optional(),
  new_entity_id: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// SAAS SUBSCRIPTION & GOVERNANCE VALIDATIONS
// ============================================================================

export const subscriptionPlanTierEnum = z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']);
export const subscriptionBillingIntervalEnum = z.enum(['MONTHLY', 'ANNUAL']);

export const subscriptionUpgradeSchema = z.object({
  institute_id: z.string().min(1, 'Institute ID is required'),
  target_plan: subscriptionPlanTierEnum,
  billing_interval: subscriptionBillingIntervalEnum.default('MONTHLY'),
  payment_method_id: z.string().optional(),
});

export const auditLogQuerySchema = z.object({
  institute_id: z.string().min(1),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const instituteBrandingUpdateSchema = z.object({
  name: z.string().trim().min(3).max(150),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Format YYYY-YYYY'),
  timezone: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  primary_brand_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i),
  secondary_brand_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i),
});

export const userProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// ============================================================================
// LEAVE MANAGEMENT & FACULTY SUBSTITUTION VALIDATIONS
// ============================================================================

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().min(2, 'Code must be 2-10 characters').max(10).regex(/^[A-Z0-9_\-]+$/, 'Code must be uppercase alphanumeric'),
  description: z.string().max(500).optional(),
  default_days_per_year: z.number().min(0.5).max(365),
  is_paid: z.boolean().default(true),
  requires_document: z.boolean().default(false),
});

export const applyLeaveSchema = z.object({
  faculty_profile_id: z.string().min(1, 'Faculty is required'),
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(1000),
  attachment_url: z.string().url().optional().or(z.literal('')),
  applicant_notes: z.string().max(500).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

export const approveRejectLeaveSchema = z.object({
  leave_id: z.string().min(1, 'Leave ID is required'),
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().max(500).optional(),
  rejection_reason: z.string().max(500).optional(),
});

export const substituteAssignmentSchema = z.object({
  leave_id: z.string().min(1, 'Leave ID is required'),
  timetable_entry_id: z.string().optional(),
  original_faculty_id: z.string().min(1, 'Original faculty is required'),
  substitute_faculty_id: z.string().min(1, 'Substitute faculty is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  day_of_week: academicDayEnum,
  time_slot_id: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  subject_id: z.string().optional(),
  room_id: z.string().optional(),
  lab_id: z.string().optional(),
  status: z.enum(['PROPOSED', 'CONFIRMED', 'REJECTED', 'COMPLETED']).default('PROPOSED'),
  notes: z.string().max(500).optional(),
});







