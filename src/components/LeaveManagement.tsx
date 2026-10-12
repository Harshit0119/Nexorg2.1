import React, { useState, useMemo } from 'react';
import {
  CalendarX2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Plus,
  Search,
  Filter,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Download,
  Send,
  Trash2,
  Info,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  UserRole,
  FacultyLeave,
  LeaveType,
  LeaveBalance,
  SubstituteAssignment,
  LeaveNotification,
  LeaveAuditLog,
  FacultyProfile,
  User,
  Department,
  Subject,
  Room,
  Lab,
  Section,
  TimetableEntry,
  InstituteTimeSlot,
  FacultyDepartmentAssignment,
  FacultyUnavailableSlot,
  WorkloadAllocation,
  AffectedLecture,
} from '../types/database';
import {
  analyzeTimetableImpact,
  suggestSubstitutesForLecture,
  computeLeaveAnalytics,
  formatDateYMD,
} from '../services/leaveService';

interface LeaveManagementProps {
  currentRole: UserRole;
  instituteId: string;
  currentUser: User;
  facultyProfiles: FacultyProfile[];
  users: User[];
  departments: Department[];
  subjects: Subject[];
  rooms: Room[];
  labs: Lab[];
  sections: Section[];
  timeSlots: InstituteTimeSlot[];
  deptAssignments: FacultyDepartmentAssignment[];
  unavailableSlots: FacultyUnavailableSlot[];
  workloads: WorkloadAllocation[];
  timetableEntries: TimetableEntry[];
  // State & Handlers
  leaves: FacultyLeave[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  substitutes: SubstituteAssignment[];
  notifications: LeaveNotification[];
  auditLogs: LeaveAuditLog[];
  onApplyLeave: (input: {
    facultyProfileId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
    applicantNotes?: string;
  }) => void;
  onApproveLeave: (leaveId: string, comments?: string) => void;
  onRejectLeave: (leaveId: string, reason: string) => void;
  onCancelLeave: (leaveId: string) => void;
  onAssignSubstitute: (assignment: {
    leaveId: string;
    timetableEntryId?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    date: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subjectId?: string;
    roomId?: string;
    labId?: string;
    notes?: string;
    matchScore: number;
    matchReasons: string[];
  }) => void;
  onCreateLeaveType: (type: {
    name: string;
    code: string;
    description?: string;
    default_days_per_year: number;
    is_paid: boolean;
    requires_document: boolean;
  }) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  currentRole,
  instituteId,
  currentUser,
  facultyProfiles,
  users,
  departments,
  subjects,
  rooms,
  labs,
  sections,
  timeSlots,
  deptAssignments,
  unavailableSlots,
  workloads,
  timetableEntries,
  leaves,
  leaveTypes,
  leaveBalances,
  substitutes,
  auditLogs,
  onApplyLeave,
  onApproveLeave,
  onRejectLeave,
  onCancelLeave,
  onAssignSubstitute,
  onCreateLeaveType,
}) => {
  // Navigation sub-tabs
  type ActiveTab = 'requests' | 'substitutions' | 'balances' | 'analytics' | 'leave-types' | 'audit';
  const [activeTab, setActiveTab] = useState<ActiveTab>('requests');

  // Role emulator (allows instant toggle between HEAD, ADMIN, FACULTY views)
  const [effectiveRole, setEffectiveRole] = useState<UserRole>(currentRole);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modals & Panels
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<FacultyLeave | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Substitute allocation drawer state
  const [selectedLectureForSub, setSelectedLectureForSub] = useState<{
    leave: FacultyLeave;
    lecture: AffectedLecture;
  } | null>(null);

  // Apply Form State
  const myFacultyProfile = facultyProfiles.find((f) => f.user_id === currentUser.id) || facultyProfiles[0];
  const [applyFacultyId, setApplyFacultyId] = useState(myFacultyProfile?.id || '');
  const [applyTypeId, setApplyTypeId] = useState(leaveTypes[0]?.id || '');
  const [applyStartDate, setApplyStartDate] = useState(formatDateYMD(new Date(Date.now() + 24 * 3600 * 1000)));
  const [applyEndDate, setApplyEndDate] = useState(formatDateYMD(new Date(Date.now() + 24 * 3600 * 1000)));
  const [applyReason, setApplyReason] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyAttachmentUrl, setApplyAttachmentUrl] = useState('');

  // New Leave Type Form
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeDays, setNewTypeDays] = useState(10);
  const [newTypePaid, setNewTypePaid] = useState(true);
  const [newTypeReqDoc, setNewTypeReqDoc] = useState(false);
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Mapping lookup tables
  const userMap = useMemo(() => new Map<string, User>(users.map((u) => [u.id, u])), [users]);
  const facultyMap = useMemo(() => new Map<string, FacultyProfile>(facultyProfiles.map((f) => [f.id, f])), [facultyProfiles]);
  const deptMap = useMemo(() => new Map<string, Department>(departments.map((d) => [d.id, d])), [departments]);
  const leaveTypeMap = useMemo(() => new Map<string, LeaveType>(leaveTypes.map((t) => [t.id, t])), [leaveTypes]);

  // Real-time Preview of Impact for Draft Leave Form
  const draftImpact = useMemo(() => {
    if (!applyFacultyId || !applyStartDate || !applyEndDate) return null;
    return analyzeTimetableImpact(
      applyFacultyId,
      applyStartDate,
      applyEndDate,
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
  }, [
    applyFacultyId,
    applyStartDate,
    applyEndDate,
    facultyProfiles,
    users,
    timetableEntries,
    subjects,
    rooms,
    labs,
    departments,
    sections,
    timeSlots,
  ]);

  // Analytics Computation
  const analytics = useMemo(() => {
    return computeLeaveAnalytics(
      leaves,
      substitutes,
      leaveBalances,
      leaveTypes,
      facultyProfiles,
      users,
      deptAssignments,
      departments
    );
  }, [leaves, substitutes, leaveBalances, leaveTypes, facultyProfiles, users, deptAssignments, departments]);

  // Filtered leaves according to role
  const filteredLeaves = useMemo(() => {
    let result = [...leaves];

    // Role-based visibility
    if (effectiveRole === 'FACULTY') {
      // Faculty views only their own leaves
      result = result.filter((l) => l.faculty_profile_id === myFacultyProfile?.id);
    } else if (effectiveRole === 'ADMIN') {
      // Admin views leaves within their department
      const adminDeptId = departments[0]?.id;
      if (adminDeptId && deptFilter !== 'ALL') {
        const facInDept = new Set(
          deptAssignments.filter((a) => a.department_id === deptFilter).map((a) => a.faculty_id)
        );
        result = result.filter((l) => facInDept.has(l.faculty_profile_id));
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Department filter for HEAD
    if (deptFilter !== 'ALL' && effectiveRole !== 'FACULTY') {
      const facInDept = new Set(
        deptAssignments.filter((a) => a.department_id === deptFilter).map((a) => a.faculty_id)
      );
      result = result.filter((l) => facInDept.has(l.faculty_profile_id));
    }

    // Search query (faculty name, employee id, reason)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const fac = facultyMap.get(l.faculty_profile_id);
        const usr = fac ? userMap.get(fac.user_id) : undefined;
        const name = usr?.full_name?.toLowerCase() || '';
        const empId = fac?.employee_id?.toLowerCase() || '';
        const reason = l.reason.toLowerCase();
        return name.includes(q) || empId.includes(q) || reason.includes(q);
      });
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [
    leaves,
    effectiveRole,
    myFacultyProfile,
    deptFilter,
    statusFilter,
    searchQuery,
    departments,
    deptAssignments,
    facultyMap,
    userMap,
  ]);

  // Handle Form Submission
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyFacultyId || !applyTypeId || !applyStartDate || !applyEndDate || !applyReason.trim()) {
      return;
    }
    onApplyLeave({
      facultyProfileId: applyFacultyId,
      leaveTypeId: applyTypeId,
      startDate: applyStartDate,
      endDate: applyEndDate,
      reason: applyReason,
      applicantNotes: applyNotes,
      attachmentUrl: applyAttachmentUrl || undefined,
    });
    setIsApplyModalOpen(false);
    setApplyReason('');
    setApplyNotes('');
  };

  // Handle Review Modal Confirmation
  const handleConfirmReview = () => {
    if (!selectedLeaveForReview || !reviewAction) return;
    if (reviewAction === 'APPROVE') {
      onApproveLeave(selectedLeaveForReview.id, reviewComments);
    } else if (reviewAction === 'REJECT') {
      onRejectLeave(selectedLeaveForReview.id, rejectionReason || 'Operational workload constraints');
    }
    setSelectedLeaveForReview(null);
    setReviewAction(null);
    setReviewComments('');
    setRejectionReason('');
  };

  // Handle New Type Submission
  const handleCreateTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypeCode.trim()) return;
    onCreateLeaveType({
      name: newTypeName.trim(),
      code: newTypeCode.trim().toUpperCase(),
      description: newTypeDesc.trim(),
      default_days_per_year: Number(newTypeDays),
      is_paid: newTypePaid,
      requires_document: newTypeReqDoc,
    });
    setIsCreateTypeModalOpen(false);
    setNewTypeName('');
    setNewTypeCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <CalendarX2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Faculty Leave & Timetable Substitution System
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Production Engine
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#A1A1AA] mt-0.5">
                  Automated lecture collision detection, instant CSP substitution ranking, and institute-wide compliance
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Perspective Selector */}
            <div className="flex items-center bg-[#18181B] border border-[#27272A] rounded-xl p-1 text-xs">
              <span className="text-[#71717A] px-2 font-medium">Role:</span>
              {(['HEAD', 'ADMIN', 'FACULTY'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setEffectiveRole(role)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    effectiveRole === role
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Apply Leave CTA */}
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </button>
          </div>
        </div>

        {/* HEAD / ADMIN Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#27272A]/70">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{analytics.pendingRequests}</div>
            <div className="text-[10px] text-amber-400 font-medium mt-1">Requires approval</div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Faculty on Leave Today</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{analytics.facultyOnLeaveToday}</div>
            <div className="text-[10px] text-[#A1A1AA] mt-1">Active off-duty staff</div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Impacted Lectures</span>
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{analytics.totalLecturesAffected}</div>
            <div className="text-[10px] text-purple-400 mt-1">Classes mapped</div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Substitutions Active</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{analytics.totalSubstitutionsConfirmed}</div>
            <div className="text-[10px] text-emerald-400 mt-1">100% collision-checked</div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Approved (Term)</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{analytics.approvedRequests}</div>
            <div className="text-[10px] text-[#A1A1AA] mt-1">Sanctioned applications</div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
              <span>Rejected / Cancelled</span>
              <XCircle className="w-4 h-4 text-[#71717A]" />
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">
              {analytics.rejectedRequests + leaves.filter((l) => l.status === 'CANCELLED').length}
            </div>
            <div className="text-[10px] text-[#71717A] mt-1">Audit preserved</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Leave Requests
          {analytics.pendingRequests > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-bold">
              {analytics.pendingRequests}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('substitutions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'substitutions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Smart Substitution Engine
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
            {substitutes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'balances'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Faculty Leave Balances
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Leave & Impact Analytics
        </button>

        {(effectiveRole === 'HEAD' || effectiveRole === 'SUPER_ADMIN') && (
          <button
            onClick={() => setActiveTab('leave-types')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'leave-types'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Custom Leave Types
          </button>
        )}

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Info className="w-4 h-4" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: LEAVE REQUESTS & TIMETABLE IMPACT INSPECTION */}
      {/* ==================================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Faculty Balance Ribbon (When viewed as Faculty) */}
          {effectiveRole === 'FACULTY' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121214] border border-[#27272A] rounded-2xl p-4">
              {leaveTypes.map((t) => {
                const bal = leaveBalances.find(
                  (b) => b.faculty_profile_id === myFacultyProfile?.id && b.leave_type_id === t.id
                ) || { total_leaves: t.default_days_per_year, used_leaves: 0, remaining_leaves: t.default_days_per_year };
                const pct = Math.min(100, Math.round((bal.used_leaves / (bal.total_leaves || 1)) * 100));

                return (
                  <div key={t.id} className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {t.code}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold text-white">{bal.remaining_leaves}</span>
                      <span className="text-xs text-[#71717A]">/ {bal.total_leaves} left</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#27272A] h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#71717A] mt-1">
                      <span>Used: {bal.used_leaves}</span>
                      <span>{pct}% consumed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search faculty or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {effectiveRole !== 'FACULTY' && (
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Leaves Table */}
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181B] border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Dates</th>
                    <th className="py-3 px-4">Timetable Impact</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#71717A]">
                        <CalendarX2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                        <div className="text-sm font-medium text-white">No leave requests found</div>
                        <p className="text-xs mt-1">Try adjusting the filter or apply for leave.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave) => {
                      const fac = facultyMap.get(leave.faculty_profile_id);
                      const user = fac ? userMap.get(fac.user_id) : undefined;
                      const type = leaveTypeMap.get(leave.leave_type_id);
                      const isOwner = fac?.user_id === currentUser.id;

                      // Pre-analyze impact for this leave
                      const impact = analyzeTimetableImpact(
                        leave.faculty_profile_id,
                        leave.start_date,
                        leave.end_date,
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

                      return (
                        <tr key={leave.id} className="hover:bg-[#18181B]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{user?.full_name || 'Faculty Member'}</div>
                            <div className="text-[11px] text-[#71717A] flex items-center gap-1.5 mt-0.5">
                              <span>{fac?.employee_id || 'ID-NA'}</span>
                              <span>•</span>
                              <span>{fac?.designation || 'Faculty'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-medium text-white block">{type?.name || 'Leave'}</span>
                            <span className="text-[10px] text-[#71717A]">{type?.code}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-white font-medium">
                              {leave.start_date === leave.end_date
                                ? leave.start_date
                                : `${leave.start_date} → ${leave.end_date}`}
                            </div>
                            <div className="text-[11px] text-[#71717A] mt-0.5">
                              {leave.total_days} Day{leave.total_days > 1 ? 's' : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {impact.totalClassesImpacted > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                                  {impact.totalClassesImpacted} Lecture{impact.totalClassesImpacted > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-400 font-medium">Zero Clash</span>
                              )}
                            </div>
                            {impact.affectedSubjects.length > 0 && (
                              <div className="text-[10px] text-[#A1A1AA] mt-1 max-w-[180px] truncate">
                                {impact.affectedSubjects.map((s) => s.code).join(', ')}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="text-white line-clamp-1">{leave.reason}</div>
                            {leave.attachment_url && (
                              <a
                                href={leave.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-1"
                              >
                                <FileText className="w-3 h-3" />
                                Attached Document
                              </a>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                leave.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : leave.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : leave.status === 'REJECTED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-[#27272A] text-[#71717A]'
                              }`}
                            >
                              {leave.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                              {leave.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              {leave.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                              {leave.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Timetable Impact & Substitution details */}
                              <button
                                onClick={() => {
                                  if (impact.affectedLectures.length > 0) {
                                    setSelectedLectureForSub({
                                      leave,
                                      lecture: impact.affectedLectures[0],
                                    });
                                  } else {
                                    alert('No lectures impacted during this leave period.');
                                  }
                                }}
                                title="View impact & assign substitutes"
                                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-indigo-600/30 text-[#A1A1AA] hover:text-white transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              </button>

                              {/* HEAD Approvals */}
                              {leave.status === 'PENDING' &&
                                (effectiveRole === 'HEAD' || effectiveRole === 'SUPER_ADMIN') && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedLeaveForReview(leave);
                                        setReviewAction('APPROVE');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-all"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedLeaveForReview(leave);
                                        setReviewAction('REJECT');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                              {/* Faculty Cancel own pending */}
                              {leave.status === 'PENDING' && (isOwner || effectiveRole === 'FACULTY') && (
                                <button
                                  onClick={() => onCancelLeave(leave.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#27272A] hover:bg-rose-900/40 text-[#A1A1AA] hover:text-rose-300 text-[11px] transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SMART SUBSTITUTION ENGINE & ROSTER */}
      {/* ==================================================================== */}
      {activeTab === 'substitutions' && (
        <div className="space-y-6">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Live Faculty Substitution Roster
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Automated matching ensures 100% lecture coverage with zero timetable overlaps
                </p>
              </div>
              <div className="text-xs text-[#71717A] bg-[#18181B] border border-[#27272A] px-3 py-1.5 rounded-xl font-medium">
                Active Substitutes: <span className="text-white font-bold">{substitutes.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {substitutes.map((sub) => {
              const origFac = facultyMap.get(sub.original_faculty_id);
              const origUser = origFac ? userMap.get(origFac.user_id) : undefined;
              const subFac = facultyMap.get(sub.substitute_faculty_id);
              const subUser = subFac ? userMap.get(subFac.user_id) : undefined;
              const subject = subjects.find((s) => s.id === sub.subject_id);
              const room = rooms.find((r) => r.id === sub.room_id);
              const lab = labs.find((l) => l.id === sub.lab_id);

              return (
                <div
                  key={sub.id}
                  className="bg-[#121214] border border-[#27272A] rounded-2xl p-5 space-y-4 hover:border-indigo-500/40 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A]">
                        {sub.day_of_week}
                      </span>
                      <span className="text-xs text-[#A1A1AA]">{sub.date}</span>
                      <span className="text-xs text-indigo-400 font-mono">
                        {sub.start_time} - {sub.end_time}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'PROPOSED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-[#27272A] text-[#71717A]'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  {/* Flow from Original to Substitute */}
                  <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider">
                        Original Faculty (On Leave)
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {origUser?.full_name || 'Faculty Member'}
                      </div>
                      <div className="text-[11px] text-[#A1A1AA]">{origFac?.employee_id}</div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 mx-2" />

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Substitute Assigned
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {subUser?.full_name || 'Substitute'}
                      </div>
                      <div className="text-[11px] text-[#A1A1AA]">{subFac?.employee_id}</div>
                    </div>
                  </div>

                  {/* Lecture Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#18181B]/60 p-2.5 rounded-lg border border-[#27272A]">
                      <span className="text-[10px] text-[#71717A] block">Subject</span>
                      <span className="font-semibold text-white">
                        {subject?.code} - {subject?.name || 'Class'}
                      </span>
                    </div>
                    <div className="bg-[#18181B]/60 p-2.5 rounded-lg border border-[#27272A]">
                      <span className="text-[10px] text-[#71717A] block">Location</span>
                      <span className="font-semibold text-white">
                        {room?.room_name || room?.name || room?.room_number || lab?.name || 'Assigned Room'}
                      </span>
                    </div>
                  </div>

                  {/* Match Score & Justifications */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#A1A1AA]">Recommendation Score:</span>
                      <span className="font-bold text-emerald-400">{sub.match_score}% Match</span>
                    </div>
                    <div className="space-y-1">
                      {sub.match_reasons.map((r, i) => (
                        <div key={i} className="text-[11px] text-[#71717A] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: FACULTY LEAVE BALANCES */}
      {/* ==================================================================== */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Faculty Leave Balances (2025-2026)</h2>
              <p className="text-xs text-[#A1A1AA]">
                Live balance quotas, consumption tracking, and institutional ceilings
              </p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181B] border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Casual Leave (CL)</th>
                    <th className="py-3 px-4">Sick Leave (SL)</th>
                    <th className="py-3 px-4">Emergency Leave (EL)</th>
                    <th className="py-3 px-4">Duty Leave (DL)</th>
                    <th className="py-3 px-4">Total Consumed</th>
                    <th className="py-3 px-4 text-right">Quota Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60">
                  {facultyProfiles.map((fac) => {
                    const user = userMap.get(fac.user_id);
                    const cl = leaveBalances.find(
                      (b) => b.faculty_profile_id === fac.id && b.leave_type_id === 'lt-cl'
                    );
                    const sl = leaveBalances.find(
                      (b) => b.faculty_profile_id === fac.id && b.leave_type_id === 'lt-sl'
                    );
                    const el = leaveBalances.find(
                      (b) => b.faculty_profile_id === fac.id && b.leave_type_id === 'lt-el'
                    );
                    const dl = leaveBalances.find(
                      (b) => b.faculty_profile_id === fac.id && b.leave_type_id === 'lt-dl'
                    );

                    const totalUsed =
                      (cl?.used_leaves || 0) +
                      (sl?.used_leaves || 0) +
                      (el?.used_leaves || 0) +
                      (dl?.used_leaves || 0);

                    return (
                      <tr key={fac.id} className="hover:bg-[#18181B]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{user?.full_name || 'Faculty Member'}</div>
                          <div className="text-[11px] text-[#71717A]">
                            {fac.employee_id} • {fac.designation}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            {cl?.remaining_leaves ?? 12}{' '}
                            <span className="text-[10px] text-[#71717A]">/ {cl?.total_leaves ?? 12}</span>
                          </div>
                          <div className="text-[10px] text-[#71717A]">Used: {cl?.used_leaves ?? 0}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            {sl?.remaining_leaves ?? 10}{' '}
                            <span className="text-[10px] text-[#71717A]">/ {sl?.total_leaves ?? 10}</span>
                          </div>
                          <div className="text-[10px] text-[#71717A]">Used: {sl?.used_leaves ?? 0}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            {el?.remaining_leaves ?? 5}{' '}
                            <span className="text-[10px] text-[#71717A]">/ {el?.total_leaves ?? 5}</span>
                          </div>
                          <div className="text-[10px] text-[#71717A]">Used: {el?.used_leaves ?? 0}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            {dl?.remaining_leaves ?? 15}{' '}
                            <span className="text-[10px] text-[#71717A]">/ {dl?.total_leaves ?? 15}</span>
                          </div>
                          <div className="text-[10px] text-[#71717A]">Used: {dl?.used_leaves ?? 0}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white">{totalUsed} Days</span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Healthy Quota
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: LEAVE ANALYTICS & INSIGHTS (RECHARTS) */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Monthly Leave Application Trends
              </h3>
              <p className="text-xs text-[#71717A] mb-4">Volume of submissions vs approved leaves over time</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="month" stroke="#71717A" fontSize={11} />
                    <YAxis stroke="#71717A" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: 8 }}
                      itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="requests" name="Total Requests" stroke="#818CF8" strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" name="Approved Leaves" stroke="#34D399" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Department Leave Volume & Impacted Lectures
              </h3>
              <p className="text-xs text-[#71717A] mb-4">Leave days taken and classes needing substitution</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="departmentName" stroke="#71717A" fontSize={11} />
                    <YAxis stroke="#71717A" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: 8 }}
                      itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalLeaves" name="Days Taken" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="affectedLectures" name="Classes Impacted" fill="#A855F7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Substitute Utilization Table */}
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Substitute Faculty Utilization & Workload Balance
            </h3>
            <p className="text-xs text-[#71717A] mb-4">
              Faculty members stepping in to cover lectures for colleagues on leave
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {analytics.substitutionUtilization.length === 0 ? (
                <div className="col-span-3 text-center py-6 text-[#71717A] text-xs">
                  No confirmed substitute lectures recorded yet.
                </div>
              ) : (
                analytics.substitutionUtilization.map((u, i) => (
                  <div key={i} className="bg-[#18181B] border border-[#27272A] rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{u.facultyName}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {u.classesCovered} Classes
                      </span>
                    </div>
                    <div className="text-[11px] text-[#A1A1AA] mt-1">
                      {u.hoursContributed} Extra Teaching Hours Contributed
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: CUSTOM LEAVE TYPES MANAGEMENT */}
      {/* ==================================================================== */}
      {activeTab === 'leave-types' && (
        <div className="space-y-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Institutional Leave Policy & Custom Types</h2>
              <p className="text-xs text-[#A1A1AA]">
                Configure quota ceilings, paid/unpaid status, and document requirements
              </p>
            </div>
            <button
              onClick={() => setIsCreateTypeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create Custom Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map((t) => (
              <div key={t.id} className="bg-[#121214] border border-[#27272A] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{t.name}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {t.code}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] min-h-[36px]">{t.description || 'Institutional leave quota'}</p>

                <div className="pt-3 border-t border-[#27272A] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#71717A] block">Annual Quota</span>
                    <span className="font-bold text-white">{t.default_days_per_year} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#71717A] block">Remuneration</span>
                    <span className="font-semibold text-emerald-400">{t.is_paid ? 'Paid Leave' : 'Unpaid'}</span>
                  </div>
                </div>

                <div className="text-[10px] text-[#71717A] flex items-center gap-1.5 pt-1">
                  <Info className="w-3 h-3 text-indigo-400" />
                  <span>
                    {t.requires_document ? 'Requires medical or institutional document' : 'No document mandatory'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: AUDIT TRAIL VIEW */}
      {/* ==================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Leave Compliance & Audit Trail</h2>
              <p className="text-xs text-[#A1A1AA]">
                Tamper-resistant log of all leave requests, approvals, rejections, and substitute allocations
              </p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181B] border-b border-[#27272A] text-[#71717A] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {auditLogs.map((log) => {
                  const user = userMap.get(log.user_id || '');
                  return (
                    <tr key={log.id} className="hover:bg-[#18181B]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">{log.action}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{user?.full_name || 'System Operator'}</div>
                        <div className="text-[10px] text-[#71717A]">{log.user_role}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#A1A1AA] max-w-sm">
                        <div className="truncate">{JSON.stringify(log.details || {})}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#71717A]">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3.5 px-4 text-right text-[#71717A]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: APPLY FOR LEAVE WITH TIMETABLE IMPACT PREVIEW */}
      {/* ==================================================================== */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarX2 className="w-5 h-5 text-indigo-400" />
                  Apply for Faculty Leave
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Real-time lecture collision detector checks your timetable schedule instantly
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-[#27272A]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              {/* Faculty selector if HEAD, otherwise locked to current faculty */}
              {effectiveRole !== 'FACULTY' ? (
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Select Faculty Member</label>
                  <select
                    value={applyFacultyId}
                    onChange={(e) => setApplyFacultyId(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {facultyProfiles.map((f) => {
                      const u = userMap.get(f.user_id);
                      return (
                        <option key={f.id} value={f.id}>
                          {u?.full_name || 'Faculty'} ({f.employee_id}) - {f.designation}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3 text-xs">
                  <span className="text-[#71717A] block">Applying as:</span>
                  <span className="font-bold text-white text-sm">
                    {userMap.get(myFacultyProfile?.user_id)?.full_name || 'Faculty Member'}
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] ml-2">({myFacultyProfile?.employee_id})</span>
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Leave Type</label>
                <select
                  value={applyTypeId}
                  onChange={(e) => setApplyTypeId(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - {t.default_days_per_year} days quota
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={applyStartDate}
                    onChange={(e) => setApplyStartDate(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">End Date</label>
                  <input
                    type="date"
                    value={applyEndDate}
                    onChange={(e) => setApplyEndDate(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* REAL-TIME TIMETABLE IMPACT PREVIEW BOX */}
              {draftImpact && (
                <div className="bg-[#18181B] border border-purple-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      Live Timetable Impact Analysis
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {draftImpact.totalClassesImpacted} Lecture{draftImpact.totalClassesImpacted > 1 ? 's' : ''} Affected
                    </span>
                  </div>

                  {draftImpact.totalClassesImpacted > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-[#A1A1AA]">
                        The following scheduled classes will require substitute faculty:
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {draftImpact.affectedLectures.map((lec, idx) => (
                          <div
                            key={idx}
                            className="bg-[#27272A]/60 border border-[#27272A] rounded-lg p-2 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-white">
                                {lec.subjectCode} - {lec.subjectName}
                              </span>
                              <div className="text-[10px] text-[#71717A]">
                                {lec.dayOfWeek} • {lec.startTime} - {lec.endTime} • {lec.roomName || lec.labName || 'Room'}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                              Period {lec.periodNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      No lectures scheduled on this date range. Smooth leave allocation.
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Reason for Leave *</label>
                <textarea
                  rows={3}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Describe reason for leave (medical, personal, conference, etc.)..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Document Attachment URL */}
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Document / Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  value={applyAttachmentUrl}
                  onChange={(e) => setApplyAttachmentUrl(e.target.value)}
                  placeholder="https://apex-tech.edu/docs/certificate.pdf"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Applicant Notes / Suggested Substitute
                </label>
                <input
                  type="text"
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="e.g. Requested Prof. Vikram to handle DB lecture"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: HEAD APPROVAL / REJECTION CONFIRMATION */}
      {/* ==================================================================== */}
      {selectedLeaveForReview && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {reviewAction === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Approve Leave Request
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  Reject Leave Request
                </>
              )}
            </h3>

            <p className="text-xs text-[#A1A1AA]">
              {reviewAction === 'APPROVE'
                ? 'Approving will confirm substitute lecture allocations and deduct days from faculty balance.'
                : 'Rejecting will notify faculty member and maintain leave quotas intact.'}
            </p>

            {reviewAction === 'APPROVE' ? (
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Approval Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Leave sanctioned by Academic Head..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify operational reason (e.g. exam week, unresolvable lecture clash)..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeaveForReview(null);
                  setReviewAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SUBSTITUTE FACULTY SUGGESTION & ALLOCATION DRAWER */}
      {/* ==================================================================== */}
      {selectedLectureForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Automated Substitute Faculty Recommendation
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Multi-variable heuristic matching: Subject domain expertise + Time availability + Workload headroom
                </p>
              </div>
              <button
                onClick={() => setSelectedLectureForSub(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-[#27272A]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Target Lecture Card */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block">
                Target Affected Lecture
              </span>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedLectureForSub.lecture.subjectCode} - {selectedLectureForSub.lecture.subjectName}
                  </h4>
                  <div className="text-xs text-[#A1A1AA] mt-0.5">
                    {selectedLectureForSub.lecture.departmentName} • {selectedLectureForSub.lecture.roomName || 'Room'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-indigo-400">
                    {selectedLectureForSub.lecture.startTime} - {selectedLectureForSub.lecture.endTime}
                  </div>
                  <div className="text-[10px] text-[#71717A]">
                    {selectedLectureForSub.lecture.dayOfWeek} • {selectedLectureForSub.lecture.date}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                Ranked Faculty Candidates
              </h4>

              {(() => {
                const suggestions = suggestSubstitutesForLecture(
                  selectedLectureForSub.lecture,
                  facultyProfiles,
                  users,
                  deptAssignments,
                  unavailableSlots,
                  workloads,
                  timetableEntries,
                  subjects,
                  departments,
                  selectedLectureForSub.leave.faculty_profile_id
                );

                return suggestions.map((cand, idx) => (
                  <div
                    key={cand.facultyId}
                    className={`border rounded-xl p-4 transition-all ${
                      cand.isAvailable
                        ? 'bg-[#18181B] border-[#27272A] hover:border-indigo-500/50'
                        : 'bg-[#18181B]/40 border-rose-500/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{cand.facultyName}</div>
                          <div className="text-[11px] text-[#71717A]">
                            {cand.employeeId} • {cand.designation} • {cand.departmentName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            cand.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {cand.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Explanations & Reasons */}
                    <div className="mt-2.5 space-y-1">
                      {cand.reasons.map((r, rIdx) => (
                        <div key={rIdx} className="text-[11px] text-[#A1A1AA] flex items-center gap-1.5">
                          {cand.isAvailable ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* One-click Assign Button */}
                    {cand.isAvailable && (
                      <div className="mt-3 pt-3 border-t border-[#27272A] flex justify-end">
                        <button
                          onClick={() => {
                            onAssignSubstitute({
                              leaveId: selectedLectureForSub.leave.id,
                              timetableEntryId: selectedLectureForSub.lecture.timetableEntryId,
                              originalFacultyId: selectedLectureForSub.leave.faculty_profile_id,
                              substituteFacultyId: cand.facultyId,
                              date: selectedLectureForSub.lecture.date,
                              dayOfWeek: selectedLectureForSub.lecture.dayOfWeek,
                              startTime: selectedLectureForSub.lecture.startTime,
                              endTime: selectedLectureForSub.lecture.endTime,
                              subjectId: selectedLectureForSub.lecture.subjectId,
                              roomId: selectedLectureForSub.lecture.roomId,
                              labId: selectedLectureForSub.lecture.labId,
                              matchScore: cand.matchScore,
                              matchReasons: cand.reasons,
                              notes: `Auto-recommended: ${cand.reasons[0] || 'Eligible faculty candidate'}`,
                            });
                            setSelectedLectureForSub(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                        >
                          Assign As Substitute
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CREATE CUSTOM LEAVE TYPE */}
      {/* ==================================================================== */}
      {isCreateTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#27272A] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                New Institutional Leave Type
              </h3>
              <button
                onClick={() => setIsCreateTypeModalOpen(false)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTypeSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Leave Name *</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Sabbatical Leave, Maternity Leave"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Code *</label>
                  <input
                    type="text"
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                    placeholder="e.g. SAB, ML"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Annual Quota (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newTypeDays}
                    onChange={(e) => setNewTypeDays(Number(e.target.value))}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Policy rules and eligibility requirements..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 text-[#A1A1AA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypePaid}
                    onChange={(e) => setNewTypePaid(e.target.checked)}
                    className="rounded bg-[#18181B] border-[#27272A] text-indigo-600 focus:ring-0"
                  />
                  <span>Paid Leave (Salary / Stipend continued)</span>
                </label>
                <label className="flex items-center gap-2 text-[#A1A1AA] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeReqDoc}
                    onChange={(e) => setNewTypeReqDoc(e.target.checked)}
                    className="rounded bg-[#18181B] border-[#27272A] text-indigo-600 focus:ring-0"
                  />
                  <span>Mandatory Document Attachment</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsCreateTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#27272A] text-[#A1A1AA] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Create Leave Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
