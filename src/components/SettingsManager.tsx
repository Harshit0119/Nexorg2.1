import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Palette,
  Clock,
  User,
  Lock,
  Bell,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Shield,
  Sliders,
} from 'lucide-react';
import { Institute, User as UserProfile, UserRole } from '../types/database';

interface SettingsManagerProps {
  institute: Institute;
  currentUser: UserProfile;
  currentRole: UserRole;
  onUpdateInstitute: (updated: Partial<Institute>) => void;
  onUpdateUserProfile: (updated: Partial<UserProfile>) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  institute,
  currentUser,
  currentRole,
  onUpdateInstitute,
  onUpdateUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'INSTITUTE' | 'BRANDING' | 'ACADEMIC' | 'PROFILE' | 'NOTIFICATIONS'>('INSTITUTE');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Institute Information Form State
  const [instName, setInstName] = useState(institute.name);
  const [instCode, setInstCode] = useState(institute.code);
  const [academicYear, setAcademicYear] = useState(institute.academic_year);
  const [timezone, setTimezone] = useState(institute.timezone);
  const [website, setWebsite] = useState(institute.website || '');
  const [address, setAddress] = useState(institute.address || '');

  // Branding Form State
  const [primaryColor, setPrimaryColor] = useState(institute.primary_brand_color || '#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState(institute.secondary_brand_color || '#7C3AED');
  const [logoUrl, setLogoUrl] = useState(institute.logo_url || '');

  // Academic & Time Configuration
  const [dayStart, setDayStart] = useState(institute.settings?.day_start_time || '09:00');
  const [dayEnd, setDayEnd] = useState(institute.settings?.day_end_time || '17:00');
  const [periodDuration, setPeriodDuration] = useState(institute.settings?.period_duration_minutes || 50);
  const [maxConsecutive, setMaxConsecutive] = useState(institute.settings?.max_consecutive_faculty_hours || 2);
  const [defaultMaxWeekly, setDefaultMaxWeekly] = useState(institute.settings?.default_faculty_max_hours || 18);

  // User Profile Form State
  const [userName, setUserName] = useState(currentUser.full_name);
  const [userEmail, setUserEmail] = useState(currentUser.email);
  const [userPhone, setUserPhone] = useState(currentUser.phone || '');

  // Notification Preferences State
  const [emailNotifPublished, setEmailNotifPublished] = useState(true);
  const [emailNotifInvitations, setEmailNotifInvitations] = useState(true);
  const [emailNotifClashes, setEmailNotifClashes] = useState(true);
  const [inAppSound, setInAppSound] = useState(false);

  const handleSaveInstituteInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstitute({
      name: instName,
      code: instCode,
      academic_year: academicYear,
      timezone: timezone,
      website: website,
      address: address,
    });
    setSaveNotice('Institute information saved successfully.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstitute({
      primary_brand_color: primaryColor,
      secondary_brand_color: secondaryColor,
      logo_url: logoUrl,
    });
    setSaveNotice('Branding and visual identity updated.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveAcademicTiming = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstitute({
      settings: {
        ...institute.settings,
        day_start_time: dayStart,
        day_end_time: dayEnd,
        period_duration_minutes: Number(periodDuration),
        max_consecutive_faculty_hours: Number(maxConsecutive),
        default_faculty_max_hours: Number(defaultMaxWeekly),
      },
    });
    setSaveNotice('Academic timing configurations saved.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      full_name: userName,
      email: userEmail,
      phone: userPhone,
    });
    setSaveNotice('User profile updated successfully.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Settings className="h-6 w-6 text-[#4F46E5]" />
              System Settings & Institutional Preferences
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Campus Governance
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Configure institutional profile, branding, lecture duration standards, user profile, and notification rules.
          </p>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setActiveTab('INSTITUTE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'INSTITUTE'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Institute Information</span>
        </button>

        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'BRANDING'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Branding & Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('ACADEMIC')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'ACADEMIC'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Academic & Timings</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'PROFILE'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>My Profile & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-indigo-600 text-white font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Notification Rules</span>
        </button>
      </div>

      {/* Tab: Institute Information */}
      {activeTab === 'INSTITUTE' && (
        <form onSubmit={handleSaveInstituteInfo} className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-white mb-2">Institute Identity & Registration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Institute Name</label>
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Institute Short Code</label>
              <input
                type="text"
                value={instCode}
                onChange={(e) => setInstCode(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
                placeholder="2025-2026"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1">Official Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://nit.edu"
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1">Campus Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Institute Information</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Branding & Appearance */}
      {activeTab === 'BRANDING' && (
        <form onSubmit={handleSaveBranding} className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-white mb-2">Custom Branding & Theme Customization</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Customize header branding and report styling with your university's official color palette.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Primary Brand Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-9 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Secondary Gradient Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-9 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1">Institute Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://assets.nexorg.edu/logo.png"
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Apply Branding Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Academic & Timings */}
      {activeTab === 'ACADEMIC' && (
        <form onSubmit={handleSaveAcademicTiming} className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-white mb-2">Academic Operating Hours & Period Constraints</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Campus Start Time</label>
              <input
                type="time"
                value={dayStart}
                onChange={(e) => setDayStart(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Campus End Time</label>
              <input
                type="time"
                value={dayEnd}
                onChange={(e) => setDayEnd(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Lecture Period Duration (Minutes)</label>
              <input
                type="number"
                value={periodDuration}
                onChange={(e) => setPeriodDuration(Number(e.target.value))}
                min={30}
                max={120}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Max Consecutive Lecture Limit</label>
              <input
                type="number"
                value={maxConsecutive}
                onChange={(e) => setMaxConsecutive(Number(e.target.value))}
                min={1}
                max={4}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1">Default Max Weekly Hours / Faculty</label>
              <input
                type="number"
                value={defaultMaxWeekly}
                onChange={(e) => setDefaultMaxWeekly(Number(e.target.value))}
                min={8}
                max={30}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Update Operating Parameters</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: User Profile & Security */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-white mb-2">Personal Profile & Credentials</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Account Role</label>
              <input
                type="text"
                value={currentRole}
                disabled
                className="w-full bg-zinc-800/50 border border-white/[0.06] rounded-lg p-2 text-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Phone Number</label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300">Security Credentials</h3>
            <button
              type="button"
              onClick={() => alert('Password reset verification link sent to ' + userEmail)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-white/[0.08] flex items-center gap-2"
            >
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Send Password Reset Link</span>
            </button>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Profile Updates</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Notification Rules */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4 max-w-2xl text-xs">
          <h2 className="text-sm font-bold text-white mb-2">Notification & Email Preferences</h2>
          <p className="text-zinc-400 mb-4">
            Choose which events trigger instant transactional emails and in-app bell reminders.
          </p>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/[0.04] cursor-pointer">
              <div>
                <div className="font-semibold text-zinc-200">Timetable Published Notifications</div>
                <div className="text-[11px] text-zinc-400">Receive alerts when official schedules are published</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifPublished}
                onChange={(e) => setEmailNotifPublished(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/[0.04] cursor-pointer">
              <div>
                <div className="font-semibold text-zinc-200">Faculty Invitation Accepted</div>
                <div className="text-[11px] text-zinc-400">Notify when professors accept onboarding tokens</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifInvitations}
                onChange={(e) => setEmailNotifInvitations(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-white/[0.04] cursor-pointer">
              <div>
                <div className="font-semibold text-zinc-200">Critical Clash Alerts</div>
                <div className="text-[11px] text-zinc-400">Instant notification when double-bookings occur</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifClashes}
                onChange={(e) => setEmailNotifClashes(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
