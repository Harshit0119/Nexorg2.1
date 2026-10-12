/**
 * Nexorg 2.1 - Faculty Availability, Unavailable Slots & Workload Rules Operations
 * Production-ready CRUD, Matrix Aggregation & Timetable Constraints
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  InstituteWorkingDay,
  InstituteTimeSlot,
  FacultyUnavailableSlot,
  WorkloadRule,
  WorkloadLimit,
  FacultyUtilizationMetric,
  FacultyProfile,
  User,
  WorkloadAllocation,
  AcademicDay,
  SlotType,
  InstituteTimingConfig
} from '../types/database';
import {
  facultyUnavailableSlotSchema,
  workloadRuleSchema,
  workloadLimitSchema,
  instituteTimeSlotSchema,
  instituteTimingConfigSchema
} from '../lib/validations';

// ============================================================================
// 1. INSTITUTE WORKING DAYS
// ============================================================================

export async function fetchWorkingDays(
  instituteId: string
): Promise<{ success: boolean; data?: InstituteWorkingDay[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('institute_working_days')
      .select('*')
      .eq('institute_id', instituteId)
      .order('day_order', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as InstituteWorkingDay[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function saveWorkingDays(
  instituteId: string,
  workingDays: { day_of_week: AcademicDay; is_working_day: boolean; day_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    for (const wd of workingDays) {
      const { error } = await supabase
        .from('institute_working_days')
        .upsert(
          {
            institute_id: instituteId,
            day_of_week: wd.day_of_week,
            is_working_day: wd.is_working_day,
            day_order: wd.day_order,
          },
          { onConflict: 'institute_id,day_of_week' }
        );
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 2. INSTITUTE TIME SLOTS & PERIOD TIMINGS
// ============================================================================

export async function fetchTimeSlots(
  instituteId: string
): Promise<{ success: boolean; data?: InstituteTimeSlot[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('institute_time_slots')
      .select('*')
      .eq('institute_id', instituteId)
      .order('slot_number', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as InstituteTimeSlot[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function saveTimeSlots(
  instituteId: string,
  slots: Omit<InstituteTimeSlot, 'id' | 'created_at' | 'institute_id'>[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    // Delete existing slots and re-insert configured slots
    await supabase.from('institute_time_slots').delete().eq('institute_id', instituteId);

    const rows = slots.map((s) => ({
      institute_id: instituteId,
      slot_number: s.slot_number,
      label: s.label,
      slot_type: s.slot_type,
      start_time: s.start_time,
      end_time: s.end_time,
      is_break: s.is_break,
      is_active: s.is_active,
    }));

    const { error } = await supabase.from('institute_time_slots').insert(rows);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 3. FACULTY UNAVAILABLE SLOTS (MATRIX)
// ============================================================================

export async function fetchUnavailableSlots(
  instituteId: string,
  facultyId?: string
): Promise<{ success: boolean; data?: FacultyUnavailableSlot[]; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    let query = supabase
      .from('faculty_unavailable_slots')
      .select('*, faculty:faculty_profiles(*)')
      .eq('institute_id', instituteId);

    if (facultyId) {
      query = query.eq('faculty_id', facultyId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as FacultyUnavailableSlot[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function addUnavailableSlot(input: {
  instituteId: string;
  facultyId: string;
  dayOfWeek: AcademicDay;
  periodNumber: number;
  slotId?: string;
  reason: string;
  isRecurring?: boolean;
}): Promise<{ success: boolean; data?: FacultyUnavailableSlot; error?: string }> {
  const validation = facultyUnavailableSlotSchema.safeParse({
    faculty_id: input.facultyId,
    day_of_week: input.dayOfWeek,
    period_number: input.periodNumber,
    slot_id: input.slotId,
    reason: input.reason.trim(),
    is_recurring: input.isRecurring ?? true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const local: FacultyUnavailableSlot = {
      id: `fus-${Date.now()}`,
      institute_id: input.instituteId,
      faculty_id: input.facultyId,
      day_of_week: input.dayOfWeek,
      period_number: input.periodNumber,
      slot_id: input.slotId,
      reason: input.reason.trim(),
      is_recurring: input.isRecurring ?? true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: local };
  }

  try {
    const { data, error } = await supabase
      .from('faculty_unavailable_slots')
      .insert({
        institute_id: input.instituteId,
        faculty_id: input.facultyId,
        day_of_week: input.dayOfWeek,
        period_number: input.periodNumber,
        slot_id: input.slotId || null,
        reason: input.reason.trim(),
        is_recurring: input.isRecurring ?? true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as FacultyUnavailableSlot };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function removeUnavailableSlot(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('faculty_unavailable_slots').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 4. WORKLOAD RULES (POLICIES)
// ============================================================================

export async function fetchWorkloadRules(
  instituteId: string
): Promise<{ success: boolean; data?: WorkloadRule[]; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { data, error } = await supabase
      .from('workload_rules')
      .select('*, department:departments(*)')
      .eq('institute_id', instituteId);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as WorkloadRule[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function createWorkloadRule(input: {
  instituteId: string;
  departmentId?: string;
  ruleName: string;
  maxHoursPerWeek: number;
  minHoursPerWeek: number;
  maxLecturesPerDay: number;
  maxConsecutiveLectures: number;
  maxPracticalHoursPerWeek: number;
  allowSaturdayTeaching?: boolean;
}): Promise<{ success: boolean; data?: WorkloadRule; error?: string }> {
  const validation = workloadRuleSchema.safeParse({
    rule_name: input.ruleName.trim(),
    department_id: input.departmentId,
    max_hours_per_week: input.maxHoursPerWeek,
    min_hours_per_week: input.minHoursPerWeek,
    max_lectures_per_day: input.maxLecturesPerDay,
    max_consecutive_lectures: input.maxConsecutiveLectures,
    max_practical_hours_per_week: input.maxPracticalHoursPerWeek,
    allow_saturday_teaching: input.allowSaturdayTeaching ?? true,
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (input.maxHoursPerWeek < input.minHoursPerWeek) {
    return { success: false, error: 'Maximum weekly hours must be greater than or equal to minimum weekly hours.' };
  }

  if (!isSupabaseConfigured) {
    const local: WorkloadRule = {
      id: `wr-${Date.now()}`,
      institute_id: input.instituteId,
      department_id: input.departmentId,
      rule_name: input.ruleName.trim(),
      max_hours_per_week: input.maxHoursPerWeek,
      min_hours_per_week: input.minHoursPerWeek,
      max_lectures_per_day: input.maxLecturesPerDay,
      max_consecutive_lectures: input.maxConsecutiveLectures,
      max_practical_hours_per_week: input.maxPracticalHoursPerWeek,
      allow_saturday_teaching: input.allowSaturdayTeaching ?? true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: local };
  }

  try {
    const { data, error } = await supabase
      .from('workload_rules')
      .insert({
        institute_id: input.instituteId,
        department_id: input.departmentId || null,
        rule_name: input.ruleName.trim(),
        max_hours_per_week: input.maxHoursPerWeek,
        min_hours_per_week: input.minHoursPerWeek,
        max_lectures_per_day: input.maxLecturesPerDay,
        max_consecutive_lectures: input.maxConsecutiveLectures,
        max_practical_hours_per_week: input.maxPracticalHoursPerWeek,
        allow_saturday_teaching: input.allowSaturdayTeaching ?? true,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as WorkloadRule };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function updateWorkloadRule(
  id: string,
  input: Partial<Omit<WorkloadRule, 'id' | 'created_at' | 'institute_id'>>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase
      .from('workload_rules')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteWorkloadRule(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('workload_rules').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 5. WORKLOAD LIMITS (INDIVIDUAL FACULTY)
// ============================================================================

export async function fetchWorkloadLimits(
  instituteId: string
): Promise<{ success: boolean; data?: WorkloadLimit[]; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { data, error } = await supabase
      .from('workload_limits')
      .select('*, faculty:faculty_profiles(*), rule:workload_rules(*)')
      .eq('institute_id', instituteId);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as WorkloadLimit[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function upsertWorkloadLimit(input: {
  instituteId: string;
  facultyId: string;
  ruleId?: string;
  maxWeeklyHours: number;
  minWeeklyHours: number;
  maxLecturesPerDay: number;
  maxConsecutiveLectures: number;
  maxPracticalHours: number;
  notes?: string;
}): Promise<{ success: boolean; data?: WorkloadLimit; error?: string }> {
  const validation = workloadLimitSchema.safeParse({
    faculty_id: input.facultyId,
    rule_id: input.ruleId,
    max_weekly_hours: input.maxWeeklyHours,
    min_weekly_hours: input.minWeeklyHours,
    max_lectures_per_day: input.maxLecturesPerDay,
    max_consecutive_lectures: input.maxConsecutiveLectures,
    max_practical_hours: input.maxPracticalHours,
    notes: input.notes,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const local: WorkloadLimit = {
      id: `wl-${Date.now()}`,
      institute_id: input.instituteId,
      faculty_id: input.facultyId,
      rule_id: input.ruleId,
      max_weekly_hours: input.maxWeeklyHours,
      min_weekly_hours: input.minWeeklyHours,
      max_lectures_per_day: input.maxLecturesPerDay,
      max_consecutive_lectures: input.maxConsecutiveLectures,
      max_practical_hours: input.maxPracticalHours,
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: local };
  }

  try {
    const { data, error } = await supabase
      .from('workload_limits')
      .upsert(
        {
          institute_id: input.instituteId,
          faculty_id: input.facultyId,
          rule_id: input.ruleId || null,
          max_weekly_hours: input.maxWeeklyHours,
          min_weekly_hours: input.minWeeklyHours,
          max_lectures_per_day: input.maxLecturesPerDay,
          max_consecutive_lectures: input.maxConsecutiveLectures,
          max_practical_hours: input.maxPracticalHours,
          notes: input.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'faculty_id' }
      )
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as WorkloadLimit };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function addTimeSlot(
  instituteId: string,
  slot: Omit<InstituteTimeSlot, 'id' | 'created_at' | 'institute_id'>
): Promise<{ success: boolean; data?: InstituteTimeSlot; error?: string }> {
  const validation = instituteTimeSlotSchema.safeParse(slot);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid slot configuration' };
  }

  if (slot.start_time >= slot.end_time) {
    return { success: false, error: 'End time must be strictly after start time' };
  }

  if (!isSupabaseConfigured) {
    const local: InstituteTimeSlot = {
      ...slot,
      id: `slot-${Date.now()}`,
      institute_id: instituteId,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: local };
  }

  try {
    const { data, error } = await supabase
      .from('institute_time_slots')
      .insert({
        institute_id: instituteId,
        slot_number: slot.slot_number,
        label: slot.label,
        slot_type: slot.slot_type,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_break: slot.is_break,
        is_active: slot.is_active,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as InstituteTimeSlot };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function updateTimeSlot(
  id: string,
  slot: Partial<Omit<InstituteTimeSlot, 'id' | 'created_at' | 'institute_id'>>
): Promise<{ success: boolean; error?: string }> {
  if (slot.start_time && slot.end_time && slot.start_time >= slot.end_time) {
    return { success: false, error: 'End time must be after start time' };
  }

  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase
      .from('institute_time_slots')
      .update(slot)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteTimeSlot(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase.from('institute_time_slots').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function markDayUnavailable(input: {
  instituteId: string;
  facultyId: string;
  dayOfWeek: AcademicDay;
  periodNumbers: number[];
  reason: string;
}): Promise<{ success: boolean; createdSlots?: FacultyUnavailableSlot[]; error?: string }> {
  if (!input.periodNumbers || input.periodNumbers.length === 0) {
    return { success: false, error: 'No periods provided to block' };
  }

  const results: FacultyUnavailableSlot[] = [];

  for (const period of input.periodNumbers) {
    const res = await addUnavailableSlot({
      instituteId: input.instituteId,
      facultyId: input.facultyId,
      dayOfWeek: input.dayOfWeek,
      periodNumber: period,
      reason: input.reason.trim() || `Full day unavailable: ${input.dayOfWeek}`,
      isRecurring: true,
    });
    if (res.success && res.data) {
      results.push(res.data);
    }
  }

  return { success: true, createdSlots: results };
}

export async function clearDayUnavailable(input: {
  instituteId: string;
  facultyId: string;
  dayOfWeek: AcademicDay;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase
      .from('faculty_unavailable_slots')
      .delete()
      .eq('institute_id', input.instituteId)
      .eq('faculty_id', input.facultyId)
      .eq('day_of_week', input.dayOfWeek);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export function generateSlotsFromTimings(
  config: InstituteTimingConfig
): Omit<InstituteTimeSlot, 'id' | 'created_at' | 'institute_id'>[] {
  const generated: Omit<InstituteTimeSlot, 'id' | 'created_at' | 'institute_id'>[] = [];
  const [startHour, startMin] = config.college_start_time.split(':').map(Number);
  let currentMinutes = startHour * 60 + startMin;
  const duration = config.period_duration_minutes || 50;
  const totalPeriods = config.total_periods_per_day || 8;
  const lunchAfter = config.lunch_after_period || 4;

  const [lunchStartH, lunchStartM] = config.lunch_break_start.split(':').map(Number);
  const [lunchEndH, lunchEndM] = config.lunch_break_end.split(':').map(Number);
  const lunchDuration = (lunchEndH * 60 + lunchEndM) - (lunchStartH * 60 + lunchStartM);

  let slotNum = 1;
  for (let p = 1; p <= totalPeriods; p++) {
    const periodStartH = Math.floor(currentMinutes / 60);
    const periodStartM = currentMinutes % 60;
    const periodStartTime = `${String(periodStartH).padStart(2, '0')}:${String(periodStartM).padStart(2, '0')}`;

    currentMinutes += duration;

    const periodEndH = Math.floor(currentMinutes / 60);
    const periodEndM = currentMinutes % 60;
    const periodEndTime = `${String(periodEndH).padStart(2, '0')}:${String(periodEndM).padStart(2, '0')}`;

    generated.push({
      slot_number: slotNum++,
      label: `Period ${p}`,
      slot_type: p === totalPeriods ? 'PRACTICAL' : 'LECTURE',
      start_time: periodStartTime,
      end_time: periodEndTime,
      is_break: false,
      is_active: true,
    });

    if (p === lunchAfter) {
      const lStartH = Math.floor(currentMinutes / 60);
      const lStartM = currentMinutes % 60;
      const lStartTime = `${String(lStartH).padStart(2, '0')}:${String(lStartM).padStart(2, '0')}`;
      
      const effectiveLunchDur = lunchDuration > 0 ? lunchDuration : 60;
      currentMinutes += effectiveLunchDur;

      const lEndH = Math.floor(currentMinutes / 60);
      const lEndM = currentMinutes % 60;
      const lEndTime = `${String(lEndH).padStart(2, '0')}:${String(lEndM).padStart(2, '0')}`;

      generated.push({
        slot_number: slotNum++,
        label: 'Lunch Break',
        slot_type: 'LUNCH_BREAK',
        start_time: lStartTime,
        end_time: lEndTime,
        is_break: true,
        is_active: true,
      });
    }
  }

  return generated;
}
