import React, { useEffect } from 'react';
import {
  Building2,
  Network,
  Users2,
  BookOpen,
  DoorOpen,
  CalendarClock,
  BarChart3,
  Settings,
  ShieldCheck,
  CalendarX2,
  X,
  Layers,
  LogOut,
  Users,
  Calendar,
  CheckSquare,
  Sparkles,
  Bell,
  User as UserIcon
} from 'lucide-react';
import { UserRole } from '../types/database';

export type NavTab = 
  // HEAD tabs
  | 'institute'
  | 'departments'
  | 'faculty'
  | 'subjects'
  | 'rooms-labs'
  | 'timetable'
  | 'leaves'
  | 'analytics'
  | 'settings'
  // ADMIN specific tabs
  | 'rooms'
  | 'labs'
  // FACULTY tabs
  | 'my-subjects'
  | 'my-classes'
  | 'my-timetable'
  | 'free-slots'
  | 'leave-requests'
  | 'student-lists'
  | 'quick-attendance'
  | 'announcements'
  | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  facultyCount: number;
  deptCount: number;
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

  // 1. HEAD Dashboard Menu (Institute-wide access)
  const headNavItems = [
    {
      id: 'institute' as NavTab,
      label: 'Institute Management',
      icon: Building2,
      badge: 'Core',
    },
    {
      id: 'departments' as NavTab,
      label: 'Department Management',
      icon: Network,
      badge: deptCount > 0 ? `${deptCount}` : null,
    },
    {
      id: 'faculty' as NavTab,
      label: 'Faculty Management',
      icon: Users2,
      badge: facultyCount > 0 ? `${facultyCount}` : null,
    },
    {
      id: 'subjects' as NavTab,
      label: 'Subjects',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'rooms-labs' as NavTab,
      label: 'Rooms & Labs',
      icon: DoorOpen,
      badge: null,
    },
    {
      id: 'timetable' as NavTab,
      label: 'Timetable',
      icon: ShieldCheck,
      badge: 'Engine',
    },
    {
      id: 'leaves' as NavTab,
      label: 'Leave Management',
      icon: CalendarX2,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  // 2. ADMIN Dashboard Menu (Department-level access only)
  const adminNavItems = [
    {
      id: 'faculty' as NavTab,
      label: 'Faculty',
      icon: Users2,
      badge: 'Dept',
    },
    {
      id: 'subjects' as NavTab,
      label: 'Subjects',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'timetable' as NavTab,
      label: 'Timetable',
      icon: ShieldCheck,
      badge: 'Schedule',
    },
    {
      id: 'rooms' as NavTab,
      label: 'Rooms',
      icon: DoorOpen,
      badge: null,
    },
    {
      id: 'labs' as NavTab,
      label: 'Labs',
      icon: Layers,
      badge: null,
    },
    {
      id: 'leaves' as NavTab,
      label: 'Leave Requests',
      icon: CalendarX2,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null,
    },
  ];

  // 3. FACULTY Dashboard Menu (Personal academic dashboard only)
  const facultyNavItems = [
    {
      id: 'my-subjects' as NavTab,
      label: 'My Subjects',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'my-classes' as NavTab,
      label: 'My Classes',
      icon: Users,
      badge: null,
    },
    {
      id: 'my-timetable' as NavTab,
      label: 'My Timetable',
      icon: Calendar,
      badge: 'Personal',
    },
    {
      id: 'free-slots' as NavTab,
      label: 'Available Free Slots',
      icon: CalendarClock,
      badge: null,
    },
    {
      id: 'leave-requests' as NavTab,
      label: 'Leave Requests',
      icon: CalendarX2,
      badge: null,
    },
    {
      id: 'student-lists' as NavTab,
      label: 'Student Lists',
      icon: CheckSquare,
      badge: null,
    },
    {
      id: 'quick-attendance' as NavTab,
      label: 'Quick Attendance',
      icon: Sparkles,
      badge: 'Fast',
    },
    {
      id: 'announcements' as NavTab,
      label: 'Announcements',
      icon: Bell,
      badge: null,
    },
    {
      id: 'profile' as NavTab,
      label: 'Profile',
      icon: UserIcon,
      badge: null,
    },
  ];

  // Pick exact items for current role
  let roleTitle = 'Institutional Head';
  let roleSubtitle = 'Campus-wide Administration';
  let activeNavItems = headNavItems;

  if (currentRole === 'ADMIN') {
    roleTitle = 'Department Admin';
    roleSubtitle = 'Department-Level Scope';
    activeNavItems = adminNavItems;
  } else if (currentRole === 'FACULTY') {
    roleTitle = 'Academic Faculty';
    roleSubtitle = 'Personal Academic Workspace';
    activeNavItems = facultyNavItems;
  }

  const renderNavList = () => (
    <div className="space-y-6">
      <div>
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {roleSubtitle}
        </div>
        <nav className="space-y-1">
          {activeNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

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
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                        isActive
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-white/[0.08] bg-[#0A0A0A]/95 p-4 shrink-0 overflow-y-auto">
        <div className="flex-1 space-y-4">
          {/* Active Role Card (No switching - purely informative) */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Active Role</div>
              <div className="text-xs font-bold text-white mt-0.5">{roleTitle}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              currentRole === 'HEAD' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : currentRole === 'ADMIN'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {currentRole}
            </span>
          </div>

          {renderNavList()}
        </div>

        {/* Footer Logout Action */}
        {onLogout && (
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Workspace</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex-col border-r border-white/[0.08] bg-[#0A0A0A] p-4 flex md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">NEXORG 2.1</span>
              <div className="text-[10px] text-zinc-400">{roleTitle}</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 space-y-4">
          {renderNavList()}
        </div>

        {onLogout && (
          <div className="pt-4 border-t border-white/[0.08]">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Workspace</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
