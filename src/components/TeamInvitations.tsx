import React, { useState } from 'react';
import {
  Users2,
  UserPlus,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Send,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  Copy
} from 'lucide-react';
import {
  User,
  Department,
  FacultyProfile,
  FacultyDepartmentAssignment,
  InstituteInvitation,
  UserRole,
  InvitationStatus
} from '../types/database';
import { invitationSchema, acceptInvitationSchema } from '../lib/validations';

interface TeamInvitationsProps {
  users: User[];
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  assignments: FacultyDepartmentAssignment[];
  invitations: InstituteInvitation[];
  onSendInvitation: (invitation: {
    email: string;
    role: 'ADMIN' | 'FACULTY';
    departmentIds: string[];
    employeeId?: string;
    designation?: string;
  }) => void;
  onRevokeInvitation: (id: string) => void;
  onResendInvitation: (id: string) => void;
  onSimulateAcceptInvitation: (token: string, fullName: string, employeeId?: string) => void;
  currentRole: UserRole;
}

export const TeamInvitations: React.FC<TeamInvitationsProps> = ({
  users,
  departments,
  facultyProfiles,
  assignments,
  invitations,
  onSendInvitation,
  onRevokeInvitation,
  onResendInvitation,
  onSimulateAcceptInvitation,
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [simulationModalInv, setSimulationModalInv] = useState<InstituteInvitation | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'FACULTY'>('FACULTY');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [inviteEmployeeId, setInviteEmployeeId] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('Assistant Professor');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Accept simulation state
  const [simFullName, setSimFullName] = useState('');
  const [simPassword, setSimPassword] = useState('Password123!');
  const [simError, setSimError] = useState<string | null>(null);

  const toggleDeptSelection = (deptId: string) => {
    if (selectedDeptIds.includes(deptId)) {
      setSelectedDeptIds(selectedDeptIds.filter((id) => id !== deptId));
    } else {
      setSelectedDeptIds([...selectedDeptIds, deptId]);
    }
  };

  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Zod validation
    const validation = invitationSchema.safeParse({
      email: inviteEmail.trim(),
      role: inviteRole,
      department_ids: selectedDeptIds,
      employee_id: inviteEmployeeId.trim() || undefined,
      designation: inviteDesignation.trim() || undefined,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    // Check if user already exists
    if (users.some((u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setFormError(`User with email "${inviteEmail}" is already an active member of this institute.`);
      return;
    }

    // Check if pending invite already exists
    if (
      invitations.some(
        (i) => i.email.toLowerCase() === inviteEmail.trim().toLowerCase() && i.status === 'PENDING'
      )
    ) {
      setFormError(`A pending invitation has already been dispatched to "${inviteEmail}".`);
      return;
    }

    onSendInvitation({
      email: inviteEmail.trim(),
      role: inviteRole,
      departmentIds: selectedDeptIds,
      employeeId: inviteEmployeeId.trim() || undefined,
      designation: inviteDesignation,
    });

    setFormSuccess(`Invitation dispatched to ${inviteEmail}!`);
    setTimeout(() => {
      setFormSuccess(null);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setSelectedDeptIds([]);
      setInviteEmployeeId('');
      setActiveTab('invitations');
    }, 1200);
  };

  const handleSimulateAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationModalInv) return;
    setSimError(null);

    const validation = acceptInvitationSchema.safeParse({
      token: simulationModalInv.token,
      full_name: simFullName.trim(),
      password: simPassword,
    });

    if (!validation.success) {
      setSimError(validation.error.issues[0]?.message || 'Validation failed');
      return;
    }

    onSimulateAcceptInvitation(
      simulationModalInv.token,
      simFullName.trim(),
      `FAC-${Date.now().toString().slice(-4)}`
    );

    setSimulationModalInv(null);
    setSimFullName('');
    setActiveTab('members');
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filtered members
  const filteredUsers = users.filter((u) => {
    const matches =
      !searchQuery ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matches;
  });

  const pendingCount = invitations.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Team Members & Invitation System
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {users.length} Members • {pendingCount} Pending
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Invite department managers and faculty members with automatic multi-department mapping.
          </p>
        </div>

        {currentRole === 'HEAD' && (
          <button
            onClick={() => {
              setFormError(null);
              setIsInviteModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'members'
                ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users2 className="h-4 w-4 text-indigo-400" />
            <span>Active Team Members ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'invitations'
                ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4 text-[#06B6D4]" />
            <span>Invitations Management ({invitations.length})</span>
            {pendingCount > 0 && (
              <span className="h-5 px-1.5 rounded-full bg-indigo-500/30 text-indigo-300 font-mono text-[10px] flex items-center justify-center border border-indigo-500/40">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search member or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-zinc-800/80 border border-white/[0.08] py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab: Active Team Members */}
      {activeTab === 'members' && (
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-zinc-900/90 text-zinc-400 font-mono">
                <th className="p-3">Team Member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Departments (M:N)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {filteredUsers.map((u) => {
                const fac = facultyProfiles.find((f) => f.user_id === u.id);
                const userDepts = assignments
                  .filter((a) => a.faculty_id === fac?.id)
                  .map((a) => departments.find((d) => d.id === a.department_id))
                  .filter(Boolean);

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.full_name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="font-semibold text-white">{u.full_name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === 'HEAD'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {userDepts.length === 0 ? (
                        <span className="text-zinc-500 text-[11px] italic">Institutional Scope</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userDepts.map((d) => (
                            <span
                              key={d!.id}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border"
                              style={{
                                backgroundColor: `${d!.color_accent}20`,
                                color: d!.color_accent,
                                borderColor: `${d!.color_accent}40`,
                              }}
                            >
                              {d!.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-zinc-400 font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Invitations Management */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-zinc-900/90 text-zinc-400 font-mono">
                  <th className="p-3">Invited Recipient</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Pre-Assigned Departments</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {invitations.map((inv) => {
                  const preDepts = inv.department_ids
                    .map((id) => departments.find((d) => d.id === id))
                    .filter(Boolean);

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-semibold text-white">{inv.email}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Token: {inv.token.slice(0, 16)}...</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                          {inv.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {preDepts.map((d) => (
                            <span
                              key={d!.id}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border"
                              style={{
                                backgroundColor: `${d!.color_accent}20`,
                                color: d!.color_accent,
                                borderColor: `${d!.color_accent}40`,
                              }}
                            >
                              {d!.code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            inv.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : inv.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-zinc-400 font-mono">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => copyInviteLink(inv.token)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Copy invitation link"
                              >
                                {copiedToken === inv.token ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setSimulationModalInv(inv);
                                  setSimFullName(inv.email.split('@')[0].replace('.', ' ').toUpperCase());
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold"
                                title="Simulate invited user accepting invitation"
                              >
                                Simulate Accept
                              </button>

                              <button
                                onClick={() => onResendInvitation(inv.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Resend invitation"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>

                              {currentRole === 'HEAD' && (
                                <button
                                  onClick={() => onRevokeInvitation(inv.id)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                                  title="Revoke invitation"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}
                          {inv.status === 'ACCEPTED' && (
                            <span className="text-[10px] text-emerald-400 font-mono">Linked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invite User */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-indigo-400" />
                  <span>Invite Institutional Team Member</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Invitation link will link user to {departments.length} department resource pools</p>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-zinc-500 hover:text-white">
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
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Recipient Official Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="professor@apex-tech.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2 pl-9 pr-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'FACULTY')}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                  >
                    <option value="FACULTY">FACULTY (Professor / Instructor)</option>
                    <option value="ADMIN">ADMIN (Department Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Designation</label>
                  <select
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Professor">Adjunct Professor</option>
                  </select>
                </div>
              </div>

              {/* Department Pre-Assignments */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">
                  Pre-Assigned Departments (Select multiple for cross-department faculty):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <button
                        type="button"
                        key={dept.id}
                        onClick={() => toggleDeptSelection(dept.id)}
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

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                When the invitee accepts, Nexorg creates their verified <code className="font-mono text-white">faculty_profiles</code> and links them to the selected departments with automatic clash locks.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Simulate User Accepting Invitation */}
      {simulationModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#06B6D4]" />
                  <span>Simulate Invitee Onboarding</span>
                </h3>
                <span className="text-xs text-zinc-400">Accepting invite for {simulationModalInv.email}</span>
              </div>
              <button onClick={() => setSimulationModalInv(null)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {simError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {simError}
              </div>
            )}

            <form onSubmit={handleSimulateAcceptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={simFullName}
                  onChange={(e) => setSimFullName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={simPassword}
                  onChange={(e) => setSimPassword(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/[0.06] text-[11px] text-zinc-400 space-y-1">
                <div>• Invitee Role: <span className="font-mono text-white">{simulationModalInv.role}</span></div>
                <div>• Departments: <span className="font-mono text-indigo-300">{simulationModalInv.department_ids.length} selected</span></div>
                <div>• Verification: PostgreSQL <code className="font-mono text-zinc-300">accept_institute_invitation()</code></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSimulationModalInv(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
