import React from 'react';
import {
  Layers,
  ShieldCheck,
  Target,
  Sparkles,
  Users2,
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { PublicPage } from './PublicNavbar';

interface AboutPageProps {
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigate,
  onLaunchDashboard,
}) => {
  return (
    <div className="py-12 sm:py-20 space-y-20 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Manifesto Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold font-mono text-[#06B6D4] tracking-wider uppercase px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
          The Nexorg 2.1 Manifesto
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Why Higher Education Needed a Resource Engine, Not Another ERP
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          For twenty years, college enterprise software focused on accounting ledgers, fee collection, and gate access. No one solved the actual academic core: allocating professors, courses, and laboratories without clashes.
        </p>
      </div>

      {/* Two Paths Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-rose-500/20 bg-zinc-900/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <XCircle className="h-5 w-5" />
            <span>What We Strictly Refuse to Build</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Generic college ERP software becomes slow and brittle because it tries to do 30 unrelated tasks at once. We deliberately do not build:
          </p>
          <ul className="space-y-2 text-xs text-zinc-500">
            <li className="line-through">• Attendance tracking portals</li>
            <li className="line-through">• Student tuition & fee gateways</li>
            <li className="line-through">• Examination gradebook printing</li>
            <li className="line-through">• Hostel room & mess allocations</li>
            <li className="line-through">• Campus bus fleet logistics</li>
            <li className="line-through">• Faculty payroll & pension deductions</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-indigo-500/40 bg-zinc-900/60 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>What Nexorg 2.1 Perfects</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            By focusing 100% of our engineering on academic resource planning, we deliver sub-millisecond mathematical precision:
          </p>
          <ul className="space-y-2 text-xs text-zinc-200">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>Multi-Department Faculty Assignments (M:N)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>Real-Time Cross-Department Conflict Propagation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>Faculty Contract Workload Balancing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>Shared Classroom & Lecture Hall Inventory</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>GPU & Specialized Engineering Computing Labs</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#06B6D4]" />
              <span>Clash-Free Timetable Architecture</span>
            </li>
          </ul>
        </div>
      </div>

      {/* The Architectural Breakthrough */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-8 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
            Architectural Invariant
          </span>
          <h2 className="text-2xl font-bold text-white">
            The Multi-Department Mathematical Invariant
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            In modern educational institutions, interdisciplinary programs are standard. A professor in Artificial Intelligence frequently teaches in the Computer Science department, the AI & ML department, and the Information Technology department.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-indigo-500/20 font-mono text-xs text-indigo-200 space-y-2">
          <div className="text-zinc-400 font-sans text-xs">PostgreSQL Stored Procedure Constraint:</div>
          <code className="block text-zinc-300">
            IF faculty_assigned(p_faculty, 'CSE', 10:00, 11:00) THEN<br />
            &nbsp;&nbsp;lock_faculty_across_departments(['AIML', 'IT', 'ECE'], 10:00, 11:00);<br />
            END IF;
          </code>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Because this rule is modeled directly inside the normalized relational schema rather than left to human memory, no department can inadvertently double-book faculty. Academic planners achieve 100% confidence before a semester starts.
        </p>
      </div>

      {/* Institutional Security & Privacy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Database className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-white">PostgreSQL Multi-Tenancy</h4>
          <p className="text-xs text-zinc-400">
            Strict Row Level Security (RLS) guarantees total isolation between different university campuses.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Role-Based Access</h4>
          <p className="text-xs text-zinc-400">
            Discrete permission hierarchies for Institute Directors (HEAD), Department Managers (ADMIN), and Faculty.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5 space-y-2">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/15 text-[#06B6D4] flex items-center justify-center">
            <Target className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Zero ERP Bloat</h4>
          <p className="text-xs text-zinc-400">
            Ultra-fast performance because the database is never bogged down by student billing logs or bus routes.
          </p>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="text-center pt-6 space-y-4">
        <h3 className="text-2xl font-bold text-white">Experience the Future of Academic Planning</h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow-lg transition-all"
          >
            Register Institution
          </button>
          <button
            onClick={onLaunchDashboard}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-white/[0.08] transition-all"
          >
            Test Live App Demo
          </button>
        </div>
      </div>
    </div>
  );
};
