import React from 'react';
import {
  Network,
  Users2,
  BookOpen,
  DoorOpen,
  Cpu,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  Department,
  FacultyProfile,
  FacultyDepartmentAssignment,
  Subject,
  Room,
  Lab,
  WorkloadAllocation,
  User,
  UserRole
} from '../types/database';
import { NavTab } from './Sidebar';

interface OverviewDashboardProps {
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  assignments: FacultyDepartmentAssignment[];
  subjects: Subject[];
  rooms: Room[];
  labs: Lab[];
  workloads: WorkloadAllocation[];
  onNavigate: (tab: NavTab) => void;
  currentRole: UserRole;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  departments,
  facultyProfiles,
  users,
  assignments,
  subjects,
  rooms,
  labs,
  workloads,
  onNavigate,
  currentRole,
}) => {
  // Compute multi-department faculty (faculty mapped to > 1 department)
  const facultyDeptCounts = facultyProfiles.map((faculty) => {
    const user = users.find((u) => u.id === faculty.user_id);
    const assignedDepts = assignments
      .filter((a) => a.faculty_id === faculty.id)
      .map((a) => {
        const dept = departments.find((d) => d.id === a.department_id);
        return {
          code: dept?.code || 'UNKNOWN',
          name: dept?.name || '',
          color: dept?.color_accent || '#4F46E5',
          isPrimary: a.is_primary_department,
        };
      });

    const facultyWorkloadHours = workloads
      .filter((w) => w.faculty_id === faculty.id)
      .reduce((sum, item) => sum + item.hours_per_week, 0);

    return {
      faculty,
      user,
      assignedDepts,
      totalHours: facultyWorkloadHours,
      isMultiDept: assignedDepts.length > 1,
    };
  });

  const totalTeachingHours = workloads.reduce((sum, w) => sum + w.hours_per_week, 0);
  const multiDeptFacultyCount = facultyDeptCounts.filter((f) => f.isMultiDept).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-purple-950/20 p-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Nexorg 2.1 Academic Resource Planning Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Institutional Resource Operations
            </h1>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
              Unified cross-department faculty orchestration, room/lab allocation, and conflict-free timetable readiness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('timetable')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Open Timetable Engine</span>
            </button>
            <button
              onClick={() => onNavigate('faculty')}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 border border-white/[0.08] transition-all"
            >
              <Users2 className="h-4 w-4" />
              <span>Manage Faculty M:N</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Multi-Dept Faculty</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{multiDeptFacultyCount}</span>
            <span className="text-xs text-zinc-500 font-normal">of {facultyProfiles.length} professors</span>
          </div>
          <p className="mt-2 text-[11px] text-indigo-300/80 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Cross-department lock active
          </p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Departments</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <Network className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{departments.length}</span>
            <span className="text-xs text-zinc-400 truncate max-w-[150px]">
              {departments.length > 0 ? departments.map((d) => d.code).join(', ') : 'None configured'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 font-medium">
            Unified institute resource pool
          </p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Weekly Teaching Hours</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-[#06B6D4]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalTeachingHours} hrs</span>
            <span className="text-xs text-emerald-400 font-medium font-mono">Balanced</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 font-medium">
            0% Faculty overload detected
          </p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Rooms & Specialized Labs</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <DoorOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{rooms.length + labs.length}</span>
            <span className="text-xs text-zinc-500">({rooms.length} Halls, {labs.length} Labs)</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Shared cross-department pool
          </p>
        </div>
      </div>

      {/* Primary Showcase Card: The Rahul Multi-Department Case */}
      <div className="rounded-2xl border border-indigo-500/30 bg-zinc-900/70 p-6 relative overflow-hidden backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#4F46E5] text-white uppercase tracking-wider">
                Core Architectural Showcase
              </span>
              <span className="text-xs text-indigo-400 font-mono">Prof. Rahul Sharma Multi-Department Mapping</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              One Faculty Teaching Across CSE, AIML & IT Simultaneously
            </h3>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              In Nexorg 2.1, faculty assignments use a normalized many-to-many schema (<code className="text-indigo-300 font-mono text-[11px]">faculty_department_assignments</code>). When Rahul is assigned a lecture in CSE from 10:00 to 11:00 AM, the conflict engine automatically locks AIML and IT for that identical time slot across the campus.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-xs">
                <span className="h-2 w-2 rounded-full bg-[#4F46E5]" />
                <span className="font-semibold text-zinc-200">CSE:</span>
                <span className="text-zinc-400">6 hrs/week (Primary)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-xs">
                <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                <span className="font-semibold text-zinc-200">AIML:</span>
                <span className="text-zinc-400">5 hrs/week (Cross-dept)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-xs">
                <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
                <span className="font-semibold text-zinc-200">IT:</span>
                <span className="text-zinc-400">4 hrs/week (Cross-dept)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs font-mono text-emerald-300">
                <span>Total: 15 / 18 hrs max (Safe)</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <button
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Timetable Master Schedule</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigate('faculty')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-white/[0.08] transition-all flex items-center justify-center gap-2"
            >
              <span>View Faculty Load</span>
            </button>
            <button
              onClick={() => onNavigate('leaves')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-xs font-medium text-purple-200 border border-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Leave & Substitution System</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Faculty Directory Highlights & Department Resource Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Department Faculty Matrix */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Multi-Department Faculty Matrix</h3>
              <p className="text-xs text-zinc-400">Cross-department teaching allocations & total weekly load</p>
            </div>
            <button
              onClick={() => onNavigate('faculty')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {facultyDeptCounts.map(({ faculty, user, assignedDepts, totalHours }) => (
              <div
                key={faculty.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-white/[0.04] hover:border-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.full_name}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{user?.full_name}</div>
                    <div className="text-[11px] text-zinc-400">{faculty.designation} • {faculty.employee_id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {assignedDepts.map((dept, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border"
                        style={{
                          backgroundColor: `${dept.color}20`,
                          color: dept.color,
                          borderColor: `${dept.color}40`,
                        }}
                      >
                        {dept.code} {dept.isPrimary && '★'}
                      </span>
                    ))}
                  </div>

                  <div className="text-right pl-2 border-l border-zinc-700/50">
                    <span className="text-xs font-mono font-semibold text-zinc-200">{totalHours}</span>
                    <span className="text-[10px] text-zinc-500">/{faculty.max_weekly_hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Department Resource Overview</h3>
              <p className="text-xs text-zinc-400">Curriculum subjects and dedicated room allocations</p>
            </div>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Departments</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.length === 0 ? (
              <div className="col-span-full p-6 text-center rounded-lg bg-zinc-800/20 border border-white/[0.04]">
                <p className="text-xs text-zinc-400">No departments configured yet.</p>
                <button
                  onClick={() => onNavigate('departments')}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add First Department
                </button>
              </div>
            ) : (
              departments.map((dept) => {
                const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
                const deptFaculty = assignments.filter((a) => a.department_id === dept.id);

                return (
                  <div
                    key={dept.id}
                    className="p-3.5 rounded-lg bg-zinc-800/40 border border-white/[0.04] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                        style={{
                          backgroundColor: `${dept.color_accent}25`,
                          color: dept.color_accent,
                        }}
                      >
                        {dept.code}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 truncate">{dept.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[0.04]">
                      <span>{deptFaculty.length} Faculty</span>
                      <span>{deptSubjects.length} Subjects</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
