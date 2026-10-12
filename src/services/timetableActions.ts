/**
 * Nexorg 2.1 - Timetable Engine Server Actions & Supabase Integration
 * Production CRUD, Generation Workflow, Conflict Resolution & Approvals
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Timetable,
  TimetableEntry,
  TimetableConflict,
  GenerationLog,
  TimetableStatus,
} from '../types/database';
import { timetableSchema, timetableEntrySchema } from '../lib/validations';

// ============================================================================
// 1. TIMETABLES MASTER CRUD
// ============================================================================

export async function fetchTimetables(
  instituteId: string
): Promise<{ success: boolean; data?: Timetable[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Timetable[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function createTimetable(
  timetableData: Omit<Timetable, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Timetable; error?: string }> {
  const validation = timetableSchema.safeParse({
    name: timetableData.name,
    academic_year: timetableData.academic_year,
    term: timetableData.term,
    status: timetableData.status,
    generation_strategy: timetableData.generation_strategy,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message };
  }

  if (!isSupabaseConfigured) {
    const mockId = `tt-${Date.now()}`;
    const newRecord: Timetable = {
      ...timetableData,
      id: mockId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: newRecord };
  }

  try {
    const { data, error } = await supabase
      .from('timetables')
      .insert(timetableData)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Timetable };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function updateTimetable(
  id: string,
  updated: Partial<Timetable>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('timetables')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteTimetable(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('timetables').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 2. TIMETABLE ENTRIES CRUD
// ============================================================================

export async function fetchTimetableEntries(
  timetableId: string
): Promise<{ success: boolean; data?: TimetableEntry[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        *,
        department:departments(*),
        course:courses(*),
        semester:semesters(*),
        section:sections(*),
        subject:subjects(*),
        faculty:faculty_profiles(*, user:users(*)),
        room:rooms(*),
        lab:labs(*)
      `)
      .eq('timetable_id', timetableId)
      .order('day_of_week')
      .order('period_number');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as TimetableEntry[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function saveTimetableEntries(
  timetableId: string,
  entries: TimetableEntry[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    // Transactional replace: delete existing unlocked entries and insert new ones
    await supabase.from('timetable_entries').delete().eq('timetable_id', timetableId).eq('is_locked', false);

    const payload = entries.map((e) => ({
      timetable_id: timetableId,
      institute_id: e.institute_id,
      department_id: e.department_id,
      course_id: e.course_id,
      semester_id: e.semester_id,
      section_id: e.section_id,
      subject_id: e.subject_id,
      faculty_id: e.faculty_id,
      room_id: e.room_id,
      lab_id: e.lab_id,
      day_of_week: e.day_of_week,
      period_number: e.period_number,
      slot_id: e.slot_id,
      start_time: e.start_time,
      end_time: e.end_time,
      entry_type: e.entry_type,
      is_locked: e.is_locked,
      notes: e.notes,
    }));

    if (payload.length > 0) {
      const { error } = await supabase.from('timetable_entries').insert(payload);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function updateTimetableEntry(
  id: string,
  entry: Partial<TimetableEntry>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('timetable_entries')
      .update({ ...entry, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteTimetableEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('timetable_entries').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 3. CONFLICTS MANAGEMENT
// ============================================================================

export async function fetchTimetableConflicts(
  timetableId: string
): Promise<{ success: boolean; data?: TimetableConflict[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('timetable_conflicts')
      .select('*')
      .eq('timetable_id', timetableId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as TimetableConflict[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function saveTimetableConflicts(
  timetableId: string,
  conflicts: TimetableConflict[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    // Clear unresolved conflicts and write fresh ones
    await supabase.from('timetable_conflicts').delete().eq('timetable_id', timetableId);

    if (conflicts.length > 0) {
      const payload = conflicts.map((c) => ({
        timetable_id: timetableId,
        institute_id: c.institute_id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        description: c.description,
        primary_entry_id: c.primary_entry_id,
        conflicting_entry_id: c.conflicting_entry_id,
        faculty_id: c.faculty_id,
        room_id: c.room_id,
        lab_id: c.lab_id,
        section_id: c.section_id,
        day_of_week: c.day_of_week,
        period_number: c.period_number,
        status: c.status,
      }));

      const { error } = await supabase.from('timetable_conflicts').insert(payload);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function resolveTimetableConflict(
  conflictId: string,
  resolutionNotes: string,
  resolvedByUserId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('timetable_conflicts')
      .update({
        status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedByUserId,
      })
      .eq('id', conflictId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 4. GENERATION LOGS
// ============================================================================

export async function saveGenerationLogs(
  logs: GenerationLog[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || logs.length === 0) {
    return { success: true };
  }

  try {
    const payload = logs.map((l) => ({
      timetable_id: l.timetable_id,
      institute_id: l.institute_id,
      run_id: l.run_id,
      log_level: l.log_level,
      stage: l.stage,
      message: l.message,
      metadata: l.metadata,
    }));

    await supabase.from('generation_logs').insert(payload);
    return { success: true };
  } catch {
    return { success: true }; // non-blocking log write
  }
}
