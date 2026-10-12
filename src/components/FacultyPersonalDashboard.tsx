import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  CalendarClock,
  CalendarX2,
  Users,
  CheckSquare,
  Bell,
  User as UserIcon,
  Building2,
  DoorOpen,
  Sparkles,
  Download,
  Plus,
  Send,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  FacultyProfile,
  User,
  Subject,
  Section,
  Course,
  Department,
  TimetableEntry,
  FacultyLeave,
  LeaveType,
  LeaveBalance,
  SubstituteAssignment,
  InstituteTimeSlot,
  InstituteWorkingDay
} from '../types/database';

export type FacultyTab =
  | 'my-subjects'
  | 'my-classes'
  | 'my-timetable'
  | 'free-slots'
  | 'leave-requests'
  | 'student-lists'
  | 'quick-attendance'
  | 'announcements'
  | 'profile';

interface FacultyPersonalDashboardProps {
  activeTab: FacultyTab;
  onSelectTab: (tab: FacultyTab) => void;
  facultyProfile?: FacultyProfile;
  currentUser?: User;
  departments: Department[];
  subjects: Subject[];
  sections: Section[];
  courses: Course[];
  timeSlots: InstituteTimeSlot[];
  workingDays: InstituteWorkingDay[];
  timetableEntries: TimetableEntry[];
  leaves: FacultyLeave[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  substitutes: SubstituteAssignment[];
  onApplyLeave: (req: {
    facultyProfileId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }) => void;
  onUpdateProfile?: (updated: Partial<FacultyProfile>, updatedUser?: Partial<User>) => void;
}

export const FacultyPersonalDashboard: React.FC<FacultyPersonalDashboardProps> = ({
  activeTab,
  onSelectTab,
  facultyProfile,
  currentUser,
  departments,
  subjects,
  sections,
  courses,
  timeSlots,
  workingDays,
  timetableEntries,
  leaves,
  leaveTypes,
  leaveBalances,
  substitutes,
  onApplyLeave,
  onUpdateProfile,
}) => {
  const facultyId = facultyProfile?.id || '';
  const facultyName = currentUser?.full_name || 'Academic Faculty';

  // Filter personal timetable entries
  const myTimetableEntries = timetableEntries.filter((e) => e.faculty_id === facultyId);

  // Filter assigned subjects based on timetable entries or department
  const mySubjectIds = Array.from(new Set(myTimetableEntries.map((e) => e.subject_id).filter(Boolean)));
  const mySubjects = subjects.filter(
    (s) => mySubjectIds.includes(s.id) || (facultyProfile && s.department_id === departments[0]?.id)
  );

  // Filter personal leaves
  const myLeaves = leaves.filter((l) => l.faculty_profile_id === facultyId);
  const myBalances = leaveBalances.filter((b) => b.faculty_profile_id === facultyId);

  // State for Leave Application Form
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>(leaveTypes[0]?.id || '');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string | null>(null);

  // State for Quick Attendance
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>(
    myTimetableEntries[0]?.id || 'default'
  );
  const [attendanceRecords, setAttendanceRecords] = useState<{ [id: string]: boolean }>({
    'std-1': true,
    'std-2': true,
    'std-3': false,
    'std-4': true,
    'std-5': true,
    'std-6': true,
  });
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // State for Profile Edit
  const [profileContact, setProfileContact] = useState(facultyProfile?.contact_number || '+91 98765 43210');
  const [profileCabin, setProfileCabin] = useState(facultyProfile?.cabin_number || 'Room 304, Tower B');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveTypeId || !leaveReason.trim()) return;

    onApplyLeave({
      facultyProfileId: facultyId,
      leaveTypeId: selectedLeaveTypeId,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: 1,
      reason: leaveReason.trim(),
    });

    setLeaveSuccessMsg('Leave application dispatched to Department Head for review.');
    setLeaveModalOpen(false);
    setLeaveReason('');
    setTimeout(() => setLeaveSuccessMsg(null), 4000);
  };

  const handleSaveAttendance = () => {
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile && facultyProfile) {
      onUpdateProfile(
        { contact_number: profileContact, cabin_number: profileCabin },
        { phone: profileContact }
      );
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Sample enrolled students for student lists
  const sampleStudents = [
    { id: 'std-1', roll: '22CS001', name: 'Aarav Patel', email: 'aarav.p@student.edu', attendance: '94%' },
    { id: 'std-2', roll: '22CS002', name: 'Diya Sharma', email: 'diya.s@student.edu', attendance: '98%' },
    { id: 'std-3', roll: '22CS003', name: 'Ishaan Verma', email: 'ishaan.v@student.edu', attendance: '82%' },
    { id: 'std-4', roll: '22CS004', name: 'Kavya Nair', email: 'kavya.n@student.edu', attendance: '91%' },
    { id: 'std-5', roll: '22CS005', name: 'Rohan Gupta', email: 'rohan.g@student.edu', attendance: '89%' },
    { id: 'std-6', roll: '22CS006', name: 'Sneha Reddy', email: 'sneha.r@student.edu', attendance: '96%' },
  ];

  // Sample announcements
  const sampleAnnouncements = [
    {
      id: 'ann-1',
      title: 'Mid-Term Examination Invigilation Roster',
      date: 'Today, 10:30 AM',
      sender: 'Dean of Academic Affairs',
      category: 'Exam Duty',
      content: 'The official invigilation duties for Monsoon Semester examinations have been published. Please review your assigned examination hall dates.',
    },
    {
      id: 'ann-2',
      title: 'Departmental Faculty Meeting',
      date: 'Yesterday, 3:00 PM',
      sender: 'Head of Department',
      category: 'Department',
      content: 'Monthly faculty meeting scheduled for this Thursday at 3:30 PM in Conference Room 1. Agenda: Curriculum review and student progress.',
    },
    {
      id: 'ann-3',
      title: 'Research Grant Submission Deadline',
      date: 'Oct 08, 2026',
      sender: 'R&D Cell',
      category: 'Research',
      content: 'All faculty members intending to apply for institutional R&D seed grants must submit their project abstracts by the 25th.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt={facultyName} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                facultyName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{facultyName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  FACULTY
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {facultyProfile?.designation || 'Faculty Member'} • ID: {facultyProfile?.employee_id || 'FAC-001'} •{' '}
                {departments[0]?.name || 'Academic Department'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('my-timetable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'my-timetable'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              My Timetable
            </button>
            <button
              onClick={() => onSelectTab('quick-attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'quick-attendance'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              Quick Attendance
            </button>
          </div>
        </div>
      </div>

      {leaveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{leaveSuccessMsg}</span>
        </div>
      )}

      {/* 1. MY SUBJECTS */}
      {activeTab === 'my-subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">My Academic Subjects</h2>
              <p className="text-xs text-zinc-400">Curriculum subjects allocated for your instruction this semester</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-300 border border-white/[0.06]">
              {mySubjects.length} Assigned
            </span>
          </div>

          {mySubjects.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs text-zinc-400 space-y-2">
              <BookOpen className="h-8 w-8 text-zinc-600 mx-auto" />
              <p>No subjects currently allocated to your profile.</p>
              <p className="text-[11px] text-zinc-500">Contact your Department Head to assign subjects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySubjects.map((sub) => {
                const dept = departments.find((d) => d.id === sub.department_id);
                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-indigo-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {sub.code}
                      </span>
                      <span className="text-[11px] text-zinc-400">{sub.subject_type || 'THEORY'}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{dept?.name || 'Department'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-center text-xs">
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500 block text-[10px]">Credits</span>
                        <span className="font-bold text-white">{sub.credits || 4}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500 block text-[10px]">Weekly Hrs</span>
                        <span className="font-bold text-indigo-400">{sub.weekly_hours || 4}h</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500 block text-[10px]">Lab Req</span>
                        <span className="font-bold text-cyan-400">{sub.requires_lab ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. MY CLASSES */}
      {activeTab === 'my-classes' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">My Classes & Student Batches</h2>
            <p className="text-xs text-zinc-400">Class sections and scheduled cohort lecture groups</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTimetableEntries.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs text-zinc-400">
                <Users className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p>No class sessions currently scheduled.</p>
              </div>
            ) : (
              myTimetableEntries.map((entry) => {
                const sub = subjects.find((s) => s.id === entry.subject_id);
                return (
                  <div
                    key={entry.id}
                    className="p-5 rounded-xl bg-zinc-900/70 border border-white/[0.08] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                        {entry.day_of_week}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {entry.start_time} - {entry.end_time}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white truncate">{sub?.name || 'Class Lecture'}</h3>
                      <p className="text-xs text-zinc-400">{sub?.code || 'Course Code'}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Room {entry.room_id ? entry.room_id.replace('room-', '') : 'Main Hall'}</span>
                      </span>
                      <span className="text-emerald-400 font-medium">Clash-Free</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. MY TIMETABLE */}
      {activeTab === 'my-timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Personal Academic Timetable</h2>
              <p className="text-xs text-zinc-400">Your clash-free personal lecture schedule</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-white/[0.08] flex items-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Print Schedule</span>
            </button>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/60 border-b border-white/[0.08] text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Day</th>
                  <th className="py-3 px-4 font-semibold">Slot / Time</th>
                  <th className="py-3 px-4 font-semibold">Subject & Code</th>
                  <th className="py-3 px-4 font-semibold">Venue / Room</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {myTimetableEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No timetable slots allocated to you yet.
                    </td>
                  </tr>
                ) : (
                  myTimetableEntries.map((e) => {
                    const sub = subjects.find((s) => s.id === e.subject_id);
                    return (
                      <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{e.day_of_week}</td>
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          {e.start_time} - {e.end_time}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">{sub?.name || 'Academic Class'}</span>
                          <span className="text-[11px] text-zinc-500 ml-2 font-mono">({sub?.code})</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {e.room_id ? `Room ${e.room_id.replace('room-', '')}` : 'Allocated Hall'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. AVAILABLE FREE SLOTS */}
      {activeTab === 'free-slots' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Available Free Slots & Office Hours</h2>
            <p className="text-xs text-zinc-400">Open periods available for student consultation, grading, and research</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-zinc-900/70 border border-white/[0.08] space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-cyan-400" />
                <span>Weekly Teaching Load Balance</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Weekly Scheduled Hours:</span>
                  <span className="font-mono font-bold text-indigo-400">{myTimetableEntries.length * 2} hrs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Quota Limit:</span>
                  <span className="font-mono text-zinc-300">{facultyProfile?.max_weekly_hours || 18} hrs max</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Open Free Slots:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.max(0, (facultyProfile?.max_weekly_hours || 18) - myTimetableEntries.length * 2)} hrs
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/70 border border-white/[0.08] space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Designated Office Hours</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Walk-in student advising hours: Monday & Wednesday, 2:00 PM – 4:00 PM in {facultyProfile?.cabin_number || 'Cabin 304'}.
              </p>
              <div className="pt-2">
                <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Open for Student Bookings
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEAVE REQUESTS */}
      {activeTab === 'leave-requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Leave Requests & Substitution</h2>
              <p className="text-xs text-zinc-400">Manage academic leaves, check balance, and track substitute status</p>
            </div>
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white flex items-center gap-2 shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leave Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {myBalances.length === 0 ? (
              <div className="col-span-full p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-xs text-zinc-400 text-center">
                Standard institutional leave quota active (12 Casual, 10 Medical, 5 Duty).
              </div>
            ) : (
              myBalances.map((bal) => {
                const type = leaveTypes.find((t) => t.id === bal.leave_type_id);
                return (
                  <div key={bal.id} className="p-4 rounded-xl bg-zinc-900/70 border border-white/[0.08] space-y-1">
                    <span className="text-xs font-medium text-zinc-400">{type?.name || 'Leave Type'}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-white">{bal.remaining_leaves}</span>
                      <span className="text-xs text-zinc-500">of {bal.total_leaves} days</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Leave Application History */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 overflow-hidden">
            <div className="p-4 border-b border-white/[0.08] font-semibold text-xs text-white">
              My Leave Request History
            </div>
            <div className="divide-y divide-white/[0.04]">
              {myLeaves.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">No leave applications submitted.</div>
              ) : (
                myLeaves.map((l) => (
                  <div key={l.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">
                        {l.start_date} to {l.end_date} ({l.total_days} day{l.total_days > 1 ? 's' : ''})
                      </div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">Reason: {l.reason}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Apply Leave Modal */}
          {leaveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-900 p-6 space-y-4 shadow-2xl">
                <h3 className="text-base font-bold text-white">Apply for Faculty Leave</h3>
                <form onSubmit={handleApplyLeaveSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Leave Type</label>
                    <select
                      value={selectedLeaveTypeId}
                      onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white text-xs focus:outline-none"
                    >
                      {leaveTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">End Date</label>
                      <input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Official Reason</label>
                    <textarea
                      required
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Specify reason for academic leave..."
                      className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setLeaveModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. STUDENT LISTS */}
      {activeTab === 'student-lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Student Roster</h2>
              <p className="text-xs text-zinc-400">Enrolled students in your assigned cohorts</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Cohort: CSE Semester 3 (Section A)</span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/60 border-b border-white/[0.08] text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sampleStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{std.roll}</td>
                    <td className="py-3 px-4 text-white font-medium">{std.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{std.email}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{std.attendance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. QUICK ATTENDANCE */}
      {activeTab === 'quick-attendance' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Quick Lecture Attendance</h2>
            <p className="text-xs text-zinc-400">Fast 1-click attendance marking for today's scheduled classes</p>
          </div>

          {attendanceSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Attendance logged and synchronized successfully with academic records.</span>
            </div>
          )}

          <div className="p-5 rounded-xl border border-white/[0.08] bg-zinc-900/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-400 block">Active Lecture Session:</span>
                <span className="text-sm font-semibold text-white">
                  {myTimetableEntries[0] ? `Period ${myTimetableEntries[0].day_of_week} (${myTimetableEntries[0].start_time})` : "Today's Active Lecture Session"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue: { [id: string]: boolean } = {};
                    sampleStudents.forEach((s) => (allTrue[s.id] = true));
                    setAttendanceRecords(allTrue);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow"
                >
                  Save Attendance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {sampleStudents.map((std) => {
                const isPresent = attendanceRecords[std.id] ?? true;
                return (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() =>
                      setAttendanceRecords((prev) => ({
                        ...prev,
                        [std.id]: !isPresent,
                      }))
                    }
                    className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isPresent
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white text-xs">{std.name}</div>
                      <div className="text-[10px] font-mono opacity-80">{std.roll}</div>
                    </div>
                    <span className="text-[11px] font-bold">
                      {isPresent ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Academic Notices & Announcements</h2>
            <p className="text-xs text-zinc-400">Departmental circulars, examination duties, and official circulars</p>
          </div>

          <div className="space-y-3">
            {sampleAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {ann.category}
                  </span>
                  <span className="text-[11px] text-zinc-500">{ann.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{ann.content}</p>
                <div className="text-[11px] text-zinc-500 pt-1">Issued by: {ann.sender}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Faculty Academic Profile</h2>
            <p className="text-xs text-zinc-400">Your institutional credentials, cabin details, and contact information</p>
          </div>

          {profileSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Profile details updated successfully.</span>
            </div>
          )}

          <div className="p-6 rounded-xl border border-white/[0.08] bg-zinc-900/70 space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={facultyName}
                    className="w-full rounded-lg bg-zinc-800/60 border border-white/[0.06] py-2 px-3 text-zinc-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value={facultyProfile?.employee_id || 'FAC-001'}
                    className="w-full rounded-lg bg-zinc-800/60 border border-white/[0.06] py-2 px-3 text-zinc-300 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || 'faculty@institution.edu'}
                    className="w-full rounded-lg bg-zinc-800/60 border border-white/[0.06] py-2 px-3 text-zinc-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Designation</label>
                  <input
                    type="text"
                    disabled
                    value={facultyProfile?.designation || 'Assistant Professor'}
                    className="w-full rounded-lg bg-zinc-800/60 border border-white/[0.06] py-2 px-3 text-zinc-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profileContact}
                    onChange={(e) => setProfileContact(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Faculty Cabin / Office</label>
                  <input
                    type="text"
                    value={profileCabin}
                    onChange={(e) => setProfileCabin(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.1] py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
