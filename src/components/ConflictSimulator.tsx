import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
  DoorOpen,
  Calendar,
  Zap,
  Info
} from 'lucide-react';
import {
  Department,
  FacultyProfile,
  Subject,
  Room,
  Lab,
  TimetableSlot,
  User,
  AcademicDay,
  ClashResult
} from '../types/database';
import { checkSlotConflict } from '../services/academicData';

interface ConflictSimulatorProps {
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  subjects: Subject[];
  rooms: Room[];
  labs: Lab[];
  timetableSlots: TimetableSlot[];
  onAddSlot: (slot: Omit<TimetableSlot, 'id' | 'created_at'>) => void;
}

export const ConflictSimulator: React.FC<ConflictSimulatorProps> = ({
  departments,
  facultyProfiles,
  users,
  subjects,
  rooms,
  labs,
  timetableSlots,
  onAddSlot,
}) => {
  // Simulator State
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('fac-rahul');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-aiml');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-ai402');
  const [selectedDay, setSelectedDay] = useState<AcademicDay>('MONDAY');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-sc204');
  const [verificationRan, setVerificationRan] = useState<boolean>(true);
  const [clashResults, setClashResults] = useState<ClashResult[]>([]);
  const [slotCreatedNotice, setSlotCreatedNotice] = useState<string | null>(null);

  // Trigger real-time check
  const runVerification = (
    facultyId = selectedFacultyId,
    deptId = selectedDeptId,
    day = selectedDay,
    start = startTime,
    end = endTime,
    roomId = selectedRoomId
  ) => {
    const results = checkSlotConflict({
      facultyId,
      targetDepartmentId: deptId,
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      roomId: roomId || undefined,
      timetableSlots,
      departments,
      facultyProfiles,
      users,
      subjects,
      rooms,
      labs,
    });

    setClashResults(results);
    setVerificationRan(true);
    setSlotCreatedNotice(null);
  };

  // Run initial check on mount or param changes
  React.useEffect(() => {
    runVerification();
  }, [selectedFacultyId, selectedDeptId, selectedDay, startTime, endTime, selectedRoomId]);

  // Preset Scenario Handlers
  const loadRahulClashPreset = () => {
    setSelectedFacultyId('fac-rahul');
    setSelectedDeptId('dept-aiml'); // Trying to schedule in AIML
    setSelectedSubjectId('sub-ai402');
    setSelectedDay('MONDAY');
    setStartTime('10:00');
    setEndTime('11:00'); // Clashes with CSE slot (10:00-11:00)!
    setSelectedRoomId('room-sc204');
    runVerification('fac-rahul', 'dept-aiml', 'MONDAY', '10:00', '11:00', 'room-sc204');
  };

  const loadRahulValidSlotPreset = () => {
    setSelectedFacultyId('fac-rahul');
    setSelectedDeptId('dept-aiml');
    setSelectedSubjectId('sub-ai402');
    setSelectedDay('MONDAY');
    setStartTime('11:00'); // Valid time right after CSE lecture!
    setEndTime('12:00');
    setSelectedRoomId('room-sc204');
    runVerification('fac-rahul', 'dept-aiml', 'MONDAY', '11:00', '12:00', 'room-sc204');
  };

  const loadRoomClashPreset = () => {
    setSelectedFacultyId('fac-ananya');
    setSelectedDeptId('dept-cse');
    setSelectedSubjectId('sub-cs408');
    setSelectedDay('MONDAY');
    setStartTime('10:00');
    setEndTime('11:00');
    setSelectedRoomId('room-lh101'); // LH-101 is already taken by Rahul in CSE!
    runVerification('fac-ananya', 'dept-cse', 'MONDAY', '10:00', '11:00', 'room-lh101');
  };

  const handleCommitSlot = () => {
    if (clashResults.length > 0) return;
    onAddSlot({
      institute_id: 'inst-001',
      department_id: selectedDeptId,
      semester_id: 'sem-5',
      section_id: 'sec-general',
      subject_id: selectedSubjectId,
      faculty_id: selectedFacultyId,
      room_id: selectedRoomId || undefined,
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
      is_lab_session: false,
      academic_year: '2025-2026',
    });
    setSlotCreatedNotice(`Successfully committed slot for ${selectedDay} ${startTime}-${endTime}!`);
  };

  const selectedFacultyUser = users.find(
    (u) => u.id === facultyProfiles.find((f) => f.id === selectedFacultyId)?.user_id
  );
  const targetDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Clash-Free Timetable Architecture Simulator
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
            Real-Time Cross-Department Engine
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400 max-w-3xl">
          Simulate academic scheduling requests across departments. Verify how multi-department faculty assignments, room collisions, and time windows are mathematically enforced before slot commitment.
        </p>
      </div>

      {/* Preset Test Scenarios */}
      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4">
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Quick Architectural Test Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={loadRahulClashPreset}
            className="flex flex-col text-left p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 transition-all text-xs"
          >
            <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
              <span>1. The Rahul Sharma Clash</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Rahul teaches CSE 10:00-11:00. Attempt to schedule him in AIML at the same time.
            </p>
          </button>

          <button
            onClick={loadRahulValidSlotPreset}
            className="flex flex-col text-left p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 transition-all text-xs"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
              <span>2. Clash-Free Slot Approved</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Schedule Rahul in AIML Monday 11:00-12:00 in SC-204 with no conflict.
            </p>
          </button>

          <button
            onClick={loadRoomClashPreset}
            className="flex flex-col text-left p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 transition-all text-xs"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
              <span>3. Room LH-101 Collision</span>
              <DoorOpen className="h-4 w-4" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Attempt to book LH-101 when CSE already has it occupied.
            </p>
          </button>
        </div>
      </div>

      {/* Main Simulator Matrix & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-zinc-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span>Simulated Slot Proposal</span>
            </h2>
            <button
              onClick={() => runVerification()}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Re-check</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Faculty Selection */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Assigned Faculty Member</label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                {facultyProfiles.map((f) => {
                  const u = users.find((user) => user.id === f.user_id);
                  return (
                    <option key={f.id} value={f.id}>
                      {u?.full_name} ({f.employee_id} • {f.designation})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Target Department */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Target Department for Slot</label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Subject / Curriculum Code</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Day and Time Range */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Academic Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as AcademicDay)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                >
                  <option value="MONDAY">Monday</option>
                  <option value="TUESDAY">Tuesday</option>
                  <option value="WEDNESDAY">Wednesday</option>
                  <option value="THURSDAY">Thursday</option>
                  <option value="FRIDAY">Friday</option>
                  <option value="SATURDAY">Saturday</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Room or Hall</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">No Physical Room Assigned</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} ({room.building}, Cap: {room.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => runVerification()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                Run Clash-Free Verification
              </button>
            </div>
          </div>
        </div>

        {/* Right: Engine Feedback & Architectural Proof (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status Verdict Banner */}
          {clashResults.length > 0 ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-5 backdrop-blur space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-300">
                    Conflict Detected: Cross-Department Lock Engaged
                  </h3>
                  <p className="text-xs text-rose-200/80 mt-1">
                    The requested slot violates institutional resource constraints. In a production database, the PostgreSQL function <code className="font-mono bg-rose-900/40 px-1 py-0.5 rounded text-rose-200">check_faculty_clash()</code> rejects this transaction.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-rose-500/20">
                {clashResults.map((clash, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-rose-900/30 border border-rose-500/30 text-xs text-rose-200 space-y-1"
                  >
                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{clash.type}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300">{clash.message}</p>
                    <div className="text-[10px] text-zinc-400 font-mono pt-1">
                      Target Slot: {selectedDay} {startTime}-{endTime} | Conflict Window: {clash.time_window}
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled
                className="w-full py-2.5 rounded-lg bg-zinc-800 text-zinc-500 font-semibold text-xs cursor-not-allowed border border-white/[0.04]"
              >
                Slot Cannot Be Committed Due to Conflicts
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-5 backdrop-blur space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">
                    Slot Approved: Conflict-Free
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    No faculty, department, or room clashes detected across any campus division. Professor {selectedFacultyUser?.full_name} is free for {targetDept?.code}.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-xs text-emerald-200 space-y-1">
                <div className="font-semibold text-emerald-300">Slot Feasibility Parameters:</div>
                <ul className="text-[11px] space-y-1 text-zinc-300 list-disc list-inside">
                  <li>Cross-department timetable query verified (0 overlaps in CSE, AIML, IT, ECE)</li>
                  <li>Room {rooms.find((r) => r.id === selectedRoomId)?.room_number || 'Selected'} available for full duration</li>
                  <li>Faculty contract workload within permissible weekly threshold</li>
                </ul>
              </div>

              {slotCreatedNotice && (
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium text-center">
                  {slotCreatedNotice}
                </div>
              )}

              <button
                onClick={handleCommitSlot}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                Commit Slot to Institutional Timetable
              </button>
            </div>
          )}

          {/* Current Campus Active Slots Timeline */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>Existing Locked Campus Slots</span>
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                {timetableSlots.length} active sessions
              </span>
            </div>

            <div className="space-y-2">
              {timetableSlots.map((slot) => {
                const dept = departments.find((d) => d.id === slot.department_id);
                const prof = facultyProfiles.find((f) => f.id === slot.faculty_id);
                const profUser = users.find((u) => u.id === prof?.user_id);
                const sub = subjects.find((s) => s.id === slot.subject_id);
                const room = rooms.find((r) => r.id === slot.room_id);

                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 border border-white/[0.04] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${dept?.color_accent}20`,
                          color: dept?.color_accent,
                        }}
                      >
                        {dept?.code}
                      </span>
                      <span className="font-medium text-white">{profUser?.full_name}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{sub?.code}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-300">
                        {slot.day_of_week} {slot.start_time}-{slot.end_time}
                      </span>
                      <span className="text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {room?.room_number || 'Room'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
