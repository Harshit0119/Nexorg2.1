import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Layers, 
  UserCheck, 
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Bell,
  Menu,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../types/database';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  instituteName: string;
  academicYear: string;
  isLiveSupabase: boolean;
  onOpenSupabaseConfig: () => void;
  activeClashesCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onGoToPublicWebsite?: () => void;
  onToggleMobileSidebar?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  instituteName,
  academicYear,
  isLiveSupabase,
  onOpenSupabaseConfig,
  activeClashesCount,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onGoToPublicWebsite,
  onToggleMobileSidebar,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Mobile Hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] transition-all shrink-0 active:scale-95"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-lg shadow-indigo-500/20 shrink-0">
              <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
              <div className="absolute -bottom-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full bg-[#06B6D4] ring-2 ring-[#0A0A0A]">
                <div className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg font-mono">
                  NEXORG <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2.1</span>
                </span>
                <span className="hidden xl:inline-block text-xs text-zinc-500 font-medium">| Academic Engine</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 truncate">
                <Building2 className="h-3 w-3 text-zinc-500 shrink-0 hidden xs:inline" />
                <span className="font-medium text-zinc-300 truncate max-w-[110px] sm:max-w-[200px]">{instituteName}</span>
                <span className="text-zinc-600 hidden sm:inline">•</span>
                <span className="text-zinc-400 hidden sm:inline">{academicYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions, Database, Role, Notifications & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Public Website Button */}
          {onGoToPublicWebsite && (
            <button
              onClick={onGoToPublicWebsite}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.06] transition-all"
            >
              <span>Public Website</span>
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            </button>
          )}

          {/* Health Status */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-zinc-900/60 text-xs">
            <div className={`h-2 w-2 rounded-full ${activeClashesCount === 0 ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'} shadow-sm`} />
            <span className="text-zinc-300">
              {activeClashesCount === 0 ? 'Clash-Free Engine Active' : `${activeClashesCount} Scheduling Clash`}
            </span>
          </div>

          {/* Notification Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-[#0A0A0A]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Supabase Connection Indicator */}
          <button
            onClick={onOpenSupabaseConfig}
            className={`hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLiveSupabase 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40' 
                : 'bg-zinc-900/80 text-zinc-300 border-white/[0.08] hover:border-indigo-500/50 hover:bg-zinc-800/80'
            }`}
          >
            <Database className={`h-3.5 w-3.5 ${isLiveSupabase ? 'text-emerald-400' : 'text-[#06B6D4]'}`} />
            <span className="hidden md:inline">
              {isLiveSupabase ? 'Supabase Connected' : 'Supabase Studio / DDL'}
            </span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl bg-zinc-900/90 border border-white/[0.08]">
            {(['HEAD', 'ADMIN', 'FACULTY'] as UserRole[]).map((role) => {
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-indigo-500/25'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                  title={`Switch active view context to ${role}`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-300 bg-zinc-900/80 hover:bg-rose-950/30 border border-white/[0.08] hover:border-rose-500/30 transition-all"
              title="Logout from Workspace"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
