import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Network,
  Clock,
  Settings,
  ShieldCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Institute, InstituteType, AcademicDay } from '../types/database';
import { instituteSetupSchema } from '../lib/validations';

interface InstituteSetupWizardProps {
  onComplete: (instituteData: Partial<Institute>, initialDepts: string[]) => void;
  onCancel?: () => void;
}

const ALL_DAYS: AcademicDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const InstituteSetupWizard: React.FC<InstituteSetupWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Profile
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instituteType, setInstituteType] = useState<InstituteType>('TECHNOLOGY_INSTITUTE');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [timezone, setTimezone] = useState('Asia/Kolkata (UTC+05:30)');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2: Initial Departments
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'Computer Science & Engineering (CSE)',
    'Artificial Intelligence & Machine Learning (AIML)',
    'Information Technology (IT)',
  ]);
  const [customDeptInput, setCustomDeptInput] = useState('');

  // Step 3: Operational Controls
  const [workingDays, setWorkingDays] = useState<AcademicDay[]>(ALL_DAYS);
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('17:00:00');
  const [periodDuration, setPeriodDuration] = useState(60);
  const [maxHours, setMaxHours] = useState(18);

  const [stepError, setStepError] = useState<string | null>(null);

  const availablePresetDepts = [
    'Computer Science & Engineering (CSE)',
    'Artificial Intelligence & Machine Learning (AIML)',
    'Information Technology (IT)',
    'Electronics & Communication Engineering (ECE)',
    'Data Science & Analytics (DSA)',
    'Mechanical Engineering (MECH)',
    'Robotics & Automation (ROB)',
  ];

  const toggleDay = (day: AcademicDay) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== dept));
      }
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const handleAddCustomDept = () => {
    if (customDeptInput.trim() && !selectedDepts.includes(customDeptInput.trim())) {
      setSelectedDepts([...selectedDepts, customDeptInput.trim()]);
      setCustomDeptInput('');
    }
  };

  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!name.trim() || name.length < 3) {
        setStepError('Please enter a valid institution name (minimum 3 characters).');
        return;
      }
      if (!code.trim() || code.length < 2) {
        setStepError('Please enter a valid uppercase code (e.g. MIT-ENG).');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedDepts.length === 0) {
        setStepError('Please select or add at least one department division.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (workingDays.length === 0) {
        setStepError('Please select at least one instructional working day.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleFinish = () => {
    onComplete(
      {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        institute_type: instituteType,
        academic_year: academicYear,
        timezone,
        address,
        website: website || undefined,
        settings: {
          working_days: workingDays,
          day_start_time: startTime,
          day_end_time: endTime,
          period_duration_minutes: Number(periodDuration),
          max_consecutive_faculty_hours: 3,
          default_faculty_max_hours: Number(maxHours),
        },
      },
      selectedDepts
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
          Institution Onboarding Wizard
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Provision Academic Institution Workspace
        </h1>
        <p className="text-xs text-zinc-400">
          Configure multi-tenant tenancy parameters, academic calendar, and initial department architecture.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-4 gap-2 border-b border-white/[0.08] pb-4">
        {[
          { num: 1, label: 'Institution Profile' },
          { num: 2, label: 'Departments Pool' },
          { num: 3, label: 'Operational Controls' },
          { num: 4, label: 'Verify & Provision' },
        ].map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div key={step.num} className="text-center space-y-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]'
                    : 'bg-zinc-800'
                }`}
              />
              <span
                className={`text-[11px] font-medium block truncate ${
                  isCurrent ? 'text-white font-bold' : isDone ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                {step.num}. {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {stepError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Step Content Container */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-6 sm:p-8 backdrop-blur shadow-2xl">
        {/* Step 1: Legal Entity & Classification */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Legal Institution Identity</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Specify institutional legal accreditation and campus identifier</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-zinc-400 font-medium mb-1">Institution Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford School of Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Tenant Code (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="STAN-ENG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  placeholder="2025-2026"
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
                  placeholder="Asia/Kolkata (UTC+05:30)"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Campus Physical Address</label>
              <input
                type="text"
                placeholder="450 Serra Mall, Stanford, CA 94305"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Departments */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="h-4 w-4 text-[#06B6D4]" />
                <span>Academic Department Architecture</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Select or add academic divisions that share faculty and laboratory facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availablePresetDepts.map((d) => {
                const isSelected = selectedDepts.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDept(d)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                        : 'bg-zinc-800/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="truncate">{d}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-[#06B6D4] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Dept */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Type custom division (e.g. Electrical & Computer Eng - ECE)"
                value={customDeptInput}
                onChange={(e) => setCustomDeptInput(e.target.value)}
                className="flex-1 rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomDept}
                className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-white/[0.08]"
              >
                Add Custom
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Operational Controls */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-400" />
                <span>Academic Operational Parameters</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Timetable slots duration, weekly working days, and faculty limits</p>
            </div>

            {/* Working days */}
            <div>
              <label className="block text-zinc-400 font-medium mb-2">Instructional Working Days</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${
                        isChecked
                          ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-zinc-800 border-white/[0.06] text-zinc-500'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Campus Start Time</label>
                <input
                  type="time"
                  value={startTime.slice(0, 5)}
                  onChange={(e) => setStartTime(e.target.value + ':00')}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Campus End Time</label>
                <input
                  type="time"
                  value={endTime.slice(0, 5)}
                  onChange={(e) => setEndTime(e.target.value + ':00')}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Period Length (Mins)</label>
                <input
                  type="number"
                  min={30}
                  max={120}
                  value={periodDuration}
                  onChange={(e) => setPeriodDuration(Number(e.target.value))}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Max Faculty Load</label>
                <input
                  type="number"
                  min={8}
                  max={30}
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Verification & Tenant Provision */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Review & Confirm Workspace Provisioning</span>
              </h3>
              <p className="text-[11px] text-zinc-400">PostgreSQL 16 multi-tenant partition and RLS security enforcement</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Tenant Summary</span>
                <div className="font-bold text-white text-sm">{name}</div>
                <div className="font-mono text-indigo-400 text-xs">Code: {code}</div>
                <div className="text-zinc-400 text-[11px]">Type: {instituteType.replace('_', ' ')}</div>
                <div className="text-zinc-400 text-[11px]">Academic Year: {academicYear}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Resource Parameters</span>
                <div className="text-zinc-300 font-mono text-xs">
                  {workingDays.length} Working Days • {startTime.slice(0, 5)} - {endTime.slice(0, 5)}
                </div>
                <div className="text-zinc-400 text-[11px]">Period Duration: {periodDuration} mins</div>
                <div className="text-zinc-400 text-[11px]">Default Max Workload: {maxHours} hrs/week</div>
                <div className="text-emerald-400 text-[11px] font-mono">RLS Isolation: ENFORCED</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px] space-y-1">
              <span className="font-bold block">Provisioning {selectedDepts.length} Academic Divisions:</span>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedDepts.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:opacity-95"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Provision & Launch Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
