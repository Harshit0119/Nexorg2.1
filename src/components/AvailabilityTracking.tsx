import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  Calendar,
  Sliders,
  Scale,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  Building,
  UserCheck,
  Check,
  X,
  Search,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Info,
  ChevronDown,
  Star,
  RefreshCw,
  Zap
} from 'lucide-react';
import {
  FacultyProfile,
  FacultyAvailability,
  User,
  AcademicDay,
  AvailabilityStatus,
  UserRole,
  Department,
  WorkloadAllocation,
  Subject,
  InstituteWorkingDay,
  InstituteTimeSlot,
  FacultyUnavailableSlot,
  WorkloadRule,
  WorkloadLimit,
  InstituteTimingConfig,
  FacultyUtilizationMetric,
  SlotType
} from '../types/database';
import {
  facultyUnavailableSlotSchema,
  workloadRuleSchema,
  workloadLimitSchema,
  instituteTimingConfigSchema,
  instituteTimeSlotSchema
} from '../lib/validations';
import { generateSlotsFromTimings } from '../services/availabilityWorkloadActions';

interface AvailabilityTrackingProps {
  facultyProfiles: FacultyProfile[];
  users: User[];
  departments: Department[];
  workloads: WorkloadAllocation[];
  subjects: Subject[];
  availabilities: FacultyAvailability[];
  workingDays: InstituteWorkingDay[];
  timeSlots: InstituteTimeSlot[];
  unavailableSlots: FacultyUnavailableSlot[];
  workloadRules: WorkloadRule[];
  workloadLimits: WorkloadLimit[];
  timingConfig: InstituteTimingConfig;
  onAddAvailability: (avail: Omit<FacultyAvailability, 'id' | 'created_at'>) => void;
  onRemoveAvailability: (id: string) => void;
  onUpdateWorkingDays: (days: InstituteWorkingDay[]) => void;
  onUpdateTimeSlots: (slots: InstituteTimeSlot[]) => void;
  onAddTimeSlot?: (slot: Omit<InstituteTimeSlot, 'id' | 'created_at'>) => void;
  onUpdateSingleTimeSlot?: (id: string, updated: Partial<InstituteTimeSlot>) => void;
  onDeleteTimeSlot?: (id: string) => void;
  onAddUnavailableSlot: (slot: Omit<FacultyUnavailableSlot, 'id' | 'created_at'>) => void;
  onRemoveUnavailableSlot: (id: string) => void;
  onMarkDayUnavailable?: (facultyId: string, day: AcademicDay, reason: string) => void;
  onClearDayUnavailable?: (facultyId: string, day: AcademicDay) => void;
  onAddWorkloadRule: (rule: Omit<WorkloadRule, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateWorkloadRule: (id: string, updated: Partial<WorkloadRule>) => void;
  onDeleteWorkloadRule: (id: string) => void;
  onUpdateWorkloadLimit: (limit: Omit<WorkloadLimit, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTimingConfig: (config: InstituteTimingConfig) => void;
  currentRole: UserRole;
  userAssignedDeptId?: string;
}

export type AvailabilityTab = 
  | 'timings' 
  | 'working-days' 
  | 'time-slots' 
  | 'availability' 
  | 'workload-rules' 
  | 'utilization';

const ALL_DAYS: AcademicDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const AvailabilityTracking: React.FC<AvailabilityTrackingProps> = ({
  facultyProfiles,
  users,
  departments,
  workloads,
  subjects,
  availabilities,
  workingDays,
  timeSlots,
  unavailableSlots,
  workloadRules,
  workloadLimits,
  timingConfig,
  onAddAvailability,
  onRemoveAvailability,
  onUpdateWorkingDays,
  onUpdateTimeSlots,
  onAddTimeSlot,
  onUpdateSingleTimeSlot,
  onDeleteTimeSlot,
  onAddUnavailableSlot,
  onRemoveUnavailableSlot,
  onMarkDayUnavailable,
  onClearDayUnavailable,
  onAddWorkloadRule,
  onUpdateWorkloadRule,
  onDeleteWorkloadRule,
  onUpdateWorkloadLimit,
  onUpdateTimingConfig,
  currentRole,
  userAssignedDeptId,
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AvailabilityTab>('availability');

  // Selected Faculty for Matrix inspection
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    currentRole === 'FACULTY' ? 'fac-rahul' : facultyProfiles[0]?.id || 'fac-rahul'
  );

  // Filter & Search states
  const [searchFaculty, setSearchFaculty] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BALANCED' | 'UNDERLOAD' | 'OVERLOAD'>('ALL');

  // Modals
  const [isAddUnavailableModalOpen, setIsAddUnavailableModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
  const [targetRuleToEdit, setTargetRuleToEdit] = useState<WorkloadRule | null>(null);
  const [isEditLimitModalOpen, setIsEditLimitModalOpen] = useState(false);
  const [targetFacultyForLimit, setTargetFacultyForLimit] = useState<FacultyProfile | null>(null);

  // Time Slot Form & Modal states
  const [isAddTimeSlotModalOpen, setIsAddTimeSlotModalOpen] = useState(false);
  const [isEditTimeSlotModalOpen, setIsEditTimeSlotModalOpen] = useState(false);
  const [targetSlotToEdit, setTargetSlotToEdit] = useState<InstituteTimeSlot | null>(null);
  const [slotNumberInput, setSlotNumberInput] = useState(1);
  const [slotLabelInput, setSlotLabelInput] = useState('');
  const [slotTypeInput, setSlotTypeInput] = useState<SlotType>('LECTURE');
  const [slotStartTimeInput, setSlotStartTimeInput] = useState('09:00');
  const [slotEndTimeInput, setSlotEndTimeInput] = useState('10:00');
  const [slotIsBreakInput, setSlotIsBreakInput] = useState(false);

  // Mark Day Unavailable Modal states
  const [isMarkDayModalOpen, setIsMarkDayModalOpen] = useState(false);
  const [markDayTarget, setMarkDayTarget] = useState<AcademicDay>('SATURDAY');
  const [markDayReason, setMarkDayReason] = useState('Research & Departmental Duties');

  // Form states for Blocked / Unavailable slot
  const [blockDay, setBlockDay] = useState<AcademicDay>('MONDAY');
  const [blockPeriod, setBlockPeriod] = useState<number>(1);
  const [blockReason, setBlockReason] = useState<string>('');
  const [blockFacultyId, setBlockFacultyId] = useState<string>(selectedFacultyId);

  // Form states for Workload Rule
  const [ruleName, setRuleName] = useState('');
  const [ruleDeptId, setRuleDeptId] = useState<string>('');
  const [ruleMaxHours, setRuleMaxHours] = useState(18);
  const [ruleMinHours, setRuleMinHours] = useState(12);
  const [ruleMaxLecturesPerDay, setRuleMaxLecturesPerDay] = useState(4);
  const [ruleMaxConsecutive, setRuleMaxConsecutive] = useState(2);
  const [ruleMaxPractical, setRuleMaxPractical] = useState(8);
  const [ruleAllowSaturday, setRuleAllowSaturday] = useState(true);

  // Form states for Individual Workload Limit Override
  const [limitMaxHours, setLimitMaxHours] = useState(18);
  const [limitMinHours, setLimitMinHours] = useState(12);
  const [limitMaxLecturesPerDay, setLimitMaxLecturesPerDay] = useState(4);
  const [limitMaxConsecutive, setLimitMaxConsecutive] = useState(2);
  const [limitMaxPractical, setLimitMaxPractical] = useState(8);
  const [limitNotes, setLimitNotes] = useState('');

  // Form states for Institute Timings
  const [timingStart, setTimingStart] = useState(timingConfig.college_start_time || '09:00');
  const [timingEnd, setTimingEnd] = useState(timingConfig.college_end_time || '17:00');
  const [timingPeriods, setTimingPeriods] = useState(timingConfig.total_periods_per_day || 8);
  const [timingDuration, setTimingDuration] = useState(timingConfig.period_duration_minutes || 50);
  const [timingLunchStart, setTimingLunchStart] = useState(timingConfig.lunch_break_start || '13:00');
  const [timingLunchEnd, setTimingLunchEnd] = useState(timingConfig.lunch_break_end || '14:00');
  const [timingLunchAfterPeriod, setTimingLunchAfterPeriod] = useState(timingConfig.lunch_after_period || 4);

  // Feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Active Faculty Details
  const selectedFaculty = facultyProfiles.find((f) => f.id === selectedFacultyId);
  const selectedUser = users.find((u) => u.id === selectedFaculty?.user_id);
  const selectedFacultyUnavailable = unavailableSlots.filter((s) => s.faculty_id === selectedFacultyId);

  // Active working days list
  const activeWorkingDays = workingDays.filter((wd) => wd.is_working_day);

  // Period slots sorted
  const sortedSlots = [...timeSlots].sort((a, b) => a.slot_number - b.slot_number);
  const lectureSlots = sortedSlots.filter((s) => !s.is_break);

  // =========================================================================
  // ANALYTICS COMPUTATION: FACULTY UTILIZATION METRICS
  // =========================================================================
  const facultyUtilizationMetrics: FacultyUtilizationMetric[] = facultyProfiles.map((faculty) => {
    const user = users.find((u) => u.id === faculty.user_id);
    const facultyWorkloads = workloads.filter((w) => w.faculty_id === faculty.id);
    const facultyUnavail = unavailableSlots.filter((s) => s.faculty_id === faculty.id);
    const specificLimit = workloadLimits.find((l) => l.faculty_id === faculty.id);

    const maxHours = specificLimit?.max_weekly_hours ?? faculty.max_weekly_hours;
    const minHours = specificLimit?.min_weekly_hours ?? faculty.min_weekly_hours;
    const assignedHours = facultyWorkloads.reduce((sum, w) => sum + w.hours_per_week, 0);

    // Available teaching hours = (Total Periods in week - Unavailable periods) * slot hours approx
    const activeDaysCount = activeWorkingDays.length;
    const weeklyPeriodsCapacity = activeDaysCount * (timingConfig.total_periods_per_day || 8);
    const blockedPeriodsCount = facultyUnavail.length;
    const availablePeriods = Math.max(0, weeklyPeriodsCapacity - blockedPeriodsCount);
    const availableHours = Math.round(availablePeriods * 1.0); // 1 period approx 1 hr
    const freeHours = Math.max(0, maxHours - assignedHours);

    const utilizationPct = maxHours > 0 ? Math.round((assignedHours / maxHours) * 100) : 0;

    let status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD' = 'BALANCED';
    if (assignedHours < minHours) status = 'UNDERLOAD';
    if (assignedHours > maxHours) status = 'OVERLOAD';

    const deptNames = departments
      .filter((d) => facultyWorkloads.some((w) => w.department_id === d.id))
      .map((d) => d.code);

    return {
      faculty_id: faculty.id,
      faculty_name: user?.full_name || 'Faculty Member',
      employee_id: faculty.employee_id,
      designation: faculty.designation,
      department_names: deptNames.length > 0 ? deptNames : ['CSE'],
      max_hours: maxHours,
      min_hours: minHours,
      assigned_hours: assignedHours,
      available_hours: availableHours,
      free_hours: freeHours,
      utilization_percentage: utilizationPct,
      status,
      unavailable_periods_count: blockedPeriodsCount,
      allocated_subjects_count: facultyWorkloads.length,
    };
  });

  // Campus aggregated metrics
  const totalAssignedTeachingHours = facultyUtilizationMetrics.reduce((sum, m) => sum + m.assigned_hours, 0);
  const totalCampusCapacityHours = facultyUtilizationMetrics.reduce((sum, m) => sum + m.max_hours, 0);
  const averageUtilization = facultyUtilizationMetrics.length > 0
    ? Math.round(facultyUtilizationMetrics.reduce((sum, m) => sum + m.utilization_percentage, 0) / facultyUtilizationMetrics.length)
    : 0;
  const balancedFacultyCount = facultyUtilizationMetrics.filter((m) => m.status === 'BALANCED').length;
  const underloadFacultyCount = facultyUtilizationMetrics.filter((m) => m.status === 'UNDERLOAD').length;
  const overloadFacultyCount = facultyUtilizationMetrics.filter((m) => m.status === 'OVERLOAD').length;

  // Filtered faculty for table
  const filteredMetrics = facultyUtilizationMetrics.filter((m) => {
    const matchesSearch =
      !searchFaculty ||
      m.faculty_name.toLowerCase().includes(searchFaculty.toLowerCase()) ||
      m.employee_id.toLowerCase().includes(searchFaculty.toLowerCase());
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      m.department_names.includes(selectedDeptFilter);
    const matchesStatus =
      statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. Toggle Day/Period Availability from Matrix (3-State Cycling: Open -> Preferred -> Blocked -> Open)
  const handleToggleCellAvailability = (day: AcademicDay, periodNumber: number) => {
    const isBlocked = unavailableSlots.find(
      (s) => s.faculty_id === selectedFacultyId && s.day_of_week === day && s.period_number === periodNumber
    );

    const isPreferred = availabilities.find(
      (a) => a.faculty_id === selectedFacultyId && a.day_of_week === day && a.reason === `PERIOD_${periodNumber}_PREFERRED`
    );

    if (isBlocked) {
      // 1. Blocked -> Open (Remove lockout constraint)
      onRemoveUnavailableSlot(isBlocked.id);
      setFormSuccess(`Unlocked ${day} Period ${periodNumber} for ${selectedUser?.full_name}. Slot is now OPEN.`);
      setTimeout(() => setFormSuccess(null), 2500);
    } else if (isPreferred) {
      // 2. Preferred -> Blocked (Remove preferred tag, add hard constraint)
      onRemoveAvailability(isPreferred.id);
      const slot = timeSlots.find((s) => s.slot_number === periodNumber);
      onAddUnavailableSlot({
        faculty_id: selectedFacultyId,
        institute_id: 'inst-001',
        day_of_week: day,
        period_number: periodNumber,
        slot_id: slot?.id,
        reason: 'Faculty personal or research constraint',
        is_recurring: true,
      });
      setFormSuccess(`Marked ${day} Period ${periodNumber} as BLOCKED constraint for timetable generation.`);
      setTimeout(() => setFormSuccess(null), 2500);
    } else {
      // 3. Open -> Preferred (Mark as optimal teaching slot)
      onAddAvailability({
        faculty_id: selectedFacultyId,
        institute_id: 'inst-001',
        day_of_week: day,
        start_time: '09:00',
        end_time: '10:00',
        status: 'AVAILABLE',
        reason: `PERIOD_${periodNumber}_PREFERRED`,
      });
      setFormSuccess(`Marked ${day} Period ${periodNumber} as PREFERRED teaching time.`);
      setTimeout(() => setFormSuccess(null), 2500);
    }
  };

  // 1b. Mark Entire Day Unavailable
  const handleConfirmMarkDayUnavailable = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nonBreakSlots = timeSlots.filter((s) => !s.is_break);
    if (nonBreakSlots.length === 0) {
      setFormError('No active instructional time slots configured to block.');
      return;
    }

    if (onMarkDayUnavailable) {
      onMarkDayUnavailable(selectedFacultyId, markDayTarget, markDayReason.trim());
    } else {
      for (const slot of nonBreakSlots) {
        const alreadyBlocked = unavailableSlots.some(
          (u) =>
            u.faculty_id === selectedFacultyId &&
            u.day_of_week === markDayTarget &&
            u.period_number === slot.slot_number
        );
        if (!alreadyBlocked) {
          onAddUnavailableSlot({
            faculty_id: selectedFacultyId,
            institute_id: 'inst-001',
            day_of_week: markDayTarget,
            period_number: slot.slot_number,
            slot_id: slot.id,
            reason: markDayReason.trim() || `Full day unavailable: ${markDayTarget}`,
            is_recurring: true,
          });
        }
      }
    }

    setIsMarkDayModalOpen(false);
    setFormSuccess(`Entire ${markDayTarget} marked as unavailable for ${selectedUser?.full_name}.`);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  // 1c. Clear All Restrictions for a Specific Day
  const handleClearDayRestrictions = (day: AcademicDay) => {
    if (confirm(`Unlock all blocked periods on ${day} for ${selectedUser?.full_name}?`)) {
      if (onClearDayUnavailable) {
        onClearDayUnavailable(selectedFacultyId, day);
      } else {
        const slotsToRemove = unavailableSlots.filter(
          (u) => u.faculty_id === selectedFacultyId && u.day_of_week === day
        );
        slotsToRemove.forEach((s) => onRemoveUnavailableSlot(s.id));
      }
      setFormSuccess(`Cleared all blocked periods on ${day} for ${selectedUser?.full_name}.`);
      setTimeout(() => setFormSuccess(null), 2500);
    }
  };

  // 1d. Quick Demo for User Brief: Professor Rahul Blocked Mon P1 & Fri P7
  const handleQuickDemoRahul = () => {
    setSelectedFacultyId('fac-rahul');
    const hasMonP1 = unavailableSlots.some(
      (u) => u.faculty_id === 'fac-rahul' && u.day_of_week === 'MONDAY' && u.period_number === 1
    );
    const hasFriP7 = unavailableSlots.some(
      (u) => u.faculty_id === 'fac-rahul' && u.day_of_week === 'FRIDAY' && u.period_number === 7
    );

    if (!hasMonP1) {
      onAddUnavailableSlot({
        faculty_id: 'fac-rahul',
        institute_id: 'inst-001',
        day_of_week: 'MONDAY',
        period_number: 1,
        reason: "Dean's Academic Senate Meeting",
        is_recurring: true,
      });
    }
    if (!hasFriP7) {
      onAddUnavailableSlot({
        faculty_id: 'fac-rahul',
        institute_id: 'inst-001',
        day_of_week: 'FRIDAY',
        period_number: 7,
        reason: 'AI Innovation Lab Research & Doctoral Review',
        is_recurring: true,
      });
    }
    setFormSuccess('Configured Professor Rahul: Monday Period 1 & Friday Period 7 locked out.');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  // 2. Submit explicit Unavailable Period Modal
  const handleConfirmAddUnavailable = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = facultyUnavailableSlotSchema.safeParse({
      faculty_id: blockFacultyId,
      day_of_week: blockDay,
      period_number: Number(blockPeriod),
      reason: blockReason.trim(),
      is_recurring: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    // Check duplicate
    const isDuplicate = unavailableSlots.some(
      (s) => s.faculty_id === blockFacultyId && s.day_of_week === blockDay && s.period_number === Number(blockPeriod)
    );
    if (isDuplicate) {
      setFormError(`This period (${blockDay} Period ${blockPeriod}) is already recorded as unavailable.`);
      return;
    }

    const slot = timeSlots.find((s) => s.slot_number === Number(blockPeriod));
    onAddUnavailableSlot({
      faculty_id: blockFacultyId,
      institute_id: 'inst-001',
      day_of_week: blockDay,
      period_number: Number(blockPeriod),
      slot_id: slot?.id,
      reason: blockReason.trim(),
      is_recurring: true,
    });

    setIsAddUnavailableModalOpen(false);
    setBlockReason('');
    setFormSuccess(`Added unavailable slot: ${blockDay} Period ${blockPeriod}.`);
    setTimeout(() => setFormSuccess(null), 2500);
  };

  // 3. Save Institute Timing Settings
  const handleSaveTimingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const newConfig: InstituteTimingConfig = {
      working_days: activeWorkingDays.map((wd) => wd.day_of_week),
      college_start_time: timingStart,
      college_end_time: timingEnd,
      total_periods_per_day: Number(timingPeriods),
      period_duration_minutes: Number(timingDuration),
      lunch_break_start: timingLunchStart,
      lunch_break_end: timingLunchEnd,
      lunch_after_period: Number(timingLunchAfterPeriod),
    };

    const validation = instituteTimingConfigSchema.safeParse(newConfig);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Invalid timing configuration');
      return;
    }

    onUpdateTimingConfig(newConfig);
    setFormSuccess('Institute timings & period constraints successfully updated!');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  // 3b. Auto-Regenerate Slots from Timings
  const handleRegenerateSlotsFromTimings = () => {
    if (confirm('Regenerate and synchronize all period slots from current Institute Timings?')) {
      const generated = generateSlotsFromTimings(timingConfig);
      const withIds: InstituteTimeSlot[] = generated.map((s, idx) => ({
        ...s,
        id: `slot-gen-${idx + 1}`,
        institute_id: 'inst-001',
        created_at: new Date().toISOString(),
      }));
      onUpdateTimeSlots(withIds);
      setFormSuccess('Successfully regenerated period slots from institute operating timings.');
      setTimeout(() => setFormSuccess(null), 3000);
    }
  };

  // 4. Toggle Working Day
  const handleToggleWorkingDay = (day: AcademicDay) => {
    if (currentRole !== 'HEAD') return;
    const updated = workingDays.map((wd) =>
      wd.day_of_week === day ? { ...wd, is_working_day: !wd.is_working_day } : wd
    );
    onUpdateWorkingDays(updated);
  };

  // 4b. Apply Working Days Preset
  const handleApplyPresetWorkingDays = (preset: '6-DAY' | '5-DAY' | '7-DAY') => {
    if (currentRole !== 'HEAD') return;
    let updated: InstituteWorkingDay[] = [];
    if (preset === '6-DAY') {
      updated = ALL_DAYS.map((d, i) => ({
        id: `iwd-${i + 1}`,
        institute_id: 'inst-001',
        day_of_week: d,
        is_working_day: d !== 'SUNDAY',
        day_order: i + 1,
        created_at: new Date().toISOString(),
      }));
    } else if (preset === '5-DAY') {
      updated = ALL_DAYS.map((d, i) => ({
        id: `iwd-${i + 1}`,
        institute_id: 'inst-001',
        day_of_week: d,
        is_working_day: d !== 'SATURDAY' && d !== 'SUNDAY',
        day_order: i + 1,
        created_at: new Date().toISOString(),
      }));
    } else {
      updated = ALL_DAYS.map((d, i) => ({
        id: `iwd-${i + 1}`,
        institute_id: 'inst-001',
        day_of_week: d,
        is_working_day: true,
        day_order: i + 1,
        created_at: new Date().toISOString(),
      }));
    }
    onUpdateWorkingDays(updated);
    setFormSuccess(`Applied ${preset} working days preset.`);
    setTimeout(() => setFormSuccess(null), 2500);
  };

  // 4c. Time Slot Management
  const handleOpenAddSlot = () => {
    const maxNum = timeSlots.reduce((max, s) => Math.max(max, s.slot_number), 0);
    setSlotNumberInput(maxNum + 1);
    setSlotLabelInput(`Period ${maxNum + 1}`);
    setSlotTypeInput('LECTURE');
    setSlotStartTimeInput('09:00');
    setSlotEndTimeInput('10:00');
    setSlotIsBreakInput(false);
    setFormError(null);
    setIsAddTimeSlotModalOpen(true);
  };

  const handleConfirmAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (slotStartTimeInput >= slotEndTimeInput) {
      setFormError('End time must be strictly after start time.');
      return;
    }
    if (timeSlots.some((s) => s.slot_number === Number(slotNumberInput))) {
      setFormError(`Slot number ${slotNumberInput} already exists. Choose a unique slot number.`);
      return;
    }

    const newSlot: Omit<InstituteTimeSlot, 'id' | 'created_at'> = {
      institute_id: 'inst-001',
      slot_number: Number(slotNumberInput),
      label: slotLabelInput.trim() || `Period ${slotNumberInput}`,
      slot_type: slotTypeInput,
      start_time: slotStartTimeInput,
      end_time: slotEndTimeInput,
      is_break: slotIsBreakInput,
      is_active: true,
    };

    if (onAddTimeSlot) {
      onAddTimeSlot(newSlot);
    } else {
      onUpdateTimeSlots([...timeSlots, { ...newSlot, id: `slot-${Date.now()}`, created_at: new Date().toISOString() }]);
    }

    setIsAddTimeSlotModalOpen(false);
    setFormSuccess(`Added ${slotLabelInput} to time slot schedule.`);
    setTimeout(() => setFormSuccess(null), 2500);
  };

  const handleOpenEditSlot = (slot: InstituteTimeSlot) => {
    setTargetSlotToEdit(slot);
    setSlotNumberInput(slot.slot_number);
    setSlotLabelInput(slot.label);
    setSlotTypeInput(slot.slot_type);
    setSlotStartTimeInput(slot.start_time.slice(0, 5));
    setSlotEndTimeInput(slot.end_time.slice(0, 5));
    setSlotIsBreakInput(slot.is_break);
    setFormError(null);
    setIsEditTimeSlotModalOpen(true);
  };

  const handleConfirmEditSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlotToEdit) return;
    setFormError(null);

    if (slotStartTimeInput >= slotEndTimeInput) {
      setFormError('End time must be strictly after start time.');
      return;
    }

    const updated: Partial<InstituteTimeSlot> = {
      slot_number: Number(slotNumberInput),
      label: slotLabelInput.trim(),
      slot_type: slotTypeInput,
      start_time: slotStartTimeInput,
      end_time: slotEndTimeInput,
      is_break: slotIsBreakInput,
    };

    if (onUpdateSingleTimeSlot) {
      onUpdateSingleTimeSlot(targetSlotToEdit.id, updated);
    } else {
      onUpdateTimeSlots(timeSlots.map((s) => (s.id === targetSlotToEdit.id ? { ...s, ...updated } : s)));
    }

    setIsEditTimeSlotModalOpen(false);
    setFormSuccess(`Updated slot ${slotLabelInput}.`);
    setTimeout(() => setFormSuccess(null), 2500);
  };

  const handleDeleteSlot = (id: string, label: string) => {
    if (confirm(`Remove slot "${label}"?`)) {
      if (onDeleteTimeSlot) {
        onDeleteTimeSlot(id);
      } else {
        onUpdateTimeSlots(timeSlots.filter((s) => s.id !== id));
      }
      setFormSuccess(`Removed slot "${label}".`);
      setTimeout(() => setFormSuccess(null), 2500);
    }
  };

  // 5. Submit Workload Rule Modal
  const handleConfirmAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = workloadRuleSchema.safeParse({
      rule_name: ruleName.trim(),
      department_id: ruleDeptId || null,
      max_hours_per_week: Number(ruleMaxHours),
      min_hours_per_week: Number(ruleMinHours),
      max_lectures_per_day: Number(ruleMaxLecturesPerDay),
      max_consecutive_lectures: Number(ruleMaxConsecutive),
      max_practical_hours_per_week: Number(ruleMaxPractical),
      allow_saturday_teaching: ruleAllowSaturday,
      is_active: true,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (Number(ruleMaxHours) < Number(ruleMinHours)) {
      setFormError('Max hours must be greater than or equal to min hours.');
      return;
    }

    onAddWorkloadRule({
      institute_id: 'inst-001',
      department_id: ruleDeptId || undefined,
      rule_name: ruleName.trim(),
      max_hours_per_week: Number(ruleMaxHours),
      min_hours_per_week: Number(ruleMinHours),
      max_lectures_per_day: Number(ruleMaxLecturesPerDay),
      max_consecutive_lectures: Number(ruleMaxConsecutive),
      max_practical_hours_per_week: Number(ruleMaxPractical),
      allow_saturday_teaching: ruleAllowSaturday,
      is_active: true,
    });

    setIsAddRuleModalOpen(false);
    setRuleName('');
  };

  // 6. Submit Edit Rule Modal
  const handleConfirmEditRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRuleToEdit) return;
    setFormError(null);

    onUpdateWorkloadRule(targetRuleToEdit.id, {
      rule_name: ruleName.trim(),
      department_id: ruleDeptId || undefined,
      max_hours_per_week: Number(ruleMaxHours),
      min_hours_per_week: Number(ruleMinHours),
      max_lectures_per_day: Number(ruleMaxLecturesPerDay),
      max_consecutive_lectures: Number(ruleMaxConsecutive),
      max_practical_hours_per_week: Number(ruleMaxPractical),
      allow_saturday_teaching: ruleAllowSaturday,
    });

    setIsEditRuleModalOpen(false);
  };

  // 7. Open Edit Faculty Limit Modal
  const handleOpenEditLimit = (faculty: FacultyProfile) => {
    setFormError(null);
    setTargetFacultyForLimit(faculty);
    const existing = workloadLimits.find((l) => l.faculty_id === faculty.id);
    setLimitMaxHours(existing?.max_weekly_hours ?? faculty.max_weekly_hours);
    setLimitMinHours(existing?.min_weekly_hours ?? faculty.min_weekly_hours);
    setLimitMaxLecturesPerDay(existing?.max_lectures_per_day ?? 4);
    setLimitMaxConsecutive(existing?.max_consecutive_lectures ?? 2);
    setLimitMaxPractical(existing?.max_practical_hours ?? 8);
    setLimitNotes(existing?.notes ?? '');
    setIsEditLimitModalOpen(true);
  };

  // 8. Submit Workload Limit Override
  const handleConfirmLimitOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacultyForLimit) return;
    setFormError(null);

    const validation = workloadLimitSchema.safeParse({
      faculty_id: targetFacultyForLimit.id,
      max_weekly_hours: Number(limitMaxHours),
      min_weekly_hours: Number(limitMinHours),
      max_lectures_per_day: Number(limitMaxLecturesPerDay),
      max_consecutive_lectures: Number(limitMaxConsecutive),
      max_practical_hours: Number(limitMaxPractical),
      notes: limitNotes.trim(),
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (Number(limitMaxHours) < Number(limitMinHours)) {
      setFormError('Max weekly hours must be greater than or equal to min weekly hours.');
      return;
    }

    onUpdateWorkloadLimit({
      institute_id: 'inst-001',
      faculty_id: targetFacultyForLimit.id,
      max_weekly_hours: Number(limitMaxHours),
      min_weekly_hours: Number(limitMinHours),
      max_lectures_per_day: Number(limitMaxLecturesPerDay),
      max_consecutive_lectures: Number(limitMaxConsecutive),
      max_practical_hours: Number(limitMaxPractical),
      notes: limitNotes.trim(),
    });

    setIsEditLimitModalOpen(false);
    setFormSuccess('Faculty workload limits successfully updated!');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-indigo-400" />
              <span>Faculty Availability & Workload Rules</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Timetable Rules Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Define institutional timings, period slots, blocked faculty times, and workload constraints before clash-free timetable generation.
          </p>
        </div>

        {/* Action Buttons based on Role & Active Tab */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'availability' && (
            <>
              <button
                onClick={handleQuickDemoRahul}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-all"
                title="Example: Block Professor Rahul on Monday Period 1 and Friday Period 7"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Preset: Rahul Constraints</span>
              </button>

              <button
                onClick={() => {
                  setMarkDayTarget('SATURDAY');
                  setMarkDayReason('Research & Doctoral Sabbatical');
                  setIsMarkDayModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <Calendar className="h-3.5 w-3.5 text-rose-400" />
                <span>Mark Day Unavailable</span>
              </button>

              <button
                onClick={() => {
                  setBlockFacultyId(selectedFacultyId);
                  setBlockDay('MONDAY');
                  setBlockPeriod(1);
                  setBlockReason('');
                  setFormError(null);
                  setIsAddUnavailableModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Record Blocked Period</span>
              </button>
            </>
          )}

          {activeTab === 'time-slots' && currentRole === 'HEAD' && (
            <>
              <button
                onClick={handleRegenerateSlotsFromTimings}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
                title="Regenerate all slots based on Institute Timings duration & lunch break"
              >
                <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                <span>Regenerate from Timings</span>
              </button>
              <button
                onClick={handleOpenAddSlot}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Time Slot</span>
              </button>
            </>
          )}

          {activeTab === 'workload-rules' && currentRole !== 'FACULTY' && (
            <button
              onClick={() => {
                setRuleName('Department Workload Policy');
                setRuleDeptId(currentRole === 'ADMIN' && userAssignedDeptId ? userAssignedDeptId : '');
                setRuleMaxHours(18);
                setRuleMinHours(12);
                setRuleMaxLecturesPerDay(4);
                setRuleMaxConsecutive(2);
                setRuleMaxPractical(8);
                setRuleAllowSaturday(true);
                setFormError(null);
                setIsAddRuleModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Workload Policy</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {formSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {formSuccess}
          </span>
          <button onClick={() => setFormSuccess(null)} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Average Utilization</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{averageUtilization}%</span>
            <span className="text-[11px] text-zinc-400 font-mono">
              ({totalAssignedTeachingHours}h / {totalCampusCapacityHours}h)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Balanced Capacity</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{balancedFacultyCount}</span>
            <span className="text-[11px] text-zinc-400">of {facultyProfiles.length} Faculty</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Blocked Periods</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{unavailableSlots.length}</span>
            <span className="text-[11px] text-rose-400/90 font-mono">Hard Constraints</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Workload Rules</span>
            <Scale className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{workloadRules.length}</span>
            <span className="text-[11px] text-zinc-400">Policies Enforced</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: 6 Distinct UI Pages */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('timings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'timings'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Institute Timings</span>
        </button>

        <button
          onClick={() => setActiveTab('working-days')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'working-days'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Working Days ({activeWorkingDays.length}/7)</span>
        </button>

        <button
          onClick={() => setActiveTab('time-slots')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'time-slots'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Time Slot Settings ({timeSlots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'availability'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          <span>Faculty Availability ({unavailableSlots.length} Blocked)</span>
        </button>

        <button
          onClick={() => setActiveTab('workload-rules')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'workload-rules'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Workload Rules ({workloadRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('utilization')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            activeTab === 'utilization'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Faculty Utilization Dashboard</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: FACULTY AVAILABILITY (INTERACTIVE GRID & HARD CONSTRAINTS) */}
      {/* ========================================================================= */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          {/* Faculty Selector & Profile Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <img
                src={selectedUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={selectedUser?.full_name}
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10"
              />
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedUser?.full_name}</span>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {selectedFaculty?.employee_id}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {selectedFaculty?.designation} • Max Load: {selectedFaculty?.max_weekly_hours} hrs/wk
                </div>
              </div>
            </div>

            {currentRole !== 'FACULTY' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Select Professor:</span>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="rounded-lg bg-zinc-800 border border-white/[0.08] px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {facultyProfiles.map((f) => {
                    const u = users.find((usr) => usr.id === f.user_id);
                    return (
                      <option key={f.id} value={f.id}>
                        {u?.full_name} ({f.employee_id})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Guide / Legend Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                <span className="text-zinc-300 text-[11px]">Available / Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
                <span className="text-zinc-300 text-[11px]">Blocked / Unavailable (Click to toggle)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-zinc-800 border border-zinc-700 inline-block" />
                <span className="text-zinc-300 text-[11px]">Lunch Recess</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Click any period cell below to block/unblock time for timetable generation
            </div>
          </div>

          {/* Interactive Matrix Grid (Days × Periods) */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4 text-left w-36">Day / Period</th>
                    {sortedSlots.map((slot) => (
                      <th key={slot.id} className="py-3 px-2 min-w-[100px]">
                        <span className="text-white block font-semibold">{slot.label}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {activeWorkingDays.map((wd) => {
                    const day = wd.day_of_week;

                    return (
                      <tr key={day} className="hover:bg-white/[0.01]">
                        <td className="py-3.5 px-4 text-left font-bold text-white uppercase text-xs">
                          {day}
                        </td>

                        {sortedSlots.map((slot) => {
                          if (slot.is_break) {
                            return (
                              <td
                                key={slot.id}
                                className="py-2 px-2 bg-zinc-800/40 text-[10px] text-zinc-500 font-mono"
                              >
                                Break
                              </td>
                            );
                          }

                          const isBlocked = unavailableSlots.some(
                            (s) =>
                              s.faculty_id === selectedFacultyId &&
                              s.day_of_week === day &&
                              s.period_number === slot.slot_number
                          );

                          const blockedEntry = unavailableSlots.find(
                            (s) =>
                              s.faculty_id === selectedFacultyId &&
                              s.day_of_week === day &&
                              s.period_number === slot.slot_number
                          );

                          return (
                            <td key={slot.id} className="p-1.5">
                              <button
                                onClick={() => handleToggleCellAvailability(day, slot.slot_number)}
                                title={
                                  isBlocked
                                    ? `Unavailable: ${blockedEntry?.reason || 'Blocked'}. Click to unlock.`
                                    : 'Available for teaching. Click to block.'
                                }
                                className={`w-full py-2.5 px-2 rounded-lg text-xs font-medium transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                  isBlocked
                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isBlocked ? (
                                  <>
                                    <X className="h-3.5 w-3.5 text-rose-400" />
                                    <span className="text-[9px] font-mono uppercase tracking-wider text-rose-300/80">
                                      Blocked
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/80">
                                      Open
                                    </span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hard Constraints: Faculty Unavailable Periods Table */}
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Hard Constraints: Faculty Unavailable Periods</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                These recurring periods are locked out during clash-free timetable generation to guarantee professors never receive assignments during administrative or research hours.
              </p>
            </div>

            <button
              onClick={() => {
                setBlockFacultyId(selectedFacultyId);
                setBlockDay('MONDAY');
                setBlockPeriod(1);
                setBlockReason('');
                setFormError(null);
                setIsAddUnavailableModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow hover:opacity-95 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Blocked Period</span>
            </button>
          </div>

          {/* Unavailable Table */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Day of Week</th>
                    <th className="py-3 px-4">Period Number</th>
                    <th className="py-3 px-4">Time Window</th>
                    <th className="py-3 px-4">Reason / Constraint Purpose</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {unavailableSlots.map((slot) => {
                    const fac = facultyProfiles.find((f) => f.id === slot.faculty_id);
                    const usr = users.find((u) => u.id === fac?.user_id);
                    const tSlot = timeSlots.find((s) => s.slot_number === slot.period_number);

                    return (
                      <tr key={slot.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{usr?.full_name || 'Faculty Member'}</span>
                          <span className="block text-[11px] text-zinc-500 font-mono">{fac?.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{slot.day_of_week}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Period {slot.period_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {tSlot ? `${tSlot.start_time.slice(0, 5)} - ${tSlot.end_time.slice(0, 5)}` : 'Period ' + slot.period_number}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{slot.reason || 'Faculty Unavailable'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Unlock ${slot.day_of_week} Period ${slot.period_number} for ${usr?.full_name}?`)) {
                                onRemoveUnavailableSlot(slot.id);
                              }
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove Constraint"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: WORKING DAYS */}
      {/* ========================================================================= */}
      {activeTab === 'working-days' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>Institute Working Days Configuration</span>
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Configure institutional operating days for class schedules. Monday to Saturday is standard.
                </p>
              </div>

              {currentRole === 'HEAD' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Presets:</span>
                  <button
                    onClick={() => handleApplyPresetWorkingDays('6-DAY')}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/[0.08]"
                  >
                    6-Day (Mon-Sat)
                  </button>
                  <button
                    onClick={() => handleApplyPresetWorkingDays('5-DAY')}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/[0.08]"
                  >
                    5-Day (Mon-Fri)
                  </button>
                  <button
                    onClick={() => handleApplyPresetWorkingDays('7-DAY')}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/[0.08]"
                  >
                    7-Day (All)
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {workingDays.map((wd) => (
                <div
                  key={wd.day_of_week}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-white">{wd.day_of_week}</span>
                    <span className="text-[11px] text-zinc-400">Day #{wd.day_order}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        wd.is_working_day ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      {wd.is_working_day ? 'Active Working Day' : 'Campus Closed'}
                    </span>
                    {currentRole === 'HEAD' && (
                      <button
                        onClick={() => handleToggleWorkingDay(wd.day_of_week)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          wd.is_working_day
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-white/[0.1] hover:text-white'
                        }`}
                      >
                        {wd.is_working_day ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: INSTITUTE TIMINGS */}
      {/* ========================================================================= */}
      {activeTab === 'timings' && (
        <div className="max-w-4xl mx-auto">
          {/* College Timings Form */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>College Operating Timings & Period Setup</span>
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Global institutional hours, total periods per day, and lunch break timing enforced on timetable generator.
                </p>
              </div>

              {currentRole === 'HEAD' && (
                <button
                  type="button"
                  onClick={handleRegenerateSlotsFromTimings}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-semibold border border-white/[0.08] flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync Slots from Timings</span>
                </button>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTimingSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">College Start Time</label>
                  <input
                    type="time"
                    disabled={currentRole !== 'HEAD'}
                    value={timingStart}
                    onChange={(e) => setTimingStart(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">College End Time</label>
                  <input
                    type="time"
                    disabled={currentRole !== 'HEAD'}
                    value={timingEnd}
                    onChange={(e) => setTimingEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Total Periods Per Day</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    disabled={currentRole !== 'HEAD'}
                    value={timingPeriods}
                    onChange={(e) => setTimingPeriods(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Period Duration (Minutes)</label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    disabled={currentRole !== 'HEAD'}
                    value={timingDuration}
                    onChange={(e) => setTimingDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Lunch Break Start</label>
                  <input
                    type="time"
                    disabled={currentRole !== 'HEAD'}
                    value={timingLunchStart}
                    onChange={(e) => setTimingLunchStart(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Lunch Break End</label>
                  <input
                    type="time"
                    disabled={currentRole !== 'HEAD'}
                    value={timingLunchEnd}
                    onChange={(e) => setTimingLunchEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Lunch After Period</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    disabled={currentRole !== 'HEAD'}
                    value={timingLunchAfterPeriod}
                    onChange={(e) => setTimingLunchAfterPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {currentRole === 'HEAD' && (
                <div className="pt-3 border-t border-white/[0.08] flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg transition-all"
                  >
                    Save Timing Configuration
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: TIME SLOT SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'time-slots' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>Period Time Slot Schedule</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Granular period timing table used by the scheduling engine for collision detection across rooms, labs, and professors.
              </p>
            </div>

            {currentRole === 'HEAD' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateSlotsFromTimings}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-semibold border border-white/[0.08] flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync from Timings</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddSlot}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow hover:opacity-95 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Period Slot</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Period #</th>
                    <th className="py-3 px-4">Label</th>
                    <th className="py-3 px-4">Slot Type</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4">Break Status</th>
                    {currentRole === 'HEAD' && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {sortedSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-white">{slot.slot_number}</td>
                      <td className="py-3 px-4 font-medium text-white">{slot.label}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                          {slot.slot_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{slot.start_time.slice(0, 5)}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{slot.end_time.slice(0, 5)}</td>
                      <td className="py-3 px-4">
                        {slot.is_break ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Recess / Break
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Instructional
                          </span>
                        )}
                      </td>
                      {currentRole === 'HEAD' && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSlot(slot)}
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Edit Slot"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id, slot.label)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: WORKLOAD RULES & POLICIES */}
      {/* ========================================================================= */}
      {activeTab === 'workload-rules' && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-cyan-400" />
                <span>Institutional & Departmental Workload Policies</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Define maximum hours per week, maximum lectures per day, consecutive lecture ceilings, and practical hour limits.
              </p>
            </div>

            {currentRole !== 'FACULTY' && (
              <button
                type="button"
                onClick={() => {
                  setRuleName('');
                  setRuleDeptId('');
                  setRuleMaxHours(18);
                  setRuleMinHours(12);
                  setRuleMaxLecturesPerDay(4);
                  setRuleMaxConsecutive(2);
                  setRuleMaxPractical(8);
                  setRuleAllowSaturday(true);
                  setFormError(null);
                  setIsAddRuleModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow hover:opacity-95 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Workload Policy</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workloadRules.map((rule) => {
              const dept = departments.find((d) => d.id === rule.department_id);

              return (
                <div
                  key={rule.id}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5 hover:border-white/[0.15] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        {dept ? dept.code : 'CAMPUS DEFAULT'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {rule.is_active ? 'Active Policy' : 'Archived'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-white">{rule.rule_name}</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Scope: {dept ? dept.name : 'All Academic Departments'}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-800/40 text-[11px] font-mono border border-white/[0.04]">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Weekly Hours</span>
                        <span className="font-bold text-white">{rule.min_hours_per_week}h - {rule.max_hours_per_week}h</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Daily Lectures</span>
                        <span className="font-bold text-indigo-400">Max {rule.max_lectures_per_day} / day</span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04]">
                        <span className="text-zinc-500 block text-[10px]">Consecutive Max</span>
                        <span className="font-bold text-emerald-400">{rule.max_consecutive_lectures} lectures</span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04]">
                        <span className="text-zinc-500 block text-[10px]">Practical Limit</span>
                        <span className="font-bold text-amber-400">{rule.max_practical_hours_per_week} hrs/wk</span>
                      </div>
                    </div>
                  </div>

                  {currentRole !== 'FACULTY' && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setTargetRuleToEdit(rule);
                          setRuleName(rule.rule_name);
                          setRuleDeptId(rule.department_id || '');
                          setRuleMaxHours(rule.max_hours_per_week);
                          setRuleMinHours(rule.min_hours_per_week);
                          setRuleMaxLecturesPerDay(rule.max_lectures_per_day);
                          setRuleMaxConsecutive(rule.max_consecutive_lectures);
                          setRuleMaxPractical(rule.max_practical_hours_per_week);
                          setRuleAllowSaturday(rule.allow_saturday_teaching);
                          setIsEditRuleModalOpen(true);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit Policy"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {onDeleteWorkloadRule && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete rule ${rule.rule_name}?`)) {
                              onDeleteWorkloadRule(rule.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Policy"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: FACULTY UTILIZATION DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'utilization' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 rounded-xl border border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search faculty name or ID..."
                  value={searchFaculty}
                  onChange={(e) => setSearchFaculty(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-zinc-800/80 border border-white/[0.08] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">Department:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-zinc-800 border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Showing {filteredMetrics.length} of {facultyProfiles.length} Faculty Members
            </div>
          </div>

          {/* Detailed Utilization Table */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 font-mono text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Departments</th>
                    <th className="py-3 px-4">Assigned / Target Load</th>
                    <th className="py-3 px-4">Available Capacity</th>
                    <th className="py-3 px-4">Utilization %</th>
                    <th className="py-3 px-4">Workload Status</th>
                    {currentRole !== 'FACULTY' && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  {filteredMetrics.map((item) => {
                    const faculty = facultyProfiles.find((f) => f.id === item.faculty_id);

                    return (
                      <tr key={item.faculty_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{item.faculty_name}</span>
                          <span className="block text-[10px] text-zinc-500 font-mono">
                            {item.employee_id} • {item.designation}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.department_names.map((deptCode) => (
                              <span
                                key={deptCode}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                              >
                                {deptCode}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-white">{item.assigned_hours} hrs</span>
                          <span className="text-zinc-500"> / {item.max_hours} max</span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className="text-emerald-400 font-semibold">{item.free_hours} hrs free</span>
                          <span className="block text-[10px] text-zinc-500">
                            {item.unavailable_periods_count} blocked periods
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-white font-bold">{item.utilization_percentage}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.status === 'BALANCED'
                                    ? 'bg-emerald-500'
                                    : item.status === 'UNDERLOAD'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, item.utilization_percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.status === 'BALANCED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : item.status === 'UNDERLOAD'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {currentRole !== 'FACULTY' && (
                          <td className="py-3 px-4 text-right">
                            {faculty && (
                              <button
                                onClick={() => handleOpenEditLimit(faculty)}
                                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs transition-colors flex items-center gap-1 ml-auto"
                              >
                                <Sliders className="h-3 w-3" />
                                <span>Adjust Limits</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD UNAVAILABLE PERIOD */}
      {/* ========================================================================= */}
      {isAddUnavailableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-400" />
                <span>Record Blocked Teaching Period</span>
              </h2>
              <button onClick={() => setIsAddUnavailableModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmAddUnavailable} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Faculty Member</label>
                <select
                  disabled={currentRole === 'FACULTY'}
                  value={blockFacultyId}
                  onChange={(e) => setBlockFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  {facultyProfiles.map((f) => {
                    const u = users.find((usr) => usr.id === f.user_id);
                    return (
                      <option key={f.id} value={f.id}>
                        {u?.full_name} ({f.employee_id})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Day of Week</label>
                  <select
                    value={blockDay}
                    onChange={(e) => setBlockDay(e.target.value as AcademicDay)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {activeWorkingDays.map((wd) => (
                      <option key={wd.day_of_week} value={wd.day_of_week}>
                        {wd.day_of_week}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Target Period</label>
                  <select
                    value={blockPeriod}
                    onChange={(e) => setBlockPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                  >
                    {lectureSlots.map((s) => (
                      <option key={s.id} value={s.slot_number}>
                        {s.label} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Constraint Reason / Meeting Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dean's Academic Senate Meeting, AI Lab Research Duty"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnavailableModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white shadow-lg"
                >
                  Lock Out Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE WORKLOAD RULE */}
      {/* ========================================================================= */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-cyan-400" />
                <span>Create Workload Policy</span>
              </h2>
              <button onClick={() => setIsAddRuleModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmAddRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Research Workload Policy"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Department Scope (Optional)</label>
                <select
                  disabled={currentRole === 'ADMIN'}
                  value={ruleDeptId}
                  onChange={(e) => setRuleDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                >
                  <option value="">Campus-Wide Default Policy</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Weekly Hours</label>
                  <input
                    type="number"
                    min="4"
                    max="40"
                    value={ruleMaxHours}
                    onChange={(e) => setRuleMaxHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Min Weekly Hours</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={ruleMinHours}
                    onChange={(e) => setRuleMinHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Lectures / Day</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={ruleMaxLecturesPerDay}
                    onChange={(e) => setRuleMaxLecturesPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Max Consecutive</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ruleMaxConsecutive}
                    onChange={(e) => setRuleMaxConsecutive(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Max Practical Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={ruleMaxPractical}
                    onChange={(e) => setRuleMaxPractical(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="saturdayCheck"
                  checked={ruleAllowSaturday}
                  onChange={(e) => setRuleAllowSaturday(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/[0.1] text-indigo-600 focus:ring-0"
                />
                <label htmlFor="saturdayCheck" className="text-zinc-300">
                  Allow classes scheduled on Saturday
                </label>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT WORKLOAD RULE */}
      {/* ========================================================================= */}
      {isEditRuleModalOpen && targetRuleToEdit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Edit Workload Policy</span>
              </h2>
              <button onClick={() => setIsEditRuleModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmEditRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Weekly Hours</label>
                  <input
                    type="number"
                    min="4"
                    max="40"
                    value={ruleMaxHours}
                    onChange={(e) => setRuleMaxHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Min Weekly Hours</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={ruleMinHours}
                    onChange={(e) => setRuleMinHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Lectures / Day</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={ruleMaxLecturesPerDay}
                    onChange={(e) => setRuleMaxLecturesPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Max Consecutive</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ruleMaxConsecutive}
                    onChange={(e) => setRuleMaxConsecutive(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Max Practical</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={ruleMaxPractical}
                    onChange={(e) => setRuleMaxPractical(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditRuleModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADJUST FACULTY WORKLOAD LIMITS */}
      {/* ========================================================================= */}
      {isEditLimitModalOpen && targetFacultyForLimit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <span>Adjust Individual Limits: {users.find((u) => u.id === targetFacultyForLimit.user_id)?.full_name}</span>
              </h2>
              <button onClick={() => setIsEditLimitModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmLimitOverride} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Weekly Hours</label>
                  <input
                    type="number"
                    min="4"
                    max="40"
                    value={limitMaxHours}
                    onChange={(e) => setLimitMaxHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Min Weekly Hours</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={limitMinHours}
                    onChange={(e) => setLimitMinHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Lectures / Day</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={limitMaxLecturesPerDay}
                    onChange={(e) => setLimitMaxLecturesPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Consecutive Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={limitMaxConsecutive}
                    onChange={(e) => setLimitMaxConsecutive(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Practical Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={limitMaxPractical}
                    onChange={(e) => setLimitMaxPractical(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Notes / Dean Override Reason</label>
                <textarea
                  rows={2}
                  value={limitNotes}
                  onChange={(e) => setLimitNotes(e.target.value)}
                  placeholder="e.g. Granted reduced load for active grant funding and departmental leadership"
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.1] rounded-lg text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditLimitModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg"
                >
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
