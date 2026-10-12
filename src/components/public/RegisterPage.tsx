import React, { useState } from 'react';
import {
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  User,
  Calendar,
  Lock,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { PublicPage } from './PublicNavbar';
import { Institute, Department } from '../../types/database';

interface RegisterPageProps {
  onNavigate: (page: PublicPage) => void;
  onRegisterSuccess: (
    newInstitute: Partial<Institute>,
    initialDepts: string[],
    adminUser?: { name: string; email: string }
  ) => Promise<void> | void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onRegisterSuccess,
}) => {
  const [instituteName, setInstituteName] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  
  // Default department list ready for (CSE, IT, EC) test case
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['CSE', 'IT', 'EC']);
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetDepartmentSuggestions = [
    'CSE',
    'IT',
    'EC',
    'AIML',
    'ECE',
    'MECH',
    'CIVIL',
    'DSA',
  ];

  const handleTogglePreset = (code: string) => {
    if (selectedDepts.includes(code)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== code));
      }
    } else {
      setSelectedDepts([...selectedDepts, code]);
    }
  };

  const handleRemoveDept = (deptToRemove: string) => {
    if (selectedDepts.length > 1) {
      setSelectedDepts(selectedDepts.filter((d) => d !== deptToRemove));
    }
  };

  const handleAddCustomDept = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customDeptInput.trim();
    if (!trimmed) return;

    if (!selectedDepts.includes(trimmed)) {
      setSelectedDepts([...selectedDepts, trimmed]);
      setCustomDeptInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const instName = instituteName.trim();
    const instCode = instituteCode.toUpperCase().trim();
    const admEmail = adminEmail.trim();

    if (!instName || instName.length < 2) {
      setFormError('Please enter a valid institution name (at least 2 characters).');
      return;
    }
    if (!instCode || instCode.length < 2) {
      setFormError('Please enter a valid uppercase tenant code (e.g. AIT, MIT-TECH).');
      return;
    }
    if (!admEmail || !admEmail.includes('@')) {
      setFormError('Please provide a valid official institution email.');
      return;
    }
    if (selectedDepts.length === 0) {
      setFormError('Please specify at least one academic department for the institute.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegisterSuccess(
        {
          name: instName,
          code: instCode,
          academic_year: academicYear,
        },
        selectedDepts,
        {
          name: adminName.trim() || 'Institution Director',
          email: admEmail,
        }
      );
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-16 md:py-20 flex items-center justify-center px-3 sm:px-6">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-xl shadow-indigo-500/20 mb-1">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Register Your Educational Institution
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Provision a dedicated, isolated multi-tenant academic resource planning workspace for your university or college.
          </p>
        </div>

        {/* Registration Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/85 p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Step 1: Institution Details */}
            <div className="space-y-3 pb-5 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>1. Institution Legal Profile</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">Institution Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Institute of Technology & Sciences"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Tenant Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="AIT-TECH"
                    value={instituteCode}
                    onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white font-mono uppercase text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Academic Dean / Administrator */}
            <div className="space-y-3 pb-5 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-[#06B6D4]" />
                <span>2. Academic Lead / Director (HEAD Account)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Director / Dean Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Rajeshwar Kulkarni"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Official Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="director@apex-tech.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Account Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Set account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Initial Departments to Provision */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>3. Initial Academic Departments (e.g. CSE, IT, EC)</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  {selectedDepts.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Departments registered here will immediately be saved to the database and provisioned in your workspace.
              </p>

              {/* Active Department Badges */}
              <div className="p-3 rounded-xl bg-zinc-800/50 border border-white/[0.06] flex flex-wrap gap-2 min-h-[46px] items-center">
                {selectedDepts.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 font-mono text-xs font-semibold shadow-sm"
                  >
                    <span>{d}</span>
                    {selectedDepts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(d)}
                        className="text-indigo-300 hover:text-white transition-colors"
                        title={`Remove ${d}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Quick Select Presets */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">
                  Quick Department Chips:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetDepartmentSuggestions.map((deptCode) => {
                    const isSelected = selectedDepts.includes(deptCode);
                    return (
                      <button
                        key={deptCode}
                        type="button"
                        onClick={() => handleTogglePreset(deptCode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-zinc-800/80 text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        {deptCode} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Dept */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Or Add Custom Department (e.g. EC, Biotech, Civil):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter department name or code..."
                    value={customDeptInput}
                    onChange={(e) => setCustomDeptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDept();
                      }
                    }}
                    className="flex-1 rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomDept()}
                    className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-white/[0.08] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-xs shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? 'Provisioning Workspace in Database...' : 'Complete Registration & Open Dashboard'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Existing User Link */}
        <p className="text-center text-xs text-zinc-500">
          Already have an institution workspace?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Log in to existing workspace &rarr;
          </button>
        </p>
      </div>
    </div>
  );
};
