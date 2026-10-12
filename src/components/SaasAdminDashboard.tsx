import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  Power,
  PowerOff,
} from 'lucide-react';
import {
  TenantOverviewItem,
  getAllTenants,
  toggleTenantStatus,
} from '../services/saasService';
import { InstituteStatus, SubscriptionPlanTier } from '../types/database';

export const SaasAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<TenantOverviewItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    getAllTenants().then(setTenants);
  }, []);

  const totalMRR = tenants.reduce((sum, t) => sum + (t.status === 'ACTIVE' ? t.monthly_revenue : 0), 0);
  const activeTenantsCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalFacultyAcrossTenants = tenants.reduce((sum, t) => sum + t.faculty_count, 0);

  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlan = selectedPlan === 'ALL' || t.plan_tier === selectedPlan;
    const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const handleToggleStatus = async (tenantId: string, currentStatus: InstituteStatus) => {
    const newStatus: InstituteStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await toggleTenantStatus(tenantId, newStatus);
    if (res.success) {
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: res.updatedStatus } : t))
      );
      setStatusNotice(`Institute status successfully changed to ${res.updatedStatus}.`);
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
              SaaS Super Administrator Governance Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Cross-Tenant Root Access
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Monitor all registered universities, inspect subscription health, enforce campus suspension, and track platform MRR.
          </p>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Global SaaS System Statistics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Monthly Recurring Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">${totalMRR}</span>
            <span className="text-xs text-emerald-400 font-medium">USD / mo</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Live active subscriptions</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Registered Institutes</span>
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{tenants.length}</span>
            <span className="text-xs text-zinc-500">Campuses</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400">{activeTenantsCount} Active, {tenants.length - activeTenantsCount} Suspended/Trial</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Professors Managed</span>
            <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalFacultyAcrossTenants}</span>
            <span className="text-xs text-zinc-500">Faculty Profiles</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-300">Across all tenant databases</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">System Engine Status</span>
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">99.98%</span>
            <span className="text-xs text-zinc-500">Uptime</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400">PostgreSQL 16 Multi-Tenant RLS Safe</p>
        </div>
      </div>

      {/* Tenant Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search institutes by name or code (e.g. NIT, MUT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
      </div>

      {/* Institutes Monitoring Table */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-800/40 text-zinc-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Institute Name</th>
                <th className="py-2.5 px-3">Plan Tier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Depts / Faculty / Rooms</th>
                <th className="py-2.5 px-3">MRR</th>
                <th className="py-2.5 px-3 rounded-r-lg text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-zinc-200">{tenant.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      Code: {tenant.code} • ID: {tenant.id}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {tenant.plan_tier}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 w-fit ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : tenant.status === 'SUSPENDED'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {tenant.status === 'ACTIVE' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {tenant.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-400">
                    {tenant.departments_count} Depts • {tenant.faculty_count} Faculty • {tenant.rooms_count} Rooms
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-zinc-200">
                    ${tenant.monthly_revenue} / mo
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all inline-flex items-center gap-1.5 ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                          : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {tenant.status === 'ACTIVE' ? (
                        <>
                          <PowerOff className="h-3 w-3" />
                          <span>Suspend Tenant</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3" />
                          <span>Activate Tenant</span>
                        </>
                      )}
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
