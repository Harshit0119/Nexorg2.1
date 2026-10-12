import React from 'react';
import {
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  BarChart3,
  Network
} from 'lucide-react';
import {
  FacultyProfile,
  Department,
  WorkloadAllocation,
  User,
  Subject
} from '../types/database';

interface WorkloadBalancingProps {
  facultyProfiles: FacultyProfile[];
  users: User[];
  departments: Department[];
  workloads: WorkloadAllocation[];
  subjects: Subject[];
}

export const WorkloadBalancing: React.FC<WorkloadBalancingProps> = ({
  facultyProfiles,
  users,
  departments,
  workloads,
  subjects,
}) => {
  const facultyWorkloadStats = facultyProfiles.map((faculty) => {
    const user = users.find((u) => u.id === faculty.user_id);
    const facultyWorkloads = workloads.filter((w) => w.faculty_id === faculty.id);

    // Group hours by department
    const hoursByDept: Record<string, number> = {};
    for (const w of facultyWorkloads) {
      hoursByDept[w.department_id] = (hoursByDept[w.department_id] || 0) + w.hours_per_week;
    }

    const totalHours = facultyWorkloads.reduce((sum, w) => sum + w.hours_per_week, 0);
    const percentage = Math.round((totalHours / faculty.max_weekly_hours) * 100);

    let status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD' = 'BALANCED';
    if (totalHours < faculty.min_weekly_hours) status = 'UNDERLOAD';
    if (totalHours > faculty.max_weekly_hours) status = 'OVERLOAD';

    return {
      faculty,
      user,
      totalHours,
      percentage,
      status,
      hoursByDept,
      allocations: facultyWorkloads,
    };
  });

  const totalCampusHours = workloads.reduce((sum, w) => sum + w.hours_per_week, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Faculty Workload Balancing & Distribution
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Multi-department load tracking ensuring professors are not overloaded across joint departmental appointments.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs font-mono text-zinc-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Campus Teaching Load: {totalCampusHours} hrs/wk</span>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
            <span>Optimal Capacity</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {facultyWorkloadStats.filter((f) => f.status === 'BALANCED').length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Faculty within target weekly ranges</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
            <span>Under Capacity</span>
            <Scale className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {facultyWorkloadStats.filter((f) => f.status === 'UNDERLOAD').length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Available for additional lecture sessions</p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold mb-1">
            <span>Contract Overload Risk</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {facultyWorkloadStats.filter((f) => f.status === 'OVERLOAD').length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Exceeding contractual maximums</p>
        </div>
      </div>

      {/* Detailed Faculty Workload Breakdown */}
      <div className="space-y-4">
        {facultyWorkloadStats.map(({ faculty, user, totalHours, percentage, status, hoursByDept, allocations }) => {
          const isRahul = faculty.id === 'fac-rahul';

          return (
            <div
              key={faculty.id}
              className={`rounded-xl border p-5 bg-zinc-900/70 transition-all ${
                isRahul
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.full_name}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{user?.full_name}</h3>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {faculty.employee_id}
                      </span>
                      {isRahul && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4F46E5] text-white">
                          Tri-Department Split
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400">{faculty.designation}</div>
                  </div>
                </div>

                {/* Progress Meter & Status */}
                <div className="flex items-center gap-4 lg:text-right">
                  <div className="w-48 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Load: {totalHours} / {faculty.max_weekly_hours}h</span>
                      <span className="font-bold text-white">{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'OVERLOAD'
                            ? 'bg-rose-500'
                            : status === 'UNDERLOAD'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                      status === 'BALANCED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : status === 'UNDERLOAD'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {/* Department Split Cards */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Cross-Department Allocation Breakdown</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(hoursByDept).map(([deptId, hours]) => {
                    const dept = departments.find((d) => d.id === deptId);
                    const deptAllocations = allocations.filter((a) => a.department_id === deptId);

                    return (
                      <div
                        key={deptId}
                        className="p-3 rounded-lg border text-xs space-y-1.5"
                        style={{
                          backgroundColor: `${dept?.color_accent}10`,
                          borderColor: `${dept?.color_accent}30`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono font-bold"
                            style={{ color: dept?.color_accent }}
                          >
                            {dept?.code} - {dept?.name}
                          </span>
                          <span className="font-mono font-bold text-white">{hours} hrs</span>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                          {deptAllocations.map((a) => {
                            const sub = subjects.find((s) => s.id === a.subject_id);
                            return (
                              <div
                                key={a.id}
                                className="flex items-center justify-between text-[11px] text-zinc-400"
                              >
                                <span className="truncate max-w-[140px]">{sub?.code}: {sub?.name}</span>
                                <span className="font-mono">{a.hours_per_week}h</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
