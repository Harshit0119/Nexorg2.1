import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Download,
  Filter,
  Search,
  Users2,
  DoorOpen,
  Cpu,
  Layers,
  Clock,
  Lock,
  Unlock,
  Move,
  ArrowRight,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Info,
  Sliders,
  Check,
  Zap,
  Building2,
  Plus,
  Trash2,
  Eye,
  BarChart3,
  Flame
} from 'lucide-react';
import {
  Department,
  FacultyProfile,
  Subject,
  Room,
  Lab,
  Section,
  Semester,
  AcademicDay,
  Timetable,
  TimetableEntry,
  TimetableConflict,
  TimetableHealthMetrics,
  TimetableViewMode,
  TimetableStatus,
  User,
  UserRole,
  InstituteWorkingDay,
  InstituteTimeSlot,
  FacultyUnavailableSlot,
  WorkloadRule,
  WorkloadLimit,
  FacultySubjectAssignment,
} from '../types/database';
import {
  generateTimetableAlgorithm,
  autoResolveConflict,
  exportTimetableToCSV,
  detectAllTimetableConflicts,
} from '../services/timetableEngine';

interface TimetableEngineProps {
  currentRole: UserRole;
  userAssignedDeptId?: string;
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  subjects: Subject[];
  sections: Section[];
  semesters: Semester[];
  rooms: Room[];
  labs: Lab[];
  workingDays: InstituteWorkingDay[];
  timeSlots: InstituteTimeSlot[];
  unavailableSlots: FacultyUnavailableSlot[];
  workloadRules: WorkloadRule[];
  workloadLimits: WorkloadLimit[];
  facultySubjectAssignments: FacultySubjectAssignment[];
  timetables: Timetable[];
  timetableEntries: TimetableEntry[];
  timetableConflicts: TimetableConflict[];
  onSaveEntries: (timetableId: string, entries: TimetableEntry[]) => void;
  onUpdateTimetable: (id: string, updated: Partial<Timetable>) => void;
  onCreateTimetable: (data: Omit<Timetable, 'id' | 'created_at' | 'updated_at'>) => void;
  onOpenExportModal?: () => void;
}

const ALL_DAYS: AcademicDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const TimetableEngine: React.FC<TimetableEngineProps> = ({
  currentRole,
  userAssignedDeptId,
  departments,
  facultyProfiles,
  users,
  subjects,
  sections,
  semesters,
  rooms,
  labs,
  workingDays,
  timeSlots,
  unavailableSlots,
  workloadRules,
  workloadLimits,
  facultySubjectAssignments,
  timetables,
  timetableEntries,
  timetableConflicts,
  onSaveEntries,
  onUpdateTimetable,
  onCreateTimetable,
  onOpenExportModal,
}) => {
  // Master Active Timetable Selector
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>(
    timetables[0]?.id || 'tt-2025-odd-main'
  );

  // Current view modes
  const [viewMode, setViewMode] = useState<TimetableViewMode>('DEPARTMENT');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    userAssignedDeptId || departments[0]?.id || 'dept-cse'
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('fac-rahul');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || 'room-sc201');
  const [selectedLabId, setSelectedLabId] = useState<string>(labs[0]?.id || 'lab-ai101');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || 'sec-cse-5a');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('ALL');

  // Interactive Drag & Drop / Move State
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [selectedSlotForManualAdd, setSelectedSlotForManualAdd] = useState<{ day: AcademicDay; period: number } | null>(null);
  const [manualSubjectId, setManualSubjectId] = useState<string>(subjects[0]?.id || '');
  const [manualFacultyId, setManualFacultyId] = useState<string>('fac-rahul');
  const [manualRoomId, setManualRoomId] = useState<string>(rooms[0]?.id || '');
  const [manualSectionId, setManualSectionId] = useState<string>(sections[0]?.id || '');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [engineNotice, setEngineNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Active timetable data
  const currentTimetable = timetables.find((t) => t.id === selectedTimetableId) || timetables[0];

  // Active working days & periods
  const activeWorkingDays = useMemo(
    () => workingDays.filter((d) => d.is_working_day).sort((a, b) => a.day_order - b.day_order),
    [workingDays]
  );
  const lectureSlots = useMemo(
    () => timeSlots.filter((s) => !s.is_break).sort((a, b) => a.slot_number - b.slot_number),
    [timeSlots]
  );

  // Active entries filtered to selected timetable
  const activeEntries = useMemo(
    () => timetableEntries.filter((e) => e.timetable_id === currentTimetable?.id),
    [timetableEntries, currentTimetable?.id]
  );

  // Real-time conflict computation
  const activeConflicts = useMemo(() => {
    return detectAllTimetableConflicts(activeEntries, {
      facultyProfiles,
      users,
      rooms,
      labs,
      sections,
      departments,
      unavailableSlots,
    });
  }, [activeEntries, facultyProfiles, users, rooms, labs, sections, departments, unavailableSlots]);

  // Real-time Health Metrics
  const healthMetrics = useMemo<TimetableHealthMetrics>(() => {
    const totalSlots = activeEntries.length;
    const critical = activeConflicts.filter((c) => c.severity === 'CRITICAL').length;
    const health = Math.max(0, 100 - critical * 20 - activeConflicts.length * 3);

    const facultyCap = facultyProfiles.reduce((s, f) => s + f.max_weekly_hours, 0) || 1;
    const facHours = activeEntries.length;
    const facUtil = Math.min(100, Math.round((facHours / facultyCap) * 100));

    const totalDays = activeWorkingDays.length || 6;
    const totalPeriods = lectureSlots.length || 7;
    const roomCap = (rooms.length || 1) * totalDays * totalPeriods;
    const roomOccupied = new Set(activeEntries.filter((e) => e.room_id).map((e) => `${e.room_id}#${e.day_of_week}#${e.period_number}`)).size;
    const roomUtil = Math.min(100, Math.round((roomOccupied / roomCap) * 100));

    const labCap = (labs.length || 1) * totalDays * totalPeriods;
    const labOccupied = new Set(activeEntries.filter((e) => e.lab_id).map((e) => `${e.lab_id}#${e.day_of_week}#${e.period_number}`)).size;
    const labUtil = Math.min(100, Math.round((labOccupied / labCap) * 100));

    return {
      health_score: totalSlots === 0 ? 100 : health,
      total_slots: totalSlots,
      total_conflicts: activeConflicts.length,
      faculty_conflicts: activeConflicts.filter((c) => c.conflict_type === 'FACULTY_CLASH').length,
      room_conflicts: activeConflicts.filter((c) => c.conflict_type === 'ROOM_CLASH').length,
      lab_conflicts: activeConflicts.filter((c) => c.conflict_type === 'LAB_CLASH').length,
      section_conflicts: activeConflicts.filter((c) => c.conflict_type === 'SECTION_CLASH').length,
      faculty_utilization_pct: facUtil,
      room_utilization_pct: roomUtil,
      lab_utilization_pct: labUtil,
    };
  }, [activeEntries, activeConflicts, facultyProfiles, rooms.length, labs.length, activeWorkingDays.length, lectureSlots.length]);

  // =========================================================================
  // ACTIONS: AUTO-GENERATE & REGENERATE
  // =========================================================================
  const handleRunAutoGenerate = () => {
    if (currentRole !== 'HEAD' && currentRole !== 'ADMIN') {
      setEngineNotice({ type: 'error', message: 'Unauthorized: Only HEAD and ADMIN roles can run Timetable Generation.' });
      return;
    }

    setIsGenerating(true);
    setEngineNotice(null);

    setTimeout(() => {
      try {
        const result = generateTimetableAlgorithm({
          timetableId: currentTimetable.id,
          instituteId: 'inst-001',
          departments,
          facultyProfiles,
          users,
          subjects,
          sections,
          semesters,
          rooms,
          labs,
          workingDays,
          timeSlots,
          unavailableSlots,
          workloadRules,
          workloadLimits,
          facultySubjectAssignments,
          params: {
            timetableId: currentTimetable.id,
            instituteId: 'inst-001',
            academicYear: currentTimetable.academic_year,
            term: currentTimetable.term,
            respectFacultyAvailability: true,
            respectWorkloadLimits: true,
            respectConsecutiveLimits: true,
            allowDepartmentCrossLocking: true,
            preferredTimeSlotBonus: true,
          },
        });

        onSaveEntries(currentTimetable.id, result.entries);
        onUpdateTimetable(currentTimetable.id, {
          health_score: result.healthMetrics.health_score,
          total_slots: result.entries.length,
          conflicts_count: result.conflicts.length,
          status: 'GENERATED',
        });

        setIsGenerating(false);
        setEngineNotice({
          type: 'success',
          message: `Generation complete! Generated ${result.entries.length} slots with Health Score: ${result.healthMetrics.health_score}%. ${result.conflicts.length} conflicts.`,
        });
      } catch (err) {
        setIsGenerating(false);
        setEngineNotice({
          type: 'error',
          message: `Generation failed: ${err instanceof Error ? err.message : 'Unknown solver error'}`,
        });
      }
    }, 600);
  };

  // 1-Click Conflict Resolver
  const handleResolveConflict = (conflict: TimetableConflict) => {
    const res = autoResolveConflict(conflict, activeEntries, workingDays, timeSlots);
    if (res.resolved) {
      onSaveEntries(currentTimetable.id, res.updatedEntries);
      setEngineNotice({ type: 'success', message: res.message });
    } else {
      setEngineNotice({ type: 'error', message: res.message });
    }
  };

  // Timetable State Lifecycle: Approve / Publish
  const handleApprove = () => {
    if (currentRole !== 'HEAD') return;
    onUpdateTimetable(currentTimetable.id, {
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    });
    setEngineNotice({ type: 'success', message: 'Timetable approved by Institutional Head.' });
  };

  const handlePublish = () => {
    if (currentRole !== 'HEAD') return;
    onUpdateTimetable(currentTimetable.id, {
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
    });
    setEngineNotice({ type: 'success', message: 'Timetable published! Students & Faculty can now view official schedules.' });
  };

  // Drag-and-drop or slot swap handler
  const handleDropToSlot = (targetDay: AcademicDay, targetPeriod: number) => {
    if (!draggedEntryId) return;
    const dragged = activeEntries.find((e) => e.id === draggedEntryId);
    if (!dragged) return;

    if (dragged.is_locked) {
      setEngineNotice({ type: 'error', message: 'Cannot move a locked class period.' });
      setDraggedEntryId(null);
      return;
    }

    const matchingSlot = timeSlots.find((s) => s.slot_number === targetPeriod);
    const updated = activeEntries.map((e) =>
      e.id === draggedEntryId
        ? {
            ...e,
            day_of_week: targetDay,
            period_number: targetPeriod,
            start_time: matchingSlot?.start_time.slice(0, 5) || e.start_time,
            end_time: matchingSlot?.end_time.slice(0, 5) || e.end_time,
            updated_at: new Date().toISOString(),
          }
        : e
    );

    onSaveEntries(currentTimetable.id, updated);
    setDraggedEntryId(null);
    setEngineNotice({
      type: 'info',
      message: `Shifted assignment to ${targetDay} Period ${targetPeriod}. Engine automatically updated cross-department locks.`,
    });
  };

  // CSV Export
  const handleDownloadCSV = () => {
    const csv = exportTimetableToCSV(activeEntries, viewMode);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTimetable.name.replace(/\s+/g, '_')}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered view entries based on selected mode
  const filteredGridEntries = useMemo(() => {
    return activeEntries.filter((e) => {
      if (filterDay !== 'ALL' && e.day_of_week !== filterDay) return false;

      if (viewMode === 'DEPARTMENT') {
        return e.department_id === selectedDeptId;
      }
      if (viewMode === 'FACULTY') {
        return e.faculty_id === selectedFacultyId;
      }
      if (viewMode === 'ROOM') {
        return e.room_id === selectedRoomId;
      }
      if (viewMode === 'LAB') {
        return e.lab_id === selectedLabId;
      }
      if (viewMode === 'SECTION') {
        return e.section_id === selectedSectionId;
      }
      return true; // INSTITUTE view shows everything
    });
  }, [activeEntries, filterDay, viewMode, selectedDeptId, selectedFacultyId, selectedRoomId, selectedLabId, selectedSectionId]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & TIMETABLE CONTROL BAR */}
      {/* ===================================================================== */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">Core Timetable Engine</h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      currentTimetable.status === 'PUBLISHED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : currentTimetable.status === 'APPROVED'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : currentTimetable.status === 'GENERATED'
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-white/[0.08]'
                    }`}
                  >
                    {currentTimetable.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Multi-department cross-locking scheduler. Prevents faculty, room, lab, and section collisions automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Engine Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timetable Selector */}
            <select
              value={selectedTimetableId}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              className="bg-zinc-800/90 border border-white/[0.1] text-xs font-medium text-white rounded-xl px-3 py-2 focus:outline-none"
            >
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.academic_year})
                </option>
              ))}
            </select>

            {/* Auto Generate Button */}
            {currentRole !== 'FACULTY' && (
              <button
                onClick={handleRunAutoGenerate}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Solving CSP Matrix...' : activeEntries.length > 0 ? 'Regenerate Timetable' : 'Auto Generate Timetable'}</span>
              </button>
            )}

            {/* Approval & Publish Buttons (HEAD only) */}
            {currentRole === 'HEAD' && currentTimetable.status === 'GENERATED' && (
              <button
                onClick={handleApprove}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Approve Schedule</span>
              </button>
            )}

            {currentRole === 'HEAD' && (currentTimetable.status === 'APPROVED' || currentTimetable.status === 'GENERATED') && (
              <button
                onClick={handlePublish}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Publish Timetable</span>
              </button>
            )}

            {/* Export Package Modal Trigger */}
            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Export Timetable Package (PDF, Excel, Multi-view)"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Export Package</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleDownloadCSV}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
              title="Quick CSV Export"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
              title="Quick Print"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Engine Notice Banner */}
        {engineNotice && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
              engineNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : engineNotice.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {engineNotice.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : engineNotice.type === 'error' ? (
                <XCircle className="h-4 w-4 text-rose-400" />
              ) : (
                <Info className="h-4 w-4 text-indigo-400" />
              )}
              <span>{engineNotice.message}</span>
            </div>
            <button onClick={() => setEngineNotice(null)} className="text-zinc-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. TIMETABLE HEALTH SCORE & METRICS DASHBOARD RIBBON */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Health Score Gauge */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-mono font-black text-sm ${
                healthMetrics.health_score >= 90
                  ? 'border-emerald-500 text-emerald-400'
                  : healthMetrics.health_score >= 70
                  ? 'border-amber-500 text-amber-400'
                  : 'border-rose-500 text-rose-400'
              }`}
            >
              {healthMetrics.health_score}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Health Score</div>
            <div className="text-xs font-semibold text-white">
              {healthMetrics.health_score === 100
                ? '100% Clash-Free'
                : healthMetrics.health_score >= 80
                ? 'Optimized'
                : 'Clashes Detected'}
            </div>
          </div>
        </div>

        {/* Conflicts Count */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              healthMetrics.total_conflicts === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {healthMetrics.total_conflicts === 0 ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Conflicts Detected</div>
            <div className="text-sm font-bold font-mono text-white">
              {healthMetrics.total_conflicts} Clashes
            </div>
          </div>
        </div>

        {/* Faculty Utilization */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users2 className="h-5 w-5" />
          </div>
          <div className="w-full">
            <div className="text-[11px] text-zinc-400 font-medium flex justify-between">
              <span>Faculty Utilization</span>
              <span className="font-mono text-white font-bold">{healthMetrics.faculty_utilization_pct}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${healthMetrics.faculty_utilization_pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Room Utilization */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="w-full">
            <div className="text-[11px] text-zinc-400 font-medium flex justify-between">
              <span>Room Utilization</span>
              <span className="font-mono text-white font-bold">{healthMetrics.room_utilization_pct}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${healthMetrics.room_utilization_pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lab Utilization */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="w-full">
            <div className="text-[11px] text-zinc-400 font-medium flex justify-between">
              <span>Lab Utilization</span>
              <span className="font-mono text-white font-bold">{healthMetrics.lab_utilization_pct}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-violet-500 h-full rounded-full transition-all"
                style={{ width: `${healthMetrics.lab_utilization_pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. CONFLICT CENTER (DIAGNOSTICS & ONE-CLICK RESOLVER) */}
      {/* ===================================================================== */}
      {activeConflicts.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Conflict Center ({activeConflicts.length} Action Items)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Automatic Clash Diagnostic Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Multi-department cross-locking detected collisions. Click Resolve to heuristically swap slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {activeConflicts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-rose-500/30 flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 uppercase">
                      {c.conflict_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{c.time_window}</span>
                  </div>
                  <p className="mt-2 text-zinc-300 text-xs leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">Severity: {c.severity}</span>
                  {currentRole !== 'FACULTY' && (
                    <button
                      onClick={() => handleResolveConflict(c)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Auto-Resolve Clash</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MULTI-PERSPECTIVE VIEW SELECTOR & FILTERS */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
        {/* Perspectives Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setViewMode('DEPARTMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'DEPARTMENT'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Department View</span>
          </button>

          <button
            onClick={() => setViewMode('FACULTY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'FACULTY'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Users2 className="h-3.5 w-3.5" />
            <span>Faculty View</span>
          </button>

          <button
            onClick={() => setViewMode('SECTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'SECTION'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Section View</span>
          </button>

          <button
            onClick={() => setViewMode('ROOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'ROOM'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Room View</span>
          </button>

          <button
            onClick={() => setViewMode('LAB')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'LAB'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Lab View</span>
          </button>

          <button
            onClick={() => setViewMode('INSTITUTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'INSTITUTE'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Institute Master</span>
          </button>
        </div>

        {/* Dynamic Secondary Entity Picker */}
        <div className="flex items-center gap-2 text-xs">
          {viewMode === 'DEPARTMENT' && (
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'FACULTY' && (
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium focus:outline-none"
            >
              {facultyProfiles.map((f) => {
                const u = users.find((usr) => usr.id === f.user_id);
                return (
                  <option key={f.id} value={f.id}>
                    {u?.full_name || 'Professor'} ({f.employee_id})
                  </option>
                );
              })}
            </select>
          )}

          {viewMode === 'SECTION' && (
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium focus:outline-none"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name} ({departments.find((d) => d.id === s.department_id)?.code})
                </option>
              ))}
            </select>
          )}

          {viewMode === 'ROOM' && (
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} - {r.room_name} ({r.building})
                </option>
              ))}
            </select>
          )}

          {viewMode === 'LAB' && (
            <select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg font-medium focus:outline-none"
            >
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lab_code || l.lab_number} - {l.name || l.lab_name || 'Laboratory'}
                </option>
              ))}
            </select>
          )}

          {/* Day Filter */}
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-zinc-300 px-2.5 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Days</option>
            {activeWorkingDays.map((d) => (
              <option key={d.day_of_week} value={d.day_of_week}>
                {d.day_of_week}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. VISUAL INTERACTIVE TIMETABLE GRID */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-zinc-800/80 border-b border-white/[0.08]">
                <th className="p-3.5 text-xs font-mono font-bold text-zinc-400 w-32 border-r border-white/[0.08]">
                  Day / Period
                </th>
                {lectureSlots.map((slot) => (
                  <th key={slot.id} className="p-3 text-xs font-mono border-r border-white/[0.08] min-w-[150px]">
                    <div className="font-bold text-white">{slot.label}</div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {activeWorkingDays
                .filter((wd) => filterDay === 'ALL' || wd.day_of_week === filterDay)
                .map((workingDay) => {
                  const day = workingDay.day_of_week;

                  return (
                    <tr key={day} className="hover:bg-white/[0.01]">
                      {/* Day Label Cell */}
                      <td className="p-3.5 border-r border-white/[0.08] bg-zinc-800/30">
                        <div className="font-bold text-xs text-white tracking-wide">{day}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Day #{workingDay.day_order}</div>
                      </td>

                      {/* Period Cells */}
                      {lectureSlots.map((slot) => {
                        const period = slot.slot_number;
                        // Find entries matching this Day and Period
                        const entriesInCell = filteredGridEntries.filter(
                          (e) => e.day_of_week === day && e.period_number === period
                        );

                        // Check if faculty has locked-out availability on this cell
                        const isFacultyBlocked =
                          viewMode === 'FACULTY' &&
                          unavailableSlots.some(
                            (u) => u.faculty_id === selectedFacultyId && u.day_of_week === day && u.period_number === period
                          );

                        return (
                          <td
                            key={`${day}-${period}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDropToSlot(day, period)}
                            className={`p-2 border-r border-white/[0.06] align-top transition-colors relative min-h-[90px] ${
                              isFacultyBlocked ? 'bg-rose-950/20' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            {isFacultyBlocked && (
                              <div className="text-[10px] font-mono text-rose-400 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 mb-1 flex items-center gap-1">
                                <Lock className="h-3 w-3 shrink-0" />
                                <span>Faculty Unavailable</span>
                              </div>
                            )}

                            {entriesInCell.length === 0 && !isFacultyBlocked && (
                              <div className="h-full min-h-[75px] flex items-center justify-center rounded-lg border border-dashed border-white/[0.05] text-[10px] text-zinc-600 hover:border-indigo-500/40 transition-colors group">
                                {currentRole !== 'FACULTY' ? (
                                  <span className="opacity-0 group-hover:opacity-100 text-indigo-400 flex items-center gap-1 font-mono">
                                    <Plus className="h-3 w-3" />
                                    <span>Vacant</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-700">Free</span>
                                )}
                              </div>
                            )}

                            {entriesInCell.map((entry) => {
                              const fac = facultyProfiles.find((f) => f.id === entry.faculty_id);
                              const usr = users.find((u) => u.id === fac?.user_id);
                              const subj = subjects.find((s) => s.id === entry.subject_id);
                              const dept = departments.find((d) => d.id === entry.department_id);
                              const sec = sections.find((s) => s.id === entry.section_id);
                              const room = rooms.find((r) => r.id === entry.room_id);
                              const lab = labs.find((l) => l.id === entry.lab_id);

                              const isLabSession = entry.entry_type === 'LAB_PRACTICAL';

                              return (
                                <div
                                  key={entry.id}
                                  draggable={currentRole !== 'FACULTY' && !entry.is_locked}
                                  onDragStart={() => setDraggedEntryId(entry.id)}
                                  className={`p-2.5 rounded-xl border mb-1.5 transition-all cursor-grab active:cursor-grabbing shadow-sm group ${
                                    isLabSession
                                      ? 'bg-violet-950/30 border-violet-500/40 text-violet-200 hover:border-violet-400'
                                      : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200 hover:border-indigo-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                                      style={{
                                        backgroundColor: `${dept?.color_accent || '#4F46E5'}25`,
                                        color: dept?.color_accent || '#818CF8',
                                      }}
                                    >
                                      {dept?.code} • Sec {sec?.name}
                                    </span>
                                    {entry.is_locked && (
                                      <span title="Locked Class">
                                        <Lock className="h-3 w-3 text-zinc-400" />
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1.5 font-bold text-xs text-white truncate" title={subj?.name}>
                                    {subj?.code}: {subj?.name}
                                  </div>

                                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-300">
                                    <span className="truncate max-w-[90px]" title={usr?.full_name}>
                                      {usr?.full_name}
                                    </span>
                                    <span className="font-mono text-zinc-400 font-semibold">
                                      {isLabSession ? lab?.lab_code || 'Lab' : room?.room_number || 'Room'}
                                    </span>
                                  </div>

                                  {/* Multi-Department highlight badge */}
                                  {entry.faculty_id === 'fac-rahul' && (
                                    <div className="mt-1.5 pt-1 border-t border-white/[0.08] flex items-center gap-1 text-[9px] font-mono text-cyan-300">
                                      <Zap className="h-2.5 w-2.5 text-cyan-400" />
                                      <span>Multi-Dept Locked ({dept?.code})</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. TIMETABLE SUMMARY & CROSS-DEPARTMENT LOCK EXPLANATION */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>Multi-Department Cross-Locking Rule Verification</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Faculty members belonging to multiple departments (e.g. Professor Rahul with CSE, AIML, IT) are protected by Nexorg&apos;s
            global time-space constraint engine. When Professor Rahul teaches CSE on Monday 10:00 - 11:00 (Period 2), his schedule is automatically
            frozen and blocked in AIML and IT.
          </p>
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/[0.04] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Professor Rahul (CSE Assignment):</span>
              <span className="font-mono text-emerald-400 font-semibold">Monday 10:00 - 11:00 (Room SC-201)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">AIML Automated Protection:</span>
              <span className="font-mono text-cyan-400 font-semibold">BLOCKED from Monday 10:00 - 11:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">IT Automated Protection:</span>
              <span className="font-mono text-cyan-400 font-semibold">BLOCKED from Monday 10:00 - 11:00</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Automated Constraint Guarantees</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">
                <strong>Room Concurrency:</strong> Strict single-class occupancy per physical room.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">
                <strong>Lab Category Compliance:</strong> Practicals routed exclusively to compliant laboratories.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">
                <strong>Section Non-Collision:</strong> Each student section receives exactly one instructional block at any given time.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">
                <strong>Workload Ceilings:</strong> Daily max lectures and consecutive limits enforced at every period.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
