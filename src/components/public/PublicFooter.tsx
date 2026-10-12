import React from 'react';
import { Layers, ShieldCheck, Heart, Sparkles, ArrowUpRight } from 'lucide-react';
import { PublicPage } from './PublicNavbar';

interface PublicFooterProps {
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigate,
  onLaunchDashboard,
}) => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0A] pt-16 pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/[0.08]">
          {/* Brand & Manifesto */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-md shadow-indigo-500/20">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-lg font-mono">
                NEXORG <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2.1</span>
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              The AI-Powered Academic Resource Planning Platform for higher education. 
              <strong className="text-zinc-200 block mt-1">Nexorg is NOT a college ERP.</strong> 
              We focus entirely on solving the complex math of conflict-free academic resource allocation.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Deterministic Clash-Free Engine Active
              </span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Platform
            </div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={onLaunchDashboard} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Interactive App</span>
                  <ArrowUpRight className="h-3 w-3 text-[#06B6D4]" />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  The Nexorg Manifesto
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Request Campus Pilot
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Core Engine
            </div>
            <ul className="space-y-2 text-zinc-400">
              <li>Multi-Dept Faculty M:N</li>
              <li>Cross-Department Lock</li>
              <li>Workload Balancer</li>
              <li>Room & Computing Labs</li>
              <li>PostgreSQL RLS Multi-Tenancy</li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
              What We Do NOT Build
            </div>
            <ul className="space-y-2 text-zinc-500">
              <li className="line-through">No Attendance Systems</li>
              <li className="line-through">No Fee Collection</li>
              <li className="line-through">No Exam Portals</li>
              <li className="line-through">No Hostel & Mess</li>
              <li className="line-through">No Transport Logistics</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Nexorg 2.1 Systems. Enterprise Academic Resource Planning.
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('about')} className="hover:text-zinc-300">
              Security & RLS Architecture
            </button>
            <button onClick={() => onNavigate('contact')} className="hover:text-zinc-300">
              Privacy & Institutional Data
            </button>
            <button onClick={onLaunchDashboard} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Open App Console &rarr;
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
