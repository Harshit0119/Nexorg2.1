import React from 'react';
import {
  Sparkles,
  Network,
  Users2,
  BookOpen,
  DoorOpen,
  ShieldCheck,
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Compass,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface OnboardingGuideProps {
  instituteName: string;
  instituteCode: string;
  departmentCount: number;
  facultyCount: number;
  subjectCount: number;
  roomCount: number;
  timetableCount: number;
  onNavigate: (tab: NavTab) => void;
  onSwitchToDemo?: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  instituteName,
  instituteCode,
  departmentCount,
  facultyCount,
  subjectCount,
  roomCount,
  timetableCount,
  onNavigate,
  onSwitchToDemo,
}) => {
  const steps = [
    {
      id: 1,
      title: 'Department Management',
      tab: 'departments' as NavTab,
      description: 'Define your academic faculties and departmental divisions (e.g. CSE, ECE, MECH).',
      icon: Network,
      isDone: departmentCount > 0,
      countLabel: `${departmentCount} department${departmentCount === 1 ? '' : 's'} configured`,
      actionLabel: departmentCount > 0 ? 'Manage Departments' : '+ Add First Department',
    },
    {
      id: 2,
      title: 'Faculty Directory & Mapping',
      tab: 'faculty' as NavTab,
      description: 'Onboard faculty members, set teaching quotas, and assign them across departments.',
      icon: Users2,
      isDone: facultyCount > 0,
      countLabel: `${facultyCount} professor${facultyCount === 1 ? '' : 's'} onboarded`,
      actionLabel: facultyCount > 0 ? 'Manage Faculty' : '+ Add Faculty Member',
    },
    {
      id: 3,
      title: 'Courses, Semesters & Subjects',
      tab: 'subjects' as NavTab,
      description: 'Add degree courses, sections, and allocate subjects with lecture/lab hours.',
      icon: BookOpen,
      isDone: subjectCount > 0,
      countLabel: `${subjectCount} subject${subjectCount === 1 ? '' : 's'} defined`,
      actionLabel: subjectCount > 0 ? 'Configure Subjects' : '+ Add Subjects',
    },
    {
      id: 4,
      title: 'Rooms & Specialized Labs',
      tab: 'rooms-labs' as NavTab,
      description: 'Register classrooms, lecture halls, and dedicated computing/science labs.',
      icon: DoorOpen,
      isDone: roomCount > 0,
      countLabel: `${roomCount} space${roomCount === 1 ? '' : 's'} registered`,
      actionLabel: roomCount > 0 ? 'Manage Facilities' : '+ Register Room/Lab',
    },
    {
      id: 5,
      title: 'Automated Timetable Engine',
      tab: 'timetable' as NavTab,
      description: 'Run the Constraint Satisfaction solver to generate clash-free master schedules.',
      icon: ShieldCheck,
      isDone: timetableCount > 0,
      countLabel: `${timetableCount} timetable${timetableCount === 1 ? '' : 's'} published`,
      actionLabel: timetableCount > 0 ? 'View Timetables' : 'Generate Timetable',
    },
  ];

  const completedCount = steps.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Clean Multi-Tenant Workspace Activated</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to {instituteName}
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Your institute workspace is ready. Nexorg 2.1 starts completely empty to ensure no mock data leaks into your live institutional database. Complete the guided setup below to establish your curriculum and scheduling engine.
            </p>
            
            <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400 font-mono">
              <span>Tenant Code: <strong className="text-indigo-400">{instituteCode}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-emerald-400">Live Production Isolated</strong></span>
            </div>
          </div>

          {/* Quick Demo Switcher if user wants to test before inputting data */}
          {onSwitchToDemo && (
            <div className="shrink-0 p-4 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-center space-y-2 lg:max-w-xs">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Want to explore first?
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Experience Nexorg with the isolated Apex demo campus dataset.
              </p>
              <button
                type="button"
                onClick={onSwitchToDemo}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white border border-white/[0.08] transition-all flex items-center justify-center gap-2"
              >
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>Open Demo Sandbox</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200">
              Setup Progress: {completedCount} of {steps.length} Milestones
            </span>
            <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5 Setup Steps Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Academic Onboarding Roadmap
        </h2>

        <div className="grid grid-cols-1 gap-3.5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border transition-all ${
                  step.isDone
                    ? 'bg-zinc-900/40 border-emerald-500/30'
                    : 'bg-zinc-900/80 border-white/[0.08] hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      step.isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                    }`}
                  >
                    {step.isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">Step {step.id}</span>
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                      {step.isDone && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                    <span className="inline-block text-[11px] font-mono text-zinc-500">
                      {step.countLabel}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex sm:justify-end">
                  <button
                    onClick={() => onNavigate(step.tab)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      step.isDone
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08]'
                        : 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md hover:opacity-95'
                    }`}
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Informational Guidance Box */}
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-4 flex items-start gap-3 text-xs text-zinc-400">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-200 font-semibold">Strict Multi-Tenant Security Guarantee:</strong> All data entered in this workspace is linked to your tenant ID (<code className="text-indigo-300 font-mono text-[11px]">{instituteCode}</code>). It is completely segregated in the database and never accessible by other institutions or demo users.
        </div>
      </div>
    </div>
  );
};
