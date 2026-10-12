import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Network,
  Users2,
  BookOpen,
  CalendarClock,
  Scale,
  DoorOpen,
  ShieldAlert,
  Database,
  Info,
  ChevronRight,
  Sparkles,
  BarChart3,
  CreditCard,
  Bell,
  FileText,
  Settings,
  ShieldCheck,
  CalendarX2,
  X,
  Layers,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types/database';

export type NavTab = 
  | 'overview'
  | 'institute'
  | 'institute-setup'
  | 'departments'
  | 'team-invitations'
  | 'faculty'
  | 'subjects'
  | 'availability'
  | 'workload'
  | 'leaves'
  | 'rooms-labs'
  | 'clash-engine'
  | 'analytics'
  | 'subscription'
  | 'audit-logs'
  | 'notifications'
  | 'saas-admin'
  | 'settings'
  | 'supabase';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  facultyCount: number;
  deptCount: number;
  invitationsCount?: number;
  pendingLeavesCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  facultyCount,
  deptCount,
  invitationsCount = 0,
  pendingLeavesCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  onLogout,
}) => {
  // Lock body scrolling on mobile when sidebar drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleSelectTab = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Institutional Overview',
      icon: LayoutDashboard,
      badge: null,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'departments' as NavTab,
      label: 'Department Management',
      icon: Network,
      badge: `${deptCount}`,
      highlight: true,
      roles: ['HEAD', 'ADMIN'],
    },
    {
      id: 'team-invitations' as NavTab,
      label: 'Team & Invitations',
      icon: Users2,
      badge: invitationsCount > 0 ? `${invitationsCount} Pending` : 'Invite',
      highlight: true,
      roles: ['HEAD', 'ADMIN'],
    },
    {
      id: 'institute' as NavTab,
      label: 'Institute Settings',
      icon: Building2,
      badge: 'Core',
      roles: ['HEAD'],
    },
    {
      id: 'institute-setup' as NavTab,
      label: 'Setup Wizard',
      icon: Sparkles,
      badge: 'New',
      roles: ['HEAD'],
    },
    {
      id: 'faculty' as NavTab,
      label: 'Faculty Management (M:N)',
      icon: Users2,
      badge: 'Multi-Dept',
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'subjects' as NavTab,
      label: 'Academic Structure & Subjects',
      icon: BookOpen,
      badge: 'Courses',
      highlight: true,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'availability' as NavTab,
      label: 'Faculty Availability (Grid)',
      icon: CalendarClock,
      badge: null,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'workload' as NavTab,
      label: 'Workload & Quota Limits',
      icon: Scale,
      badge: null,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'leaves' as NavTab,
      label: 'Leave & Substitution Engine',
      icon: CalendarX2,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : 'Leaves',
      highlight: true,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'rooms-labs' as NavTab,
      label: 'Rooms & Specialized Labs',
      icon: DoorOpen,
      badge: null,
      roles: ['HEAD', 'ADMIN'],
    },
    {
      id: 'clash-engine' as NavTab,
      label: 'Timetable & Conflict Engine',
      icon: ShieldAlert,
      badge: 'Engine',
      highlight: true,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics Dashboard',
      icon: BarChart3,
      badge: 'Charts',
      highlight: true,
      roles: ['HEAD', 'ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'subscription' as NavTab,
      label: 'Subscription & Quotas',
      icon: CreditCard,
      badge: 'Pro Tier',
      roles: ['HEAD', 'SUPER_ADMIN'],
    },
    {
      id: 'audit-logs' as NavTab,
      label: 'Compliance Audit Logs',
      icon: FileText,
      badge: 'Security',
      roles: ['HEAD', 'ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'notifications' as NavTab,
      label: 'Notification Center',
      icon: Bell,
      badge: null,
      roles: ['HEAD', 'ADMIN', 'FACULTY', 'SUPER_ADMIN'],
    },
    {
      id: 'saas-admin' as NavTab,
      label: 'SaaS Platform Admin',
      icon: ShieldCheck,
      badge: 'Super Admin',
      roles: ['SUPER_ADMIN', 'HEAD'],
    },
    {
      id: 'settings' as NavTab,
      label: 'Platform Settings',
      icon: Settings,
      badge: null,
      roles: ['HEAD', 'ADMIN', 'FACULTY'],
    },
    {
      id: 'supabase' as NavTab,
      label: 'Supabase Architecture & DDL',
      icon: Database,
      badge: 'RLS',
      roles: ['HEAD', 'ADMIN', 'FACULTY', 'SUPER_ADMIN'],
    },
  ];

  const renderNavList = () => (
    <div className="space-y-6">
      <div>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Resource Engine
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isAllowed = item.roles.includes(currentRole);
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (!isAllowed) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F46E5]/20 to-[#7C3AED]/20 text-white border border-[#4F46E5]/50 shadow-sm'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive 
                        ? 'text-[#06B6D4]' 
                        : item.highlight 
                        ? 'text-indigo-400 group-hover:text-indigo-300' 
                        : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-[#4F46E5]/40 text-indigo-200 border border-indigo-500/40'
                        : item.highlight
                        ? 'bg-violet-950/70 text-violet-300 border border-violet-800/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Feature Focus Callout */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 via-zinc-900/60 to-purple-950/20 p-3.5 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>Multi-Dept Constraint</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Faculty mapped across multiple departments automatically locks parallel schedules across all campus blocks.
        </p>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="pt-4 border-t border-white/[0.06] space-y-3">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>Active Context</span>
        <span className="text-zinc-400 font-mono">v2.1-prod</span>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/80 p-2.5 border border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-[#4F46E5]/20 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
            {currentRole[0]}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-medium text-zinc-200 truncate">
              {currentRole === 'HEAD' && 'Institution Head'}
              {currentRole === 'ADMIN' && 'Department Admin'}
              {currentRole === 'FACULTY' && 'Faculty Member'}
              {currentRole === 'SUPER_ADMIN' && 'SaaS Super Admin'}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {currentRole === 'HEAD' && 'Full Academic Control'}
              {currentRole === 'ADMIN' && 'Department Operations'}
              {currentRole === 'FACULTY' && 'Teaching Schedule & Leaves'}
              {currentRole === 'SUPER_ADMIN' && 'Platform-wide Governance'}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Permanently Visible Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/[0.08] bg-[#0A0A0A]/95 p-4 flex-col justify-between overflow-y-auto">
        {renderNavList()}
        {renderFooter()}
      </aside>

      {/* 2. Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* 3. Mobile Slide-in Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0A0A0A] border-r border-white/[0.1] p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden overflow-y-auto ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Header with Brand & Close Button */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-sm">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-white text-sm font-mono block">NEXORG 2.1</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-400">Navigation</span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08] transition-colors"
              aria-label="Close navigation sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {renderNavList()}
        </div>

        {renderFooter()}
      </aside>
    </>
  );
};
