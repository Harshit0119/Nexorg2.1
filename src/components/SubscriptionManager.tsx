import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Layers,
  Zap,
  Building2,
  Users2,
  DoorOpen,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionHistory,
  SubscriptionPlanTier,
  SubscriptionBillingInterval,
  Department,
  FacultyProfile,
  Room,
  Timetable,
  UserRole,
} from '../types/database';
import { SUBSCRIPTION_PLANS, changeSubscriptionPlan } from '../services/saasService';

interface SubscriptionManagerProps {
  currentRole: UserRole;
  subscription: Subscription;
  billingHistory: SubscriptionHistory[];
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  rooms: Room[];
  timetables: Timetable[];
  onSubscriptionUpdated: (updated: Subscription) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  currentRole,
  subscription,
  billingHistory,
  departments,
  facultyProfiles,
  rooms,
  timetables,
  onSubscriptionUpdated,
}) => {
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval>('MONTHLY');
  const [selectedTierForConfirm, setSelectedTierForConfirm] = useState<SubscriptionPlanTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePlanSelect = async (tier: SubscriptionPlanTier) => {
    if (tier === subscription.plan_tier) return;
    setIsProcessing(true);
    setNotice(null);

    try {
      const res = await changeSubscriptionPlan(subscription.institute_id, tier, billingInterval);
      if (res.success) {
        onSubscriptionUpdated(res.subscription);
        setNotice({
          type: 'success',
          message: `Successfully updated subscription plan to ${SUBSCRIPTION_PLANS[tier].name}!`,
        });
        setSelectedTierForConfirm(null);
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: `Plan update failed: ${err.message || 'Unknown billing error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Usage Limit Gauges
  const deptPct = Math.round((departments.length / subscription.max_departments) * 100);
  const facultyPct = Math.round((facultyProfiles.length / subscription.max_faculty) * 100);
  const roomsPct = Math.round((rooms.length / subscription.max_rooms) * 100);
  const ttPct = Math.round((timetables.length / subscription.max_timetables) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[#4F46E5]" />
              Subscription & Multi-Tenant Plan Governance
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {subscription.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Scale institutional quotas, manage tier upgrades, review billing invoices, and enforce capacity ceilings.
          </p>
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center p-1 bg-zinc-900 border border-white/[0.08] rounded-xl text-xs">
          <button
            onClick={() => setBillingInterval('MONTHLY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              billingInterval === 'MONTHLY' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingInterval('ANNUAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              billingInterval === 'ANNUAL' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Annual (Save 20%)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">SAVE</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. CURRENT ACTIVE PLAN & USAGE LIMITS RIBBON */}
      {/* ===================================================================== */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <span className="text-[11px] font-mono text-zinc-400">Current Subscription</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-bold text-white">
                {SUBSCRIPTION_PLANS[subscription.plan_tier].name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                ${subscription.amount} / {subscription.billing_interval.toLowerCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Next billing cycle renews on{' '}
              <strong className="text-zinc-200">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400">Tenant Status</span>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active & Provisioned
              </div>
            </div>
          </div>
        </div>

        {/* Live Resource Limits Progress Gauges */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Live Resource Quota Utilization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Departments Quota */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                  Departments
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {departments.length} / {subscription.max_departments}
                </span>
              </div>
              <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${deptPct >= 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, deptPct)}%` }}
                />
              </div>
            </div>

            {/* Faculty Quota */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Users2 className="h-3.5 w-3.5 text-violet-400" />
                  Faculty Members
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {facultyProfiles.length} / {subscription.max_faculty}
                </span>
              </div>
              <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${facultyPct >= 100 ? 'bg-rose-500' : 'bg-violet-500'}`}
                  style={{ width: `${Math.min(100, facultyPct)}%` }}
                />
              </div>
            </div>

            {/* Rooms Quota */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-cyan-400" />
                  Rooms & Labs
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {rooms.length} / {subscription.max_rooms}
                </span>
              </div>
              <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${roomsPct >= 100 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, roomsPct)}%` }}
                />
              </div>
            </div>

            {/* Timetables Quota */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-emerald-400" />
                  Timetable Drafts
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {timetables.length} / {subscription.max_timetables}
                </span>
              </div>
              <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${ttPct >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, ttPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. PLAN COMPARISON TIERS (FREE, STARTER, PRO, ENTERPRISE) */}
      {/* ===================================================================== */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-white">Select Institutional Subscription Tier</h2>
          <p className="text-xs text-zinc-400">Upgrade or downgrade anytime. Changes apply immediately to resource limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanTier[]).map((tierKey) => {
            const plan = SUBSCRIPTION_PLANS[tierKey];
            const isCurrent = subscription.plan_tier === tierKey;
            const price = billingInterval === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <div
                key={tierKey}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                  isCurrent
                    ? 'bg-zinc-900 border-indigo-500 ring-2 ring-indigo-500/20'
                    : plan.popular
                    ? 'bg-zinc-900/80 border-indigo-500/40 hover:border-indigo-500'
                    : 'bg-zinc-900/50 border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">{plan.name}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500 text-white">
                        ACTIVE
                      </span>
                    )}
                    {!isCurrent && plan.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-white">${price}</span>
                    <span className="text-xs text-zinc-400">/{billingInterval === 'MONTHLY' ? 'mo' : 'yr'}</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed min-h-[36px]">{plan.description}</p>

                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-zinc-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-not-allowed text-center"
                    >
                      Current Plan
                    </button>
                  ) : currentRole !== 'HEAD' && currentRole !== 'SUPER_ADMIN' ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-medium cursor-not-allowed text-center"
                    >
                      Head Role Required
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(tierKey)}
                      disabled={isProcessing}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95'
                          : 'bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08]'
                      }`}
                    >
                      <span>{price > (subscription.amount || 0) ? 'Upgrade to ' + plan.name : 'Switch to ' + plan.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. BILLING & INVOICE HISTORY TABLE */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Billing History & Invoices</h3>
            <p className="text-xs text-zinc-400">Official tax invoices and past payment records</p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{billingHistory.length} Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-800/40 text-zinc-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Invoice Number</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 rounded-r-lg text-right">PDF Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {billingHistory.map((hist) => (
                <tr key={hist.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono font-medium text-zinc-200">{hist.invoice_number}</td>
                  <td className="py-3 px-3 text-zinc-400">{new Date(hist.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-zinc-300">{hist.notes || hist.event_type}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-200 font-bold">${hist.amount}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400">
                      Paid
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => alert(`Downloading invoice ${hist.invoice_number}...`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
