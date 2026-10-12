/**
 * Nexorg 2.1 - Resource Management Module Operations
 * Classrooms, Specialized Laboratories, Room Allocation Rules & Availability
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Room,
  Lab,
  RoomAvailability,
  LabAvailability,
  RoomFacilityType,
  LabType,
  ResourceSlotType,
  AcademicDay
} from '../types/database';
import {
  roomSchema,
  editRoomSchema,
  labSchema,
  editLabSchema,
  resourceAvailabilitySchema
} from '../lib/validations';

// ============================================================================
// 1. ROOM / CLASSROOM OPERATIONS
// ============================================================================

export async function createRoomRecord(input: {
  instituteId: string;
  roomName: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  facilityType: RoomFacilityType;
  departmentId?: string;
  hasProjector?: boolean;
  hasAC?: boolean;
  isShared?: boolean;
}): Promise<{ success: boolean; data?: Room; error?: string }> {
  const validation = roomSchema.safeParse({
    room_name: input.roomName.trim(),
    room_number: input.roomNumber.toUpperCase().trim(),
    building: input.building.trim(),
    floor: input.floor,
    capacity: input.capacity,
    facility_type: input.facilityType,
    department_id: input.departmentId || '',
    has_projector: input.hasProjector ?? true,
    has_air_conditioning: input.hasAC ?? true,
    is_shared_across_departments: input.isShared ?? true,
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localRoom: Room = {
      id: `room-${Date.now().toString().slice(-4)}`,
      institute_id: input.instituteId,
      room_name: input.roomName.trim(),
      room_number: input.roomNumber.toUpperCase().trim(),
      building: input.building.trim(),
      floor: input.floor,
      capacity: input.capacity,
      facility_type: input.facilityType,
      owning_department_id: input.departmentId,
      department_id: input.departmentId,
      has_projector: input.hasProjector ?? true,
      has_air_conditioning: input.hasAC ?? true,
      is_shared_across_departments: input.isShared ?? true,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localRoom };
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        institute_id: input.instituteId,
        room_name: input.roomName.trim(),
        room_number: input.roomNumber.toUpperCase().trim(),
        building: input.building.trim(),
        floor: input.floor,
        capacity: input.capacity,
        facility_type: input.facilityType,
        owning_department_id: input.departmentId || null,
        department_id: input.departmentId || null,
        has_projector: input.hasProjector ?? true,
        has_air_conditioning: input.hasAC ?? true,
        is_shared_across_departments: input.isShared ?? true,
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

export async function updateRoomRecord(
  roomId: string,
  input: {
    roomName: string;
    building: string;
    floor: number;
    capacity: number;
    facilityType: RoomFacilityType;
    departmentId?: string;
    hasProjector: boolean;
    hasAC: boolean;
    isShared: boolean;
    isActive: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('rooms')
      .update({
        room_name: input.roomName.trim(),
        building: input.building.trim(),
        floor: input.floor,
        capacity: input.capacity,
        facility_type: input.facilityType,
        owning_department_id: input.departmentId || null,
        department_id: input.departmentId || null,
        has_projector: input.hasProjector,
        has_air_conditioning: input.hasAC,
        is_shared_across_departments: input.isShared,
        is_active: input.isActive,
      })
      .eq('id', roomId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteRoomRecord(roomId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 2. LAB OPERATIONS
// ============================================================================

export async function createLabRecord(input: {
  instituteId: string;
  name: string;
  labCode: string;
  building: string;
  floor: number;
  capacity: number;
  pcCount: number;
  labType?: LabType;
  departmentId?: string;
  specializedHardware?: string;
  hasUPS?: boolean;
  isShared?: boolean;
}): Promise<{ success: boolean; data?: Lab; error?: string }> {
  const validation = labSchema.safeParse({
    name: input.name.trim(),
    lab_code: input.labCode.toUpperCase().trim(),
    building: input.building.trim(),
    floor: input.floor,
    capacity: input.capacity,
    pc_count: input.pcCount,
    lab_type: input.labType || 'COMPUTER_SCIENCE',
    department_id: input.departmentId || '',
    specialized_hardware: input.specializedHardware || '',
    has_ups_backup: input.hasUPS ?? true,
    is_shared: input.isShared ?? true,
    is_active: true,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Validation error' };
  }

  if (!isSupabaseConfigured) {
    const localLab: Lab = {
      id: `lab-${Date.now().toString().slice(-4)}`,
      institute_id: input.instituteId,
      name: input.name.trim(),
      lab_number: input.labCode.toUpperCase().trim(),
      lab_code: input.labCode.toUpperCase().trim(),
      building: input.building.trim(),
      floor: input.floor,
      capacity: input.capacity,
      pc_count: input.pcCount,
      lab_type: input.labType || 'COMPUTER_SCIENCE',
      owning_department_id: input.departmentId,
      department_id: input.departmentId,
      specialized_hardware: input.specializedHardware,
      has_ups_backup: input.hasUPS ?? true,
      is_shared: input.isShared ?? true,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localLab };
  }

  try {
    const { data, error } = await supabase
      .from('labs')
      .insert({
        institute_id: input.instituteId,
        name: input.name.trim(),
        lab_number: input.labCode.toUpperCase().trim(),
        lab_code: input.labCode.toUpperCase().trim(),
        building: input.building.trim(),
        floor: input.floor,
        capacity: input.capacity,
        pc_count: input.pcCount,
        lab_type: input.labType || 'COMPUTER_SCIENCE',
        owning_department_id: input.departmentId || null,
        department_id: input.departmentId || null,
        specialized_hardware: input.specializedHardware || null,
        has_ups_backup: input.hasUPS ?? true,
        is_shared: input.isShared ?? true,
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

export async function updateLabRecord(
  labId: string,
  input: {
    name: string;
    building: string;
    floor: number;
    capacity: number;
    pcCount: number;
    labType: LabType;
    departmentId?: string;
    specializedHardware?: string;
    hasUPS: boolean;
    isShared: boolean;
    isActive: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('labs')
      .update({
        name: input.name.trim(),
        building: input.building.trim(),
        floor: input.floor,
        capacity: input.capacity,
        pc_count: input.pcCount,
        lab_type: input.labType,
        owning_department_id: input.departmentId || null,
        department_id: input.departmentId || null,
        specialized_hardware: input.specializedHardware || null,
        has_ups_backup: input.hasUPS,
        is_shared: input.isShared,
        is_active: input.isActive,
      })
      .eq('id', labId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function deleteLabRecord(labId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('labs').delete().eq('id', labId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

// ============================================================================
// 3. AVAILABILITY RULES, MAINTENANCE BLOCKS & LOCKING
// ============================================================================

export async function setRoomAvailabilityRule(input: {
  instituteId: string;
  roomId: string;
  dayOfWeek: AcademicDay;
  startTime: string;
  endTime: string;
  slotType: ResourceSlotType;
  reason?: string;
  isRecurring?: boolean;
}): Promise<{ success: boolean; data?: RoomAvailability; error?: string }> {
  if (!isSupabaseConfigured) {
    const localRule: RoomAvailability = {
      id: `ravail-${Date.now()}`,
      institute_id: input.instituteId,
      room_id: input.roomId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      slot_type: input.slotType,
      reason: input.reason,
      is_recurring: input.isRecurring ?? true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localRule };
  }

  try {
    const { data, error } = await supabase
      .from('room_availability')
      .insert({
        institute_id: input.instituteId,
        room_id: input.roomId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        slot_type: input.slotType,
        reason: input.reason || null,
        is_recurring: input.isRecurring ?? true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}

export async function setLabAvailabilityRule(input: {
  instituteId: string;
  labId: string;
  dayOfWeek: AcademicDay;
  startTime: string;
  endTime: string;
  slotType: ResourceSlotType;
  reason?: string;
  isRecurring?: boolean;
}): Promise<{ success: boolean; data?: LabAvailability; error?: string }> {
  if (!isSupabaseConfigured) {
    const localRule: LabAvailability = {
      id: `lavail-${Date.now()}`,
      institute_id: input.instituteId,
      lab_id: input.labId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      slot_type: input.slotType,
      reason: input.reason,
      is_recurring: input.isRecurring ?? true,
      created_at: new Date().toISOString(),
    };
    return { success: true, data: localRule };
  }

  try {
    const { data, error } = await supabase
      .from('lab_availability')
      .insert({
        institute_id: input.instituteId,
        lab_id: input.labId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        slot_type: input.slotType,
        reason: input.reason || null,
        is_recurring: input.isRecurring ?? true,
      })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Database error' };
  }
}
