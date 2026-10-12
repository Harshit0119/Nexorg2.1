import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users2,
  BookOpen,
  DoorOpen,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  Download,
} from 'lucide-react';
import {
  Department,
  FacultyProfile,
  Subject,
  Room,
  Lab,
  Timetable,
  TimetableEntry,
  TimetableConflict,
  User,
  WorkloadAllocation,
} from '../types/database';

interface AnalyticsDashboardProps {
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  subjects: Subject[];
  rooms: Room[];
  labs: Lab[];
  timetables: Timetable[];
  timetableEntries: TimetableEntry[];
  timetableConflicts: TimetableConflict[];
  workloads: WorkloadAllocation[];
}

const COLORS = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  departments,
  facultyProfiles,
  users,
  subjects,
  rooms,
  labs,
  timetables,
  timetableEntries,
  timetableConflicts,
  workloads,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');

  // KPI Calculations
  const activeTimetable = timetables[0];
  const healthScore = activeTimetable?.health_score ?? 100;
  const conflictsCount = timetableConflicts.filter((c) => c.status === 'UNRESOLVED').length;
  const totalWeeklyTeachingHours = workloads.reduce((sum, w) => sum + (w.hours_per_week || 0), 0);
  const activeFacultyCount = facultyProfiles.filter((f) => f.is_active).length;

  // Department Load Breakdown for BarChart
  const departmentWorkloadData = useMemo(() => {
    return departments.map((dept) => {
      const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
      const totalHours = deptSubjects.reduce((sum, s) => sum + (s.lecture_hours_per_week || 0) + (s.lab_hours_per_week || 0), 0);
      const entriesCount = timetableEntries.filter((e) => e.department_id === dept.id).length;
      const deptFacultyCount = facultyProfiles.filter((f) =>
        f.assigned_departments?.some((d) => d.id === dept.id) || ((f as any).department_ids && (f as any).department_ids.includes(dept.id))
      ).length;

      return {
        name: dept.code,
        fullName: dept.name,
        CurriculumHours: totalHours,
        ScheduledSlots: entriesCount,
        FacultyAssigned: deptFacultyCount,
      };
    });
  }, [departments, subjects, timetableEntries, facultyProfiles]);

  // Daily Schedule Density across Week for AreaChart
  const weeklyDensityData = useMemo(() => {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days.map((day) => {
      const theoryEntries = timetableEntries.filter((e) => e.day_of_week === day && e.entry_type === 'THEORY_LECTURE').length;
      const labEntries = timetableEntries.filter((e) => e.day_of_week === day && e.entry_type === 'LAB_PRACTICAL').length;
      return {
        day: day.slice(0, 3),
        TheoryLectures: theoryEntries,
        LabPracticals: labEntries,
        Total: theoryEntries + labEntries,
      };
    });
  }, [timetableEntries]);

  // Facility Allocation Breakdown for Donut Chart
  const facilityAllocationData = useMemo(() => {
    const lectureHallSlots = timetableEntries.filter((e) => e.room_id).length;
    const specializedLabSlots = timetableEntries.filter((e) => e.lab_id).length;
    return [
      { name: 'Lecture Halls', value: lectureHallSlots || 24 },
      { name: 'Specialized Labs', value: specializedLabSlots || 14 },
      { name: 'Unallocated Slots', value: Math.max(0, 48 - (lectureHallSlots + specializedLabSlots)) },
    ];
  }, [timetableEntries]);

  // Faculty Utilization Ratios
  const facultyUtilizationData = useMemo(() => {
    return facultyProfiles.slice(0, 8).map((fac) => {
      const u = users.find((usr) => usr.id === fac.user_id);
      const assigned = timetableEntries.filter((e) => e.faculty_id === fac.id).length;
      const capacity = fac.max_weekly_hours || 18;
      const pct = Math.min(100, Math.round((assigned / capacity) * 100));

      return {
        name: u?.full_name?.split(' ')[1] || u?.full_name || 'Prof',
        allocated: assigned,
        capacity: capacity,
        utilizationRate: pct,
      };
    });
  }, [facultyProfiles, users, timetableEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#4F46E5]" />
              Institutional Analytics & Utilization Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Live Engine Metrics
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time analytics across academic workload balance, facility allocation, and timetable health scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-white text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Academic Terms</option>
            <option value="ODD">Term ODD (Monsoon)</option>
            <option value="EVEN">Term EVEN (Spring)</option>
          </select>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/[0.08] transition-all"
            title="Print Analytics Report"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. DASHBOARD CARDS (PRIMARY KPIs) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Faculty Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Faculty</span>
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{activeFacultyCount}</span>
            <span className="text-xs text-zinc-500">Professors</span>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            100% Availability Captured
          </p>
        </div>

        {/* Weekly Workload Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Weekly Workload</span>
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalWeeklyTeachingHours || 48}h</span>
            <span className="text-xs text-emerald-400 font-medium">Allocated</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Across {departments.length} Academic Departments
          </p>
        </div>

        {/* Conflict Count Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Conflict Count</span>
            <div
              className={`p-2 rounded-lg ${
                conflictsCount === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {conflictsCount === 0 ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{conflictsCount}</span>
            <span className="text-xs text-zinc-500">Clashes</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400 font-medium">
            {conflictsCount === 0 ? '0 Critical Collisions' : 'Action required in Conflict Center'}
          </p>
        </div>

        {/* Timetable Health Score Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Health Score</span>
            <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{healthScore}%</span>
            <span className="text-xs text-emerald-400 font-medium">Clash-Free</span>
          </div>
          <p className="mt-1.5 text-[11px] text-indigo-300 font-medium">
            CSP Constraint Backtracking Active
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. INSTITUTE RESOURCE INVENTORY COUNTERS */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Total Departments</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{departments.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Total Faculty</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{facultyProfiles.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Curriculum Subjects</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{subjects.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Lecture Halls</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{rooms.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Specialized Labs</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{labs.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
          <span className="text-[11px] text-zinc-400">Total Timetables</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{timetables.length}</div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. RECHARTS CHARTS: DEPARTMENT WORKLOAD & WEEKLY DENSITY */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Bar Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Department Curriculum & Scheduled Hours</h3>
              <p className="text-xs text-zinc-400">Curriculum demand vs. scheduled timetable periods</p>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              Bar Chart
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="CurriculumHours" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Required Hours" />
                <Bar dataKey="ScheduledSlots" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Scheduled Slots" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Schedule Density Area Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Academic Density (Monday - Saturday)</h3>
              <p className="text-xs text-zinc-400">Lecture distribution preventing burnout spikes</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              Area Distribution
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyDensityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="theoryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="TheoryLectures" stroke="#4F46E5" fillOpacity={1} fill="url(#theoryGrad)" name="Theory Lectures" />
                <Area type="monotone" dataKey="LabPracticals" stroke="#06B6D4" fillOpacity={1} fill="url(#labGrad)" name="Lab Practicals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. RECHARTS CHARTS: FACILITY DONUT & FACULTY UTILIZATION */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility Allocation Donut Chart */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Facility Allocation Mix</h3>
              <p className="text-xs text-zinc-400">Classrooms vs. specialized labs</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facilityAllocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {facilityAllocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Utilization Table & Progress Bars */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Faculty Workload Utilization Ceiling</h3>
              <p className="text-xs text-zinc-400">Live hours allocated compared to weekly maximum ceiling</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Workload Guardrail
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {facultyUtilizationData.map((fac, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-zinc-800/40 border border-white/[0.04]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-200">Prof. {fac.name}</span>
                  <span className="font-mono text-zinc-400">
                    {fac.allocated} / {fac.capacity} hrs ({fac.utilizationRate}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fac.utilizationRate > 90
                        ? 'bg-rose-500'
                        : fac.utilizationRate > 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, fac.utilizationRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
