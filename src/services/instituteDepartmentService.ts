/**
 * Nexorg 2.1 - Institute & Department Multi-Tenant Data Service
 * Real-time Supabase Database Operations with Strict Multi-Tenant Isolation
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Institute, Department, User, UserRole } from '../types/database';
import { departmentSchema, instituteSetupSchema } from '../lib/validations';

const STORAGE_KEYS = {
  INSTITUTES: 'nexorg_institutes_v2',
  DEPARTMENTS: 'nexorg_departments_v2',
  USERS: 'nexorg_users_v2',
  SESSION: 'nexorg_active_session_v2',
};

// Helper to get from local persistent storage
function getStoredItems<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Failed to read from localStorage (${key}):`, e);
    return [];
  }
}

function setStoredItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`Failed to write to localStorage (${key}):`, e);
  }
}

/**
 * 1. Fetch Institute by ID or Tenant Code
 */
export async function fetchInstitute(identifier: string): Promise<{
  success: boolean;
  data?: Institute;
  error?: string;
}> {
  if (!identifier) {
    return { success: false, error: 'Institute identifier required' };
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const query = supabase.from('institutes').select('*');
      const { data, error } = isUuid 
        ? await query.eq('id', identifier).maybeSingle()
        : await query.eq('code', identifier.toUpperCase().trim()).maybeSingle();

      if (!error && data) {
        // Cache to local storage
        const localList = getStoredItems<Institute>(STORAGE_KEYS.INSTITUTES);
        const idx = localList.findIndex((i) => i.id === data.id || i.code === data.code);
        if (idx >= 0) localList[idx] = data;
        else localList.push(data);
        setStoredItems(STORAGE_KEYS.INSTITUTES, localList);

        return { success: true, data };
      }
    } catch (err: unknown) {
      console.warn('Supabase fetchInstitute fallback:', err);
    }
  }

  // 2. Query persistent local storage
  const institutes = getStoredItems<Institute>(STORAGE_KEYS.INSTITUTES);
  const found = institutes.find(
    (i) => i.id === identifier || i.code?.toUpperCase() === identifier.toUpperCase().trim()
  );

  if (found) {
    return { success: true, data: found };
  }

  return { success: false, error: 'Institute not found' };
}

/**
 * 2. Save or Register a New Institute
 */
export async function saveInstitute(input: {
  id?: string;
  name: string;
  code: string;
  academic_year?: string;
  timezone?: string;
  address?: string;
  website?: string;
  subscription_tier?: string;
  settings?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  data?: Institute;
  error?: string;
}> {
  const code = input.code.toUpperCase().trim();
  const name = input.name.trim();

  if (!name || name.length < 2) {
    return { success: false, error: 'Institute name must be at least 2 characters.' };
  }
  if (!code || code.length < 2) {
    return { success: false, error: 'Institute code must be at least 2 characters.' };
  }

  const instituteId = input.id || `inst-${code.toLowerCase()}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const instituteRecord: Institute = {
    id: instituteId,
    name,
    code,
    institute_type: 'TECHNOLOGY_INSTITUTE',
    academic_year: input.academic_year || '2025-2026',
    timezone: input.timezone || 'Asia/Kolkata (UTC+05:30)',
    address: input.address || 'Academic City Campus',
    website: input.website || `https://${code.toLowerCase()}.edu`,
    subscription_tier: input.subscription_tier || 'STARTER',
    settings: {
      working_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      day_start_time: '09:00:00',
      day_end_time: '17:00:00',
      period_duration_minutes: 60,
      max_consecutive_faculty_hours: 3,
      default_faculty_max_hours: 18,
      ...(input.settings || {}),
    },
    created_at: now,
    updated_at: now,
  };

  // Sync to Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('institutes')
        .upsert({
          id: instituteRecord.id,
          name: instituteRecord.name,
          code: instituteRecord.code,
          academic_year: instituteRecord.academic_year,
          timezone: instituteRecord.timezone,
          address: instituteRecord.address,
          website: instituteRecord.website,
          subscription_tier: instituteRecord.subscription_tier,
          settings: instituteRecord.settings,
          updated_at: now,
        })
        .select('*')
        .single();

      if (!error && data) {
        instituteRecord.id = data.id;
      }
    } catch (err: unknown) {
      console.warn('Supabase saveInstitute fallback:', err);
    }
  }

  // Update persistent local multi-tenant storage
  const localList = getStoredItems<Institute>(STORAGE_KEYS.INSTITUTES);
  const idx = localList.findIndex((i) => i.id === instituteRecord.id || i.code === instituteRecord.code);
  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...instituteRecord };
  } else {
    localList.push(instituteRecord);
  }
  setStoredItems(STORAGE_KEYS.INSTITUTES, localList);

  return { success: true, data: instituteRecord };
}

/**
 * 3. Fetch Departments with Strict Multi-Tenant Isolation (by institute_id)
 */
export async function fetchDepartments(instituteId: string): Promise<{
  success: boolean;
  data: Department[];
  error?: string;
}> {
  if (!instituteId) {
    return { success: true, data: [] };
  }

  // 1. Try Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('institute_id', instituteId)
        .order('name', { ascending: true });

      if (!error && data) {
        // Update local cache for this institute
        const allLocal = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
        const others = allLocal.filter((d) => d.institute_id !== instituteId);
        setStoredItems(STORAGE_KEYS.DEPARTMENTS, [...others, ...data]);
        return { success: true, data };
      }
    } catch (err: unknown) {
      console.warn('Supabase fetchDepartments fallback:', err);
    }
  }

  // 2. Fetch from persistent multi-tenant storage filtered strictly by institute_id
  const allDepts = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
  const instituteDepts = allDepts.filter((d) => d.institute_id === instituteId);

  return { success: true, data: instituteDepts };
}

/**
 * 4. Create a Single Department
 */
export async function createDepartment(
  instituteId: string,
  input: {
    code: string;
    name: string;
    contactEmail?: string;
    buildingBlock?: string;
    colorAccent?: string;
    headOfDepartmentId?: string;
  }
): Promise<{
  success: boolean;
  data?: Department;
  error?: string;
}> {
  if (!instituteId) {
    return { success: false, error: 'Institute ID is required to create a department.' };
  }

  const code = input.code.toUpperCase().trim();
  const name = input.name.trim();

  // Validate with Zod
  const validation = departmentSchema.safeParse({
    code,
    name,
    contact_email: input.contactEmail || '',
    building_block: input.buildingBlock || '',
    color_accent: input.colorAccent || '#4F46E5',
    head_of_department_id: input.headOfDepartmentId || '',
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid department information' };
  }

  // Check unique code within this institute
  const existing = await fetchDepartments(instituteId);
  if (existing.data.some((d) => d.code.toUpperCase() === code)) {
    return { success: false, error: `Department code "${code}" already exists in this institute.` };
  }

  const deptId = `dept-${code.toLowerCase()}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newDept: Department = {
    id: deptId,
    institute_id: instituteId,
    code,
    name,
    contact_email: input.contactEmail?.trim(),
    building_block: input.buildingBlock?.trim(),
    color_accent: input.colorAccent || '#4F46E5',
    head_of_department_id: input.headOfDepartmentId,
    is_active: true,
    created_at: now,
  };

  // 1. Supabase insert
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          id: newDept.id,
          institute_id: newDept.institute_id,
          code: newDept.code,
          name: newDept.name,
          contact_email: newDept.contact_email,
          building_block: newDept.building_block,
          color_accent: newDept.color_accent,
          head_of_department_id: newDept.head_of_department_id || null,
          is_active: true,
        })
        .select('*')
        .single();

      if (!error && data) {
        newDept.id = data.id;
      } else if (error) {
        console.warn('Supabase insert warning:', error.message);
      }
    } catch (err: unknown) {
      console.warn('Supabase createDepartment fallback:', err);
    }
  }

  // 2. Persistent storage update
  const allDepts = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
  allDepts.push(newDept);
  setStoredItems(STORAGE_KEYS.DEPARTMENTS, allDepts);

  return { success: true, data: newDept };
}

/**
 * 5. Batch Provision Departments during Registration / Setup Flow
 * Supports input like ['CSE', 'IT', 'EC'] or ['Computer Science & Engineering (CSE)', ...]
 */
export async function batchProvisionDepartments(
  instituteId: string,
  rawDeptList: string[]
): Promise<{
  success: boolean;
  data: Department[];
  error?: string;
}> {
  if (!instituteId) {
    return { success: false, data: [], error: 'Institute ID is required' };
  }

  const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
  const formattedDepts: Department[] = [];
  const now = new Date().toISOString();

  // Fetch current depts to prevent duplicates
  const existing = await fetchDepartments(instituteId);
  const existingCodes = new Set(existing.data.map((d) => d.code.toUpperCase()));

  rawDeptList.forEach((entry, idx) => {
    const trimmed = entry.trim();
    if (!trimmed) return;

    let code = '';
    let name = '';

    // Check pattern: "Name (CODE)"
    const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (match) {
      name = match[1].trim();
      code = match[2].trim().toUpperCase();
    } else {
      // Just a code or short name: e.g. "CSE", "IT", "EC"
      if (trimmed.length <= 6 && !trimmed.includes(' ')) {
        code = trimmed.toUpperCase();
        // Expand known acronyms for better UX or keep as Name
        const expandedNames: Record<string, string> = {
          CSE: 'Computer Science & Engineering',
          IT: 'Information Technology',
          EC: 'Electronics & Communication',
          ECE: 'Electronics & Communication Engineering',
          AIML: 'Artificial Intelligence & Machine Learning',
          MECH: 'Mechanical Engineering',
          CIVIL: 'Civil Engineering',
          EE: 'Electrical Engineering',
          EEE: 'Electrical & Electronics Engineering',
          DSA: 'Data Science & Analytics',
          ROB: 'Robotics & Automation',
        };
        name = expandedNames[code] || `${code} Department`;
      } else {
        name = trimmed;
        // Generate abbreviation
        code = trimmed
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 5) || `D${idx + 1}`;
      }
    }

    if (existingCodes.has(code)) return; // skip duplicate
    existingCodes.add(code);

    const deptId = `dept-${code.toLowerCase()}-${Date.now().toString(36)}-${idx}`;
    formattedDepts.push({
      id: deptId,
      institute_id: instituteId,
      code,
      name,
      contact_email: `hod.${code.toLowerCase()}@institution.edu`,
      building_block: `Block ${String.fromCharCode(65 + (idx % 6))}`,
      color_accent: colors[idx % colors.length],
      is_active: true,
      created_at: now,
    });
  });

  if (formattedDepts.length === 0) {
    return { success: true, data: existing.data };
  }

  // 1. Supabase bulk insert
  if (isSupabaseConfigured) {
    try {
      const recordsToInsert = formattedDepts.map((d) => ({
        id: d.id,
        institute_id: d.institute_id,
        code: d.code,
        name: d.name,
        contact_email: d.contact_email,
        building_block: d.building_block,
        color_accent: d.color_accent,
        is_active: true,
      }));

      await supabase.from('departments').insert(recordsToInsert);
    } catch (err: unknown) {
      console.warn('Supabase batchProvisionDepartments fallback:', err);
    }
  }

  // 2. Persistent storage update
  const allDepts = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
  const updatedAll = [...allDepts, ...formattedDepts];
  setStoredItems(STORAGE_KEYS.DEPARTMENTS, updatedAll);

  return { success: true, data: [...existing.data, ...formattedDepts] };
}

/**
 * 6. Update Department
 */
export async function updateDepartment(
  departmentId: string,
  instituteId: string,
  updates: Partial<Department>
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('departments')
        .update({
          ...(updates.name ? { name: updates.name.trim() } : {}),
          ...(updates.code ? { code: updates.code.toUpperCase().trim() } : {}),
          ...(updates.contact_email !== undefined ? { contact_email: updates.contact_email } : {}),
          ...(updates.building_block !== undefined ? { building_block: updates.building_block } : {}),
          ...(updates.color_accent ? { color_accent: updates.color_accent } : {}),
          ...(updates.head_of_department_id !== undefined ? { head_of_department_id: updates.head_of_department_id || null } : {}),
          ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
        })
        .eq('id', departmentId)
        .eq('institute_id', instituteId);
    } catch (err: unknown) {
      console.warn('Supabase updateDepartment fallback:', err);
    }
  }

  // Local storage update
  const allDepts = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
  const idx = allDepts.findIndex((d) => d.id === departmentId && d.institute_id === instituteId);
  if (idx >= 0) {
    allDepts[idx] = { ...allDepts[idx], ...updates };
    setStoredItems(STORAGE_KEYS.DEPARTMENTS, allDepts);
  }

  return { success: true };
}

/**
 * 7. Delete Department
 */
export async function deleteDepartment(
  departmentId: string,
  instituteId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)
        .eq('institute_id', instituteId);
    } catch (err: unknown) {
      console.warn('Supabase deleteDepartment fallback:', err);
    }
  }

  const allDepts = getStoredItems<Department>(STORAGE_KEYS.DEPARTMENTS);
  const remaining = allDepts.filter((d) => !(d.id === departmentId && d.institute_id === instituteId));
  setStoredItems(STORAGE_KEYS.DEPARTMENTS, remaining);

  return { success: true };
}

/**
 * 8. User Session Persistence (Multi-Tenant)
 */
export interface ActiveSession {
  institute: Institute;
  user: User;
  role: UserRole;
}

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error('Failed to clear active session:', e);
  }
}

/**
 * 9. Find User by Email & Institute Code
 */
export async function authenticateTenantUser(
  tenantCode: string,
  email: string,
  role: UserRole
): Promise<{
  success: boolean;
  institute?: Institute;
  user?: User;
  error?: string;
}> {
  const normCode = tenantCode.toUpperCase().trim();
  const normEmail = email.toLowerCase().trim();

  // Find institute
  const instResult = await fetchInstitute(normCode);
  if (!instResult.success || !instResult.data) {
    return {
      success: false,
      error: `No registered institution found with tenant code "${normCode}". Please check code or register first.`,
    };
  }

  const institute = instResult.data;

  // Find or provision user in this institute
  const allUsers = getStoredItems<User>(STORAGE_KEYS.USERS);
  let user = allUsers.find(
    (u) => u.institute_id === institute.id && u.email.toLowerCase() === normEmail
  );

  if (!user) {
    // Create user profile for this tenant
    user = {
      id: `usr-${Date.now().toString(36)}`,
      institute_id: institute.id,
      email: normEmail,
      full_name: normEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    allUsers.push(user);
    setStoredItems(STORAGE_KEYS.USERS, allUsers);
  }

  saveActiveSession({ institute, user, role });
  return { success: true, institute, user };
}
