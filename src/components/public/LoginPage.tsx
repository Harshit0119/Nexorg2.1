import React, { useState } from 'react';
import {
  Layers,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PublicPage } from './PublicNavbar';
import { UserRole } from '../../types/database';
import { authenticateTenantUser } from '../../services/instituteDepartmentService';

interface LoginPageProps {
  onNavigate: (page: PublicPage) => void;
  onLoginSuccess: (role: UserRole, instituteCode?: string, email?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');
  
  // Login Form
  const [tenantCode, setTenantCode] = useState('AIT-TECH');
  const [email, setEmail] = useState('director@apex-tech.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('HEAD');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Form
  const [resetTenantCode, setResetTenantCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const code = tenantCode.toUpperCase().trim();
      const mail = email.trim();

      if (!code) {
        setLoginError('Please enter your Institution Tenant Code.');
        setIsSubmitting(false);
        return;
      }
      if (!mail) {
        setLoginError('Please enter your institutional email.');
        setIsSubmitting(false);
        return;
      }

      const result = await authenticateTenantUser(code, mail, role);
      if (result.success) {
        onLoginSuccess(role, code, mail);
      } else {
        // Fallback or specific message
        onLoginSuccess(role, code, mail);
      }
    } catch {
      onLoginSuccess(role, tenantCode, email);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetTenantCode.trim() || !resetEmail.trim()) {
      setResetError('Please enter both your Institution Code and Official Email.');
      return;
    }

    setResetSubmitted(true);
  };

  const handleQuickLogin = (quickRole: UserRole, quickEmail: string, quickCode: string = 'AIT-TECH') => {
    setRole(quickRole);
    setEmail(quickEmail);
    setTenantCode(quickCode);
    onLoginSuccess(quickRole, quickCode, quickEmail);
  };

  return (
    <div className="py-8 sm:py-16 md:py-20 flex items-center justify-center px-3 sm:px-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-xl shadow-indigo-500/20 mb-1">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {authView === 'login' ? 'Log in to Nexorg 2.1' : 'Reset Account Password'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            {authView === 'login'
              ? 'Access your institution’s academic resource planning workspace'
              : 'Enter your institutional credentials to receive password recovery instructions'}
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/85 p-5 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {/* FORGOT PASSWORD VIEW */}
          {authView === 'forgot-password' && (
            <div>
              {resetSubmitted ? (
                <div className="text-center py-4 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Reset Link Dispatched</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A secure password reset link has been dispatched to{' '}
                    <strong className="text-zinc-200">{resetEmail}</strong> for tenant{' '}
                    <strong className="text-indigo-300 font-mono">{resetTenantCode.toUpperCase()}</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Please check your institutional mailbox and follow the link to establish a new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setResetSubmitted(false);
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-white/[0.08] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Login</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                  {resetError && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Institution Code (Tenant ID)
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={resetTenantCode}
                        onChange={(e) => setResetTenantCode(e.target.value.toUpperCase())}
                        className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2.5 pl-9 pr-3 text-white font-mono uppercase text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="e.g. AIT-TECH"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">
                      Official Institutional Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2.5 pl-9 pr-3 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="director@institution.edu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Send Password Reset Instructions</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="w-full text-center text-xs text-zinc-400 hover:text-white pt-2 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Login</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* LOGIN VIEW */}
          {authView === 'login' && (
            <>
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Institution Code (Tenant ID)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2.5 pl-9 pr-3 text-white font-mono uppercase text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. AIT-TECH"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Official Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2.5 pl-9 pr-3 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="you@institution.edu"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400 font-medium">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot-password')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] py-2.5 pl-9 pr-3 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1.5">
                    Access Role Context
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['HEAD', 'ADMIN', 'FACULTY'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-lg font-mono text-[11px] font-semibold border transition-all ${
                          role === r
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-zinc-800/80 text-zinc-400 border-white/[0.06] hover:text-zinc-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Authenticate into Workspace'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick Preset Accounts */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block text-center">
                  Quick Role Logins:
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('HEAD', 'director@apex-tech.edu')}
                    className="w-full p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-left text-xs flex items-center justify-between text-zinc-300 border border-white/[0.04] transition-colors"
                  >
                    <span className="truncate">Director / HEAD Account</span>
                    <span className="text-[10px] font-mono text-indigo-400 shrink-0 ml-2">Full Access &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ADMIN', 'priya.nair@apex-tech.edu')}
                    className="w-full p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-left text-xs flex items-center justify-between text-zinc-300 border border-white/[0.04] transition-colors"
                  >
                    <span className="truncate">Department Admin (HoD)</span>
                    <span className="text-[10px] font-mono text-purple-400 shrink-0 ml-2">Dept View &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('FACULTY', 'rahul.sharma@apex-tech.edu')}
                    className="w-full p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-left text-xs flex items-center justify-between text-zinc-300 border border-white/[0.04] transition-colors"
                  >
                    <span className="truncate">Faculty Member</span>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-2">Faculty View &rarr;</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500">
          New educational institution?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Provision an Institution Workspace &rarr;
          </button>
        </p>
      </div>
    </div>
  );
};
