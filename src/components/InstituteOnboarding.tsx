import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Calendar,
  Save,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Settings,
  Globe,
  MapPin
} from 'lucide-react';
import { Institute, AcademicDay, InstituteType } from '../types/database';

interface InstituteOnboardingProps {
  institute: Institute;
  onUpdateInstitute: (updated: Partial<Institute>) => void;
}

const ALL_DAYS: AcademicDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const InstituteOnboarding: React.FC<InstituteOnboardingProps> = ({
  institute,
  onUpdateInstitute,
}) => {
  const [name, setName] = useState(institute.name);
  const [code, setCode] = useState(institute.code);
  const [instituteType, setInstituteType] = useState<InstituteType>(
    institute.institute_type || 'TECHNOLOGY_INSTITUTE'
  );
  const [academicYear, setAcademicYear] = useState(institute.academic_year);
  const [timezone, setTimezone] = useState(institute.timezone);
  const [address, setAddress] = useState(institute.address || '');
  const [website, setWebsite] = useState(institute.website || '');
  const [workingDays, setWorkingDays] = useState<AcademicDay[]>(
    institute.settings?.working_days || ALL_DAYS
  );
  const [startTime, setStartTime] = useState(institute.settings?.day_start_time || '09:00:00');
  const [endTime, setEndTime] = useState(institute.settings?.day_end_time || '17:00:00');
  const [periodDuration, setPeriodDuration] = useState(
    institute.settings?.period_duration_minutes || 60
  );
  const [maxHours, setMaxHours] = useState(
    institute.settings?.default_faculty_max_hours || 18
  );
  const [isSaved, setIsSaved] = useState(false);

  const toggleDay = (day: AcademicDay) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstitute({
      name,
      code,
      institute_type: instituteType,
      academic_year: academicYear,
      timezone,
      address,
      website,
      settings: {
        ...institute.settings,
        working_days: workingDays,
        day_start_time: startTime,
        day_end_time: endTime,
        period_duration_minutes: Number(periodDuration),
        default_faculty_max_hours: Number(maxHours),
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Institute Onboarding & Master Parameters
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Institutional tenancy profile, academic calendar timeline, and cross-department scheduling constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Tenant: {institute.code}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Tenancy Information */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>Institution Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Institution Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Institution Code (Tenant ID)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Institution Classification</label>
              <select
                value={instituteType}
                onChange={(e) => setInstituteType(e.target.value as InstituteType)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="TECHNOLOGY_INSTITUTE">Technology Institute</option>
                <option value="ENGINEERING_COLLEGE">Engineering College</option>
                <option value="UNIVERSITY">University Campus</option>
                <option value="AUTONOMOUS_CAMPUS">Autonomous Campus</option>
                <option value="BUSINESS_SCHOOL">Business School</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Current Academic Year</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Campus Timezone</label>
              <input
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 font-medium mb-1">Campus Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Global Operational Constraints */}
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#06B6D4]" />
            <span>Academic Operational Parameters</span>
          </h3>

          {/* Working Days */}
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-2">
              Instructional Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/60 text-indigo-300'
                        : 'bg-zinc-800/60 border-white/[0.06] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Campus Start Time</label>
              <input
                type="time"
                value={startTime.slice(0, 5)}
                onChange={(e) => setStartTime(e.target.value + ':00')}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Campus End Time</label>
              <input
                type="time"
                value={endTime.slice(0, 5)}
                onChange={(e) => setEndTime(e.target.value + ':00')}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Period Duration (Mins)</label>
              <input
                type="number"
                min={30}
                max={120}
                value={periodDuration}
                onChange={(e) => setPeriodDuration(Number(e.target.value))}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Default Max Faculty Hrs/Wk</label>
              <input
                type="number"
                min={10}
                max={30}
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Parameters synchronized with institutional database
              </span>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Master Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
