import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRight, 
  Menu, 
  X, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

export type PublicPage = 'home' | 'pricing' | 'about' | 'contact' | 'login' | 'register';

interface PublicNavbarProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  onLaunchDashboard: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPage,
  onNavigate,
  onLaunchDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: PublicPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <Layers className="h-5 w-5 text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#06B6D4] ring-2 ring-[#0A0A0A]">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-lg font-mono">
                NEXORG <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2.1</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
              Academic Resource Planning
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-zinc-900/80 border border-white/[0.08]">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onLaunchDashboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Launch App</span>
          </button>

          <button
            onClick={() => onNavigate('login')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              currentPage === 'login'
                ? 'text-white bg-zinc-800'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Login
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#06B6D4] p-[1px] font-semibold text-xs transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            <div className="flex items-center gap-1.5 rounded-[11px] bg-[#0A0A0A] px-4 py-2 text-white transition-all group-hover:bg-opacity-0">
              <Sparkles className="h-3.5 w-3.5 text-[#06B6D4] group-hover:text-white transition-colors" />
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/[0.08]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0A0A0A] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === link.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <button
              onClick={() => {
                onLaunchDashboard();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-semibold text-zinc-200"
            >
              <LayoutDashboard className="h-4 w-4 text-[#06B6D4]" />
              <span>Launch Platform</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl bg-zinc-900 text-xs font-medium text-white border border-white/[0.08]"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onNavigate('register');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-xs font-semibold text-white shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
