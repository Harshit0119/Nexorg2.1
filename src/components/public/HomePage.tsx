import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Users2,
  Network,
  Clock,
  CheckCircle2,
  XCircle,
  DoorOpen,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  Zap,
  Building2,
  Calendar,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { PublicPage } from './PublicNavbar';

interface HomePageProps {
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onLaunchDashboard,
}) => {
  // Conflict Demo state inside Hero/Section
  const [demoSelectedDept, setDemoSelectedDept] = useState<'AIML' | 'IT'>('AIML');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How is Nexorg 2.1 fundamentally different from traditional college ERPs?',
      a: 'College ERPs were built as generic administrative accounting tools for fee collection, student attendance, bus routes, and hostel room bookings. They treat academic timetables as basic static forms with zero constraint satisfaction algorithms. Nexorg 2.1 is NOT an ERP: we are a specialized Academic Resource Planning engine engineered purely to solve the combinatorial problem of multi-department faculty scheduling, shared laboratory allocations, and mathematically guaranteed clash prevention.'
    },
    {
      q: 'How does the many-to-many faculty architecture solve cross-department conflicts?',
      a: 'In modern universities, specialized faculty (such as AI or Distributed Systems professors) teach across multiple departments like CSE, AIML, and IT. Traditional software models faculty inside a single department bucket. Nexorg uses a normalized many-to-many relationship (faculty_department_assignments). If Professor Rahul is assigned to CSE on Monday 10:00–11:00 AM, our engine instantly projects a hard cross-department lock across AIML and IT, blocking simultaneous bookings before they occur.'
    },
    {
      q: 'Can Nexorg prevent room and specialized computing lab double-bookings?',
      a: 'Yes. Nexorg models rooms (lecture halls, tiered auditoriums, smart classrooms) and computing labs (GPU clusters, hardware security testbeds) as shared institutional resources. Even if departments plan their curriculum independently, room collisions are detected and locked across all departments in real time.'
    },
    {
      q: 'Does Nexorg handle faculty contract workload balancing?',
      a: 'Absolutely. A professor might teach 6 hours in CSE, 5 hours in AIML, and 4 hours in IT. Nexorg aggregates teaching hours across all departmental assignments simultaneously and alerts academic heads if a faculty exceeds their contractual weekly threshold (e.g. 18 hours/week) or falls below minimal instructional quotas.'
    },
    {
      q: 'Is Nexorg ready for institutional deployment on cloud or hybrid infrastructure?',
      a: 'Yes. Nexorg 2.1 is architected on PostgreSQL 16 with Supabase multi-tenant Row Level Security (RLS) and Next.js 15 Edge Middleware. Tenancy isolation is enforced at the database level, ensuring complete privacy and isolation between institutions.'
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-20 pb-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[700px] rounded-full bg-gradient-to-tr from-[#4F46E5]/25 via-[#7C3AED]/20 to-[#06B6D4]/15 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 relative z-10 space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/[0.1] text-xs shadow-lg backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-[#06B6D4] animate-pulse" />
            <span className="text-zinc-300 font-medium">Nexorg 2.1 is Released</span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400 font-mono text-[11px] font-semibold">NOT an ERP</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            AI-Powered Academic <br />
            <span className="bg-gradient-to-r from-[#4F46E5] via-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">
              Resource Planning
            </span> Platform
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
            Eliminate scheduling chaos forever. Model multi-department faculty, balance instructional workloads, and guarantee 100% clash-free academic timetables.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all active:scale-98"
            >
              <Sparkles className="h-4 w-4 text-[#06B6D4]" />
              <span>Start Free Institution Trial</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onLaunchDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 px-6 py-3.5 text-sm font-semibold text-zinc-200 border border-white/[0.1] shadow-lg transition-all"
            >
              <Play className="h-4 w-4 text-[#06B6D4] fill-[#06B6D4]" />
              <span>Explore Live Platform</span>
            </button>
          </div>

          {/* Trust Banner */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Deterministic Conflict Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-400" />
              <span>Multi-Dept Faculty M:N Mapping</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#06B6D4]" />
              <span>Shared GPU & Computing Labs</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Showcase Mockup */}
        <div className="max-w-6xl mx-auto mt-12 px-4 sm:px-6 relative">
          <div className="rounded-2xl border border-white/[0.12] bg-zinc-950/80 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
            {/* Top Bar of Mockup */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] text-xs text-zinc-400 mb-3">
              <div className="flex items-center gap-2 font-mono">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-zinc-500 ml-2">nexorg://resource-kernel/cross-dept-matrix</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] font-mono border border-emerald-800/50">
                Cross-Dept Locks: 100% Active
              </span>
            </div>

            {/* Mockup Content: Visualizing the Rahul Case */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-2 sm:p-4 bg-zinc-900/40 rounded-xl">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center font-mono">
                    RS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Prof. Rahul Sharma</h4>
                    <span className="text-[11px] text-zinc-400">Assigned across CSE, AIML & IT</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono pt-2 border-t border-white/[0.06]">
                  <div className="flex justify-between text-zinc-400">
                    <span>CSE Dept:</span>
                    <span className="text-indigo-400 font-bold">6 hrs/wk (Primary)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>AIML Dept:</span>
                    <span className="text-purple-400 font-bold">5 hrs/wk (Joint)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>IT Dept:</span>
                    <span className="text-cyan-400 font-bold">4 hrs/wk (Joint)</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-4 rounded-xl bg-zinc-900/90 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Real-Time Cross-Department Interlock</span>
                  </span>
                  <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                    Automatic Conflict Block
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200">
                  <strong>Monday 10:00 AM – 11:00 AM:</strong> Rahul is lecturing in <strong className="text-white">CSE (CS301)</strong> in Room LH-101.
                  <span className="block text-zinc-400 text-[11px] mt-1">
                    Nexorg immediately marks Rahul as <strong className="text-rose-300">LOCKED</strong> in AIML and IT. Simultaneous double-booking is mathematically impossible.
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={onLaunchDashboard}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>Test this live in Simulator</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE PROBLEM STATEMENT: WHY ERPS FAIL */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-rose-400 tracking-wider uppercase px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20">
            The Fundamental Architectural Flaw
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Why Traditional College ERPs Fail at Academic Resource Planning
          </h2>
          <p className="text-sm text-zinc-400">
            Higher education institutions spend millions on bloated ERPs, yet departmental heads still juggle timetables on Excel spreadsheets and WhatsApp groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legacy ERP Flaws */}
          <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-950/15 to-zinc-950/60 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="h-5 w-5" />
              <span>Generic College ERPs (Legacy Bloat)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Designed as accounting ledgers with bolted-on timetable forms. They assume every faculty member belongs to exactly one department and can only teach one cohort.
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span><strong>No Multi-Department Faculty Support:</strong> Cannot handle professors teaching CSE and AIML simultaneously.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span><strong>Silent Double-Bookings:</strong> CSE schedules Professor Rahul; AIML schedules him at the exact same hour with zero warnings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span><strong>Room & Lab Collisions:</strong> Physics and Computer Science claim the same smart lecture hall at 11:00 AM.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span><strong>Unchecked Overload:</strong> Faculty assigned 28 hours across 3 departments with no contract compliance checks.</span>
              </li>
            </ul>
          </div>

          {/* Nexorg 2.1 Solution */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-zinc-950/60 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Nexorg 2.1 (Deterministic Resource Engine)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Purpose-built mathematical resource planner. Multi-tenant database with strict relational many-to-many architecture and instant conflict propagation.
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <span><strong>Normalized M:N Faculty Schema:</strong> A professor holds primary and joint appointments across unlimited departments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <span><strong>Real-Time Cross-Dept Locks:</strong> Scheduling a slot in one department immediately locks all other departments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <span><strong>Shared Physical & Lab Pools:</strong> Shared lecture halls and GPU laboratories managed with zero collisions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#06B6D4] shrink-0 mt-0.5" />
                <span><strong>Aggregated Contract Balancing:</strong> Real-time workload meters prevent burnout and ensure university policy compliance.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CORE BENEFITS & FEATURES */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
            Dedicated Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Engineered Exclusively for Academic Resource Planning
          </h2>
          <p className="text-sm text-zinc-400">
            No bloated modules. Only the tools required to orchestrate departments, faculty, facilities, and conflict-free schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              <Users2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Faculty Management (M:N)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Model cross-department teaching appointments without duplicating profiles or breaking university payroll records.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Network className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Department Management</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Empower departmental heads with autonomous curriculum allocation while maintaining campus-wide resource visibility.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-[#06B6D4]">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Workload Balancing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Aggregate theory lectures, lab practicals, and tutorial hours across all departments into unified faculty meters.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <DoorOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Smart Room Allocation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Manage smart classrooms, tiered lecture halls, and seminar spaces with capacity constraints and cross-dept sharing.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Specialized Lab Management</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Optimize GPU clusters, network security testbeds, and engineering workstations with hardware specification tags.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-[#4F46E5]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Clash-Free Timetable AI</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deterministic constraint evaluation preventing faculty clashes, room overlaps, and student section bottlenecks.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (4 STEPS) */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold font-mono text-[#06B6D4] tracking-wider uppercase px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
            Streamlined Onboarding
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            How Nexorg 2.1 Orchestrates Your Campus
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Onboard Institution',
              desc: 'Configure academic calendar, working days, campus hours, and define independent department divisions (CSE, AIML, IT).',
            },
            {
              step: '02',
              title: 'Map Multi-Dept Faculty',
              desc: 'Create faculty profiles and assign joint appointments with primary and secondary department relationships.',
            },
            {
              step: '03',
              title: 'Inventory Rooms & Labs',
              desc: 'Catalog physical lecture halls, seating capacities, projector facilities, and specialized computing equipment.',
            },
            {
              step: '04',
              title: 'Verify Clash-Free Slots',
              desc: 'Simulate slot proposals with instant cross-department verification and zero double-booking tolerance.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-3 relative group hover:border-indigo-500/50 transition-all"
            >
              <div className="text-3xl font-extrabold font-mono text-zinc-700 group-hover:text-indigo-400 transition-colors">
                {item.step}
              </div>
              <h4 className="text-base font-bold text-white">{item.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE FACULTY CONFLICT SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-indigo-500/40 bg-zinc-900/90 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur">
          <div className="space-y-4 max-w-3xl">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#4F46E5] text-white">
              The Real-World Business Scenario
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Professor Rahul Teaches CSE, AIML & IT
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              If Rahul is assigned a lecture in <strong className="text-white">CSE from 10:00 AM to 11:00 AM</strong>, how does Nexorg prevent AIML or IT from scheduling him at the exact same hour?
            </p>

            {/* Interactive Toggle */}
            <div className="pt-4 flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-medium">Test conflicting department booking:</span>
              <div className="flex rounded-lg bg-zinc-800 p-1 border border-white/[0.08]">
                <button
                  onClick={() => setDemoSelectedDept('AIML')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    demoSelectedDept === 'AIML'
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Attempt in AIML
                </button>
                <button
                  onClick={() => setDemoSelectedDept('IT')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    demoSelectedDept === 'IT'
                      ? 'bg-cyan-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Attempt in IT
                </button>
              </div>
            </div>

            {/* Engine Simulation Output */}
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-2 mt-4">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                <span>CROSS-DEPARTMENT CONFLICT BLOCKED AUTOMATICALLY</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Slot proposal for {demoSelectedDept} (Monday 10:00–11:00 AM) rejected. Professor Rahul Sharma is already committed to Department: <strong>CSE (CS301 - Advanced Data Structures)</strong> in Room LH-101.
              </p>
              <div className="text-[10px] font-mono text-zinc-400 pt-1">
                PostgreSQL Trigger check_faculty_clash() status: HARD_LOCK_ENFORCED
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onLaunchDashboard}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#06B6D4] hover:text-cyan-300"
              >
                <span>Launch Interactive Simulator to test all slot combinations &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TIMETABLE AUTOMATION SHOWCASE */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Manual Scheduling vs. Nexorg 2.1
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-zinc-900/60">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-zinc-900/90 text-zinc-400 font-mono">
                <th className="p-4">Operational Capability</th>
                <th className="p-4 text-rose-400">Legacy College ERP / Excel</th>
                <th className="p-4 text-emerald-400">Nexorg 2.1 Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr>
                <td className="p-4 font-semibold text-white">Faculty Multi-Department Appointments</td>
                <td className="p-4 text-zinc-400">Single department lock; duplicates faculty profile</td>
                <td className="p-4 text-emerald-300 font-medium">True normalized Many-to-Many relational mapping</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Cross-Department Conflict Detection</td>
                <td className="p-4 text-zinc-400">None; departments operate in blind silos</td>
                <td className="p-4 text-emerald-300 font-medium">Real-time lock across CSE, AIML, IT & ECE</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Shared Computing Lab Management</td>
                <td className="p-4 text-zinc-400">Manual phone calls; constant double bookings</td>
                <td className="p-4 text-emerald-300 font-medium">Unified lab inventory with hardware specs (e.g. RTX 4090s)</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Faculty Contract Overload Prevention</td>
                <td className="p-4 text-zinc-400">Untracked across departmental boundaries</td>
                <td className="p-4 text-emerald-300 font-medium">Real-time weekly capacity meters (max 18 hrs)</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Database Security & Tenancy</td>
                <td className="p-4 text-zinc-400">Legacy shared schemas without RLS</td>
                <td className="p-4 text-emerald-300 font-medium">PostgreSQL 16 Multi-Tenant Row Level Security</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-emerald-400 tracking-wider uppercase px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            Validated by Academia
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Trusted by Deans & Academic Directors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-4">
            <p className="text-xs text-zinc-300 italic leading-relaxed">
              "We have 40 professors teaching across Computer Science, Artificial Intelligence, and Data Science. Our legacy ERP caused hundreds of clashes every semester. Nexorg solved our cross-department lock on day one."
            </p>
            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                DK
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dr. K. Ramanathan</div>
                <div className="text-[11px] text-zinc-400">Dean of Engineering, Apex Institute</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-4">
            <p className="text-xs text-zinc-300 italic leading-relaxed">
              "Nexorg is refreshingly fast because it isn't weighed down by fee portals or hostel records. It does one thing with absolute mathematical perfection: academic resource planning."
            </p>
            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                SM
              </div>
              <div>
                <div className="text-xs font-bold text-white">Prof. Sneha Mukherjee</div>
                <div className="text-[11px] text-zinc-400">HoD Computer Science & Eng.</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-4">
            <p className="text-xs text-zinc-300 italic leading-relaxed">
              "The workload balancer prevented faculty burnout during our accreditation audit. We could prove exactly how teaching hours were distributed across all joint appointments."
            </p>
            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                VA
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dr. Vivek Agarwal</div>
                <div className="text-[11px] text-zinc-400">Director of Academic Affairs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING PREVIEW */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
            Institutional Licensing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Transparent Pricing for Institutions
          </h2>
          <p className="text-sm text-zinc-400">
            Predictable annual licensing based on academic departments, not per-student taxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-4">
            <div className="text-sm font-bold text-white">Department Starter</div>
            <div className="text-3xl font-extrabold font-mono text-white">$490 <span className="text-xs font-normal text-zinc-400">/mo billed annually</span></div>
            <p className="text-xs text-zinc-400">Ideal for single engineering or business schools.</p>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.06]">
              <li>✓ Up to 4 Academic Departments</li>
              <li>✓ 40 Faculty Multi-Dept Profiles</li>
              <li>✓ Shared Room & Lab Inventory</li>
              <li>✓ Deterministic Conflict Checker</li>
            </ul>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Tier 2 (Highlighted) */}
          <div className="rounded-2xl border border-indigo-500/60 bg-gradient-to-b from-indigo-950/30 to-zinc-950/80 p-6 space-y-4 shadow-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4F46E5] text-white">
              Most Popular Academic Tier
            </span>
            <div className="text-sm font-bold text-white">Campus Enterprise</div>
            <div className="text-3xl font-extrabold font-mono text-white">$1,190 <span className="text-xs font-normal text-zinc-400">/mo billed annually</span></div>
            <p className="text-xs text-zinc-300">Complete multi-department collegiate resource planning.</p>
            <ul className="space-y-2 text-xs text-zinc-200 pt-2 border-t border-white/[0.06]">
              <li>✓ Unlimited Academic Departments</li>
              <li>✓ Unlimited Cross-Dept Faculty Mapping</li>
              <li>✓ Full GPU & Specialized Lab Manager</li>
              <li>✓ Real-Time Workload Balancing</li>
              <li>✓ PostgreSQL RLS Database Isolation</li>
            </ul>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow-lg transition-all"
            >
              Start 30-Day Campus Pilot
            </button>
          </div>

          {/* Tier 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 space-y-4">
            <div className="text-sm font-bold text-white">University System</div>
            <div className="text-3xl font-extrabold font-mono text-white">Custom <span className="text-xs font-normal text-zinc-400">multi-campus</span></div>
            <p className="text-xs text-zinc-400">For multi-campus state and private universities.</p>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-white/[0.06]">
              <li>✓ Multi-Campus Federated Tenancy</li>
              <li>✓ Custom AI Timetable Heuristics</li>
              <li>✓ Dedicated Supabase Cluster</li>
              <li>✓ 99.99% Enterprise SLA</li>
            </ul>
            <button
              onClick={() => onNavigate('contact')}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all"
            >
              Contact University Sales
            </button>
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            onClick={() => onNavigate('pricing')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 mx-auto"
          >
            <span>View Full Feature Comparison & Licensing Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQS */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold font-mono text-zinc-400 tracking-wider uppercase px-2.5 py-1 rounded bg-zinc-800">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-white/[0.08] bg-zinc-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-indigo-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="relative rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-zinc-900 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              End Academic Scheduling Clashes This Semester
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Join leading higher education institutes using Nexorg 2.1 to orchestrate cross-department faculty, labs, and clash-free academic timetables.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-6 py-3.5 text-xs font-semibold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all"
              >
                <Sparkles className="h-4 w-4 text-[#06B6D4]" />
                <span>Onboard Your Institution</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={onLaunchDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 px-6 py-3.5 text-xs font-semibold text-zinc-200 border border-white/[0.1] transition-all"
              >
                <span>Launch Interactive Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
