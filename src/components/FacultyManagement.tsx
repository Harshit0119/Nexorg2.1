import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Network,
  CheckCircle,
  Briefcase,
  GraduationCap,
  Clock,
  Layers,
  Filter,
  Search,
  AlertTriangle,
  X,
  Edit3,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  CalendarClock,
  Sparkles,
  Trash2,
  Check
} from 'lucide-react';
import {
  FacultyProfile,
  Department,
  FacultyDepartmentAssignment,
  User,
  WorkloadAllocation,
  Subject,
  FacultyAvailability,
  UserRole,
  EmploymentType,
  WorkloadComponent,
  AcademicDay,
  AvailabilityStatus
} from '../types/database';
import {
  createFacultySchema,
  editFacultySchema,
  facultySubjectAssignmentSchema,
  facultyAvailabilitySchema
} from '../lib/validations';

interface FacultyManagementProps {
  facultyProfiles: FacultyProfile[];
  users: User[];
  departments: Department[];
  assignments: FacultyDepartmentAssignment[];
  workloads: WorkloadAllocation[];
  subjects?: Subject[];
  availabilities?: FacultyAvailability[];
  onAddAssignment: (facultyId: string, departmentId: string, isPrimary: boolean) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onAddFaculty: (facultyData: {
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
  }) => void;
  onUpdateFacultyProfile?: (id: string, updatedProfile: Partial<FacultyProfile>, updatedUser?: Partial<User>) => void;
  onAssignSubject?: (facultyId: string, subjectId: string, hours: number, component: WorkloadComponent) => void;
  onRemoveWorkloadAllocation?: (id: string) => void;
  onAddAvailability?: (avail: Omit<FacultyAvailability, 'id' | 'created_at'>) => void;
  onRemoveAvailability?: (id: string) => void;
  currentRole: UserRole;
  userAssignedDeptId?: string;
}

export const FacultyManagement: React.FC<FacultyManagementProps> = ({
  facultyProfiles,
  users,
  departments,
  assignments,
  workloads,
  subjects = [],
  availabilities = [],
  onAddAssignment,
  onRemoveAssignment,
  onAddFaculty,
  onUpdateFacultyProfile,
  onAssignSubject,
  onRemoveWorkloadAllocation,
  onAddAvailability,
  onRemoveAvailability,
  currentRole,
  userAssignedDeptId,
}) => {
  // Filters & View State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedEmploymentFilter, setSelectedEmploymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected faculty for detailed drawer view
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    currentRole === 'FACULTY' ? 'fac-rahul' : null
  );

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isNewFacultyModalOpen, setIsNewFacultyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignSubjectModalOpen, setIsAssignSubjectModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  // Form Targets
  const [targetFacultyId, setTargetFacultyId] = useState<string>('');
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [isPrimarySelected, setIsPrimarySelected] = useState<boolean>(false);

  // Validation & Feedback States
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Faculty State
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyEmpId, setNewFacultyEmpId] = useState('');
  const [newFacultyDesignation, setNewFacultyDesignation] = useState('Assistant Professor');
  const [newFacultyContact, setNewFacultyContact] = useState('');
  const [newFacultyQualifications, setNewFacultyQualifications] = useState('');
  const [newFacultyEmpType, setNewFacultyEmpType] = useState<EmploymentType>('FULL_TIME');
  const [newFacultyJoiningDate, setNewFacultyJoiningDate] = useState('2025-01-15');
  const [newFacultyMaxHours, setNewFacultyMaxHours] = useState(18);
  const [newFacultyMinHours, setNewFacultyMinHours] = useState(12);
  const [newFacultyCabin, setNewFacultyCabin] = useState('');
  const [newFacultySelectedDepts, setNewFacultySelectedDepts] = useState<string[]>([]);
  const [newFacultyPrimaryDept, setNewFacultyPrimaryDept] = useState<string>('');

  // Edit Faculty State
  const [editFullName, setEditFullName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editQualifications, setEditQualifications] = useState('');
  const [editEmpType, setEditEmpType] = useState<EmploymentType>('FULL_TIME');
  const [editMaxHours, setEditMaxHours] = useState(18);
  const [editMinHours, setEditMinHours] = useState(12);
  const [editCabin, setEditCabin] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Subject Assignment State
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocComponent, setAllocComponent] = useState<WorkloadComponent>('LECTURE');
  const [allocHours, setAllocHours] = useState(3);

  // Availability State
  const [availDay, setAvailDay] = useState<AcademicDay>('MONDAY');
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('11:00');
  const [availStatus, setAvailStatus] = useState<AvailabilityStatus>('UNAVAILABLE');
  const [availReason, setAvailReason] = useState('');

  // Filter faculty
  const filteredFaculty = facultyProfiles.filter((faculty) => {
    const user = users.find((u) => u.id === faculty.user_id);
    const facultyDepts = assignments.filter((a) => a.faculty_id === faculty.id);

    // If role is ADMIN, only show faculty that belong to their department (or allow all if HEAD)
    if (currentRole === 'ADMIN' && userAssignedDeptId) {
      const belongsToAdminDept = facultyDepts.some((a) => a.department_id === userAssignedDeptId);
      if (!belongsToAdminDept) return false;
    }

    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      facultyDepts.some((a) => a.department_id === selectedDeptFilter);

    const matchesEmployment =
      selectedEmploymentFilter === 'ALL' ||
      (faculty.employment_type || 'FULL_TIME') === selectedEmploymentFilter;

    const matchesSearch =
      !searchQuery ||
      user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.specializations?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDept && matchesEmployment && matchesSearch;
  });

  // Selected faculty computed object for details view
  const activeFaculty = selectedFacultyId
    ? facultyProfiles.find((f) => f.id === selectedFacultyId) || null
    : null;
  const activeUser = activeFaculty
    ? users.find((u) => u.id === activeFaculty.user_id) || null
    : null;
  const activeAssignments = activeFaculty
    ? assignments.filter((a) => a.faculty_id === activeFaculty.id)
    : [];
  const activeWorkloads = activeFaculty
    ? workloads.filter((w) => w.faculty_id === activeFaculty.id)
    : [];
  const activeAvailabilities = activeFaculty
    ? availabilities.filter((a) => a.faculty_id === activeFaculty.id)
    : [];
  const activeTotalHours = activeWorkloads.reduce((acc, curr) => acc + curr.hours_per_week, 0);

  // Stats calculation
  const totalFacultyCount = facultyProfiles.length;
  const multiDeptCount = facultyProfiles.filter((f) => {
    const depts = assignments.filter((a) => a.faculty_id === f.id);
    return depts.length > 1;
  }).length;
  const fullTimeCount = facultyProfiles.filter(
    (f) => (f.employment_type || 'FULL_TIME') === 'FULL_TIME'
  ).length;
  const totalWorkloadHours = workloads.reduce((sum, w) => sum + w.hours_per_week, 0);
  const avgWorkload = totalFacultyCount > 0 ? (totalWorkloadHours / totalFacultyCount).toFixed(1) : '0';

  // Open Create Faculty Modal
  const openCreateModal = () => {
    setNewFacultyName('');
    setNewFacultyEmail('');
    setNewFacultyEmpId(`FAC-${Date.now().toString().slice(-4)}`);
    setNewFacultyDesignation('Assistant Professor');
    setNewFacultyContact('');
    setNewFacultyQualifications('');
    setNewFacultyEmpType('FULL_TIME');
    setNewFacultyJoiningDate(new Date().toISOString().slice(0, 10));
    setNewFacultyMaxHours(18);
    setNewFacultyMinHours(12);
    setNewFacultyCabin('');
    setNewFacultySelectedDepts(departments[0] ? [departments[0].id] : []);
    setNewFacultyPrimaryDept(departments[0] ? departments[0].id : '');
    setFormError(null);
    setFormSuccess(null);
    setIsNewFacultyModalOpen(true);
  };

  // Open Edit Faculty Modal
  const openEditModal = (faculty: FacultyProfile) => {
    const u = users.find((user) => user.id === faculty.user_id);
    setTargetFacultyId(faculty.id);
    setEditFullName(u?.full_name || '');
    setEditDesignation(faculty.designation);
    setEditContact(faculty.contact_number || u?.phone || '');
    setEditQualifications(faculty.qualification || '');
    setEditEmpType(faculty.employment_type || 'FULL_TIME');
    setEditMaxHours(faculty.max_weekly_hours);
    setEditMinHours(faculty.min_weekly_hours);
    setEditCabin(faculty.cabin_number || '');
    setEditIsActive(faculty.is_active);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open Assign Department Modal
  const handleOpenAssign = (facultyId: string) => {
    setTargetFacultyId(facultyId);
    const existingDeptIds = assignments
      .filter((a) => a.faculty_id === facultyId)
      .map((a) => a.department_id);
    const available = departments.filter((d) => !existingDeptIds.includes(d.id));
    if (available.length > 0) {
      setTargetDeptId(available[0].id);
    }
    setIsPrimarySelected(false);
    setFormError(null);
    setIsAssignModalOpen(true);
  };

  // Open Assign Subject Modal
  const openAssignSubjectModal = (facultyId: string) => {
    setTargetFacultyId(facultyId);
    // Find subjects in faculty's assigned departments
    const facDeptIds = assignments.filter((a) => a.faculty_id === facultyId).map((a) => a.department_id);
    const eligibleSubjects = subjects.filter((s) => facDeptIds.includes(s.department_id));
    if (eligibleSubjects.length > 0) {
      setAllocSubjectId(eligibleSubjects[0].id);
    } else if (subjects.length > 0) {
      setAllocSubjectId(subjects[0].id);
    }
    setAllocComponent('LECTURE');
    setAllocHours(3);
    setFormError(null);
    setIsAssignSubjectModalOpen(true);
  };

  // Handle Create Faculty Submit with Zod validation
  const handleCreateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = createFacultySchema.safeParse({
      full_name: newFacultyName.trim(),
      email: newFacultyEmail.trim(),
      employee_id: newFacultyEmpId.trim().toUpperCase(),
      designation: newFacultyDesignation.trim(),
      contact_number: newFacultyContact.trim(),
      qualifications: newFacultyQualifications.trim(),
      employment_type: newFacultyEmpType,
      joining_date: newFacultyJoiningDate,
      max_weekly_hours: Number(newFacultyMaxHours),
      min_weekly_hours: Number(newFacultyMinHours),
      department_ids: newFacultySelectedDepts,
      primary_department_id: newFacultyPrimaryDept || newFacultySelectedDepts[0],
      cabin_number: newFacultyCabin.trim(),
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    // Check duplicate employee ID
    if (facultyProfiles.some((f) => f.employee_id.toLowerCase() === newFacultyEmpId.trim().toLowerCase())) {
      setFormError(`Employee ID "${newFacultyEmpId.toUpperCase()}" already exists.`);
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === newFacultyEmail.trim().toLowerCase())) {
      setFormError(`A user with email "${newFacultyEmail}" is already registered.`);
      return;
    }

    onAddFaculty({
      fullName: newFacultyName.trim(),
      email: newFacultyEmail.trim(),
      employeeId: newFacultyEmpId.trim().toUpperCase(),
      designation: newFacultyDesignation,
      contactNumber: newFacultyContact.trim() || undefined,
      qualifications: newFacultyQualifications.trim() || undefined,
      employmentType: newFacultyEmpType,
      joiningDate: newFacultyJoiningDate,
      maxWeeklyHours: Number(newFacultyMaxHours),
      departmentIds: newFacultySelectedDepts,
      primaryDepartmentId: newFacultyPrimaryDept || newFacultySelectedDepts[0],
    });

    setFormSuccess('Faculty profile created with multi-department assignments!');
    setTimeout(() => {
      setFormSuccess(null);
      setIsNewFacultyModalOpen(false);
    }, 1200);
  };

  // Handle Edit Faculty Submit with Zod validation
  const handleEditFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = editFacultySchema.safeParse({
      full_name: editFullName.trim(),
      designation: editDesignation.trim(),
      contact_number: editContact.trim(),
      qualifications: editQualifications.trim(),
      employment_type: editEmpType,
      max_weekly_hours: Number(editMaxHours),
      min_weekly_hours: Number(editMinHours),
      cabin_number: editCabin.trim(),
      is_active: editIsActive,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    if (onUpdateFacultyProfile && targetFacultyId) {
      onUpdateFacultyProfile(
        targetFacultyId,
        {
          designation: editDesignation,
          qualification: editQualifications,
          employment_type: editEmpType,
          max_weekly_hours: Number(editMaxHours),
          min_weekly_hours: Number(editMinHours),
          cabin_number: editCabin,
          contact_number: editContact,
          is_active: editIsActive,
        },
        {
          full_name: editFullName,
          phone: editContact,
        }
      );
    }

    setFormSuccess('Faculty profile updated successfully!');
    setTimeout(() => {
      setFormSuccess(null);
      setIsEditModalOpen(false);
    }, 1000);
  };

  // Handle Confirm Department Assignment
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacultyId || !targetDeptId) return;

    // Check duplicate assignment
    const alreadyAssigned = assignments.some(
      (a) => a.faculty_id === targetFacultyId && a.department_id === targetDeptId
    );
    if (alreadyAssigned) {
      setFormError('This faculty member is already assigned to this department.');
      return;
    }

    onAddAssignment(targetFacultyId, targetDeptId, isPrimarySelected);
    setIsAssignModalOpen(false);
  };

  // Handle Confirm Subject Assignment
  const handleConfirmSubjectAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacultyId || !allocSubjectId) return;

    const sub = subjects.find((s) => s.id === allocSubjectId);
    if (!sub) return;

    const validation = facultySubjectAssignmentSchema.safeParse({
      faculty_id: targetFacultyId,
      subject_id: allocSubjectId,
      department_id: sub.department_id,
      component: allocComponent,
      hours_per_week: Number(allocHours),
      is_lead_faculty: false,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    if (onAssignSubject) {
      onAssignSubject(targetFacultyId, allocSubjectId, Number(allocHours), allocComponent);
    }
    setIsAssignSubjectModalOpen(false);
  };

  // Handle Confirm Availability Block
  const handleConfirmAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFaculty) return;

    const validation = facultyAvailabilitySchema.safeParse({
      faculty_id: activeFaculty.id,
      day_of_week: availDay,
      start_time: availStart,
      end_time: availEnd,
      status: availStatus,
      reason: availReason.trim(),
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    if (onAddAvailability) {
      onAddAvailability({
        faculty_id: activeFaculty.id,
        institute_id: activeFaculty.institute_id,
        day_of_week: availDay,
        start_time: availStart,
        end_time: availEnd,
        status: availStatus,
        reason: availReason.trim() || undefined,
      });
    }

    setIsAvailabilityModalOpen(false);
    setAvailReason('');
  };

  const toggleDeptForNewFaculty = (deptId: string) => {
    if (newFacultySelectedDepts.includes(deptId)) {
      if (newFacultySelectedDepts.length > 1) {
        const updated = newFacultySelectedDepts.filter((id) => id !== deptId);
        setNewFacultySelectedDepts(updated);
        if (newFacultyPrimaryDept === deptId) {
          setNewFacultyPrimaryDept(updated[0]);
        }
      }
    } else {
      const updated = [...newFacultySelectedDepts, deptId];
      setNewFacultySelectedDepts(updated);
      if (!newFacultyPrimaryDept) {
        setNewFacultyPrimaryDept(deptId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Faculty Management (Multi-Department Architecture)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              One Faculty ↔ Multiple Departments
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-3xl">
            Normalized relational model allowing professors to be appointed across CSE, AIML, and IT simultaneously with cross-department conflict locks and aggregate workload tracking.
          </p>
        </div>

        {currentRole === 'HEAD' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Faculty (M:N)</span>
          </button>
        )}
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur">
          <div className="text-[11px] font-medium text-zinc-400">Total Faculty</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{totalFacultyCount}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Teaching across campus</div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur">
          <div className="text-[11px] font-medium text-indigo-300 flex items-center justify-between">
            <span>Multi-Dept Faculty</span>
            <Network className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{multiDeptCount}</div>
          <div className="text-[10px] text-indigo-400 mt-1">Cross-department locks active</div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur">
          <div className="text-[11px] font-medium text-zinc-400">Full-Time / Adjunct</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {fullTimeCount} <span className="text-xs text-zinc-500 font-normal">/ {totalFacultyCount - fullTimeCount}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Contract distribution</div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur">
          <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
            <span>Avg Weekly Load</span>
            <Clock className="h-3.5 w-3.5 text-[#06B6D4]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{avgWorkload} hrs</div>
          <div className="text-[10px] text-emerald-400 mt-1">Optimal utilization</div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & View Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span>Dept:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-white/[0.08] py-1 px-2 text-white focus:outline-none text-xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Type:</span>
            <select
              value={selectedEmploymentFilter}
              onChange={(e) => setSelectedEmploymentFilter(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-white/[0.08] py-1 px-2 text-white focus:outline-none text-xs"
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="ADJUNCT">Adjunct</option>
              <option value="VISITING">Visiting</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, ID, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-800/80 border border-white/[0.08] py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-lg bg-zinc-800 p-1 border border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Faculty Content: List View or Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Faculty List (Left Column, spans 7 or 12 depending on detail selection) */}
        <div className={`${activeFaculty ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {filteredFaculty.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-12 text-center space-y-3">
              <Users2 className="h-10 w-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Faculty Found</h3>
              <p className="text-xs text-zinc-400">Try adjusting your department or search filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 ${activeFaculty ? 'sm:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
              {filteredFaculty.map((faculty) => {
                const user = users.find((u) => u.id === faculty.user_id);
                const facultyAssignments = assignments.filter((a) => a.faculty_id === faculty.id);
                const facultyWorkload = workloads
                  .filter((w) => w.faculty_id === faculty.id)
                  .reduce((sum, item) => sum + item.hours_per_week, 0);

                const isRahul = faculty.id === 'fac-rahul';
                const isSelected = selectedFacultyId === faculty.id;

                return (
                  <div
                    key={faculty.id}
                    onClick={() => setSelectedFacultyId(faculty.id)}
                    className={`rounded-xl border p-5 transition-all bg-zinc-900/70 cursor-pointer relative group ${
                      isSelected
                        ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/15'
                        : isRahul
                        ? 'border-indigo-500/40 hover:border-indigo-500'
                        : 'border-white/[0.08] hover:border-white/[0.16]'
                    }`}
                  >
                    {isRahul && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[#4F46E5] text-white">
                        CSE • AIML • IT
                      </span>
                    )}

                    {/* Faculty Profile Card Header */}
                    <div className="flex items-start gap-4">
                      <img
                        src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={user?.full_name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{user?.full_name}</h3>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            {faculty.employee_id}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400">{faculty.designation}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{faculty.qualification}</div>
                      </div>
                    </div>

                    {/* Multi-Department Badges (M:N) */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Network className="h-3 w-3 text-indigo-400" />
                          <span>Appointments ({facultyAssignments.length})</span>
                        </span>
                        {currentRole === 'HEAD' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssign(faculty.id);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            + Assign Dept
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {facultyAssignments.map((a) => {
                          const dept = departments.find((d) => d.id === a.department_id);
                          if (!dept) return null;

                          return (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-mono font-medium"
                              style={{
                                backgroundColor: `${dept.color_accent}15`,
                                borderColor: `${dept.color_accent}35`,
                                color: dept.color_accent,
                              }}
                            >
                              <span>{dept.code}</span>
                              {a.is_primary_department && <span className="text-[9px] text-white">★ Primary</span>}
                              {currentRole === 'HEAD' && facultyAssignments.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveAssignment(a.id);
                                  }}
                                  className="text-zinc-500 hover:text-rose-400 ml-1"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Workload Capacity Bar */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Weekly Teaching:</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-white">{facultyWorkload} hrs</span>
                        <span className="text-zinc-500">/ {faculty.max_weekly_hours}h max</span>
                        <span className="h-2 w-16 bg-zinc-800 rounded-full overflow-hidden inline-block ml-1">
                          <span
                            className={`h-full block rounded-full ${
                              facultyWorkload > faculty.max_weekly_hours
                                ? 'bg-rose-500'
                                : 'bg-emerald-400'
                            }`}
                            style={{
                              width: `${Math.min(100, (facultyWorkload / faculty.max_weekly_hours) * 100)}%`,
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-zinc-900/90 text-zinc-400 font-mono">
                    <th className="p-3">Faculty Member</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Multi-Dept Appointments</th>
                    <th className="p-3 text-center">Workload</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                  {filteredFaculty.map((faculty) => {
                    const user = users.find((u) => u.id === faculty.user_id);
                    const facultyAssignments = assignments.filter((a) => a.faculty_id === faculty.id);
                    const facultyWorkload = workloads
                      .filter((w) => w.faculty_id === faculty.id)
                      .reduce((sum, item) => sum + item.hours_per_week, 0);

                    return (
                      <tr
                        key={faculty.id}
                        onClick={() => setSelectedFacultyId(faculty.id)}
                        className={`hover:bg-white/[0.02] cursor-pointer ${
                          selectedFacultyId === faculty.id ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={user?.full_name}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="font-semibold text-white">{user?.full_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{faculty.employee_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-400">{faculty.designation}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {facultyAssignments.map((a) => {
                              const dept = departments.find((d) => d.id === a.department_id);
                              return (
                                <span
                                  key={a.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                                  style={{
                                    backgroundColor: `${dept?.color_accent}15`,
                                    borderColor: `${dept?.color_accent}35`,
                                    color: dept?.color_accent,
                                  }}
                                >
                                  {dept?.code}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-white">{facultyWorkload}</span>
                          <span className="text-zinc-500">/{faculty.max_weekly_hours}h</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(faculty);
                            }}
                            className="p-1.5 rounded text-zinc-400 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Faculty Detail / Profile Drawer (Right Column, 5 cols) */}
        {activeFaculty && activeUser && (
          <div className="lg:col-span-5 rounded-2xl border border-indigo-500/40 bg-zinc-900/90 p-6 space-y-6 sticky top-20 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <img
                  src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={activeUser.full_name}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{activeUser.full_name}</h3>
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                      {activeFaculty.employee_id}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">{activeFaculty.designation}</div>
                  <div className="text-[11px] text-zinc-500">{activeFaculty.qualification}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {currentRole === 'HEAD' && (
                  <button
                    onClick={() => openEditModal(activeFaculty)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                {currentRole !== 'FACULTY' && (
                  <button
                    onClick={() => setSelectedFacultyId(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contract & Employment Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Employment</span>
                <div className="font-semibold text-white">{activeFaculty.employment_type || 'FULL_TIME'}</div>
                <div className="text-zinc-400 text-[11px]">Since {activeFaculty.joining_date || '2023'}</div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Contact / Cabin</span>
                <div className="font-semibold text-white truncate">{activeFaculty.contact_number || activeUser.phone || '—'}</div>
                <div className="text-zinc-400 text-[11px] truncate">{activeFaculty.cabin_number || 'General Faculty Suite'}</div>
              </div>
            </div>

            {/* Department Assignments (M:N) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Joint Appointments ({activeAssignments.length})</span>
                </span>
                {currentRole === 'HEAD' && (
                  <button
                    onClick={() => handleOpenAssign(activeFaculty.id)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Assign Department
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {activeAssignments.map((a) => {
                  const dept = departments.find((d) => d.id === a.department_id);
                  if (!dept) return null;

                  return (
                    <div
                      key={a.id}
                      className="p-2 rounded-lg border text-xs flex items-center justify-between"
                      style={{
                        backgroundColor: `${dept.color_accent}10`,
                        borderColor: `${dept.color_accent}30`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono" style={{ color: dept.color_accent }}>
                          {dept.code}
                        </span>
                        <span className="text-zinc-300">{dept.name}</span>
                        {a.is_primary_department && (
                          <span className="text-[10px] px-1 rounded bg-white/10 text-white font-mono">
                            Primary
                          </span>
                        )}
                      </div>

                      {currentRole === 'HEAD' && activeAssignments.length > 1 && (
                        <button
                          onClick={() => onRemoveAssignment(a.id)}
                          className="text-zinc-500 hover:text-rose-400"
                          title="Remove assignment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workload Utilization & Assigned Subjects */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#06B6D4]" />
                  <span>Assigned Curriculum Courses ({activeWorkloads.length})</span>
                </span>

                {(currentRole === 'HEAD' || currentRole === 'ADMIN') && (
                  <button
                    onClick={() => openAssignSubjectModal(activeFaculty.id)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    + Assign Course
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/[0.04] space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Total Weekly Load</span>
                  <span className="font-bold text-white">
                    {activeTotalHours} / {activeFaculty.max_weekly_hours} hrs
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      activeTotalHours > activeFaculty.max_weekly_hours
                        ? 'bg-rose-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (activeTotalHours / activeFaculty.max_weekly_hours) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Course list */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeWorkloads.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-2">No subjects assigned yet.</div>
                ) : (
                  activeWorkloads.map((w) => {
                    const sub = subjects.find((s) => s.id === w.subject_id);
                    const dept = departments.find((d) => d.id === w.department_id);

                    return (
                      <div
                        key={w.id}
                        className="p-2 rounded-lg bg-zinc-800/60 border border-white/[0.04] text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-indigo-400 font-bold mr-1.5">
                            {sub?.code || 'SUB'}
                          </span>
                          <span className="text-zinc-200">{sub?.name || 'Curriculum Course'}</span>
                          <span className="text-[10px] text-zinc-500 block">
                            Dept: {dept?.code} • Component: {w.component}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{w.hours_per_week}h/wk</span>
                          {(currentRole === 'HEAD' || currentRole === 'ADMIN') && onRemoveWorkloadAllocation && (
                            <button
                              onClick={() => onRemoveWorkloadAllocation(w.id)}
                              className="text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Availability Preferences */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-purple-400" />
                  <span>Availability Constraints ({activeAvailabilities.length})</span>
                </span>
                <button
                  onClick={() => setIsAvailabilityModalOpen(true)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                >
                  + Add Block
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                {activeAvailabilities.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-2">Open during all standard institutional hours.</div>
                ) : (
                  activeAvailabilities.map((a) => (
                    <div
                      key={a.id}
                      className="p-2 rounded-lg bg-zinc-800/40 border border-white/[0.04] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              a.status === 'UNAVAILABLE'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {a.status}
                          </span>
                          <span className="font-medium text-zinc-200">
                            {a.day_of_week} ({a.start_time} - {a.end_time})
                          </span>
                        </div>
                        {a.reason && <span className="text-[10px] text-zinc-400 block truncate">{a.reason}</span>}
                      </div>

                      {onRemoveAvailability && (
                        <button
                          onClick={() => onRemoveAvailability(a.id)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Faculty with Multi-Department Assignment */}
      {isNewFacultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-indigo-400" />
                  <span>Onboard Academic Faculty (M:N)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Establish cross-department appointment records</p>
              </div>
              <button onClick={() => setIsNewFacultyModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. Rajesh Kulkarni"
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh@apex-tech.edu"
                    value={newFacultyEmail}
                    onChange={(e) => setNewFacultyEmail(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={newFacultyEmpId}
                    onChange={(e) => setNewFacultyEmpId(e.target.value.toUpperCase())}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Designation</label>
                  <select
                    value={newFacultyDesignation}
                    onChange={(e) => setNewFacultyDesignation(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Professor">Adjunct Professor</option>
                    <option value="Visiting Professor">Visiting Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Employment Type</label>
                  <select
                    value={newFacultyEmpType}
                    onChange={(e) => setNewFacultyEmpType(e.target.value as EmploymentType)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="ADJUNCT">Adjunct</option>
                    <option value="VISITING">Visiting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Academic Qualifications</label>
                  <input
                    type="text"
                    placeholder="M.Tech, Ph.D (Distributed Systems)"
                    value={newFacultyQualifications}
                    onChange={(e) => setNewFacultyQualifications(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newFacultyContact}
                    onChange={(e) => setNewFacultyContact(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Max Weekly Contract Hours</label>
                  <input
                    type="number"
                    min={6}
                    max={36}
                    value={newFacultyMaxHours}
                    onChange={(e) => setNewFacultyMaxHours(Number(e.target.value))}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={newFacultyJoiningDate}
                    onChange={(e) => setNewFacultyJoiningDate(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department Pre-Assignments (M:N) */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">
                  Assigned Academic Departments (Select multiple for cross-department appointments):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map((dept) => {
                    const isSelected = newFacultySelectedDepts.includes(dept.id);
                    return (
                      <button
                        type="button"
                        key={dept.id}
                        onClick={() => toggleDeptForNewFaculty(dept.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-zinc-800/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-bold font-mono mr-1.5">{dept.code}</span>
                          <span className="text-[11px] truncate text-zinc-400">{dept.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsNewFacultyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Faculty Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Faculty Profile */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-400" />
                <span>Edit Faculty Profile</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditFaculty} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Designation</label>
                  <select
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Professor">Adjunct Professor</option>
                    <option value="Visiting Professor">Visiting Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Employment</label>
                  <select
                    value={editEmpType}
                    onChange={(e) => setEditEmpType(e.target.value as EmploymentType)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="ADJUNCT">Adjunct</option>
                    <option value="VISITING">Visiting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Max Weekly Hours</label>
                  <input
                    type="number"
                    min={6}
                    max={36}
                    value={editMaxHours}
                    onChange={(e) => setEditMaxHours(Number(e.target.value))}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Cabin Location</label>
                  <input
                    type="text"
                    value={editCabin}
                    onChange={(e) => setEditCabin(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="activeCheck" className="text-zinc-300">
                  Active Instructional Status
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Joint Department (M:N) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-indigo-400" />
                <span>Assign Joint Department Appointment</span>
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">Select Department</label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={isPrimarySelected}
                  onChange={(e) => setIsPrimarySelected(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="primaryCheck" className="text-zinc-300">
                  Set as Primary Home Department
                </label>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                Assigning this department will insert a row in <code className="font-mono text-white">faculty_department_assignments</code>, automatically enabling cross-department timetable locking for this professor.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Subject */}
      {isAssignSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span>Assign Subject Allocation</span>
              </h3>
              <button onClick={() => setIsAssignSubjectModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmSubjectAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Subject / Curriculum Course</label>
                <select
                  value={allocSubjectId}
                  onChange={(e) => setAllocSubjectId(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {subjects.map((sub) => {
                    const dept = departments.find((d) => d.id === sub.department_id);
                    return (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name} ({dept?.code})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Component</label>
                  <select
                    value={allocComponent}
                    onChange={(e) => setAllocComponent(e.target.value as WorkloadComponent)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="LECTURE">Theory Lecture</option>
                    <option value="LAB_PRACTICAL">Lab Practical</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="PROJECT_MENTORSHIP">Project Mentorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Weekly Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={allocHours}
                    onChange={(e) => setAllocHours(Number(e.target.value))}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAssignSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Allocate Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Availability Block */}
      {isAvailabilityModalOpen && activeFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-purple-400" />
                <span>Set Availability Preference Block</span>
              </h3>
              <button onClick={() => setIsAvailabilityModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConfirmAvailability} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Day</label>
                  <select
                    value={availDay}
                    onChange={(e) => setAvailDay(e.target.value as AcademicDay)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Start</label>
                  <input
                    type="time"
                    value={availStart}
                    onChange={(e) => setAvailStart(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">End</label>
                  <input
                    type="time"
                    value={availEnd}
                    onChange={(e) => setAvailEnd(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Constraint Status</label>
                <select
                  value={availStatus}
                  onChange={(e) => setAvailStatus(e.target.value as AvailabilityStatus)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="UNAVAILABLE">Hard Unavailable Block</option>
                  <option value="PREFER_NOT">Prefer Not to Teach (Soft Constraint)</option>
                  <option value="AVAILABLE">Open Slot</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Reason / Academic Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Department Research Colloquium, Industry Consulting"
                  value={availReason}
                  onChange={(e) => setAvailReason(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Save Preference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
