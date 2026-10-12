import {
  FacultyLeave,
  LeaveType,
  LeaveBalance,
  LeaveApproval,
  SubstituteAssignment,
  LeaveNotification,
  LeaveAuditLog,
  AffectedLecture,
  TimetableImpactSummary,
  SubstituteSuggestion,
  TimetableEntry,
  FacultyProfile,
  Subject,
  Room,
  Lab,
  Department,
  Section,
  InstituteTimeSlot,
  FacultyDepartmentAssignment,
  FacultyUnavailableSlot,
  WorkloadAllocation,
  AcademicDay,
  User,
  UserRole,
} from '../types/database';

// Helper to format Date to YYYY-MM-DD
export function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert JS Day (0 = Sun, 1 = Mon, ..., 6 = Sat) to AcademicDay
export function getAcademicDayFromDate(d: Date): AcademicDay {
  const dayIndex = d.getDay();
  switch (dayIndex) {
    case 1:
      return 'MONDAY';
    case 2:
      return 'TUESDAY';
    case 3:
      return 'WEDNESDAY';
    case 4:
      return 'THURSDAY';
    case 5:
      return 'FRIDAY';
    case 6:
      return 'SATURDAY';
    default:
      return 'SUNDAY';
  }
}

// ============================================================================
// 1. TIMETABLE IMPACT ANALYSIS ENGINE
// ============================================================================

export function analyzeTimetableImpact(
  facultyId: string,
  startDateStr: string,
  endDateStr: string,
  facultyProfiles: FacultyProfile[],
  users: User[],
  timetableEntries: TimetableEntry[],
  subjects: Subject[],
  rooms: Room[],
  labs: Lab[],
  departments: Department[],
  sections: Section[],
  timeSlots: InstituteTimeSlot[]
): TimetableImpactSummary {
  const faculty = facultyProfiles.find((f) => f.id === facultyId);
  const user = users.find((u) => u.id === faculty?.user_id);
  const facultyName = user?.full_name || 'Faculty Member';
  const facultyEmployeeId = faculty?.employee_id || facultyId;

  const affectedLectures: AffectedLecture[] = [];
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));
  const labMap = new Map<string, Lab>(labs.map((l) => [l.id, l]));
  const deptMap = new Map<string, Department>(departments.map((d) => [d.id, d]));
  const sectionMap = new Map<string, Section>(sections.map((s) => [s.id, s]));
  const slotMap = new Map<string, InstituteTimeSlot>(timeSlots.map((s) => [s.id, s]));

  // Parse start and end dates
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Iterate each day in range
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = getAcademicDayFromDate(current);
    const dateStr = formatDateYMD(current);

    // Find entries for this faculty on this day
    const dayEntries = timetableEntries.filter(
      (entry) => entry.faculty_id === facultyId && entry.day_of_week === dayOfWeek
    );

    for (const entry of dayEntries) {
      const subject = entry.subject_id ? subjectMap.get(entry.subject_id) : undefined;
      const dept = entry.department_id ? deptMap.get(entry.department_id) : undefined;
      const sec = entry.section_id ? sectionMap.get(entry.section_id) : undefined;
      const room = entry.room_id ? roomMap.get(entry.room_id) : undefined;
      const lab = entry.lab_id ? labMap.get(entry.lab_id) : undefined;
      const slot = entry.slot_id ? slotMap.get(entry.slot_id) : undefined;

      const startTime = entry.start_time || slot?.start_time || '09:00';
      const endTime = entry.end_time || slot?.end_time || '10:00';

      affectedLectures.push({
        date: dateStr,
        dayOfWeek,
        periodNumber: entry.period_number,
        startTime,
        endTime,
        subjectId: entry.subject_id || '',
        subjectCode: subject?.code || 'SUB',
        subjectName: subject?.name || 'Class Lecture',
        departmentId: entry.department_id || '',
        departmentName: dept?.name || dept?.code || 'Department',
        sectionId: entry.section_id,
        sectionName: sec?.name,
        roomId: entry.room_id,
        roomName: room?.name || room?.room_name || room?.room_number,
        labId: entry.lab_id,
        labName: lab?.name,
        timetableEntryId: entry.id,
      });
    }

    // Advance 1 day
    current.setDate(current.getDate() + 1);
  }

  // Aggregate affected subjects
  const subjectCounts = new Map<string, { code: string; name: string; count: number }>();
  for (const lec of affectedLectures) {
    if (!lec.subjectId) continue;
    const existing = subjectCounts.get(lec.subjectId) || {
      code: lec.subjectCode,
      name: lec.subjectName,
      count: 0,
    };
    existing.count += 1;
    subjectCounts.set(lec.subjectId, existing);
  }

  const affectedSubjects = Array.from(subjectCounts.entries()).map(([id, info]) => ({
    id,
    code: info.code,
    name: info.name,
    lectureCount: info.count,
  }));

  // Aggregate affected departments
  const deptCounts = new Map<string, { name: string; count: number }>();
  for (const lec of affectedLectures) {
    if (!lec.departmentId) continue;
    const existing = deptCounts.get(lec.departmentId) || {
      name: lec.departmentName,
      count: 0,
    };
    existing.count += 1;
    deptCounts.set(lec.departmentId, existing);
  }

  const affectedDepartments = Array.from(deptCounts.entries()).map(([id, info]) => ({
    id,
    name: info.name,
    lectureCount: info.count,
  }));

  return {
    facultyId,
    facultyName,
    facultyEmployeeId,
    startDate: startDateStr,
    endDate: endDateStr,
    totalClassesImpacted: affectedLectures.length,
    affectedSubjects,
    affectedDepartments,
    affectedLectures,
  };
}

// ============================================================================
// 2. SUBSTITUTE FACULTY RECOMMENDATION ENGINE
// ============================================================================

export function suggestSubstitutesForLecture(
  affectedLecture: AffectedLecture,
  allFaculty: FacultyProfile[],
  users: User[],
  deptAssignments: FacultyDepartmentAssignment[],
  unavailableSlots: FacultyUnavailableSlot[],
  workloads: WorkloadAllocation[],
  timetableEntries: TimetableEntry[],
  subjects: Subject[],
  departments: Department[],
  originalFacultyId: string
): SubstituteSuggestion[] {
  const suggestions: SubstituteSuggestion[] = [];
  const subject = subjects.find((s) => s.id === affectedLecture.subjectId);
  const deptMap = new Map<string, Department>(departments.map((d) => [d.id, d]));
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

  for (const fac of allFaculty) {
    // Cannot substitute oneself
    if (fac.id === originalFacultyId) continue;
    if (!fac.is_active) continue;

    const user = userMap.get(fac.user_id);
    const facultyName = user?.full_name || 'Faculty';
    const deptAssigns = deptAssignments.filter((a) => a.faculty_id === fac.id);
    const primaryDept = deptAssigns.find((a) => a.is_primary_department) || deptAssigns[0];
    const deptName = primaryDept ? deptMap.get(primaryDept.department_id)?.name || 'Department' : 'General';

    // Workload check
    const wl = workloads.find((w) => w.faculty_id === fac.id);
    const currentWeeklyHours = wl?.hours_per_week || 12;
    const maxWeeklyHours = fac.max_weekly_hours || 18;
    const hasWorkloadRoom = currentWeeklyHours + 1 <= maxWeeklyHours;

    // Check 1: Time Clash in Timetable Entries
    // Is faculty scheduled in any other lecture at this same day & period/time?
    const hasSlotClash = timetableEntries.some(
      (te) =>
        te.faculty_id === fac.id &&
        te.day_of_week === affectedLecture.dayOfWeek &&
        te.period_number === affectedLecture.periodNumber
    );

    // Check 2: Marked as unavailable slot
    const isSlotMarkedUnavailable = unavailableSlots.some(
      (u) =>
        u.faculty_id === fac.id &&
        u.day_of_week === affectedLecture.dayOfWeek &&
        (u.period_number === affectedLecture.periodNumber ||
          u.slot_id === `slot-${affectedLecture.periodNumber}`)
    );

    const isAvailable = !hasSlotClash && !isSlotMarkedUnavailable;

    // Check 3: Subject expertise & Department alignment
    const isSameDept = deptAssigns.some((a) => a.department_id === affectedLecture.departmentId);
    const hasSubjectSpecialization =
      fac.specializations?.some((spec) => {
        const specLower = spec.toLowerCase();
        const subNameLower = (subject?.name || '').toLowerCase();
        const subCodeLower = (subject?.code || '').toLowerCase();
        return (
          subNameLower.includes(specLower) ||
          specLower.includes(subNameLower) ||
          specLower.includes('systems') ||
          specLower.includes('engineering') ||
          specLower.includes('computer')
        );
      }) || false;

    // Calculate match score
    let score = 50;
    const reasons: string[] = [];

    if (hasSubjectSpecialization) {
      score += 25;
      reasons.push(`Subject domain expert in ${fac.specializations?.[0] || 'course topics'}`);
    }

    if (isSameDept) {
      score += 15;
      reasons.push(`Faculty in ${affectedLecture.departmentName}`);
    }

    if (isAvailable) {
      score += 10;
      reasons.push(`Schedule free on ${affectedLecture.dayOfWeek} at ${affectedLecture.startTime}`);
    } else {
      score -= 50;
      if (hasSlotClash) {
        reasons.push(`Schedule collision: Teaching another class during ${affectedLecture.startTime}`);
      } else {
        reasons.push(`Marked unavailable on ${affectedLecture.dayOfWeek} Period ${affectedLecture.periodNumber}`);
      }
    }

    if (hasWorkloadRoom) {
      score += 10;
      reasons.push(`Workload capacity safe (${currentWeeklyHours}/${maxWeeklyHours} hrs)`);
    } else {
      score -= 15;
      reasons.push(`Near/exceeding max weekly limit (${currentWeeklyHours}/${maxWeeklyHours} hrs)`);
    }

    // Clamp score
    const clampedScore = Math.max(10, Math.min(99, score));

    suggestions.push({
      facultyId: fac.id,
      facultyName,
      employeeId: fac.employee_id,
      designation: fac.designation,
      departmentName: deptName,
      matchScore: clampedScore,
      isAvailable,
      hasSubjectExpertise: hasSubjectSpecialization || isSameDept,
      currentWeeklyHours,
      maxWeeklyHours,
      reasons,
      rejectionReason: !isAvailable ? 'Schedule Clash' : !hasWorkloadRoom ? 'Workload Limit' : undefined,
    });
  }

  // Sort: available first, then highest score
  return suggestions.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) {
      return a.isAvailable ? -1 : 1;
    }
    return b.matchScore - a.matchScore;
  });
}

// ============================================================================
// 3. LEAVE APPLICATION & WORKFLOW ACTIONS
// ============================================================================

export function createFacultyLeaveRequest(
  input: {
    facultyProfileId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
    applicantNotes?: string;
  },
  instituteId: string,
  existingLeaves: FacultyLeave[],
  existingBalances: LeaveBalance[],
  existingTypes: LeaveType[],
  affectedLecturesCount: number,
  currentUser: User
): {
  newLeave: FacultyLeave;
  updatedBalances: LeaveBalance[];
  notification: LeaveNotification;
  auditLog: LeaveAuditLog;
} {
  // Calculate total days
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newLeave: FacultyLeave = {
    id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    institute_id: instituteId,
    faculty_profile_id: input.facultyProfileId,
    leave_type_id: input.leaveTypeId,
    start_date: input.startDate,
    end_date: input.endDate,
    total_days: diffDays,
    reason: input.reason,
    attachment_url: input.attachmentUrl,
    status: 'PENDING',
    affected_lectures_count: affectedLecturesCount,
    applicant_notes: input.applicantNotes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Leave balances stay reserved / pending
  const leaveType = existingTypes.find((t) => t.id === input.leaveTypeId);
  const typeName = leaveType?.name || 'Leave';

  const notification: LeaveNotification = {
    id: `lnotif-${Date.now()}`,
    institute_id: instituteId,
    leave_id: newLeave.id,
    type: 'LEAVE_SUBMITTED',
    title: `Leave Request Submitted: ${typeName}`,
    message: `${currentUser.full_name} submitted a request for ${diffDays} day(s) from ${input.startDate} to ${input.endDate} (${affectedLecturesCount} lectures impacted).`,
    is_read: false,
    email_sent: true,
    email_delivery_status: 'QUEUED',
    created_at: new Date().toISOString(),
  };

  const auditLog: LeaveAuditLog = {
    id: `laudit-${Date.now()}`,
    institute_id: instituteId,
    user_id: currentUser.id,
    user_role: currentUser.role,
    action: 'LEAVE_REQUEST_SUBMITTED',
    entity_type: 'FACULTY_LEAVE',
    entity_id: newLeave.id,
    details: {
      days: diffDays,
      start: input.startDate,
      end: input.endDate,
      lecturesImpacted: affectedLecturesCount,
    },
    created_at: new Date().toISOString(),
  };

  return {
    newLeave,
    updatedBalances: existingBalances,
    notification,
    auditLog,
  };
}

export function approveFacultyLeave(
  leaveId: string,
  approverComments: string | undefined,
  leaves: FacultyLeave[],
  balances: LeaveBalance[],
  types: LeaveType[],
  approverUser: User,
  substituteAssignments: SubstituteAssignment[]
): {
  updatedLeave: FacultyLeave;
  updatedBalances: LeaveBalance[];
  approvalRecord: LeaveApproval;
  updatedSubstitutes: SubstituteAssignment[];
  notification: LeaveNotification;
  auditLog: LeaveAuditLog;
} {
  const targetLeave = leaves.find((l) => l.id === leaveId);
  if (!targetLeave) throw new Error('Leave request not found');

  const updatedLeave: FacultyLeave = {
    ...targetLeave,
    status: 'APPROVED',
    updated_at: new Date().toISOString(),
  };

  // Update Leave Balance
  const updatedBalances = balances.map((bal) => {
    if (
      bal.faculty_profile_id === targetLeave.faculty_profile_id &&
      bal.leave_type_id === targetLeave.leave_type_id
    ) {
      const newUsed = bal.used_leaves + targetLeave.total_days;
      return {
        ...bal,
        used_leaves: newUsed,
        remaining_leaves: Math.max(0, bal.total_leaves - newUsed),
        updated_at: new Date().toISOString(),
      };
    }
    return bal;
  });

  // Confirm associated substitute assignments
  const updatedSubstitutes = substituteAssignments.map((sub) => {
    if (sub.leave_id === leaveId && sub.status === 'PROPOSED') {
      return {
        ...sub,
        status: 'CONFIRMED' as const,
        updated_at: new Date().toISOString(),
      };
    }
    return sub;
  });

  const approvalRecord: LeaveApproval = {
    id: `appr-${Date.now()}`,
    leave_id: leaveId,
    approver_id: approverUser.id,
    approver_role: (approverUser.role as 'HEAD' | 'ADMIN' | 'SUPER_ADMIN') || 'HEAD',
    status: 'APPROVED',
    comments: approverComments || 'Approved by Academic Head',
    action_timestamp: new Date().toISOString(),
  };

  const notification: LeaveNotification = {
    id: `lnotif-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    leave_id: leaveId,
    type: 'LEAVE_APPROVED',
    title: 'Leave Request Approved',
    message: `Your leave request for ${targetLeave.total_days} day(s) (${targetLeave.start_date} to ${targetLeave.end_date}) was approved. Lecture substitutions confirmed.`,
    is_read: false,
    email_sent: true,
    email_delivery_status: 'QUEUED',
    created_at: new Date().toISOString(),
  };

  const auditLog: LeaveAuditLog = {
    id: `laudit-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    user_id: approverUser.id,
    user_role: approverUser.role,
    action: 'LEAVE_REQUEST_APPROVED',
    entity_type: 'FACULTY_LEAVE',
    entity_id: leaveId,
    details: {
      comments: approverComments,
      days: targetLeave.total_days,
    },
    created_at: new Date().toISOString(),
  };

  return {
    updatedLeave,
    updatedBalances,
    approvalRecord,
    updatedSubstitutes,
    notification,
    auditLog,
  };
}

export function rejectFacultyLeave(
  leaveId: string,
  rejectionReason: string,
  leaves: FacultyLeave[],
  approverUser: User
): {
  updatedLeave: FacultyLeave;
  approvalRecord: LeaveApproval;
  notification: LeaveNotification;
  auditLog: LeaveAuditLog;
} {
  const targetLeave = leaves.find((l) => l.id === leaveId);
  if (!targetLeave) throw new Error('Leave request not found');

  const updatedLeave: FacultyLeave = {
    ...targetLeave,
    status: 'REJECTED',
    rejection_reason: rejectionReason,
    updated_at: new Date().toISOString(),
  };

  const approvalRecord: LeaveApproval = {
    id: `appr-${Date.now()}`,
    leave_id: leaveId,
    approver_id: approverUser.id,
    approver_role: (approverUser.role as 'HEAD' | 'ADMIN' | 'SUPER_ADMIN') || 'HEAD',
    status: 'REJECTED',
    comments: rejectionReason,
    action_timestamp: new Date().toISOString(),
  };

  const notification: LeaveNotification = {
    id: `lnotif-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    leave_id: leaveId,
    type: 'LEAVE_REJECTED',
    title: 'Leave Request Rejected',
    message: `Your leave request for ${targetLeave.start_date} was rejected: ${rejectionReason}`,
    is_read: false,
    email_sent: true,
    email_delivery_status: 'QUEUED',
    created_at: new Date().toISOString(),
  };

  const auditLog: LeaveAuditLog = {
    id: `laudit-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    user_id: approverUser.id,
    user_role: approverUser.role,
    action: 'LEAVE_REQUEST_REJECTED',
    entity_type: 'FACULTY_LEAVE',
    entity_id: leaveId,
    details: {
      rejectionReason,
    },
    created_at: new Date().toISOString(),
  };

  return {
    updatedLeave,
    approvalRecord,
    notification,
    auditLog,
  };
}

export function cancelFacultyLeave(
  leaveId: string,
  leaves: FacultyLeave[],
  currentUser: User
): {
  updatedLeave: FacultyLeave;
  notification: LeaveNotification;
  auditLog: LeaveAuditLog;
} {
  const targetLeave = leaves.find((l) => l.id === leaveId);
  if (!targetLeave) throw new Error('Leave request not found');

  const updatedLeave: FacultyLeave = {
    ...targetLeave,
    status: 'CANCELLED',
    updated_at: new Date().toISOString(),
  };

  const notification: LeaveNotification = {
    id: `lnotif-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    leave_id: leaveId,
    type: 'LEAVE_SUBMITTED',
    title: 'Leave Request Cancelled',
    message: `Leave request for ${targetLeave.start_date} to ${targetLeave.end_date} has been cancelled by the applicant.`,
    is_read: false,
    email_sent: false,
    email_delivery_status: 'NOT_APPLICABLE',
    created_at: new Date().toISOString(),
  };

  const auditLog: LeaveAuditLog = {
    id: `laudit-${Date.now()}`,
    institute_id: targetLeave.institute_id,
    user_id: currentUser.id,
    user_role: currentUser.role,
    action: 'LEAVE_REQUEST_CANCELLED',
    entity_type: 'FACULTY_LEAVE',
    entity_id: leaveId,
    details: {
      start: targetLeave.start_date,
      end: targetLeave.end_date,
    },
    created_at: new Date().toISOString(),
  };

  return {
    updatedLeave,
    notification,
    auditLog,
  };
}

// ============================================================================
// 4. LEAVE ANALYTICS & INSIGHTS
// ============================================================================

export interface LeaveAnalyticsSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  facultyOnLeaveToday: number;
  totalLecturesAffected: number;
  totalSubstitutionsConfirmed: number;
  monthlyTrends: { month: string; requests: number; approved: number; days: number }[];
  departmentStats: { departmentName: string; totalLeaves: number; affectedLectures: number }[];
  leaveTypeStats: { name: string; code: string; count: number; totalDays: number }[];
  substitutionUtilization: {
    facultyName: string;
    classesCovered: number;
    hoursContributed: number;
  }[];
}

export function computeLeaveAnalytics(
  leaves: FacultyLeave[],
  substitutes: SubstituteAssignment[],
  balances: LeaveBalance[],
  types: LeaveType[],
  facultyProfiles: FacultyProfile[],
  users: User[],
  deptAssignments: FacultyDepartmentAssignment[],
  departments: Department[]
): LeaveAnalyticsSummary {
  const todayStr = formatDateYMD(new Date());

  const totalRequests = leaves.length;
  const pendingRequests = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedRequests = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedRequests = leaves.filter((l) => l.status === 'REJECTED').length;

  // Faculty on leave today
  const onLeaveTodaySet = new Set<string>();
  for (const l of leaves) {
    if (l.status === 'APPROVED' && l.start_date <= todayStr && l.end_date >= todayStr) {
      onLeaveTodaySet.add(l.faculty_profile_id);
    }
  }
  const facultyOnLeaveToday = onLeaveTodaySet.size;

  const totalLecturesAffected = leaves.reduce((sum, l) => sum + (l.affected_lectures_count || 0), 0);
  const totalSubstitutionsConfirmed = substitutes.filter((s) => s.status === 'CONFIRMED' || s.status === 'COMPLETED').length;

  // Monthly trends (Last 6 months)
  const monthMap = new Map<string, { requests: number; approved: number; days: number }>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Seed recent months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
    monthMap.set(label, { requests: 0, approved: 0, days: 0 });
  }

  for (const l of leaves) {
    const d = new Date(l.start_date);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
    const curr = monthMap.get(label) || { requests: 0, approved: 0, days: 0 };
    curr.requests += 1;
    if (l.status === 'APPROVED') {
      curr.approved += 1;
      curr.days += l.total_days;
    }
    monthMap.set(label, curr);
  }

  const monthlyTrends = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    requests: data.requests,
    approved: data.approved,
    days: data.days,
  }));

  // Department Stats
  const deptMap = new Map<string, { departmentName: string; totalLeaves: number; affectedLectures: number }>();
  for (const dept of departments) {
    deptMap.set(dept.id, { departmentName: dept.name, totalLeaves: 0, affectedLectures: 0 });
  }

  for (const l of leaves) {
    const facAssign = deptAssignments.find((a) => a.faculty_id === l.faculty_profile_id && a.is_primary_department) ||
      deptAssignments.find((a) => a.faculty_id === l.faculty_profile_id);
    if (facAssign && deptMap.has(facAssign.department_id)) {
      const curr = deptMap.get(facAssign.department_id)!;
      curr.totalLeaves += l.total_days;
      curr.affectedLectures += l.affected_lectures_count;
    }
  }

  const departmentStats = Array.from(deptMap.values());

  // Leave Type stats
  const typeMap = new Map<string, { name: string; code: string; count: number; totalDays: number }>();
  for (const t of types) {
    typeMap.set(t.id, { name: t.name, code: t.code, count: 0, totalDays: 0 });
  }

  for (const l of leaves) {
    const t = typeMap.get(l.leave_type_id);
    if (t) {
      t.count += 1;
      t.totalDays += l.total_days;
    }
  }

  const leaveTypeStats = Array.from(typeMap.values());

  // Substitute utilization
  const subUtilMap = new Map<string, { facultyName: string; classesCovered: number; hoursContributed: number }>();
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

  for (const s of substitutes) {
    if (s.status === 'CONFIRMED' || s.status === 'COMPLETED') {
      const fac = facultyProfiles.find((f) => f.id === s.substitute_faculty_id);
      const user = userMap.get(fac?.user_id || '');
      const name = user?.full_name || 'Substitute';
      const curr = subUtilMap.get(s.substitute_faculty_id) || {
        facultyName: name,
        classesCovered: 0,
        hoursContributed: 0,
      };
      curr.classesCovered += 1;
      curr.hoursContributed += 1;
      subUtilMap.set(s.substitute_faculty_id, curr);
    }
  }

  const substitutionUtilization = Array.from(subUtilMap.values()).sort(
    (a, b) => b.classesCovered - a.classesCovered
  );

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    facultyOnLeaveToday,
    totalLecturesAffected,
    totalSubstitutionsConfirmed,
    monthlyTrends,
    departmentStats,
    leaveTypeStats,
    substitutionUtilization,
  };
}
