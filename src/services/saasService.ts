/**
 * Nexorg 2.1 - Production SaaS Service Layer
 * Subscription management, Resource limits enforcement, Audit logging,
 * Multi-channel Notifications, and Super Admin cross-tenant governance.
 */

import {
  Subscription,
  SubscriptionHistory,
  SubscriptionPlanTier,
  SubscriptionBillingInterval,
  PlanConfig,
  AuditLog,
  AuditLogAction,
  InAppNotification,
  NotificationType,
  PlanLimitCheckResult,
  Institute,
  InstituteStatus,
  UserRole,
} from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// 1. SUBSCRIPTION PLANS CATALOG
// ============================================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanTier, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free Community',
    badge: 'Self-Hosted / Open',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Basic scheduling for small departments and trial institutes.',
    maxDepartments: 2,
    maxFaculty: 15,
    maxRooms: 10,
    maxTimetables: 1,
    features: [
      'Up to 2 Academic Departments',
      'Up to 15 Faculty Members',
      'Up to 10 Rooms & Labs',
      '1 Active Timetable Draft',
      'Basic Faculty Clash Prevention',
      'Community Documentation',
    ],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter Campus',
    badge: 'Popular for Colleges',
    monthlyPrice: 99,
    annualPrice: 950,
    description: 'Ideal for independent colleges and autonomous polytechnics.',
    maxDepartments: 6,
    maxFaculty: 60,
    maxRooms: 30,
    maxTimetables: 4,
    popular: true,
    features: [
      'Up to 6 Academic Departments',
      'Up to 60 Faculty Members',
      'Up to 30 Rooms & Dedicated Labs',
      'Up to 4 Timetable Versions',
      'Multi-Department Rahul Cross-Locking',
      'Automated Conflict Diagnostic Center',
      'CSV & Print Timetable Export',
      'Standard Email Notifications',
    ],
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro Institute',
    badge: 'Most Scalable',
    monthlyPrice: 249,
    annualPrice: 2390,
    description: 'Comprehensive ERP for mid-to-large engineering & technology universities.',
    maxDepartments: 20,
    maxFaculty: 250,
    maxRooms: 100,
    maxTimetables: 15,
    features: [
      'Up to 20 Academic Departments',
      'Up to 250 Faculty Members',
      'Up to 100 Classrooms & Specialized Labs',
      'Up to 15 Timetable Versions per Term',
      'Instant 1-Click Heuristic Conflict Resolver',
      'Interactive Drag-and-Drop Editor',
      'Compliance Audit Trail & Security Logs',
      'Custom Institute Branding & Colors',
      'Priority 4-Hour Support SLA',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Multi-Campus',
    badge: 'Unlimited Power',
    monthlyPrice: 599,
    annualPrice: 5750,
    description: 'Custom multi-campus federations, state universities, and consortiums.',
    maxDepartments: 999,
    maxFaculty: 9999,
    maxRooms: 1000,
    maxTimetables: 999,
    features: [
      'Unlimited Departments & Schools',
      'Unlimited Faculty & Guest Lecturers',
      'Unlimited Lecture Halls & High-Tech Labs',
      'Unlimited Timetables & Archived Semesters',
      'Dedicated Cloud Cluster & Custom Supabase Schema',
      'SAML / SSO & LDAP Integration',
      'Real-Time Webhook Event Streaming',
      'Dedicated Account Engineer & 99.99% SLA',
    ],
  },
};

// ============================================================================
// 2. IN-MEMORY FALLBACK STORE (WHEN SUPABASE LIVE CONNECTION IS OPTIONAL)
// ============================================================================

const localSubscription: Subscription = {
  id: 'sub-inst-001',
  institute_id: 'inst-001',
  plan_tier: 'STARTER',
  status: 'ACTIVE',
  billing_interval: 'MONTHLY',
  amount: 99,
  currency: 'USD',
  current_period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
  current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
  cancel_at_period_end: false,
  max_departments: 6,
  max_faculty: 60,
  max_rooms: 30,
  max_timetables: 4,
  custom_branding_allowed: false,
  priority_support: false,
  created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

const localBillingHistory: SubscriptionHistory[] = [
  {
    id: 'sub-hist-001',
    subscription_id: 'sub-inst-001',
    institute_id: 'inst-001',
    event_type: 'PAYMENT_SUCCESS',
    from_plan: 'FREE',
    to_plan: 'STARTER',
    amount: 99,
    currency: 'USD',
    invoice_number: 'INV-2025-00104',
    invoice_pdf_url: '#',
    notes: 'Monthly renewal - Starter Plan',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'sub-hist-002',
    subscription_id: 'sub-inst-001',
    institute_id: 'inst-001',
    event_type: 'PAYMENT_SUCCESS',
    from_plan: 'FREE',
    to_plan: 'STARTER',
    amount: 99,
    currency: 'USD',
    invoice_number: 'INV-2025-00042',
    invoice_pdf_url: '#',
    notes: 'Initial activation - Starter Plan',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

const localAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    institute_id: 'inst-001',
    user_email: 'head@nexorg.edu',
    user_role: 'HEAD',
    action: 'TIMETABLE_PUBLISH',
    entity_type: 'TIMETABLE',
    entity_id: 'tt-2025-odd-main',
    description: 'Published official academic schedule: Monsoon 2025-2026 ODD Semester',
    ip_address: '192.168.1.104',
    user_agent: 'Chrome/124.0 MacOS',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'audit-002',
    institute_id: 'inst-001',
    user_email: 'admin@nexorg.edu',
    user_role: 'ADMIN',
    action: 'TIMETABLE_GENERATE',
    entity_type: 'TIMETABLE',
    entity_id: 'tt-2025-odd-main',
    description: 'Executed CSP Forward Checking Algorithmic Solver (Generated 42 clash-free slots)',
    ip_address: '192.168.1.105',
    user_agent: 'Firefox/125.0 Linux',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'audit-003',
    institute_id: 'inst-001',
    user_email: 'head@nexorg.edu',
    user_role: 'HEAD',
    action: 'FACULTY_CREATE',
    entity_type: 'FACULTY',
    entity_id: 'fac-rahul',
    description: 'Created Prof. Rahul Sharma with multi-department assignments (CSE, AIML, IT)',
    ip_address: '192.168.1.104',
    user_agent: 'Chrome/124.0 MacOS',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'audit-004',
    institute_id: 'inst-001',
    user_email: 'head@nexorg.edu',
    user_role: 'HEAD',
    action: 'DEPARTMENT_CREATE',
    entity_type: 'DEPARTMENT',
    entity_id: 'dept-aiml',
    description: 'Created Department: Artificial Intelligence & Machine Learning (AIML)',
    ip_address: '192.168.1.104',
    user_agent: 'Chrome/124.0 MacOS',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'audit-005',
    institute_id: 'inst-001',
    user_email: 'head@nexorg.edu',
    user_role: 'HEAD',
    action: 'USER_LOGIN',
    entity_type: 'AUTH',
    entity_id: 'usr-001',
    description: 'Authenticated via Supabase JWT Session as Institutional Head',
    ip_address: '192.168.1.104',
    user_agent: 'Chrome/124.0 MacOS',
    created_at: new Date(Date.now() - 250000000).toISOString(),
  },
];

const localNotifications: InAppNotification[] = [
  {
    id: 'notif-001',
    institute_id: 'inst-001',
    title: 'Timetable Published',
    message: 'Official timetable for Term ODD 2025-2026 has been published and is visible to students and faculty.',
    notification_type: 'TIMETABLE_PUBLISHED',
    action_url: '/timetable',
    is_read: false,
    email_sent: true,
    email_delivery_status: 'SENT',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-002',
    institute_id: 'inst-001',
    title: 'Cross-Department Lock Active',
    message: 'Prof. Rahul assigned in CSE on Mon 10:00 AM; automatically locked in AIML and IT.',
    notification_type: 'FACULTY_ASSIGNMENT',
    action_url: '/timetable',
    is_read: false,
    email_sent: true,
    email_delivery_status: 'SENT',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'notif-003',
    institute_id: 'inst-001',
    title: 'Invitation Accepted',
    message: 'Dr. Sarah Jenkins accepted your faculty invitation and has joined the Department of Computer Science.',
    notification_type: 'INVITATION_ACCEPTED',
    action_url: '/faculty',
    is_read: true,
    email_sent: true,
    email_delivery_status: 'SENT',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'notif-004',
    institute_id: 'inst-001',
    title: 'Monthly Subscription Renewal',
    message: 'Your Starter Campus plan renewed successfully ($99.00). Invoice #INV-2025-00104 generated.',
    notification_type: 'SUBSCRIPTION_EXPIRING',
    action_url: '/subscription',
    is_read: true,
    email_sent: true,
    email_delivery_status: 'SENT',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// ============================================================================
// 3. SUBSCRIPTION & PLAN ENFORCEMENT SERVICES
// ============================================================================

export async function getInstituteSubscription(instituteId: string): Promise<Subscription> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('institute_id', instituteId)
      .maybeSingle();

    if (!error && data) {
      return data as Subscription;
    }
  }
  return localSubscription;
}

export async function changeSubscriptionPlan(
  instituteId: string,
  newPlan: SubscriptionPlanTier,
  interval: SubscriptionBillingInterval = 'MONTHLY'
): Promise<{ success: boolean; subscription: Subscription; message: string }> {
  const planInfo = SUBSCRIPTION_PLANS[newPlan];
  const oldPlan = localSubscription.plan_tier;
  const isUpgrade = planInfo.monthlyPrice >= SUBSCRIPTION_PLANS[oldPlan].monthlyPrice;
  const amount = interval === 'MONTHLY' ? planInfo.monthlyPrice : planInfo.annualPrice;

  localSubscription.plan_tier = newPlan;
  localSubscription.billing_interval = interval;
  localSubscription.amount = amount;
  localSubscription.max_departments = planInfo.maxDepartments;
  localSubscription.max_faculty = planInfo.maxFaculty;
  localSubscription.max_rooms = planInfo.maxRooms;
  localSubscription.max_timetables = planInfo.maxTimetables;
  localSubscription.custom_branding_allowed = newPlan === 'PRO' || newPlan === 'ENTERPRISE';
  localSubscription.priority_support = newPlan === 'PRO' || newPlan === 'ENTERPRISE';
  localSubscription.updated_at = new Date().toISOString();

  // Record history
  const historyItem: SubscriptionHistory = {
    id: `sub-hist-${Date.now()}`,
    subscription_id: localSubscription.id,
    institute_id: instituteId,
    event_type: isUpgrade ? 'PLAN_UPGRADE' : 'PLAN_DOWNGRADE',
    from_plan: oldPlan,
    to_plan: newPlan,
    amount,
    currency: 'USD',
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    invoice_pdf_url: '#',
    notes: `${isUpgrade ? 'Upgraded' : 'Downgraded'} from ${oldPlan} to ${newPlan} (${interval})`,
    created_at: new Date().toISOString(),
  };
  localBillingHistory.unshift(historyItem);

  // Record audit log
  await recordAuditLog({
    institute_id: instituteId,
    user_email: 'head@nexorg.edu',
    user_role: 'HEAD',
    action: isUpgrade ? 'SUBSCRIPTION_UPGRADE' : 'SUBSCRIPTION_DOWNGRADE',
    entity_type: 'SUBSCRIPTION',
    entity_id: localSubscription.id,
    description: `Changed plan from ${oldPlan} to ${newPlan} ($${amount}/${interval.toLowerCase()})`,
  });

  // Create notification
  await createNotification({
    institute_id: instituteId,
    title: `Subscription Plan ${isUpgrade ? 'Upgraded' : 'Updated'}`,
    message: `Your institution is now on the ${planInfo.name}. Limit expanded to ${planInfo.maxFaculty} faculty and ${planInfo.maxDepartments} departments.`,
    notification_type: 'SUBSCRIPTION_EXPIRING',
    action_url: '/subscription',
  });

  return {
    success: true,
    subscription: localSubscription,
    message: `Successfully transitioned to ${planInfo.name}!`,
  };
}

export async function getSubscriptionHistory(instituteId: string): Promise<SubscriptionHistory[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as SubscriptionHistory[];
    }
  }
  return localBillingHistory;
}

export function checkPlanLimit(
  subscription: Subscription,
  resourceType: 'DEPARTMENTS' | 'FACULTY' | 'ROOMS' | 'TIMETABLES',
  currentCount: number
): PlanLimitCheckResult {
  let maxLimit = 999;
  switch (resourceType) {
    case 'DEPARTMENTS':
      maxLimit = subscription.max_departments;
      break;
    case 'FACULTY':
      maxLimit = subscription.max_faculty;
      break;
    case 'ROOMS':
      maxLimit = subscription.max_rooms;
      break;
    case 'TIMETABLES':
      maxLimit = subscription.max_timetables;
      break;
  }

  return {
    is_allowed: currentCount < maxLimit,
    current_count: currentCount,
    max_limit: maxLimit,
    plan_tier: subscription.plan_tier,
    resource_type: resourceType,
  };
}

// ============================================================================
// 4. AUDIT LOGGING SERVICES
// ============================================================================

export async function recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString(),
    ip_address: '192.168.1.100',
    user_agent: navigator.userAgent || 'Nexorg Applet',
    ...log,
  };

  localAuditLogs.unshift(newLog);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_logs').insert([newLog]);
    } catch {
      // Graceful fallback to memory
    }
  }

  return newLog;
}

export async function getAuditLogs(instituteId: string): Promise<AuditLog[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      return data as AuditLog[];
    }
  }
  return localAuditLogs;
}

export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  const headers = ['Timestamp', 'User Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address'];
  const rows = logs.map((l) => [
    `"${l.created_at}"`,
    `"${l.user_email}"`,
    `"${l.user_role}"`,
    `"${l.action}"`,
    `"${l.entity_type}"`,
    `"${l.entity_id || ''}"`,
    `"${l.description.replace(/"/g, '""')}"`,
    `"${l.ip_address || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ============================================================================
// 5. MULTI-CHANNEL NOTIFICATIONS SERVICES
// ============================================================================

export async function createNotification(
  notif: Omit<InAppNotification, 'id' | 'created_at' | 'is_read' | 'email_sent' | 'email_delivery_status'>
): Promise<InAppNotification> {
  const newNotif: InAppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    is_read: false,
    email_sent: true,
    email_delivery_status: 'SENT',
    created_at: new Date().toISOString(),
    ...notif,
  };

  localNotifications.unshift(newNotif);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch {
      // Fallback
    }
  }

  return newNotif;
}

export async function getNotifications(instituteId: string): Promise<InAppNotification[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('institute_id', instituteId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      return data as InAppNotification[];
    }
  }
  return localNotifications;
}

export async function markNotificationRead(notifId: string): Promise<void> {
  const target = localNotifications.find((n) => n.id === notifId);
  if (target) {
    target.is_read = true;
  }
  if (isSupabaseConfigured) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  }
}

export async function markAllNotificationsRead(instituteId: string): Promise<void> {
  localNotifications.forEach((n) => {
    if (n.institute_id === instituteId) n.is_read = true;
  });
  if (isSupabaseConfigured) {
    await supabase.from('notifications').update({ is_read: true }).eq('institute_id', instituteId);
  }
}

// ============================================================================
// 6. SAAS SUPER ADMIN CROSS-TENANT GOVERNANCE
// ============================================================================

export interface TenantOverviewItem {
  id: string;
  name: string;
  code: string;
  status: InstituteStatus;
  plan_tier: SubscriptionPlanTier;
  departments_count: number;
  faculty_count: number;
  rooms_count: number;
  timetables_count: number;
  monthly_revenue: number;
  created_at: string;
}

const localTenants: TenantOverviewItem[] = [
  {
    id: 'inst-001',
    name: 'National Institute of Technology',
    code: 'NIT',
    status: 'ACTIVE',
    plan_tier: 'STARTER',
    departments_count: 4,
    faculty_count: 5,
    rooms_count: 7,
    timetables_count: 2,
    monthly_revenue: 99,
    created_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'inst-002',
    name: 'Metropolitan University of Technology',
    code: 'MUT',
    status: 'ACTIVE',
    plan_tier: 'PRO',
    departments_count: 12,
    faculty_count: 85,
    rooms_count: 42,
    timetables_count: 8,
    monthly_revenue: 249,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'inst-003',
    name: 'Apex Polytechnic Institute',
    code: 'API',
    status: 'TRIAL',
    plan_tier: 'FREE',
    departments_count: 2,
    faculty_count: 12,
    rooms_count: 8,
    timetables_count: 1,
    monthly_revenue: 0,
    created_at: '2025-02-01T00:00:00Z',
  },
  {
    id: 'inst-004',
    name: 'Federation Institute of Applied Sciences',
    code: 'FIAS',
    status: 'SUSPENDED',
    plan_tier: 'STARTER',
    departments_count: 5,
    faculty_count: 28,
    rooms_count: 15,
    timetables_count: 3,
    monthly_revenue: 99,
    created_at: '2025-01-20T00:00:00Z',
  },
];

export async function getAllTenants(): Promise<TenantOverviewItem[]> {
  return localTenants;
}

export async function toggleTenantStatus(
  instituteId: string,
  newStatus: InstituteStatus
): Promise<{ success: boolean; updatedStatus: InstituteStatus }> {
  const target = localTenants.find((t) => t.id === instituteId);
  if (target) {
    target.status = newStatus;
  }
  if (isSupabaseConfigured) {
    await supabase.from('institutes').update({ status: newStatus }).eq('id', instituteId);
  }
  return { success: true, updatedStatus: newStatus };
}
