import React, { useState } from 'react';
import { Check, Sparkles, HelpCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { PublicPage } from './PublicNavbar';

interface PricingPageProps {
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onNavigate,
  onLaunchDashboard,
}) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      id: 'starter',
      name: 'Department Starter',
      badge: 'Single School / Division',
      price: isAnnual ? 490 : 590,
      period: '/month',
      desc: 'Perfect for an engineering or technology school with cross-program faculty.',
      features: [
        'Up to 4 Academic Departments (e.g. CSE, AIML, IT, ECE)',
        'Up to 50 Faculty Multi-Department Profiles',
        'Normalized M:N Faculty Assignment Engine',
        'Physical Classroom & Lecture Hall Inventory (up to 30 rooms)',
        'Real-Time Cross-Department Clash Prevention',
        'Weekly Faculty Availability Matrix',
        'Standard Email Support (24h turnaround)',
      ],
      ctaText: 'Start Starter Pilot',
      highlighted: false,
    },
    {
      id: 'campus',
      name: 'Campus Enterprise',
      badge: 'Institutional Standard',
      price: isAnnual ? 1190 : 1390,
      period: '/month',
      desc: 'The complete academic resource operating system for multi-department campuses.',
      features: [
        'Unlimited Academic Departments',
        'Unlimited Cross-Department Faculty M:N Mapping',
        'Full Specialized Lab & GPU Cluster Inventory',
        'Aggregated Workload Balancing & Contract Compliance',
        'Real-Time Multi-Department Conflict Interlock Engine',
        'Custom Instructional Windows & Period Durations',
        'PostgreSQL 16 Multi-Tenant RLS Database Isolation',
        'Role-Based Access Control (HEAD, ADMIN, FACULTY)',
        'Priority Technical Account Manager & SLA',
      ],
      ctaText: 'Start 30-Day Campus Pilot',
      highlighted: true,
    },
    {
      id: 'university',
      name: 'University System',
      badge: 'Multi-Campus Federation',
      price: 'Custom',
      period: '',
      desc: 'Designed for state university systems or multi-campus private university trusts.',
      features: [
        'Multi-Campus Federated Tenancy Architecture',
        'Cross-Campus Faculty Traveling & Availability Modeling',
        'Dedicated Private Supabase & PostgreSQL Cluster',
        'Institutional Single Sign-On (SAML / Okta / Azure AD)',
        'Custom Timetable Optimization Heuristics & Solver Export',
        'On-Premise / Hybrid Cloud Deployment Option',
        '24/7 Dedicated Emergency Engineering Hotline',
      ],
      ctaText: 'Speak with University Solutions',
      highlighted: false,
    },
  ];

  return (
    <div className="py-12 sm:py-20 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
          Predictable Campus Licensing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple Institutional Pricing. <br />
          <span className="bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">
            Zero Per-Student Taxes.
          </span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Traditional college ERPs bill you per student head. Nexorg 2.1 is priced simply on department scale and faculty resource orchestration.
        </p>

        {/* Annual / Term Billing Switcher */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-medium ${!isAnnual ? 'text-white' : 'text-zinc-400'}`}>
            Per Academic Term
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative h-7 w-14 rounded-full bg-zinc-800 p-1 border border-white/[0.1] transition-colors focus:outline-none"
          >
            <div
              className={`h-5 w-5 rounded-full bg-indigo-500 transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-medium flex items-center gap-1.5 ${isAnnual ? 'text-white' : 'text-zinc-400'}`}>
            <span>Annual License</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-2xl border p-8 flex flex-col justify-between transition-all ${
              tier.highlighted
                ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-950/40 via-zinc-900/90 to-zinc-950/90 shadow-2xl relative ring-1 ring-indigo-500/30'
                : 'border-white/[0.08] bg-zinc-900/60 hover:border-white/[0.14]'
            }`}
          >
            {tier.highlighted && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md">
                Recommended for Universities
              </span>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{tier.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {tier.badge}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono">
                  {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                </span>
                {tier.period && (
                  <span className="text-xs text-zinc-400">{tier.period}</span>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                {tier.desc}
              </p>

              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Included Capabilities:
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => {
                  if (tier.id === 'university') onNavigate('contact');
                  else onNavigate('register');
                }}
                className={`w-full py-3 rounded-xl text-xs font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-indigo-500/25 hover:opacity-95'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/[0.08]'
                }`}
              >
                {tier.ctaText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Full Capability Matrix</h3>
          <p className="text-xs text-zinc-400">Detailed breakdown of institutional resource management features.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 font-mono">
                <th className="p-3">Resource Constraint Feature</th>
                <th className="p-3 text-center">Starter</th>
                <th className="p-3 text-center text-indigo-300">Campus Enterprise</th>
                <th className="p-3 text-center">University System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-white">Multi-Department Faculty Assignments (M:N)</td>
                <td className="p-3 text-center">Up to 4 depts</td>
                <td className="p-3 text-center text-indigo-300">Unlimited</td>
                <td className="p-3 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Real-Time Cross-Department Clash Interlock</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center text-indigo-300">✓ (Sub-millisecond)</td>
                <td className="p-3 text-center">✓ (Cross-Campus)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">GPU Computing & Specialized Labs Catalog</td>
                <td className="p-3 text-center">Basic</td>
                <td className="p-3 text-center text-indigo-300">Hardware Spec Mapping</td>
                <td className="p-3 text-center">Custom Clusters</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">Aggregated Contract Workload Balancing</td>
                <td className="p-3 text-center">Standard</td>
                <td className="p-3 text-center text-indigo-300">Real-Time Alerts</td>
                <td className="p-3 text-center">Automated Rebalancer</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-white">PostgreSQL RLS Multi-Tenancy Isolation</td>
                <td className="p-3 text-center">Shared Instance</td>
                <td className="p-3 text-center text-indigo-300">Dedicated Tenant</td>
                <td className="p-3 text-center">Isolated Cluster / On-Prem</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
