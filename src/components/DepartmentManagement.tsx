import React, { useState } from 'react';
import {
  Network,
  Plus,
  Building,
  Users2,
  BookOpen,
  Mail,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  Department,
  FacultyDepartmentAssignment,
  Subject,
  User,
  UserRole
} from '../types/database';
import { departmentSchema } from '../lib/validations';

interface DepartmentManagementProps {
  departments: Department[];
  assignments: FacultyDepartmentAssignment[];
  subjects: Subject[];
  users: User[];
  onAddDepartment: (dept: {
    code: string;
    name: string;
    contactEmail: string;
    buildingBlock: string;
    colorAccent: string;
    headOfDepartmentId?: string;
  }) => void;
  onUpdateDepartment: (id: string, updated: Partial<Department>) => void;
  onDeleteDepartment: (id: string) => void;
  currentRole: UserRole;
  userAssignedDeptId?: string;
  isLoading?: boolean;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
  departments,
  assignments,
  subjects,
  users,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  currentRole,
  userAssignedDeptId,
  isLoading = false,
}) => {
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [buildingBlock, setBuildingBlock] = useState('');
  const [colorAccent, setColorAccent] = useState('#4F46E5');
  const [headId, setHeadId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filtered departments
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.building_block?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const openCreateModal = () => {
    setCode('');
    setName('');
    setContactEmail('');
    setBuildingBlock('');
    setColorAccent('#4F46E5');
    setHeadId('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setContactEmail(dept.contact_email || '');
    setBuildingBlock(dept.building_block || '');
    setColorAccent(dept.color_accent || '#4F46E5');
    setHeadId(dept.head_of_department_id || '');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Zod validation
    const validation = departmentSchema.safeParse({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      contact_email: contactEmail.trim(),
      building_block: buildingBlock.trim(),
      color_accent: colorAccent,
      head_of_department_id: headId || null,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    // Uniqueness Checks
    const codeExists = departments.some(
      (d) => d.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (codeExists) {
      setFormError(`Department code "${code.toUpperCase()}" already exists in this institute.`);
      return;
    }

    const nameExists = departments.some(
      (d) => d.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (nameExists) {
      setFormError(`Department name "${name}" already exists in this institute.`);
      return;
    }

    onAddDepartment({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      buildingBlock: buildingBlock.trim(),
      colorAccent,
      headOfDepartmentId: headId || undefined,
    });

    setFormSuccess(`Department "${code.toUpperCase()}" created successfully!`);
    setTimeout(() => {
      setFormSuccess(null);
      setIsCreateModalOpen(false);
    }, 1200);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setFormError(null);

    // Zod validation
    const validation = departmentSchema.safeParse({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      contact_email: contactEmail.trim(),
      building_block: buildingBlock.trim(),
      color_accent: colorAccent,
      head_of_department_id: headId || null,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    // Uniqueness Check excluding self
    const codeExists = departments.some(
      (d) => d.id !== editingDept.id && d.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (codeExists) {
      setFormError(`Department code "${code.toUpperCase()}" is already taken.`);
      return;
    }

    const nameExists = departments.some(
      (d) => d.id !== editingDept.id && d.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (nameExists) {
      setFormError(`Department name "${name}" is already taken.`);
      return;
    }

    onUpdateDepartment(editingDept.id, {
      code: code.toUpperCase().trim(),
      name: name.trim(),
      contact_email: contactEmail.trim(),
      building_block: buildingBlock.trim(),
      color_accent: colorAccent,
      head_of_department_id: headId || undefined,
    });

    setFormSuccess('Department updated successfully!');
    setTimeout(() => {
      setFormSuccess(null);
      setEditingDept(null);
    }, 1000);
  };

  const confirmDelete = () => {
    if (!deletingDept) return;
    onDeleteDepartment(deletingDept.id);
    setDeletingDept(null);
  };

  const canManageDept = (dept: Department) => {
    if (currentRole === 'HEAD') return true;
    if (currentRole === 'ADMIN' && userAssignedDeptId === dept.id) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Department Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {departments.length} Active Divisions
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Define institutional academic departments, assign leadership, and configure cross-department resource pools.
          </p>
        </div>

        {currentRole === 'HEAD' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {/* Loading State Banner */}
      {isLoading && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs animate-pulse">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <span>Synchronizing academic departments with database in real-time...</span>
        </div>
      )}

      {/* Control Bar: Search & View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by code, title or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-zinc-800/80 border border-white/[0.08] py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
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

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
            <Network className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Departments Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? `No departments match your filter "${searchQuery}". Try a different keyword.`
              : 'Start by creating your institution’s first academic department.'}
          </p>
          {currentRole === 'HEAD' && !searchQuery && (
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Department</span>
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredDepartments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepartments.map((dept) => {
            const deptFaculty = assignments.filter((a) => a.department_id === dept.id);
            const primaryFaculty = deptFaculty.filter((a) => a.is_primary_department);
            const jointFaculty = deptFaculty.filter((a) => !a.is_primary_department);
            const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
            const hodUser = users.find((u) => u.id === dept.head_of_department_id);
            const isManager = canManageDept(dept);

            return (
              <div
                key={dept.id}
                className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-5 space-y-4 hover:border-white/[0.14] transition-all relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-extrabold font-mono text-sm border"
                      style={{
                        backgroundColor: `${dept.color_accent}20`,
                        borderColor: `${dept.color_accent}40`,
                        color: dept.color_accent,
                      }}
                    >
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Building className="h-3 w-3 text-zinc-500" />
                        <span>{dept.building_block || 'Main Campus Block'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isManager && (
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {currentRole === 'HEAD' && (
                      <button
                        onClick={() => setDeletingDept(dept)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Delete Department"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* HoD Indicator */}
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-800/40 border border-white/[0.04]">
                  <span className="text-zinc-400">Head of Department (HoD):</span>
                  <span className="font-semibold text-zinc-200">
                    {hodUser ? hodUser.full_name : 'Pending Assignment'}
                  </span>
                </div>

                {/* Resource Stats Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center text-xs">
                  <div className="p-2 rounded-lg bg-zinc-800/40">
                    <span className="text-[10px] text-zinc-400 block">Total Faculty</span>
                    <span className="text-sm font-bold text-white font-mono">{deptFaculty.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/40">
                    <span className="text-[10px] text-zinc-400 block">Joint / Cross-Dept</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">{jointFaculty.length}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/40">
                    <span className="text-[10px] text-zinc-400 block">Courses</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{deptSubjects.length}</span>
                  </div>
                </div>

                {/* Contact and ID */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="font-mono text-[11px] truncate max-w-[200px]">
                      {dept.contact_email || `hod.${dept.code.toLowerCase()}@apex-tech.edu`}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {dept.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredDepartments.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-zinc-900/90 text-zinc-400 font-mono">
                <th className="p-3">Code</th>
                <th className="p-3">Department Name</th>
                <th className="p-3">Location Block</th>
                <th className="p-3">HoD</th>
                <th className="p-3 text-center">Faculty</th>
                <th className="p-3 text-center">Courses</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {filteredDepartments.map((dept) => {
                const deptFaculty = assignments.filter((a) => a.department_id === dept.id);
                const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
                const hodUser = users.find((u) => u.id === dept.head_of_department_id);
                const isManager = canManageDept(dept);

                return (
                  <tr key={dept.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono font-bold" style={{ color: dept.color_accent }}>
                      {dept.code}
                    </td>
                    <td className="p-3 font-medium text-white">{dept.name}</td>
                    <td className="p-3 text-zinc-400">{dept.building_block || 'Main Block'}</td>
                    <td className="p-3 text-zinc-300">{hodUser ? hodUser.full_name : '—'}</td>
                    <td className="p-3 text-center font-mono font-bold text-white">{deptFaculty.length}</td>
                    <td className="p-3 text-center font-mono font-bold text-cyan-400">{deptSubjects.length}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isManager && (
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-1 rounded text-zinc-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {currentRole === 'HEAD' && (
                          <button
                            onClick={() => setDeletingDept(dept)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Department */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-indigo-400" />
                <span>Create Academic Department</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MECH"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Mechanical Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Head of Department (HoD)</label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Unassigned (Select later)</option>
                  {users
                    .filter((u) => u.role === 'ADMIN' || u.role === 'HEAD')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="hod.mech@apex-tech.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Building Block / Floor</label>
                <input
                  type="text"
                  placeholder="e.g. S. Ramanujan Complex - Level 2"
                  value={buildingBlock}
                  onChange={(e) => setBuildingBlock(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Accent Color Tag</label>
                <div className="flex items-center gap-2">
                  {['#4F46E5', '#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorAccent(c)}
                      className={`h-7 w-7 rounded-lg border-2 transition-all ${
                        colorAccent === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Department */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-indigo-400" />
                <span>Edit Department: {editingDept.code}</span>
              </h3>
              <button onClick={() => setEditingDept(null)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Head of Department (HoD)</label>
                <select
                  value={headId}
                  onChange={(e) => setHeadId(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role} • {u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Building Block / Floor</label>
                <input
                  type="text"
                  value={buildingBlock}
                  onChange={(e) => setBuildingBlock(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Accent Color Tag</label>
                <div className="flex items-center gap-2">
                  {['#4F46E5', '#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorAccent(c)}
                      className={`h-7 w-7 rounded-lg border-2 transition-all ${
                        colorAccent === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
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

      {/* Modal: Delete Confirmation with Safety Notice */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Department</h3>
                <span className="text-xs text-rose-300">{deletingDept.code} - {deletingDept.name}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete this department? All curriculum subjects and departmental room mappings associated with <strong className="text-white font-mono">{deletingDept.code}</strong> will be disassociated.
            </p>

            <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/[0.06] text-[11px] text-zinc-400 space-y-1">
              <div>• {assignments.filter((a) => a.department_id === deletingDept.id).length} faculty members have joint assignments here.</div>
              <div>• {subjects.filter((s) => s.department_id === deletingDept.id).length} curriculum courses belong to this division.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
