import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  X,
  FileText,
  Building2,
  Users2,
  DoorOpen,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  Department,
  FacultyProfile,
  Room,
  Lab,
  Subject,
  Section,
  TimetableEntry,
  User,
  InstituteTimeSlot,
  InstituteWorkingDay,
} from '../types/database';
import {
  ExportScope,
  triggerPrintPDF,
  exportTimetableToExcelCSV,
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instituteName: string;
  academicYear: string;
  term: string;
  entries: TimetableEntry[];
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  rooms: Room[];
  labs: Lab[];
  subjects: Subject[];
  sections: Section[];
  timeSlots: InstituteTimeSlot[];
  workingDays: InstituteWorkingDay[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  instituteName,
  academicYear,
  term,
  entries,
  departments,
  facultyProfiles,
  users,
  rooms,
  labs,
  subjects,
  sections,
  timeSlots,
  workingDays,
}) => {
  const [scope, setScope] = useState<ExportScope>('DEPARTMENT');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(departments[0]?.id || '');

  if (!isOpen) return null;

  const exportCtx = {
    instituteName,
    academicYear,
    term,
    entries,
    departments,
    facultyProfiles,
    users,
    rooms,
    labs,
    subjects,
    sections,
    timeSlots,
    workingDays,
  };

  const handleExportExcel = () => {
    exportTimetableToExcelCSV(scope, selectedEntityId, exportCtx);
  };

  const handleExportPDF = () => {
    triggerPrintPDF(scope, selectedEntityId, exportCtx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Timetable Package</h2>
              <p className="text-xs text-zinc-400">Download formatted Excel spreadsheet or printable PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">Choose Export Perspective</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setScope('DEPARTMENT');
                setSelectedEntityId(departments[0]?.id || '');
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                scope === 'DEPARTMENT'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-zinc-800/50 border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>Department Schedule</span>
            </button>

            <button
              onClick={() => {
                setScope('FACULTY');
                setSelectedEntityId(facultyProfiles[0]?.id || '');
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                scope === 'FACULTY'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-zinc-800/50 border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              <Users2 className="h-4 w-4 text-violet-400" />
              <span>Faculty Schedule</span>
            </button>

            <button
              onClick={() => {
                setScope('ROOM');
                setSelectedEntityId(rooms[0]?.id || '');
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                scope === 'ROOM'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-zinc-800/50 border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              <DoorOpen className="h-4 w-4 text-cyan-400" />
              <span>Room / Lab Schedule</span>
            </button>

            <button
              onClick={() => {
                setScope('INSTITUTE');
                setSelectedEntityId('');
              }}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                scope === 'INSTITUTE'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-zinc-800/50 border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Master Institute View</span>
            </button>
          </div>
        </div>

        {/* Entity Selector (If applicable) */}
        {scope === 'DEPARTMENT' && (
          <div className="space-y-1.5 text-xs">
            <label className="text-zinc-400">Select Department</label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {scope === 'FACULTY' && (
          <div className="space-y-1.5 text-xs">
            <label className="text-zinc-400">Select Faculty Member</label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none"
            >
              {facultyProfiles.map((f) => {
                const u = users.find((usr) => usr.id === f.user_id);
                return (
                  <option key={f.id} value={f.id}>
                    {u?.full_name || 'Prof'} ({f.employee_id})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {scope === 'ROOM' && (
          <div className="space-y-1.5 text-xs">
            <label className="text-zinc-400">Select Facility</label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full bg-zinc-800 border border-white/[0.08] rounded-xl p-2.5 text-white focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} - {r.room_name}
                </option>
              ))}
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  Lab {l.lab_code || l.lab_number} - {l.name || l.lab_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-xs font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Generate PDF Report</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Download Excel / CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
