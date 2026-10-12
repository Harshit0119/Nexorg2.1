import React, { useState } from 'react';
import {
  Mail,
  Building2,
  Calendar,
  Send,
  CheckCircle2,
  Sparkles,
  Phone,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { PublicPage } from './PublicNavbar';

interface ContactPageProps {
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigate,
  onLaunchDashboard,
}) => {
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Dean / Director of Academics');
  const [email, setEmail] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [deptCount, setDeptCount] = useState('6 - 15 Departments');
  const [primaryFriction, setPrimaryFriction] = useState('Cross-Department Faculty Double Bookings');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-12 sm:py-20 space-y-16 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
          Direct Academic Advisory
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Request an Institutional Pilot
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Speak directly with our academic resource engineers. We will assist you in mapping your departments, multi-department faculty, and testing clash prevention with your actual curriculum.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-6 sm:p-8 backdrop-blur">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Pilot Request Received</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                Thank you, {fullName}. Our Academic Solutions Engineer will reach out to <span className="text-white font-mono">{email}</span> within 24 hours with your institution onboarding credentials.
              </p>
              <div className="pt-4">
                <button
                  onClick={onLaunchDashboard}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow-lg"
                >
                  Explore Live Demo Dashboard Now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Rajeshwar Kulkarni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Institutional Title</label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Dean of Engineering">Dean of Engineering</option>
                    <option value="Director of Academics">Director of Academics / Principal</option>
                    <option value="Head of Department (HoD)">Head of Department (HoD)</option>
                    <option value="Academic Timetable Coordinator">Academic Timetable Coordinator</option>
                    <option value="Registrar / Provost">Registrar / Provost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Official University Email</label>
                  <input
                    type="email"
                    required
                    placeholder="director@apex-tech.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Apex Institute of Technology"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Number of Departments</label>
                  <select
                    value={deptCount}
                    onChange={(e) => setDeptCount(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="1 - 5 Departments">1 - 5 Departments</option>
                    <option value="6 - 15 Departments">6 - 15 Departments</option>
                    <option value="16 - 30 Departments">16 - 30 Departments</option>
                    <option value="30+ Multi-Campus">30+ Multi-Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Primary Scheduling Challenge</label>
                  <select
                    value={primaryFriction}
                    onChange={(e) => setPrimaryFriction(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Cross-Department Faculty Double Bookings">Faculty teaching across multiple depts</option>
                    <option value="Shared Computing Labs & Classrooms">Computing Lab & Classroom collisions</option>
                    <option value="Faculty Workload Imbalance">Faculty workload overload / burnout</option>
                    <option value="Generic ERP Inability to Handle Timetables">Current ERP cannot generate conflict-free timetables</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Specific Campus Requirements (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Detail any unique curriculum constraints, interdisciplinary programs, or specialized lab requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-white/[0.08] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Submit Institutional Pilot Request</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Pilot Guarantee</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We provide a fully configured private PostgreSQL tenant populated with your institution’s departments, course lists, and faculty members so you can test clash-free scheduling risk-free.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Direct Academic Advisory</h3>
            <div className="space-y-3 text-zinc-400">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span className="font-mono text-zinc-300">advisory@nexorg.systems</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-purple-400" />
                <span>Dedicated Enterprise Campus Deployment Team</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#06B6D4]" />
                <span>Global Higher Education Support Hub</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
