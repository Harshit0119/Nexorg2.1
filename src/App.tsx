import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { FacultyManagement } from './components/FacultyManagement';
import { DepartmentManagement } from './components/DepartmentManagement';
import { SubjectAllocation } from './components/SubjectAllocation';
import { AvailabilityTracking } from './components/AvailabilityTracking';
import { WorkloadBalancing } from './components/WorkloadBalancing';
import { RoomLabManagement } from './components/RoomLabManagement';
import { ConflictSimulator } from './components/ConflictSimulator';
import { TimetableEngine } from './components/TimetableEngine';
import { SupabaseStudio } from './components/SupabaseStudio';
import { InstituteOnboarding } from './components/InstituteOnboarding';
import { InstituteSetupWizard } from './components/InstituteSetupWizard';
import { TeamInvitations } from './components/TeamInvitations';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SubscriptionManager } from './components/SubscriptionManager';
import { AuditLogsViewer } from './components/AuditLogsViewer';
import { NotificationCenter } from './components/NotificationCenter';
import { SaasAdminDashboard } from './components/SaasAdminDashboard';
import { SettingsManager } from './components/SettingsManager';
import { ExportModal } from './components/ExportModal';
import { LeaveManagement } from './components/LeaveManagement';

// Public Pages
import { PublicNavbar, PublicPage } from './components/public/PublicNavbar';
import { PublicFooter } from './components/public/PublicFooter';
import { HomePage } from './components/public/HomePage';
import { PricingPage } from './components/public/PricingPage';
import { AboutPage } from './components/public/AboutPage';
import { ContactPage } from './components/public/ContactPage';
import { LoginPage } from './components/public/LoginPage';
import { RegisterPage } from './components/public/RegisterPage';

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
} from './services/academicData';
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
  UserRole,
  EmploymentType,
  WorkloadComponent,
  Course,
  Semester,
  Section,
  SectionSubject,
  FacultySubjectAssignment,
  SubjectType,
  InstituteWorkingDay,
  InstituteTimeSlot,
  FacultyUnavailableSlot,
  WorkloadRule,
  WorkloadLimit,
  InstituteTimingConfig,
  AcademicDay,
  Timetable,
  TimetableEntry,
  TimetableConflict,
  Subscription,
  SubscriptionHistory,
  AuditLog,
  InAppNotification,
  FacultyLeave,
  LeaveType,
  LeaveBalance,
  SubstituteAssignment,
  LeaveNotification,
  LeaveAuditLog,
} from './types/database';
import { isSupabaseConfigured } from './lib/supabase';
import {
  createFacultyLeaveRequest,
  approveFacultyLeave,
  rejectFacultyLeave,
  cancelFacultyLeave,
  analyzeTimetableImpact,
} from './services/leaveService';
import {
  fetchDepartments,
  createDepartment as createDepartmentService,
  updateDepartment as updateDepartmentService,
  deleteDepartment as deleteDepartmentService,
  saveInstitute,
  batchProvisionDepartments,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  authenticateTenantUser,
} from './services/instituteDepartmentService';

export default function App() {
  // Top-Level View: Public SaaS Website vs. Internal Dashboard App
  const [viewMode, setViewMode] = useState<'public' | 'dashboard'>('public');
  const [publicPage, setPublicPage] = useState<PublicPage>('home');

  // Dashboard Navigation & Role State
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentRole, setCurrentRole] = useState<UserRole>('HEAD');

  // Mobile Navigation Drawer & Persistence Loading State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);

  // Academic Resource Domain State
  const [institute, setInstitute] = useState<Institute>(INITIAL_INSTITUTE);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_SEMESTERS);
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [sectionSubjects, setSectionSubjects] = useState<SectionSubject[]>(INITIAL_SECTION_SUBJECTS);
  const [facultySubjectAssignments, setFacultySubjectAssignments] = useState<FacultySubjectAssignment[]>(
    INITIAL_FACULTY_SUBJECT_ASSIGNMENTS
  );
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [facultyProfiles, setFacultyProfiles] = useState<FacultyProfile[]>(INITIAL_FACULTY_PROFILES);
  const [assignments, setAssignments] = useState<FacultyDepartmentAssignment[]>(
    INITIAL_FACULTY_DEPT_ASSIGNMENTS
  );
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [labs, setLabs] = useState<Lab[]>(INITIAL_LABS);
  const [workloads, setWorkloads] = useState<WorkloadAllocation[]>(INITIAL_WORKLOAD_ALLOCATIONS);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(INITIAL_TIMETABLE_SLOTS);
  const [availabilities, setAvailabilities] = useState<FacultyAvailability[]>(
    INITIAL_FACULTY_AVAILABILITY
  );
  const [invitations, setInvitations] = useState<InstituteInvitation[]>(INITIAL_INVITATIONS);
  const [workingDays, setWorkingDays] = useState<InstituteWorkingDay[]>(INITIAL_WORKING_DAYS);
  const [timeSlots, setTimeSlots] = useState<InstituteTimeSlot[]>(INITIAL_TIME_SLOTS);
  const [unavailableSlots, setUnavailableSlots] = useState<FacultyUnavailableSlot[]>(INITIAL_UNAVAILABLE_SLOTS);
  const [workloadRules, setWorkloadRules] = useState<WorkloadRule[]>(INITIAL_WORKLOAD_RULES);
  const [workloadLimits, setWorkloadLimits] = useState<WorkloadLimit[]>(INITIAL_WORKLOAD_LIMITS);
  const [timingConfig, setTimingConfig] = useState<InstituteTimingConfig>(INITIAL_TIMING_CONFIG);
  const [timetables, setTimetables] = useState<Timetable[]>(INITIAL_TIMETABLES);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(INITIAL_TIMETABLE_ENTRIES);
  const [timetableConflicts, setTimetableConflicts] = useState<TimetableConflict[]>(INITIAL_TIMETABLE_CONFLICTS);

  // Leave Management & Substitution State
  const [leaves, setLeaves] = useState<FacultyLeave[]>(INITIAL_FACULTY_LEAVES);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(INITIAL_LEAVE_TYPES);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(INITIAL_LEAVE_BALANCES);
  const [substitutes, setSubstitutes] = useState<SubstituteAssignment[]>(INITIAL_SUBSTITUTE_ASSIGNMENTS);
  const [leaveNotifications, setLeaveNotifications] = useState<LeaveNotification[]>(INITIAL_LEAVE_NOTIFICATIONS);
  const [leaveAuditLogs, setLeaveAuditLogs] = useState<LeaveAuditLog[]>(INITIAL_LEAVE_AUDIT_LOGS);


  // Production SaaS Layer State
  const [subscription, setSubscription] = useState<Subscription>({
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
  });

  const [billingHistory, setBillingHistory] = useState<SubscriptionHistory[]>([
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
      notes: 'Monthly renewal - Starter Campus Plan',
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
      notes: 'Initial activation - Starter Campus Plan',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
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
  ]);

  const [notifications, setNotifications] = useState<InAppNotification[]>([
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
  ]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Synchronize active tenant & departments on page load
  useEffect(() => {
    let isMounted = true;
    async function initTenantData() {
      setIsDepartmentsLoading(true);
      try {
        const session = getActiveSession();
        if (session && session.institute) {
          if (isMounted) {
            setInstitute(session.institute);
            if (session.role) setCurrentRole(session.role);
            if (session.user) setUsers([session.user]);
          }
          const deptRes = await fetchDepartments(session.institute.id);
          if (isMounted && deptRes.success) {
            setDepartments(deptRes.data);
          }
        } else {
          // Sync default institute departments
          const deptRes = await fetchDepartments(institute.id);
          if (isMounted && deptRes.success && deptRes.data.length > 0) {
            setDepartments(deptRes.data);
          } else {
            // Seed database for default institute
            const defaultCodes = ['CSE', 'IT', 'EC'];
            const batchRes = await batchProvisionDepartments(institute.id, defaultCodes);
            if (isMounted && batchRes.success && batchRes.data.length > 0) {
              setDepartments(batchRes.data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize tenant departments:', err);
      } finally {
        if (isMounted) setIsDepartmentsLoading(false);
      }
    }

    initTenantData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers for SaaS Layer
  const handleUpdateSubscription = (updated: Subscription) => {
    setSubscription(updated);
  };

  const handleNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  };

  const handleAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleUpdateUserProfile = (updated: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === users[0]?.id ? { ...u, ...updated } : u))
    );
  };

  // 1. Add Faculty Department Assignment (Many-to-Many)
  const handleAddAssignment = (facultyId: string, departmentId: string, isPrimary: boolean) => {
    let updatedAssignments = [...assignments];
    if (isPrimary) {
      updatedAssignments = updatedAssignments.map((a) =>
        a.faculty_id === facultyId ? { ...a, is_primary_department: false } : a
      );
    }

    const newAssignment: FacultyDepartmentAssignment = {
      id: `fda-${Date.now()}`,
      faculty_id: facultyId,
      department_id: departmentId,
      institute_id: institute.id,
      is_primary_department: isPrimary,
      assigned_at: new Date().toISOString(),
    };

    setAssignments([...updatedAssignments, newAssignment]);
  };

  // 2. Remove Faculty Department Assignment
  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  // 3. Onboard New Faculty (with Multi-Department Mapping)
  const handleAddFaculty = (facultyData: {
    fullName: string;
    email: string;
    employeeId: string;
    designation: string;
    contactNumber?: string;
    qualifications?: string;
    employmentType?: EmploymentType;
    joiningDate?: string;
    maxWeeklyHours: number;
    departmentIds: string[];
    primaryDepartmentId: string;
    cabinNumber?: string;
  }) => {
    const newUserId = `user-${Date.now()}`;
    const newFacultyId = `fac-${Date.now()}`;

    const newUser: User = {
      id: newUserId,
      institute_id: institute.id,
      email: facultyData.email,
      full_name: facultyData.fullName,
      role: 'FACULTY',
      phone: facultyData.contactNumber,
      avatar_url: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const newProfile: FacultyProfile = {
      id: newFacultyId,
      user_id: newUserId,
      institute_id: institute.id,
      employee_id: facultyData.employeeId,
      designation: facultyData.designation,
      contact_number: facultyData.contactNumber,
      qualification: facultyData.qualifications,
      employment_type: facultyData.employmentType || 'FULL_TIME',
      joining_date: facultyData.joiningDate || new Date().toISOString().slice(0, 10),
      max_weekly_hours: facultyData.maxWeeklyHours,
      min_weekly_hours: Math.max(8, facultyData.maxWeeklyHours - 6),
      cabin_number: facultyData.cabinNumber,
      specializations: ['Academic Instruction'],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const newAssignments: FacultyDepartmentAssignment[] = facultyData.departmentIds.map((deptId) => ({
      id: `fda-${Date.now()}-${deptId}`,
      faculty_id: newFacultyId,
      department_id: deptId,
      institute_id: institute.id,
      is_primary_department: deptId === facultyData.primaryDepartmentId,
      assigned_at: new Date().toISOString(),
    }));

    setUsers((prev) => [...prev, newUser]);
    setFacultyProfiles((prev) => [...prev, newProfile]);
    setAssignments((prev) => [...prev, ...newAssignments]);
  };

  // 3b. Update Faculty Profile
  const handleUpdateFacultyProfile = (
    id: string,
    updatedProfile: Partial<FacultyProfile>,
    updatedUser?: Partial<User>
  ) => {
    setFacultyProfiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updatedProfile } : f))
    );
    if (updatedUser) {
      const faculty = facultyProfiles.find((f) => f.id === id);
      if (faculty) {
        setUsers((prev) =>
          prev.map((u) => (u.id === faculty.user_id ? { ...u, ...updatedUser } : u))
        );
      }
    }
  };

  // 3c. Remove Workload Allocation
  const handleRemoveWorkloadAllocation = (id: string) => {
    setWorkloads((prev) => prev.filter((w) => w.id !== id));
  };

  // 4. Create Department (Connected to Database)
  const handleAddDepartment = async (deptData: {
    code: string;
    name: string;
    contactEmail: string;
    buildingBlock: string;
    colorAccent: string;
    headOfDepartmentId?: string;
  }) => {
    setIsDepartmentsLoading(true);
    try {
      const res = await createDepartmentService(institute.id, deptData);
      if (res.success && res.data) {
        setDepartments((prev) => [...prev, res.data!]);
      } else {
        const newDept: Department = {
          id: `dept-${deptData.code.toLowerCase()}-${Date.now()}`,
          institute_id: institute.id,
          code: deptData.code,
          name: deptData.name,
          contact_email: deptData.contactEmail,
          building_block: deptData.buildingBlock,
          color_accent: deptData.colorAccent,
          head_of_department_id: deptData.headOfDepartmentId,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setDepartments((prev) => [...prev, newDept]);
      }
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  // 5. Update Department
  const handleUpdateDepartment = async (id: string, updated: Partial<Department>) => {
    await updateDepartmentService(id, institute.id, updated);
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  // 6. Delete Department
  const handleDeleteDepartment = async (id: string) => {
    await deleteDepartmentService(id, institute.id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setAssignments((prev) => prev.filter((a) => a.department_id !== id));
    setSubjects((prev) => prev.filter((s) => s.department_id !== id));
  };

  // 7. Create Subject
  const handleAddSubject = (subjectData: {
    code: string;
    name: string;
    departmentId: string;
    courseId?: string;
    semesterId?: string;
    subjectType?: SubjectType;
    credits?: number;
    theoryHours?: number;
    practicalHours?: number;
    lectureHours: number;
    labHours: number;
    theoryCredits: number;
    labCredits: number;
  }) => {
    const newSubject: Subject = {
      id: `sub-${subjectData.code.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      institute_id: institute.id,
      department_id: subjectData.departmentId,
      course_id: subjectData.courseId,
      semester_id: subjectData.semesterId,
      code: subjectData.code,
      name: subjectData.name,
      subject_type: subjectData.subjectType || 'CORE',
      credits: subjectData.credits || 4,
      theory_hours: subjectData.theoryHours || subjectData.lectureHours,
      practical_hours: subjectData.practicalHours || subjectData.labHours,
      lecture_hours_per_week: subjectData.lectureHours,
      lab_hours_per_week: subjectData.labHours,
      theory_credits: subjectData.theoryCredits,
      lab_credits: subjectData.labCredits,
      tutorial_hours_per_week: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, newSubject]);
  };

  // 7b. Update Subject
  const handleUpdateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  // 7c. Delete Subject
  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setFacultySubjectAssignments((prev) => prev.filter((a) => a.subject_id !== id));
    setSectionSubjects((prev) => prev.filter((ss) => ss.subject_id !== id));
  };

  // 7d. Course Management
  const handleAddCourse = (courseData: Omit<Course, 'id' | 'created_at'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `course-${courseData.code.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleUpdateCourse = (id: string, updated: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // 7e. Semester Management
  const handleAddSemester = (semData: Omit<Semester, 'id' | 'created_at'>) => {
    const newSem: Semester = {
      ...semData,
      id: `sem-${semData.term_number}-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    setSemesters((prev) => [...prev, newSem]);
  };

  const handleUpdateSemester = (id: string, updated: Partial<Semester>) => {
    setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const handleArchiveSemester = (id: string) => {
    setSemesters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_archived: true, is_current: false } : s))
    );
  };

  // 7f. Section Management
  const handleAddSection = (secData: Omit<Section, 'id' | 'created_at'>) => {
    const newSec: Section = {
      ...secData,
      id: `sec-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    setSections((prev) => [...prev, newSec]);
  };

  const handleUpdateSection = (id: string, updated: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const handleDeleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setFacultySubjectAssignments((prev) => prev.filter((a) => a.section_id !== id));
  };

  // 7g. Assign Faculty to Section & Subject (with automated workload impact)
  const handleAssignFacultyToSection = (
    assignmentData: Omit<FacultySubjectAssignment, 'id' | 'created_at'>
  ) => {
    const newAssignment: FacultySubjectAssignment = {
      ...assignmentData,
      id: `fsa-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setFacultySubjectAssignments((prev) => [...prev, newAssignment]);

    // Also update workloads state so Faculty Management, Workload Balancing & Conflict Simulator update in real time
    const newWorkload: WorkloadAllocation = {
      id: `wl-${Date.now()}`,
      institute_id: assignmentData.institute_id,
      faculty_id: assignmentData.faculty_id,
      department_id: assignmentData.department_id,
      subject_id: assignmentData.subject_id,
      component: assignmentData.component,
      hours_per_week: assignmentData.hours_per_week,
      academic_year: assignmentData.academic_year,
      created_at: new Date().toISOString(),
    };
    setWorkloads((prev) => [...prev, newWorkload]);
  };

  // 7h. Remove Faculty Subject Assignment
  const handleRemoveFacultySubjectAssignment = (id: string) => {
    const target = facultySubjectAssignments.find((a) => a.id === id);
    setFacultySubjectAssignments((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      setWorkloads((prev) =>
        prev.filter(
          (w) =>
            !(
              w.faculty_id === target.faculty_id &&
              w.subject_id === target.subject_id &&
              w.component === target.component
            )
        )
      );
    }
  };

  // 8. Allocate Faculty to Subject
  const handleAllocateFaculty = (
    facultyId: string,
    subjectId: string,
    hours: number,
    component: WorkloadComponent
  ) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const newAllocation: WorkloadAllocation = {
      id: `wl-${Date.now()}`,
      institute_id: institute.id,
      faculty_id: facultyId,
      department_id: subject.department_id,
      subject_id: subjectId,
      component,
      hours_per_week: hours,
      academic_year: institute.academic_year,
      created_at: new Date().toISOString(),
    };
    setWorkloads((prev) => [...prev, newAllocation]);
  };

  // 9. Add Room
  const handleAddRoom = (roomData: Omit<Room, 'id' | 'created_at'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRooms((prev) => [...prev, newRoom]);
  };

  // 10. Add Lab
  const handleAddLab = (labData: Omit<Lab, 'id' | 'created_at'>) => {
    const newLab: Lab = {
      ...labData,
      id: `lab-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setLabs((prev) => [...prev, newLab]);
  };

  // 11. Add Faculty Availability Slot
  const handleAddAvailability = (avail: Omit<FacultyAvailability, 'id' | 'created_at'>) => {
    const newAvail: FacultyAvailability = {
      ...avail,
      id: `avail-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAvailabilities((prev) => [...prev, newAvail]);
  };

  // 12. Remove Availability Slot
  const handleRemoveAvailability = (id: string) => {
    setAvailabilities((prev) => prev.filter((a) => a.id !== id));
  };

  // 12b. Availability, Timings & Workload Rules Handlers
  const handleUpdateWorkingDays = (days: InstituteWorkingDay[]) => {
    setWorkingDays(days);
  };

  const handleUpdateTimeSlots = (slots: InstituteTimeSlot[]) => {
    setTimeSlots(slots);
  };

  const handleAddUnavailableSlot = (slotData: Omit<FacultyUnavailableSlot, 'id' | 'created_at'>) => {
    const newSlot: FacultyUnavailableSlot = {
      ...slotData,
      id: `fus-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setUnavailableSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveUnavailableSlot = (id: string) => {
    setUnavailableSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddWorkloadRule = (ruleData: Omit<WorkloadRule, 'id' | 'created_at' | 'updated_at'>) => {
    const newRule: WorkloadRule = {
      ...ruleData,
      id: `wr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setWorkloadRules((prev) => [...prev, newRule]);
  };

  const handleUpdateWorkloadRule = (id: string, updated: Partial<WorkloadRule>) => {
    setWorkloadRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated, updated_at: new Date().toISOString() } : r))
    );
  };

  const handleDeleteWorkloadRule = (id: string) => {
    setWorkloadRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateWorkloadLimit = (limitData: Omit<WorkloadLimit, 'id' | 'created_at' | 'updated_at'>) => {
    setWorkloadLimits((prev) => {
      const existingIndex = prev.findIndex((l) => l.faculty_id === limitData.faculty_id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          ...limitData,
          updated_at: new Date().toISOString(),
        };
        return copy;
      } else {
        const newLimit: WorkloadLimit = {
          ...limitData,
          id: `wl-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [...prev, newLimit];
      }
    });
  };

  const handleUpdateTimingConfig = (config: InstituteTimingConfig) => {
    setTimingConfig(config);
  };

  const handleAddSingleTimeSlot = (slotData: Omit<InstituteTimeSlot, 'id' | 'created_at'>) => {
    const newSlot: InstituteTimeSlot = {
      ...slotData,
      id: `slot-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setTimeSlots((prev) => [...prev, newSlot].sort((a, b) => a.slot_number - b.slot_number));
  };

  const handleUpdateSingleTimeSlot = (id: string, updated: Partial<InstituteTimeSlot>) => {
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s)).sort((a, b) => a.slot_number - b.slot_number)
    );
  };

  const handleDeleteSingleTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMarkDayUnavailable = (facultyId: string, day: AcademicDay, reason: string) => {
    const slotsToBlock = timeSlots.filter((s) => !s.is_break);
    const newBlocked: FacultyUnavailableSlot[] = slotsToBlock
      .filter(
        (s) =>
          !unavailableSlots.some(
            (u) => u.faculty_id === facultyId && u.day_of_week === day && u.period_number === s.slot_number
          )
      )
      .map((s) => ({
        id: `fus-${Date.now()}-${s.slot_number}`,
        institute_id: institute.id,
        faculty_id: facultyId,
        day_of_week: day,
        period_number: s.slot_number,
        slot_id: s.id,
        reason: reason || `Full day unavailable: ${day}`,
        is_recurring: true,
        created_at: new Date().toISOString(),
      }));
    setUnavailableSlots((prev) => [...prev, ...newBlocked]);
  };

  const handleClearDayUnavailable = (facultyId: string, day: AcademicDay) => {
    setUnavailableSlots((prev) =>
      prev.filter((u) => !(u.faculty_id === facultyId && u.day_of_week === day))
    );
  };

  // 13. Add Verified Timetable Slot
  const handleAddSlot = (slotData: Omit<TimetableSlot, 'id' | 'created_at'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setTimetableSlots((prev) => [...prev, newSlot]);
  };

  // 13b. Timetable Engine Handlers
  const handleSaveTimetableEntries = (timetableId: string, entries: TimetableEntry[]) => {
    setTimetableEntries((prev) => [
      ...prev.filter((e) => e.timetable_id !== timetableId),
      ...entries,
    ]);
  };

  const handleUpdateTimetable = (id: string, updated: Partial<Timetable>) => {
    setTimetables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated, updated_at: new Date().toISOString() } : t))
    );
  };

  const handleCreateTimetable = (data: Omit<Timetable, 'id' | 'created_at' | 'updated_at'>) => {
    const newRecord: Timetable = {
      ...data,
      id: `tt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTimetables((prev) => [newRecord, ...prev]);
  };

  // 14. Update Institute Master Parameters
  const handleUpdateInstitute = (updated: Partial<Institute>) => {
    setInstitute((prev) => ({ ...prev, ...updated }));
  };

  // 15. Send Team Invitation
  const handleSendInvitation = (invData: {
    email: string;
    role: 'ADMIN' | 'FACULTY';
    departmentIds: string[];
    employeeId?: string;
    designation?: string;
  }) => {
    const newInv: InstituteInvitation = {
      id: `inv-${Date.now()}`,
      institute_id: institute.id,
      email: invData.email,
      role: invData.role,
      department_ids: invData.departmentIds,
      invited_by: users.find((u) => u.role === 'HEAD')?.id || 'user-director',
      token: `tok_${Math.random().toString(36).substring(2)}${Date.now()}`,
      status: 'PENDING',
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    setInvitations((prev) => [newInv, ...prev]);
  };

  // 16. Revoke Invitation
  const handleRevokeInvitation = (id: string) => {
    setInvitations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'REVOKED' as const } : i))
    );
  };

  // 17. Resend Invitation
  const handleResendInvitation = (id: string) => {
    setInvitations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'PENDING' as const,
              expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            }
          : i
      )
    );
  };

  // 18. Simulate User Accepting Invitation
  const handleSimulateAcceptInvitation = (token: string, fullName: string, employeeId?: string) => {
    const inv = invitations.find((i) => i.token === token);
    if (!inv) return;

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      institute_id: institute.id,
      email: inv.email,
      full_name: fullName,
      role: inv.role,
      avatar_url: `https://images.unsplash.com/photo-${1535000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);

    if (inv.role === 'FACULTY') {
      const newFacultyId = `fac-${Date.now()}`;
      const newProfile: FacultyProfile = {
        id: newFacultyId,
        user_id: newUserId,
        institute_id: institute.id,
        employee_id: employeeId || `FAC-${Date.now().toString().slice(-4)}`,
        designation: 'Assistant Professor',
        max_weekly_hours: 18,
        min_weekly_hours: 12,
        specializations: ['Academic Instruction'],
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setFacultyProfiles((prev) => [...prev, newProfile]);

      const newAssignments: FacultyDepartmentAssignment[] = inv.department_ids.map((deptId, idx) => ({
        id: `fda-${Date.now()}-${deptId}`,
        faculty_id: newFacultyId,
        department_id: deptId,
        institute_id: institute.id,
        is_primary_department: idx === 0,
        assigned_at: new Date().toISOString(),
      }));
      setAssignments((prev) => [...prev, ...newAssignments]);
    }

    setInvitations((prev) =>
      prev.map((i) =>
        i.id === inv.id ? { ...i, status: 'ACCEPTED' as const, accepted_at: new Date().toISOString() } : i
      )
    );
  };

  // 19. Complete Multi-Step Setup Wizard
  const handleCompleteSetupWizard = async (newInst: Partial<Institute>, initialDepts: string[]) => {
    setIsDepartmentsLoading(true);
    try {
      const savedInstRes = await saveInstitute({
        id: institute.id,
        name: newInst.name || institute.name,
        code: newInst.code || institute.code,
        academic_year: newInst.academic_year || institute.academic_year,
        timezone: newInst.timezone || institute.timezone,
        address: newInst.address || institute.address,
        website: newInst.website || institute.website,
        settings: newInst.settings as Record<string, unknown>,
      });

      const activeInst = savedInstRes.data || {
        ...institute,
        ...newInst,
      };
      setInstitute(activeInst);

      const batchRes = await batchProvisionDepartments(activeInst.id, initialDepts);
      if (batchRes.success && batchRes.data) {
        setDepartments(batchRes.data);
      }
      setActiveTab('departments');
    } catch (err) {
      console.error('Setup wizard save error:', err);
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  // 20. Public Registration Success (Persists Institute & Departments to Database)
  const handleRegisterSuccess = async (
    newInst: Partial<Institute>,
    initialDepts: string[],
    adminUser?: { name: string; email: string }
  ) => {
    setIsDepartmentsLoading(true);
    try {
      // 1. Save institute to database and multi-tenant persistence
      const instResult = await saveInstitute({
        name: newInst.name || 'Educational Institution',
        code: newInst.code || 'INST-01',
        academic_year: newInst.academic_year || '2025-2026',
      });

      const savedInst = instResult.data || ({
        ...INITIAL_INSTITUTE,
        ...newInst,
        id: `inst-${(newInst.code || 'inst').toLowerCase()}-${Date.now().toString(36)}`,
      } as Institute);

      setInstitute(savedInst);

      // 2. Batch provision the user-selected departments (e.g. CSE, IT, EC) for this institute_id
      const deptResult = await batchProvisionDepartments(savedInst.id, initialDepts);
      const savedDepts = deptResult.data;
      setDepartments(savedDepts);

      // 3. Clear demo data from previous institutes to maintain tenant isolation
      setCourses([]);
      setSemesters([]);
      setSections([]);
      setSubjects([]);
      setFacultySubjectAssignments([]);
      setAssignments([]);
      setRooms([]);
      setLabs([]);
      setWorkloads([]);
      setTimetables([]);
      setTimetableEntries([]);
      setTimetableConflicts([]);
      setFacultyProfiles([]);

      // 4. Create user & active session
      const userObj: User = {
        id: `user-${Date.now().toString(36)}`,
        institute_id: savedInst.id,
        email: adminUser?.email || 'director@institution.edu',
        full_name: adminUser?.name || 'Academic Director',
        role: 'HEAD',
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUsers([userObj]);

      saveActiveSession({
        institute: savedInst,
        user: userObj,
        role: 'HEAD',
      });

      setCurrentRole('HEAD');
      setViewMode('dashboard');
      setActiveTab('overview');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  // 21. Login Success (Authenticates & Fetches Tenant Departments from Database)
  const handleLoginSuccess = async (selectedRole: UserRole, instituteCode?: string, userEmail?: string) => {
    setIsDepartmentsLoading(true);
    try {
      const code = instituteCode || institute.code;
      const mail = userEmail || 'director@apex-tech.edu';

      const authRes = await authenticateTenantUser(code, mail, selectedRole);
      if (authRes.success && authRes.institute) {
        setInstitute(authRes.institute);
        if (authRes.user) setUsers([authRes.user]);

        // Fetch departments for this specific institute_id from database
        const deptRes = await fetchDepartments(authRes.institute.id);
        if (deptRes.success) {
          setDepartments(deptRes.data);
        }
      } else {
        const deptRes = await fetchDepartments(institute.id);
        if (deptRes.success) {
          setDepartments(deptRes.data);
        }
      }

      setCurrentRole(selectedRole);
      setViewMode('dashboard');
      setActiveTab('overview');
    } catch (err) {
      console.error('Login error:', err);
      setCurrentRole(selectedRole);
      setViewMode('dashboard');
      setActiveTab('overview');
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  // 21b. Logout
  const handleLogout = () => {
    clearActiveSession();
    setIsMobileSidebarOpen(false);
    setViewMode('public');
    setPublicPage('login');
  };

  // 22. Leave Management Handlers
  const handleApplyLeave = (input: {
    facultyProfileId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
    applicantNotes?: string;
  }) => {
    const impact = analyzeTimetableImpact(
      input.facultyProfileId,
      input.startDate,
      input.endDate,
      facultyProfiles,
      users,
      timetableEntries,
      subjects,
      rooms,
      labs,
      departments,
      sections,
      timeSlots
    );

    const currentUserObj = users[0];
    const { newLeave, updatedBalances, notification, auditLog } = createFacultyLeaveRequest(
      input,
      institute.id,
      leaves,
      leaveBalances,
      leaveTypes,
      impact.totalClassesImpacted,
      currentUserObj
    );

    setLeaves((prev) => [newLeave, ...prev]);
    setLeaveBalances(updatedBalances);
    setLeaveNotifications((prev) => [notification, ...prev]);
    setLeaveAuditLogs((prev) => [auditLog, ...prev]);

    // Also push to top-level notification dispatcher
    const globalNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      institute_id: institute.id,
      title: notification.title,
      message: notification.message,
      notification_type: 'SYSTEM_ALERT',
      is_read: false,
      email_sent: true,
      email_delivery_status: 'SENT',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [globalNotif, ...prev]);
  };

  const handleApproveLeave = (leaveId: string, comments?: string) => {
    const approver = users[0];
    const {
      updatedLeave,
      updatedBalances,
      updatedSubstitutes,
      notification,
      auditLog,
    } = approveFacultyLeave(
      leaveId,
      comments,
      leaves,
      leaveBalances,
      leaveTypes,
      approver,
      substitutes
    );

    setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updatedLeave : l)));
    setLeaveBalances(updatedBalances);
    setSubstitutes(updatedSubstitutes);
    setLeaveNotifications((prev) => [notification, ...prev]);
    setLeaveAuditLogs((prev) => [auditLog, ...prev]);

    const globalNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      institute_id: institute.id,
      title: notification.title,
      message: notification.message,
      notification_type: 'SYSTEM_ALERT',
      is_read: false,
      email_sent: true,
      email_delivery_status: 'SENT',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [globalNotif, ...prev]);
  };

  const handleRejectLeave = (leaveId: string, reason: string) => {
    const approver = users[0];
    const { updatedLeave, notification, auditLog } = rejectFacultyLeave(
      leaveId,
      reason,
      leaves,
      approver
    );

    setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updatedLeave : l)));
    setLeaveNotifications((prev) => [notification, ...prev]);
    setLeaveAuditLogs((prev) => [auditLog, ...prev]);

    const globalNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      institute_id: institute.id,
      title: notification.title,
      message: notification.message,
      notification_type: 'SYSTEM_ALERT',
      is_read: false,
      email_sent: true,
      email_delivery_status: 'SENT',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [globalNotif, ...prev]);
  };

  const handleCancelLeave = (leaveId: string) => {
    const currentUserObj = users[0];
    const { updatedLeave, notification, auditLog } = cancelFacultyLeave(
      leaveId,
      leaves,
      currentUserObj
    );

    setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updatedLeave : l)));
    setLeaveNotifications((prev) => [notification, ...prev]);
    setLeaveAuditLogs((prev) => [auditLog, ...prev]);
  };

  const handleAssignSubstitute = (assignment: {
    leaveId: string;
    timetableEntryId?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    date: string;
    dayOfWeek: any;
    startTime: string;
    endTime: string;
    subjectId?: string;
    roomId?: string;
    labId?: string;
    notes?: string;
    matchScore: number;
    matchReasons: string[];
  }) => {
    const newAssignment: SubstituteAssignment = {
      id: `sub-${Date.now()}`,
      leave_id: assignment.leaveId,
      timetable_entry_id: assignment.timetableEntryId,
      original_faculty_id: assignment.originalFacultyId,
      substitute_faculty_id: assignment.substituteFacultyId,
      date: assignment.date,
      day_of_week: assignment.dayOfWeek,
      start_time: assignment.startTime,
      end_time: assignment.endTime,
      subject_id: assignment.subjectId,
      room_id: assignment.roomId,
      lab_id: assignment.labId,
      status: 'CONFIRMED',
      match_score: assignment.matchScore,
      match_reasons: assignment.matchReasons,
      notes: assignment.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSubstitutes((prev) => [newAssignment, ...prev]);

    const notif: LeaveNotification = {
      id: `lnotif-${Date.now()}`,
      institute_id: institute.id,
      leave_id: assignment.leaveId,
      type: 'SUBSTITUTE_ASSIGNED',
      title: 'Substitute Lecture Assigned',
      message: `Substitute confirmed for ${assignment.date} (${assignment.startTime} - ${assignment.endTime}).`,
      is_read: false,
      email_sent: true,
      email_delivery_status: 'QUEUED',
      created_at: new Date().toISOString(),
    };
    setLeaveNotifications((prev) => [notif, ...prev]);

    const audit: LeaveAuditLog = {
      id: `laudit-${Date.now()}`,
      institute_id: institute.id,
      user_id: users[0]?.id,
      user_role: currentRole,
      action: 'SUBSTITUTE_ALLOCATED',
      entity_type: 'SUBSTITUTE_ASSIGNMENT',
      entity_id: newAssignment.id,
      details: {
        originalFaculty: assignment.originalFacultyId,
        substituteFaculty: assignment.substituteFacultyId,
        date: assignment.date,
      },
      created_at: new Date().toISOString(),
    };
    setLeaveAuditLogs((prev) => [audit, ...prev]);
  };

  const handleCreateLeaveType = (type: {
    name: string;
    code: string;
    description?: string;
    default_days_per_year: number;
    is_paid: boolean;
    requires_document: boolean;
  }) => {
    const newType: LeaveType = {
      id: `lt-${type.code.toLowerCase()}-${Date.now()}`,
      institute_id: institute.id,
      name: type.name,
      code: type.code,
      description: type.description,
      default_days_per_year: type.default_days_per_year,
      is_paid: type.is_paid,
      requires_document: type.requires_document,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLeaveTypes((prev) => [...prev, newType]);

    // Provision balances for all existing faculty
    const newBalances: LeaveBalance[] = facultyProfiles.map((f) => ({
      id: `bal-${f.id}-${newType.id}`,
      institute_id: institute.id,
      faculty_profile_id: f.id,
      leave_type_id: newType.id,
      academic_year: institute.academic_year,
      total_leaves: type.default_days_per_year,
      used_leaves: 0,
      remaining_leaves: type.default_days_per_year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setLeaveBalances((prev) => [...prev, ...newBalances]);
  };


  // =========================================================================
  // VIEW MODE: PUBLIC SAAS WEBSITE
  // =========================================================================
  if (viewMode === 'public') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#4F46E5] selection:text-white">
        <PublicNavbar
          currentPage={publicPage}
          onNavigate={(page) => {
            setPublicPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLaunchDashboard={() => setViewMode('dashboard')}
        />

        <main className="flex-1">
          {publicPage === 'home' && (
            <HomePage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLaunchDashboard={() => setViewMode('dashboard')}
            />
          )}

          {publicPage === 'pricing' && (
            <PricingPage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLaunchDashboard={() => setViewMode('dashboard')}
            />
          )}

          {publicPage === 'about' && (
            <AboutPage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLaunchDashboard={() => setViewMode('dashboard')}
            />
          )}

          {publicPage === 'contact' && (
            <ContactPage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLaunchDashboard={() => setViewMode('dashboard')}
            />
          )}

          {publicPage === 'login' && (
            <LoginPage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {publicPage === 'register' && (
            <RegisterPage
              onNavigate={(page) => {
                setPublicPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )}
        </main>

        <PublicFooter
          onNavigate={(page) => {
            setPublicPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLaunchDashboard={() => setViewMode('dashboard')}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: INTERNAL ACADEMIC RESOURCE PLANNING DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        instituteName={institute.name}
        academicYear={institute.academic_year}
        isLiveSupabase={isSupabaseConfigured}
        onOpenSupabaseConfig={() => setActiveTab('supabase')}
        activeClashesCount={timetableConflicts.filter((c) => c.status === 'UNRESOLVED').length}
        unreadNotificationsCount={notifications.filter((n) => !n.is_read).length}
        onOpenNotifications={() => setActiveTab('notifications')}
        onGoToPublicWebsite={() => setViewMode('public')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Desktop permanent & Mobile drawer) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentRole={currentRole}
          facultyCount={facultyProfiles.length}
          deptCount={departments.length}
          invitationsCount={invitations.filter((i) => i.status === 'PENDING').length}
          pendingLeavesCount={leaves.filter((l) => l.status === 'PENDING').length}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 w-full min-w-0">
          <ErrorBoundary fallbackTitle="Nexorg SaaS Module Guard">
            <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'overview' && (
              <OverviewDashboard
                departments={departments}
                facultyProfiles={facultyProfiles}
                users={users}
                assignments={assignments}
                subjects={subjects}
                rooms={rooms}
                labs={labs}
                workloads={workloads}
                onNavigate={setActiveTab}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'departments' && (
              <DepartmentManagement
                departments={departments}
                assignments={assignments}
                subjects={subjects}
                users={users}
                onAddDepartment={handleAddDepartment}
                onUpdateDepartment={handleUpdateDepartment}
                onDeleteDepartment={handleDeleteDepartment}
                currentRole={currentRole}
                isLoading={isDepartmentsLoading}
              />
            )}

            {activeTab === 'team-invitations' && (
              <TeamInvitations
                users={users}
                departments={departments}
                facultyProfiles={facultyProfiles}
                assignments={assignments}
                invitations={invitations}
                onSendInvitation={handleSendInvitation}
                onRevokeInvitation={handleRevokeInvitation}
                onResendInvitation={handleResendInvitation}
                onSimulateAcceptInvitation={handleSimulateAcceptInvitation}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'institute' && (
              <InstituteOnboarding
                institute={institute}
                onUpdateInstitute={handleUpdateInstitute}
              />
            )}

            {activeTab === 'institute-setup' && (
              <InstituteSetupWizard
                onComplete={handleCompleteSetupWizard}
              />
            )}

            {activeTab === 'faculty' && (
              <FacultyManagement
                facultyProfiles={facultyProfiles}
                users={users}
                departments={departments}
                assignments={assignments}
                workloads={workloads}
                subjects={subjects}
                availabilities={availabilities}
                onAddAssignment={handleAddAssignment}
                onRemoveAssignment={handleRemoveAssignment}
                onAddFaculty={handleAddFaculty}
                onUpdateFacultyProfile={handleUpdateFacultyProfile}
                onAssignSubject={handleAllocateFaculty}
                onRemoveWorkloadAllocation={handleRemoveWorkloadAllocation}
                onAddAvailability={handleAddAvailability}
                onRemoveAvailability={handleRemoveAvailability}
                currentRole={currentRole}
                userAssignedDeptId={departments[0]?.id}
              />
            )}

            {activeTab === 'subjects' && (
              <SubjectAllocation
                subjects={subjects}
                departments={departments}
                courses={courses}
                semesters={semesters}
                sections={sections}
                sectionSubjects={sectionSubjects}
                facultySubjectAssignments={facultySubjectAssignments}
                facultyProfiles={facultyProfiles}
                users={users}
                workloads={workloads}
                onAddSubject={handleAddSubject}
                onUpdateSubject={handleUpdateSubject}
                onDeleteSubject={handleDeleteSubject}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                onAddSemester={handleAddSemester}
                onUpdateSemester={handleUpdateSemester}
                onArchiveSemester={handleArchiveSemester}
                onAddSection={handleAddSection}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onAssignFacultyToSection={handleAssignFacultyToSection}
                onRemoveFacultySubjectAssignment={handleRemoveFacultySubjectAssignment}
                currentRole={currentRole}
                userAssignedDeptId={departments[0]?.id}
              />
            )}

            {activeTab === 'availability' && (
              <AvailabilityTracking
                facultyProfiles={facultyProfiles}
                users={users}
                departments={departments}
                workloads={workloads}
                subjects={subjects}
                availabilities={availabilities}
                workingDays={workingDays}
                timeSlots={timeSlots}
                unavailableSlots={unavailableSlots}
                workloadRules={workloadRules}
                workloadLimits={workloadLimits}
                timingConfig={timingConfig}
                onAddAvailability={handleAddAvailability}
                onRemoveAvailability={handleRemoveAvailability}
                onUpdateWorkingDays={handleUpdateWorkingDays}
                onUpdateTimeSlots={handleUpdateTimeSlots}
                onAddTimeSlot={handleAddSingleTimeSlot}
                onUpdateSingleTimeSlot={handleUpdateSingleTimeSlot}
                onDeleteTimeSlot={handleDeleteSingleTimeSlot}
                onAddUnavailableSlot={handleAddUnavailableSlot}
                onRemoveUnavailableSlot={handleRemoveUnavailableSlot}
                onMarkDayUnavailable={handleMarkDayUnavailable}
                onClearDayUnavailable={handleClearDayUnavailable}
                onAddWorkloadRule={handleAddWorkloadRule}
                onUpdateWorkloadRule={handleUpdateWorkloadRule}
                onDeleteWorkloadRule={handleDeleteWorkloadRule}
                onUpdateWorkloadLimit={handleUpdateWorkloadLimit}
                onUpdateTimingConfig={handleUpdateTimingConfig}
                currentRole={currentRole}
                userAssignedDeptId={departments[0]?.id}
              />
            )}

            {activeTab === 'workload' && (
              <WorkloadBalancing
                facultyProfiles={facultyProfiles}
                users={users}
                departments={departments}
                workloads={workloads}
                subjects={subjects}
              />
            )}

            {activeTab === 'leaves' && (
              <LeaveManagement
                currentRole={currentRole}
                instituteId={institute.id}
                currentUser={users[0]}
                facultyProfiles={facultyProfiles}
                users={users}
                departments={departments}
                subjects={subjects}
                rooms={rooms}
                labs={labs}
                sections={sections}
                timeSlots={timeSlots}
                deptAssignments={assignments}
                unavailableSlots={unavailableSlots}
                workloads={workloads}
                timetableEntries={timetableEntries}
                leaves={leaves}
                leaveTypes={leaveTypes}
                leaveBalances={leaveBalances}
                substitutes={substitutes}
                notifications={leaveNotifications}
                auditLogs={leaveAuditLogs}
                onApplyLeave={handleApplyLeave}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onCancelLeave={handleCancelLeave}
                onAssignSubstitute={handleAssignSubstitute}
                onCreateLeaveType={handleCreateLeaveType}
              />
            )}

            {activeTab === 'rooms-labs' && (
              <RoomLabManagement
                rooms={rooms}
                labs={labs}
                departments={departments}
                onAddRoom={handleAddRoom}
                onAddLab={handleAddLab}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'clash-engine' && (
              <TimetableEngine
                currentRole={currentRole}
                userAssignedDeptId={departments[0]?.id}
                departments={departments}
                facultyProfiles={facultyProfiles}
                users={users}
                subjects={subjects}
                sections={sections}
                semesters={semesters}
                rooms={rooms}
                labs={labs}
                workingDays={workingDays}
                timeSlots={timeSlots}
                unavailableSlots={unavailableSlots}
                workloadRules={workloadRules}
                workloadLimits={workloadLimits}
                facultySubjectAssignments={facultySubjectAssignments}
                timetables={timetables}
                timetableEntries={timetableEntries}
                timetableConflicts={timetableConflicts}
                onSaveEntries={handleSaveTimetableEntries}
                onUpdateTimetable={handleUpdateTimetable}
                onCreateTimetable={handleCreateTimetable}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}

            {activeTab === 'supabase' && <SupabaseStudio />}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                departments={departments}
                facultyProfiles={facultyProfiles}
                users={users}
                subjects={subjects}
                rooms={rooms}
                labs={labs}
                timetables={timetables}
                timetableEntries={timetableEntries}
                timetableConflicts={timetableConflicts}
                workloads={workloads}
              />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionManager
                currentRole={currentRole}
                subscription={subscription}
                billingHistory={billingHistory}
                departments={departments}
                facultyProfiles={facultyProfiles}
                rooms={rooms}
                timetables={timetables}
                onSubscriptionUpdated={handleUpdateSubscription}
              />
            )}

            {activeTab === 'audit-logs' && (
              <AuditLogsViewer
                logs={auditLogs}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationCenter
                notifications={notifications}
                instituteId={institute.id}
                onNotificationRead={handleNotificationRead}
                onAllRead={handleAllNotificationsRead}
                onNavigate={(tab) => setActiveTab(tab as NavTab)}
              />
            )}

            {activeTab === 'saas-admin' && (
              <SaasAdminDashboard />
            )}

            {activeTab === 'settings' && (
              <SettingsManager
                institute={institute}
                currentUser={users[0]}
                currentRole={currentRole}
                onUpdateInstitute={handleUpdateInstitute}
                onUpdateUserProfile={handleUpdateUserProfile}
              />
            )}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Production Timetable Export Package Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        instituteName={institute.name}
        academicYear={institute.academic_year}
        term="ODD"
        entries={timetableEntries}
        departments={departments}
        facultyProfiles={facultyProfiles}
        users={users}
        rooms={rooms}
        labs={labs}
        subjects={subjects}
        sections={sections}
        timeSlots={timeSlots}
        workingDays={workingDays}
      />
    </div>
  );
}
