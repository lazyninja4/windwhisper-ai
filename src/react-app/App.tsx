

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import {
  Activity, Wind, Zap, AlertTriangle, ShieldCheck, FileText, Settings,
  LogOut, Plus, Search, MapPin, Play, Mic, Upload, Download, Server,
  Menu, X, CheckCircle, Globe, Thermometer, Droplets, ArrowRight, User as UserIcon, Lock, Cpu, Wifi, Bell, Key, Save, Edit2, Trash2, FileOutput, Headphones, RefreshCw, Power, CloudRain, CloudLightning, Eye, Compass, Cloud, Sun, Music, Repeat, Map as MapIcon, ToggleLeft, ToggleRight, Camera, MessageSquare, Phone, ChevronRight, Share2, Copy, Menu as MenuIcon, VolumeX, Volume2
} from 'lucide-react';
import { appStore } from './services/store';
import { audioEngine } from './services/audioEngine';
import { analyzeTurbineData, validateTurbineConfiguration, estimateTurbinePowerCurve, monitorTurbineLive } from './services/geminiService';
import { fetchWeather, getWeatherCodeDescription } from './services/weatherService';
import { Turbine, TurbineStatus, AnalysisReport, TurbineSpecs, User, SystemSettings, DeploymentValidation, WeatherData, WeatherForecast, Site, TurbineLocation } from './types';
const L = (window as any).L;
const { jsPDF } = (window as any).jspdf || {};

export function showToast(message: string, opts?: { duration?: number; type?: 'success' | 'error' }) {
  const duration = opts?.duration ?? 2200;
  const type = opts?.type ?? 'success';
  try {
    let container = document.getElementById('ww-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ww-toast-container';
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.top = '20px';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `ww-toast ww-toast-${type}`;
    el.textContent = message;
    el.style.background = type === 'error' ? 'rgba(220,38,38,0.95)' : 'rgba(16,185,129,0.95)';
    el.style.color = '#fff';
    el.style.padding = '8px 12px';
    el.style.marginTop = '8px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 6px 18px rgba(2,6,23,0.6)';
    el.style.fontSize = '13px';
    el.style.opacity = '0';
    el.style.transition = 'opacity 180ms ease, transform 240ms ease';
    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, duration);
  } catch (e) {
    console.log('[toast]', message);
  }
}

const AppStyles = () => (
  <style>{`
    /* Notion-inspired, minimalist, neutral UI */

    :root {
      /* Warmer Notion-like whites */
      --ww-bg-canvas: #F7F6F3;
      --ww-bg-white: #FFFEFC;
      --ww-border-thin: #EBEBEA;
      /* Higher-contrast text for readability */
      --ww-text-primary: #161616;
      --ww-text-secondary: #4F4F4F;
      --ww-bg-subtle: #F1F0EB;
      --ww-bg-hover: #EFEEE9;
      --ww-btn-dark: #2F2F2F;
      --ww-btn-light: #EFEFED;
    }

    /* ------------------------------------------------------------
       Global "Notion-like" theme remap for existing Tailwind utils
       (keeps layout/logic intact; overrides only visual styling)
       ------------------------------------------------------------ */

    /* Canvas & panels: replace dark "industrial" surfaces */
    .bg-industrial-950,
    .bg-industrial-900 {
      background-color: var(--ww-bg-canvas) !important;
    }
    .bg-industrial-800,
    .bg-industrial-700,
    .bg-industrial-600 {
      background-color: var(--ww-bg-white) !important;
    }
    .bg-industrial-900\\/50,
    .bg-industrial-800\\/50,
    .bg-industrial-800\\/30,
    .bg-industrial-700\\/50,
    .bg-industrial-700\\/30,
    .bg-industrial-600\\/50 {
      background-color: rgba(255, 254, 252, 0.92) !important;
    }

    /* Neutral borders instead of dark/green/neon highlights */
    .border-industrial-900,
    .border-industrial-800,
    .border-industrial-700,
    .border-industrial-600,
    .border-industrial-500,
    .border-slate-700,
    .border-slate-600,
    .border-white\\/10,
    .border-white\\/20,
    .border-brand-neon,
    .focus\\:border-brand-neon:focus,
    .hover\\:border-brand-neon:hover {
      border-color: var(--ww-border-thin) !important;
    }
    .border-industrial-700\\/50,
    .border-industrial-600\\/50,
    .border-industrial-800\\/50 {
      border-color: rgba(235, 235, 234, 0.9) !important;
    }

    /* Text readability: replace light-on-dark text with charcoal */
    .text-white,
    .text-slate-200,
    .text-slate-300 {
      color: var(--ww-text-primary) !important;
    }
    .text-gray-800,
    .text-slate-400,
    .text-slate-500 {
      color: var(--ww-text-secondary) !important;
    }

    /* Add visible hover + table header contrast when industrial bg is used */
    .hover\\:bg-industrial-800:hover,
    .hover\\:bg-industrial-700:hover,
    .hover\\:bg-industrial-900:hover {
      background-color: var(--ww-bg-hover) !important;
    }
    .bg-industrial-800\\/80,
    .bg-industrial-800\\/70,
    .bg-industrial-800\\/60 {
      background-color: var(--ww-bg-subtle) !important;
    }

    /* Replace all green/neon branding with neutral greys */
    .text-brand-neon,
    .text-emerald-400,
    .text-emerald-500,
    .text-emerald-600 {
      color: #6B6B6B !important;
    }
    .bg-brand-neon,
    .bg-emerald-500,
    .bg-emerald-600 {
      background-color: #6B6B6B !important;
    }
    .bg-brand-neon\\/10,
    .bg-brand-neon\\/5,
    .bg-emerald-500\\/20,
    .bg-emerald-500\\/10 {
      background-color: rgba(107, 107, 107, 0.12) !important;
    }
    .border-emerald-500,
    .border-emerald-500\\/30,
    .border-emerald-500\\/50,
    .focus\\:border-emerald-500:focus {
      border-color: var(--ww-border-thin) !important;
    }

    /* Remove neon/green glows from rings/shadows; keep focus visible but neutral */
    .ring-brand-neon,
    .ring-brand-neon\\/50,
    .focus\\:ring-brand-neon\\/50:focus,
    .focus\\:ring-brand-neon\\/20:focus,
    .focus\\:ring-brand-neon:focus,
    .focus\\:ring-1:focus,
    .focus\\:ring-2:focus,
    .ring-1,
    .ring-2 {
      --tw-ring-color: rgba(235, 235, 234, 1) !important;
      box-shadow: none !important;
    }

    /* Flatten heavy shadows for a Notion-like feel */
    .shadow-inner,
    .shadow-lg,
    .shadow-xl,
    .shadow-2xl {
      box-shadow: none !important;
    }

    /* Body base */
    body, #root {
      background: var(--ww-bg-canvas) !important;
      color: var(--ww-text-primary);
      font-family: ui-monospace, "Cascadia Mono", "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      letter-spacing: 0;
    }

    /* Tailwind utilities can override body font (e.g. font-sans). Force mono globally. */
    .font-sans,
    .font-serif,
    .font-mono {
      font-family: ui-monospace, "Cascadia Mono", "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    }
    input, textarea, select, button {
      font-family: inherit;
    }

    /* Minimal fade-in animation */
    @keyframes fadeInMinimal { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeInMinimal 0.4s ease-in-out forwards; }

    /* Input Group */
    .input-group { position: relative; }

    /* Notion-style Inputs */
    .input-sleek {
      width: 100%;
      background: var(--ww-bg-white);
      border: 1px solid var(--ww-border-thin);
      color: var(--ww-text-primary);
      border-radius: 4px;
      padding: 0.8rem 1rem;
      font-size: 0.98rem;
      outline: none;
      transition: background 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
      box-shadow: none;
      font-weight: 400;
    }
    .input-sleek:hover {
      background: #F6F6F4;
      border-color: #D9D9D6;
    }
    .input-sleek:focus {
      border-color: #BFC0BE;
      background: #F6F6F4;
    }
    .input-sleek:disabled {
      background: #F2F2F0;
      color: #C6C6C6;
      opacity: 1;
      cursor: not-allowed;
    }

    /* Notion-style Selects */
    .select-sleek {
      width: 100%;
      background: var(--ww-bg-white);
      border: 1px solid var(--ww-border-thin);
      color: var(--ww-text-primary);
      border-radius: 4px;
      padding: 0.8rem 1rem;
      font-size: 0.98rem;
      appearance: none;
      transition: background 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%237A7A7A' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 1rem center;
      background-repeat: no-repeat;
      background-size: 1.25em 1.25em;
    }
    .select-sleek:hover {
      background: #F6F6F4;
      border-color: #D9D9D6;
    }
    .select-sleek:focus {
      border-color: #BFC0BE;
      background: #F6F6F4;
      outline: none;
    }

    /* Notion-style Primary Button */
    .btn-primary {
      background: var(--ww-btn-dark);
      color: #FFFFFF;
      font-weight: 500;
      padding: 0.72rem 1.4rem;
      border-radius: 4px;
      border: none;
      transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
      box-shadow: none;
      outline: none;
    }
    .btn-primary:hover, .btn-primary:focus-visible {
      background: #232323;
      color: #FFFFFF;
    }
    .btn-primary:active {
      background: #181818;
      color: #FFFFFF;
    }
    .btn-primary:disabled {
      background: #E5E5E5;
      color: #B1B1B1;
      cursor: not-allowed;
    }

    /* Optional: For subtle alternate buttons (like a "secondary" Notion block) */
    .btn-secondary {
      background: var(--ww-btn-light);
      color: var(--ww-text-primary);
      border-radius: 4px;
      border: 1px solid var(--ww-border-thin);
      font-weight: 500;
      padding: 0.72rem 1.4rem;
      transition: background 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s;
    }
    .btn-secondary:hover, .btn-secondary:focus-visible {
      background: #E4E4E3;
      border-color: #D9D9D6;
      color: var(--ww-text-primary);
    }
    .btn-secondary:disabled {
      background: #F4F4F4;
      color: #B1B1B1;
      border-color: #EBEBEA;
      cursor: not-allowed;
    }

    /* Flat, clean surface cards/wrappers */
    .glass-panel,
    .weather-card-bg {
      background: var(--ww-bg-white);
      border: 1px solid var(--ww-border-thin);
      border-radius: 4px;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    /* Remove all custom scroll glow and use neutral scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #EBEBEA;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #D9D9D6;
    }

    /* Miscellaneous */
    hr, .ww-divider {
      border: none;
      border-top: 1px solid var(--ww-border-thin);
      margin: 1.5rem 0;
    }
    .muted {
      color: var(--ww-text-secondary);
    }
  `}</style>
);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const Input = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-gray-800 uppercase tracking-wider ml-1">{label}</label>}
    <input className={`input-sleek ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} {...props} />
    {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
  </div>
);
const FloatingInput = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, error?: string }) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value);

  useEffect(() => {
    setHasValue(!!props.value);
  }, [props.value]);

  return (
    <div className="relative w-full group">
      <div className={`absolute left-4 transition-all duration-200 pointer-events-none ${focused || hasValue ? '-top-2.5 text-xs bg-industrial-800 px-1 text-brand-neon' : 'top-3.5 text-gray-800 text-sm'}`}>
        {label}
      </div>
      <input
        className={`w-full bg-industrial-900/50 border rounded-xl p-3.5 text-white outline-none transition-all duration-300 ${error ? 'border-red-500 focus:border-red-500' : 'border-industrial-600 focus:border-brand-neon group-hover:border-industrial-500'}`}
        onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
};

const Select = ({ label, options, groups, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options?: { value: string, label: string }[], groups?: { label: string, options: { value: string, label: string }[] }[] }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-gray-800 uppercase tracking-wider ml-1">{label}</label>}
    <select className="select-sleek" {...props}>
      {groups ? (
        groups.map((g, i) => (
          <optgroup key={i} label={g.label}>
            {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ))
      ) : (
        options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
      )}
    </select>
  </div>
);
const Sidebar = ({ activePath, user, onLogout, onOpenProfile, isOpen, onClose }: { activePath: string, user: User | null, onLogout: () => void, onOpenProfile: () => void, isOpen: boolean, onClose: () => void }) => {
  const links = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/fleet', label: 'Fleet Manager', icon: Server },
    { path: '/analysis', label: 'Live Analysis', icon: Mic },
    { path: '/weather', label: 'Weather Intel', icon: Cloud },
    { path: '/reports', label: 'Reports & Logs', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>

      {isOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={onClose}></div>}

      <div className={`w-64 h-screen bg-industrial-900 border-r border-industrial-700 flex flex-col fixed left-0 top-0 z-50 shadow-2xl transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-industrial-800 bg-industrial-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 border border-industrial-700 bg-industrial-800">
              <Wind size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">WindWhisper</h1>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-800 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const isActive = activePath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'bg-[#F1F0EB] text-[#161616] border-l-4 border-[#CFCFCD]'
                  : 'text-gray-800 hover:bg-[#EFEEE9] hover:text-[#161616]'
                  }`}
              >
                <link.icon size={20} className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium relative z-10">{link.label}</span>
                {isActive && <div className="absolute inset-0 bg-black/0 opacity-50 z-0"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-3 pt-1">
          <p className="text-[11px] text-[#7A7A7A] leading-tight">© 2026 Developed by Niranjan Subbiyah.</p>
        </div>

        <div className="p-4 border-t border-industrial-800 bg-[#F1F0EB]">
          <div
            onClick={() => { onOpenProfile(); onClose(); }}
            className="flex items-center space-x-3 mb-4 px-2 p-2 rounded-lg bg-[#FFFEFC] border border-[#EBEBEA] cursor-pointer hover:bg-[#EFEEE9] transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-brand-accent transition-colors">{user?.name}</p>
              <p className="text-[10px] text-brand-neon truncate uppercase">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-md bg-[#FFFEFC] text-[#161616] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 border border-[#EBEBEA] transition-all"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Terminate Session</span>
          </button>
        </div>
      </div>
    </>
  );
};
const AuthPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const validateInputs = () => {
    if (!email) return "Email is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (mode === "signup" && !name) return "Full name is required.";
    return null;
  };

  const handleAuthSuccess = (u: User) => {
    window.location.hash = '/';
    onLogin(u);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        const result = appStore.login(email, password);

        if (!result.success) {
          setError(result.message || 'Authentication failed');
        } else if (result.require2FA) {
          setStep('2fa');
          setInfo(`New device detected. Verification code sent to ${email}`);
        } else {
          const u = appStore.getUser();
          if (u) handleAuthSuccess(u);
          else setError("Unknown login error.");
        }

      } else {
        const result = appStore.signUp(name, email, password);

        if (!result.success) {
          setError(result.message || 'Could not create account.');
        } else {
          setStep('2fa');
          setInfo(`Account created. Verification code sent to ${email}`);
        }
      }

      setLoading(false);
    }, 900);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const ok = appStore.verify2FA(code);

      if (!ok) {
        setError('Invalid code. Check console.');
        setLoading(false);
        return;
      }

      const u = appStore.getUser();
      if (u) handleAuthSuccess(u);
      else setError("Verification succeeded but user not found.");

      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#FFFEFC] border border-[#EBEBEA] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 pb-6 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#EBEBEA] bg-[#F1F0EB] text-[#4F4F4F]">
              <Wind size={22} />
            </div>
            <h1 className="text-2xl font-bold text-[#161616] tracking-tight">WindWhisper</h1>
            <p className="text-sm text-[#4F4F4F] mt-1">Sign in to continue</p>
          </div>
          <div className="p-8 pt-2">
            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[#161616] text-xs flex items-center">
                <AlertTriangle size={16} className="mr-3 shrink-0" /> {error}
              </div>
            )}
            {info && (
              <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[#161616] text-xs flex items-center">
                <ShieldCheck size={16} className="mr-3 shrink-0" /> {info}
              </div>
            )}
            {step === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="animate-fade-in"><FloatingInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                )}
                <FloatingInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm font-bold tracking-wide mt-2 flex justify-center items-center">
                  <span className="flex items-center">
                    {loading ? <RefreshCw className="animate-spin mr-2" size={18} /> : <span className="flex items-center">{mode === 'login' ? 'Authenticate' : 'Register Account'} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></span>}
                  </span>
                </button>
                <div className="text-center pt-4">
                  <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }} className="text-xs text-slate-500 hover:text-brand-accent transition-colors font-medium">
                    {mode === 'login' ? 'New Deployment? Create Account' : 'Existing User? Sign In'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6 animate-slide-in">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block text-center">Security Verification</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-industrial-900/50 border border-industrial-600 rounded-xl p-5 text-center text-3xl font-mono text-white tracking-[0.5em] focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/50 outline-none transition-all" maxLength={6} autoFocus placeholder="------" />
                  <p className="text-center text-xs text-slate-500 bg-industrial-900/50 py-2 rounded">Check your browser console for the mock code.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2 font-bold tracking-wide">
                  {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : "Verify Identity"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [turbines, setTurbines] = useState<Turbine[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<string>('ALL');
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);

  useEffect(() => {
    setTurbines(appStore.getTurbines());
    setSites(appStore.getSites());
    setReports(appStore.getReports());
    return appStore.subscribe(() => {
      setTurbines([...appStore.getTurbines()]);
      setSites([...appStore.getSites()]);
      setReports([...appStore.getReports()]);
    });
  }, []);
  useEffect(() => {
    const checkMonitoring = async () => {
      if (audioEngine.isPlaying && audioEngine.currentTurbineId) {
        setMonitoringActive(true);
        setActiveStreamId(audioEngine.currentTurbineId);
        const metrics = audioEngine.updateMetrics();
        const tName = appStore.getTurbine(audioEngine.currentTurbineId)?.name || 'Unknown';
        const result = await monitorTurbineLive(tName, metrics);
        if (result) {
          appStore.updateLiveAnalysis(audioEngine.currentTurbineId, result);
        }
      } else {
        setMonitoringActive(false);
        setActiveStreamId(null);
      }
    };

    const interval = setInterval(checkMonitoring, 15000); // Check every 15s to save tokens
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await appStore.forceRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredTurbines = selectedFilterId === 'ALL'
    ? turbines
    : turbines.some(t => t.id === selectedFilterId)
      ? turbines.filter(t => t.id === selectedFilterId)
      : turbines.filter(t => t.siteId === selectedFilterId);

  const metricsTurbines = filteredTurbines.filter(t => t.isActive);
  const activeTurbinesCount = metricsTurbines.filter(t => t.status === TurbineStatus.ONLINE).length;
  const totalFleetCount = filteredTurbines.length;
  const avgHealth = metricsTurbines.length ? Math.round(metricsTurbines.reduce((acc, t) => acc + t.health.acoustic, 0) / metricsTurbines.length) : 0;
  const totalPower = metricsTurbines.reduce((acc, t) => acc + (t.currentPowerOutput || 0), 0).toFixed(1);

  const filterGroups = [
    { label: "General", options: [{ value: 'ALL', label: 'Global Overview' }] },
    { label: "By Site", options: sites.map(s => ({ value: s.id, label: s.name })) },
    { label: "By Turbine", options: turbines.map(t => ({ value: t.id, label: `${t.name} ${!t.isActive ? '(Inactive)' : ''}` })) }
  ];

  const hasHistory = reports.length > 0;
  const isPlaying = audioEngine.isPlaying;
  const isLive = turbines.some(t => t.connection.mode === 'LIVE' && t.isActive) || isPlaying;
  const activeMonitoredTurbine = activeStreamId ? appStore.getTurbine(activeStreamId) : null;

  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current && L) {
      leafletMapRef.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false }).setView([20, 0], 2);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(leafletMapRef.current);
    }
    if (leafletMapRef.current) {
      leafletMapRef.current.eachLayer((layer: any) => { if (layer instanceof L.Marker) leafletMapRef.current.removeLayer(layer); });
      const group = L.featureGroup();
      filteredTurbines.forEach(t => {
        const color = !t.isActive ? '#64748b' : t.status === 'ONLINE' ? '#6B6B6B' : t.status === 'CRITICAL' ? '#ef4444' : t.status === 'MAINTENANCE' ? '#f59e0b' : '#64748b';
        const icon = L.divIcon({ className: 'custom-div-icon', html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] });
        const marker = L.marker([t.location.lat, t.location.lng], { icon }).bindPopup(`<div class="text-sm font-sans"><strong>${t.name}</strong><br/>Status: ${t.isActive ? t.status : 'INACTIVE'}<br/>Power: ${t.currentPowerOutput} MW</div>`);
        marker.addTo(group);
        marker.addTo(leafletMapRef.current);
      });
      if (filteredTurbines.length > 0) {
        const bounds = group.getBounds();
        if (bounds.isValid()) leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [filteredTurbines]);

  const resolveMaintenance = (e: React.MouseEvent, t: Turbine) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('Button clicked for:', t.name, t.id);
    console.log('Executing maintenance resolution directly...');
    appStore.resolveMaintenance(t.id);
    setTurbines(appStore.getTurbines());
    showToast(`Maintenance resolved for ${t.name}`);
  };
  if (turbines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-fade-in p-8 text-center">
        <div className="w-24 h-24 bg-industrial-800 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-industrial-700"><Wind size={48} className="text-slate-500" /></div>
        <h2 className="text-3xl font-bold text-white mb-2">Initialize Your Fleet</h2>
        <p className="text-gray-800 max-w-md mb-8">Welcome to WindWhisper. Your command center is ready. Deploy your first turbine to begin real-time acoustic monitoring and predictive maintenance.</p>
        <button onClick={() => navigate('/fleet')} className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"><Plus size={20} /><span>Deploy First Asset</span></button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {!hasHistory && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center animate-slide-in"><AlertTriangle className="text-red-500 mr-3" size={24} /><div><h4 className="font-bold text-red-500">Data Accuracy Warning</h4><p className="text-sm text-red-300">Warning: No audio analysis or diagnostic implemented. Data is based purely on turbine parameters.</p></div></div>}
      {hasHistory && !isLive && <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg flex items-center animate-slide-in"><AlertTriangle className="text-yellow-500 mr-3" size={24} /><div><h4 className="font-bold text-yellow-500">Historical Data Mode</h4><p className="text-sm text-yellow-300">Data is best accurate with ongoing transmission or simulation.</p></div></div>}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h2 className="text-3xl font-bold text-white">Global Command Center</h2><p className="text-gray-800 mt-1 flex items-center"><Globe size={14} className="mr-2" /> Live monitoring of {filteredTurbines.length} distributed assets</p></div>
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-stretch md:items-center w-full md:w-auto">
          <div className="w-full md:w-64"><Select groups={filterGroups} value={selectedFilterId} onChange={e => setSelectedFilterId(e.target.value)} /></div>
          <div className="flex space-x-3">
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 bg-industrial-800 rounded-full border border-industrial-700 text-gray-800 hover:text-white hover:border-brand-accent transition-all flex-none"><RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-neon' : ''} /></button>
            <Link to="/weather" className="flex items-center justify-center bg-industrial-800 px-3 py-2 rounded-full border border-industrial-700 hover:border-brand-accent transition-colors flex-1 md:flex-none"><Cloud size={16} className="text-brand-accent mr-2" /><span>View Weather Intel</span></Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Real-Time Generation', value: `${totalPower} MW`, sub: 'Health-Adjusted', icon: Zap, color: 'text-brand-warning', bg: 'bg-amber-500/10' },
          { label: 'Active Turbines', value: `${activeTurbinesCount} / ${totalFleetCount}`, sub: 'Capacity', icon: Wind, color: 'text-brand-neon', bg: 'bg-emerald-500/10' },
          { label: 'Acoustic Health', value: `${avgHealth}%`, sub: 'Mean Score', icon: Activity, color: 'text-brand-accent', bg: 'bg-blue-500/10' },
          { label: 'Critical Alerts', value: filteredTurbines.filter(t => t.status === 'CRITICAL' && t.isActive).length.toString(), sub: 'Requires Action', icon: AlertTriangle, color: 'text-brand-danger', bg: 'bg-red-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-xl hover:translate-y-[-4px] transition-transform duration-300 border border-industrial-700/50">
            <div className="flex justify-between mb-4"><div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div><span className="text-[10px] font-mono px-2 py-1 rounded bg-industrial-800 text-slate-300">REAL-TIME</span></div>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3><p className="text-sm font-medium text-gray-800 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-0 rounded-xl border border-industrial-700 overflow-hidden relative min-h-[400px]">
          <div className="absolute top-4 left-4 z-[400] bg-[#FFFEFC]/90 px-3 py-1 rounded text-xs text-[#161616] font-medium border border-[#EBEBEA]">Live Geospatial Tracking</div>
          <div id="dashboard-map" ref={mapRef} className="w-full h-full bg-industrial-900 z-0"></div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-industrial-700 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">System Insights</h3>
            {monitoringActive && (
              <span className="flex items-center text-xs font-bold text-brand-neon animate-pulse"><Zap size={10} className="mr-1" /> AI Active</span>
            )}
          </div>


          {monitoringActive && activeMonitoredTurbine && activeMonitoredTurbine.liveAnalysis ? (
            <div className="mb-4 bg-industrial-800/80 p-3 rounded-lg border border-brand-accent/30 animate-slide-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-accent/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-brand-accent uppercase">Live Pulse: {activeMonitoredTurbine.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${activeMonitoredTurbine.liveAnalysis.status === 'DANGER' ? 'bg-red-500 text-white' : activeMonitoredTurbine.liveAnalysis.status === 'WARNING' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>{activeMonitoredTurbine.liveAnalysis.status}</span>
              </div>
              <ul className="space-y-1 mb-2">
                {activeMonitoredTurbine.liveAnalysis.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-center text-xs text-slate-200">
                    <div className="w-1 h-1 bg-brand-accent rounded-full mr-2"></div>{tip}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between text-[10px] text-gray-800 border-t border-white/5 pt-2 mt-2">
                <span>Efficiency Factor Applied</span>
                <span className="font-mono text-white">{(activeMonitoredTurbine.liveAnalysis.efficiencyFactor * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {(filteredTurbines || []).filter(t => t.isActive).sort((a, b) => a.health.acoustic - b.health.acoustic).map(t => (
              <div key={t.id} className="block p-3 bg-industrial-800/50 rounded-lg border border-industrial-700/50 hover:bg-industrial-800 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <Link to={`/analysis?id=${t.id}`} className="font-medium text-white text-sm hover:underline">{t.name}</Link>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : t.status === 'MAINTENANCE' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{t.status}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-800 mb-2"><span className="w-16">Health</span><div className="flex-1 h-1 bg-industrial-900 rounded-full overflow-hidden"><div className="h-full bg-brand-neon" style={{ width: `${t.health.acoustic}%` }}></div></div></div>
                {t.isActive && (t.status === 'CRITICAL' || t.status === 'MAINTENANCE') && (
                  <button
                    type="button"
                    onClick={(e) => resolveMaintenance(e, t)}
                    className="w-full py-2 text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-900/80 transition-colors flex items-center justify-center cursor-pointer z-20 relative font-bold shadow-md"
                  >
                    <CheckCircle size={14} className="mr-1.5" /> Resolve Maintenance
                  </button>
                )}
              </div>
            ))}
            {filteredTurbines.filter(t => t.isActive).length === 0 && <p className="text-sm text-slate-500 text-center py-4">No alerts.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
const FleetManager = () => {
  const [turbines, setTurbines] = useState(appStore.getTurbines());
  const [sites, setSites] = useState(appStore.getSites());
  const [showAddModal, setShowAddModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<DeploymentValidation | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    siteId: '',
    newSiteName: '',
    manufacturer: 'Siemens Gamesa',
    model: 'SG 14-222 DD',
    ratedPower: 14,
    rotorDiameter: 222,
    hubHeight: 130,
    lat: 54.0,
    lng: 6.0,
    region: 'North Sea'
  });

  useEffect(() => {
    setTurbines(appStore.getTurbines());
    setSites(appStore.getSites());
    return appStore.subscribe(() => {
      setTurbines(appStore.getTurbines());
      setSites(appStore.getSites());
    });
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to decommission this asset?')) {
      appStore.removeTurbine(id);
      showToast('Asset Decommissioned');
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);

    const specs: TurbineSpecs = {
      manufacturer: formData.manufacturer,
      model: formData.model,
      ratedPower: formData.ratedPower,
      rotorDiameter: formData.rotorDiameter,
      hubHeight: formData.hubHeight,
      towerHeight: formData.hubHeight - 5
    };

    const loc: TurbineLocation = {
      lat: formData.lat,
      lng: formData.lng,
      region: formData.region
    };

    const result = await validateTurbineConfiguration(specs, loc);
    setValidationResult(result);
    setValidating(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSiteId = formData.siteId;
    if (finalSiteId === 'new') {
      if (!formData.newSiteName) {
        showToast("Please provide a name for the new site", { type: 'error' });
        return;
      }
      const newSite: Site = {
        id: `site-${Date.now()}`,
        name: formData.newSiteName,
        region: formData.region
      };
      appStore.addSite(newSite);
      finalSiteId = newSite.id;
    } else if (!finalSiteId) {
      finalSiteId = 'default-site';
      if (sites.length === 0) {
        appStore.addSite({ id: 'default-site', name: 'Default Site', region: formData.region });
      } else {
        finalSiteId = sites[0].id;
      }
    }

    const newTurbine: Turbine = {
      id: `t-${Date.now()}`,
      name: formData.name,
      siteId: finalSiteId,
      isActive: true,
      location: { lat: formData.lat, lng: formData.lng, region: formData.region },
      status: TurbineStatus.ONLINE,
      specs: {
        manufacturer: formData.manufacturer,
        model: formData.model,
        ratedPower: formData.ratedPower,
        rotorDiameter: formData.rotorDiameter,
        hubHeight: formData.hubHeight,
        towerHeight: formData.hubHeight - 5 // Estimate
      },
      health: { acoustic: 100, mechanical: 100, vibration: 100, lastUpdated: new Date().toISOString() },
      currentPowerOutput: 0,
      connection: {
        mode: 'SIMULATION',
        edgeProcessing: { enabled: true, compression: 'LZ4', sampleRate: 44100, localFilter: true },
        simLoopAudio: true
      }
    };
    await appStore.addTurbine(newTurbine);
    setShowAddModal(false);
    setValidationResult(null);
    showToast('New Asset Deployed');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold text-white">Fleet Manager</h2><p className="text-gray-800 text-sm">Asset configuration and deployment</p></div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2"><Plus size={16} /><span>Deploy New Asset</span></button>
      </div>

      <div className="glass-panel overflow-hidden border border-industrial-700 rounded-xl overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-industrial-800/80 text-xs uppercase font-bold text-gray-800 border-b border-industrial-700">
            <tr><th className="p-4">Asset Name</th><th className="p-4">Location</th><th className="p-4">Specs</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-industrial-700/50 text-sm">
            {turbines.map(t => (
              <tr key={t.id} className="hover:bg-[#EFEEE9]">
                <td className="p-4 font-bold text-white">{t.name}<br /><span className="text-xs font-normal text-slate-500 font-mono">{t.id}</span></td>
                <td className="p-4 text-slate-300">{t.location.region}<br /><span className="text-xs text-slate-500">{t.location.lat.toFixed(4)}, {t.location.lng.toFixed(4)}</span></td>
                <td className="p-4 text-slate-300">{t.specs.manufacturer} {t.specs.model}<br /><span className="text-xs text-brand-neon">{t.specs.ratedPower} MW</span></td>
                <td className="p-4">
                  <button
                    onClick={() => {
                      appStore.updateTurbine(t.id, { isActive: !t.isActive });
                      if (!t.isActive) {
                        showToast(`${t.name} activated`);
                      } else {
                        if (audioEngine.currentTurbineId === t.id) {
                          audioEngine.stop();
                        }
                        showToast(`${t.name} deactivated`);
                      }
                    }}
                    className={`text-[10px] px-3 py-1.5 rounded font-bold transition-all border ${t.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-[#F1F0EB] text-[#161616] border-[#EBEBEA] hover:bg-[#EFEEE9]'
                      }`}
                  >
                    {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    className="text-gray-800 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded"
                    title="Decommission Asset"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {turbines.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No assets in fleet. Deploy one to get started.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-13">

          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/40"
            onClick={() => setShowAddModal(false)}
          />


          <div className="relative bg-industrial-900 border border-industrial-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] animate-slide-up custom-scrollbar">


            <div className="p-6 border-b border-industrial-800 flex justify-between items-center bg-industrial-800/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wind size={20} className="text-brand-neon" /> Deploy New Asset
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-800 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>


            <div className="p-8">
              <form id="turbine-form" onSubmit={handleAdd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">


                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-brand-accent uppercase border-b border-brand-accent/20 pb-2">
                      Asset Identification
                    </h4>

                    <Input
                      label="Asset Name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alpha-X1"
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 uppercase tracking-wider ml-1">Site Assignment</label>
                      <select
                        className="select-sleek"
                        value={formData.siteId}
                        onChange={e => setFormData({ ...formData, siteId: e.target.value })}
                      >
                        <option value="">Select Existing Site...</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        <option value="new">+ Create New Site</option>
                      </select>
                    </div>

                    {formData.siteId === 'new' && (
                      <div className="bg-industrial-800/50 p-3 rounded-lg border border-industrial-700 animate-fade-in space-y-3">
                        <h5 className="text-xs font-bold text-brand-neon uppercase">Create New Site</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Site Name"
                            value={formData.newSiteName}
                            onChange={e => setFormData({ ...formData, newSiteName: e.target.value })}
                            placeholder="e.g. Dogger Bank C"
                            autoFocus
                          />
                          <Input
                            label="Site Region"
                            value={formData.newSiteName ? (formData as any).newSiteRegion || '' : ''}
                            onChange={e => setFormData({ ...formData, newSiteRegion: e.target.value } as any)}
                            placeholder="e.g. North Sea"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, siteId: '', newSiteName: '' } as any)}
                            className="px-3 py-1.5 text-xs text-gray-800 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!formData.newSiteName) {
                                showToast('Please enter a site name', { type: 'error' });
                                return;
                              }
                              const newSiteRegion = (formData as any).newSiteRegion || formData.region || 'Unknown';
                              const newSite = {
                                id: `site_${Date.now()}`,
                                name: formData.newSiteName,
                                region: newSiteRegion,
                                turbines: []
                              };
                              sites.push(newSite);
                              setFormData({
                                ...formData,
                                siteId: newSite.id,
                                newSiteName: ''
                              } as any);
                              showToast('Site created successfully', { type: 'success' });
                            }}
                            className="bg-brand-neon text-white px-3 py-1.5 text-xs rounded font-bold hover:bg-emerald-600 transition-colors"
                          >
                            Save Site
                          </button>
                        </div>
                      </div>
                    )}

                    <h4 className="text-sm font-bold text-brand-accent uppercase border-b border-brand-accent/20 pb-2 mt-8">
                      <Settings size={14} className="inline mr-2 text-brand-accent" /> Technical Specifications
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Manufacturer"
                        value={formData.manufacturer}
                        onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                      <Input
                        label="Model"
                        value={formData.model}
                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                      />
                      <Input
                        label="Rated Power (MW)"
                        type="number"
                        step="0.1"
                        value={formData.ratedPower}
                        onChange={e => setFormData({ ...formData, ratedPower: parseFloat(e.target.value) })}
                      />
                      <Input
                        label="Rotor Diameter (m)"
                        type="number"
                        value={formData.rotorDiameter}
                        onChange={e => setFormData({ ...formData, rotorDiameter: parseFloat(e.target.value) })}
                      />
                      <Input
                        label="Hub Height (m)"
                        type="number"
                        value={formData.hubHeight}
                        onChange={e => setFormData({ ...formData, hubHeight: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>


                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-brand-accent uppercase border-b border-brand-accent/20 pb-2">
                      <MapPin size={14} className="inline mr-2 text-brand-warning" /> Location & Environment
                    </h4>

                    <Input
                      label="Region"
                      value={formData.region}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. North Sea"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Latitude"
                        type="number"
                        step="0.0001"
                        value={formData.lat}
                        onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                      />
                      <Input
                        label="Longitude"
                        type="number"
                        step="0.0001"
                        value={formData.lng}
                        onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                      />
                    </div>


                    <div className="bg-industrial-800/30 p-4 rounded-xl border border-industrial-700 mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldCheck size={16} className="text-brand-neon" /> AI Validation
                        </h4>
                        <button
                          type="button"
                          onClick={handleValidate}
                          disabled={validating}
                          className="text-xs bg-industrial-800 hover:bg-industrial-700 text-brand-neon px-3 py-2 rounded border border-industrial-600 transition-colors flex items-center disabled:opacity-50"
                        >
                          {validating ? (
                            <>
                              <RefreshCw className="animate-spin mr-2" size={12} />
                              Running Analysis...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2" size={12} />
                              Check Feasibility
                            </>
                          )}
                        </button>
                      </div>

                      {!validationResult ? (
                        <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-industrial-600 rounded-lg">
                          Click "Check Feasibility" to validate your configuration
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg border animate-slide-in ${validationResult.score > 70
                          ? 'bg-emerald-900/20 border-emerald-500/30'
                          : 'bg-red-900/20 border-red-500/30'
                          }`}>
                          <div className="flex justify-between items-start mb-3">
                            <p className={`text-sm font-bold ${validationResult.score > 70 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                              {validationResult.message}
                            </p>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${validationResult.score > 80
                              ? 'bg-emerald-500 text-black'
                              : validationResult.score > 70
                                ? 'bg-amber-500 text-black'
                                : 'bg-red-500 text-white'
                              }`}>
                              Score: {validationResult.score}/100
                            </span>
                          </div>

                          {validationResult.concerns && validationResult.concerns.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Concerns</p>
                              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                                {validationResult.concerns.slice(0, 3).map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setValidationResult(null)}
                            className="text-xs text-brand-accent mt-3 underline hover:text-brand-neon transition-colors"
                          >
                            Re-validate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>


            <div className="p-6 border-t border-industrial-800 bg-industrial-800/50 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-gray-800 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="turbine-form"
                className="btn-primary px-8 py-2 shadow-lg"
              >
                Deploy Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisPage = () => {
  const query = new URLSearchParams(useLocation().search);
  const initialId = query.get('id');
  const [turbines, setTurbines] = useState(appStore.getTurbines());
  const [selectedId, setSelectedId] = useState(initialId || turbines[0]?.id || '');
  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [metrics, setMetrics] = useState<{ rms: number, zcr: number, peak: number } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted); // New state for mute
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (audioEngine.isPlaying) setConnectionStatus('CONNECTED');
    const metricsInterval = setInterval(() => { if (audioEngine.isPlaying) setMetrics(audioEngine.updateMetrics()); }, 150);
    return () => {
      clearInterval(metricsInterval);
      if (audioEngine.isPlaying) {
        audioEngine.toggleMute(true);
        console.log(`[Cleanup] Muted active stream on page unmount for background AI.`);
      }
    };
  }, []);
  useEffect(() => {
    if (selectedId) {
      const newTurbine = appStore.getTurbine(selectedId) || null;
      if (audioEngine.isPlaying && audioEngine.currentTurbineId && audioEngine.currentTurbineId !== selectedId) {
        audioEngine.toggleMute(true); // Keep running, but mute playback
        setIsMuted(true);
      } else if (audioEngine.currentTurbineId === selectedId) {
        setIsMuted(audioEngine.isMuted);
      }
      if (newTurbine?.id !== turbine?.id) {
        setReport(null);
        setMetrics(null);
      }

      setTurbine(newTurbine);
    }

  }, [selectedId, turbines]);

  const draw = useCallback(() => {
    if (!canvasRef.current) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#F1F0EB';
    ctx.fillRect(0, 0, w, h);

    const analyser = audioEngine.analyserNode;

    if (audioEngine.isPlaying && analyser && !audioEngine.isMuted) {
      try {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        const barW = w / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          const hue = 160 + (i / bufferLength) * 60;
          ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
          ctx.fillRect(i * barW, h - barHeight, barW - 1, barHeight);
        }
      } catch (e) {
        console.error('Draw error:', e);
      }
    } else {
      ctx.strokeStyle = '#B7B7B3';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (audioEngine.isPlaying && audioEngine.isMuted) {
        ctx.font = '12px ui-monospace, "Cascadia Mono", "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        ctx.fillStyle = '#4F4F4F';
        ctx.textAlign = 'center';
        ctx.fillText('Muted for Background Monitoring', w / 2, h / 2 + 20);
      }
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);

    if (audioEngine.isPlaying) {
      setConnectionStatus('CONNECTED');
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);
  useEffect(() => { animationRef.current = requestAnimationFrame(draw); return () => { cancelAnimationFrame(animationRef.current); }; }, [draw]);

  const handleModeToggle = () => {
    if (!turbine) return;
    const newMode = turbine.connection.mode === 'LIVE' ? 'SIMULATION' : 'LIVE';

    console.log('before update - turbine mode:', turbine.connection.mode);

    appStore.updateTurbine(turbine.id, {
      connection: { ...turbine.connection, mode: newMode }
    });

    const freshTurbines = appStore.getTurbines();
    const freshTurbine = appStore.getTurbine(turbine.id);

    console.log('after update - fresh turbine mode:', freshTurbine?.connection.mode);
    console.log('does it match newMode?', freshTurbine?.connection.mode === newMode);

    setTurbines(freshTurbines);

    audioEngine.stop();
    setConnectionStatus('DISCONNECTED');
  };

  const handleLoopToggle = () => {
    if (!turbine) return;
    const newVal = !turbine.connection.simLoopAudio;
    appStore.updateTurbine(turbine.id, {
      connection: { ...turbine.connection, simLoopAudio: newVal }
    });
    setTurbines(appStore.getTurbines());

    setTurbine({
      ...turbine,
      connection: { ...turbine.connection, simLoopAudio: newVal }
    });

    audioEngine.toggleLoop(newVal);
  };
  const handleEdgeToggle = () => { if (!turbine) return; const newVal = !turbine.connection.edgeProcessing.enabled; appStore.updateTurbine(turbine.id, { connection: { ...turbine.connection, edgeProcessing: { ...turbine.connection.edgeProcessing, enabled: newVal } } }); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0] && turbine) { const file = e.target.files[0]; appStore.updateTurbine(turbine.id, { connection: { ...turbine.connection, simLoopFile: file.name } }); await audioEngine.loadFile(file); if (connectionStatus === 'CONNECTED' && turbine.connection.mode === 'SIMULATION') audioEngine.play(turbine.id, turbine.connection.simLoopAudio); } };
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    audioEngine.toggleMute(newMuteState);
    setIsMuted(newMuteState);
    showToast(newMuteState ? "Playback Muted" : "Playback Unmuted");
  };


  const toggleConnection = () => {
    if (!turbine) return;

    if (connectionStatus === 'CONNECTED') {
      audioEngine.stop();
      setConnectionStatus('DISCONNECTED');
      setIsMuted(false);
    } else {
      setConnectionStatus('CONNECTING');
      if (!turbine) {
        setConnectionStatus('DISCONNECTED');
        return;
      }

      if (turbine.connection.mode === 'LIVE') {
        audioEngine.startLiveStream(turbine.id)
          .then(() => {
            if (audioEngine.isPlaying) {
              setConnectionStatus('CONNECTED');
              audioEngine.toggleMute(true);
              setIsMuted(true);
            } else {
              setConnectionStatus('DISCONNECTED');
            }
          })
          .catch((error) => {
            console.error("Live Stream Connection failed:", error);
            setConnectionStatus('DISCONNECTED');
            showToast(`Connection failed: ${error}`, { type: 'error' });
          });
      } else {
        if (audioEngine.hasBuffer()) {
          audioEngine.play(turbine!.id, turbine?.connection.simLoopAudio);
          setConnectionStatus('CONNECTED');
          audioEngine.toggleMute(true);
          setIsMuted(true);
        } else {
          showToast("Please upload a simulation audio file first.", { type: 'error' });
          setConnectionStatus('DISCONNECTED');
        }
      }
    }
  };

  const handleAnalyze = async () => {
    if (!turbine) return;
    setLoadingAI(true);
    // check if stream is playing before analysis
    if (!audioEngine.isPlaying) {
      showToast("Cannot run analysis: Audio stream is disconnected or not playing.", { type: 'error' });
      setLoadingAI(false);
      return;
    }

    const features = metrics ? `RMS: ${metrics.rms.toFixed(3)}, ZCR: ${metrics.zcr.toFixed(3)}, Peak Freq: ${metrics.peak.toFixed(0)}Hz` : "Audio stream silent or unavailable.";
    const recentReports = appStore.getReportsForTurbine(turbine.id).slice(0, 3);
    const historyContext = recentReports.length > 0 ? recentReports.map(r => `[${new Date(r.timestamp).toLocaleDateString()}] ${r.diagnosis}`).join("; ") : "No significant recent issues.";
    const report = await analyzeTurbineData(turbine.name, `${turbine.specs.manufacturer} ${turbine.specs.model}`, features, turbine.weather, turbine.currentPowerOutput, turbine.connection.mode === 'SIMULATION', historyContext);
    setReport(report);
    appStore.addReport(report);
    if (report.severity === 'CRITICAL') { appStore.updateTurbine(turbine.id, { status: TurbineStatus.CRITICAL, health: { ...turbine.health, acoustic: 40 } }); } else if (report.severity === 'HIGH') { appStore.updateTurbine(turbine.id, { status: TurbineStatus.MAINTENANCE, health: { ...turbine.health, acoustic: 65 } }); } else { appStore.updateTurbine(turbine.id, { status: TurbineStatus.ONLINE, health: { ...turbine.health, acoustic: Math.min(100, turbine.health.acoustic + 5) } }); }
    setLoadingAI(false);
  };

  if (!turbine) return <div className="p-10 text-center text-slate-500">Select a turbine to begin analysis.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Analysis</h2>
          <p className="text-gray-800 text-sm">Real-time acoustic telemetry & AI Inference</p>
        </div>

        <div className="w-64">
          <Select options={turbines.map(t => ({ value: t.id, label: `${t.name}${!t.isActive ? ' (Inactive)' : ''}` }))} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} />
        </div>
      </div>


      {!turbine.isActive ? (
        <div className="p-10 text-center animate-fade-in">
          <div className="max-w-md mx-auto bg-industrial-800/50 border border-industrial-700 rounded-xl p-8">
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{turbine.name} is Inactive</h3>
            <p className="text-gray-800 mb-6">This turbine has been deactivated. Activate it in Fleet Manager to resume monitoring.</p>
            <Link to="/fleet" className="btn-primary inline-flex items-center space-x-2">
              <Settings size={16} />
              <span>Go to Fleet Manager</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <div className="glass-panel p-6 rounded-xl border border-industrial-700 relative overflow-hidden"><div className="flex justify-between items-center mb-4"><div className="flex items-center space-x-2"><Activity className="text-brand-neon" size={20} /><h3 className="text-white font-bold">Spectrum Analyzer</h3></div><div className={`px-2 py-1 rounded text-xs font-bold ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#F1F0EB] text-[#4F4F4F] border border-[#EBEBEA]'}`}>{connectionStatus === 'CONNECTED' ? 'SIGNAL LIVE' : 'NO SIGNAL'}</div></div><div className="bg-[#F1F0EB] rounded-lg border border-[#EBEBEA] h-64 relative overflow-hidden"><canvas ref={canvasRef} width={800} height={256} className="w-full h-full" /></div></div>


            <div className="glass-panel bg-[#FFFEFC] p-6 rounded-xl border border-industrial-700"><div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold">Connectivity & Stream Control</h3><button onClick={() => setShowConnectionInfo(!showConnectionInfo)} className="text-xs text-brand-accent hover:text-[#161616] flex items-center"><Settings size={12} className="mr-1" /> Connection Config</button></div>{showConnectionInfo && (<div className="mb-6 p-4 bg-[#F1F0EB] rounded-lg border border-[#EBEBEA] animate-slide-in"><p className="text-xs font-bold text-[#4F4F4F] uppercase mb-2">WebSocket Endpoint</p><div className="flex items-center space-x-2 mb-4"><code className="flex-1 bg-[#FFFEFC] p-2 rounded text-xs text-[#4F4F4F] font-mono truncate border border-[#EBEBEA]">{turbine.connection.wsUrl}</code><button onClick={() => { navigator.clipboard.writeText(turbine.connection.wsUrl || ''); showToast("URL Copied"); }} className="p-2 bg-[#FFFEFC] rounded border border-[#EBEBEA] hover:bg-[#EFEEE9]"><Copy size={14} /></button></div><p className="text-xs font-bold text-[#4F4F4F] uppercase mb-2">Secure Stream Key</p><div className="flex items-center space-x-2"><code className="flex-1 bg-[#FFFEFC] p-2 rounded text-xs text-[#4F4F4F] font-mono truncate border border-[#EBEBEA]">{turbine.connection.apiKey}</code><button onClick={() => { navigator.clipboard.writeText(turbine.connection.apiKey || ''); showToast("Key Copied"); }} className="p-2 bg-[#FFFEFC] rounded border border-[#EBEBEA] hover:bg-[#EFEEE9]"><Copy size={14} /></button><button onClick={() => { appStore.regenerateApiKey(turbine.id); showToast("Key Regenerated"); }} className="p-2 bg-[#FFFEFC] rounded border border-[#EBEBEA] hover:bg-[#EFEEE9]"><RefreshCw size={14} /></button></div></div>)}<div className="grid grid-cols-2 gap-6"><div className="space-y-4"><div className="flex items-center justify-between p-3 bg-[#F1F0EB] rounded-lg border border-[#EBEBEA]"><span className="text-sm text-[#161616]">Input Source</span><button onClick={handleModeToggle} className="flex items-center text-xs font-bold bg-[#FFFEFC] px-3 py-1 rounded border border-[#EBEBEA] hover:bg-[#EFEEE9] transition-colors">{turbine.connection.mode === 'LIVE' ? <Mic size={14} className="mr-2 text-red-500" /> : <FileText size={14} className="mr-2 text-blue-600" />}{turbine.connection.mode}</button></div>{turbine.connection.mode === 'SIMULATION' && (<div className="p-3 bg-[#F1F0EB] rounded-lg border border-[#EBEBEA] space-y-3"><div className="flex justify-between items-center"><span className="text-xs text-[#4F4F4F]">Loop Playback</span><button onClick={handleLoopToggle} className={`text-xs p-1 rounded ${turbine.connection.simLoopAudio ? 'text-[#161616] bg-[#EFEEE9] border border-[#EBEBEA]' : 'text-slate-500'}`}><Repeat size={16} /></button></div><label className="flex items-center justify-center w-full px-4 py-2 bg-[#FFFEFC] border border-dashed border-[#CFCFCD] rounded cursor-pointer hover:bg-[#EFEEE9] transition-colors"><Upload size={16} className="mr-2 text-[#4F4F4F]" /><span className="text-xs text-[#4F4F4F]">{turbine.connection.simLoopFile || "Upload Audio File"}</span><input type='file' className="hidden" accept="audio/*" onChange={handleFileUpload} /></label></div>)}</div><div className="flex flex-col justify-end space-y-3">
              <button onClick={toggleConnection} disabled={!turbine?.isActive} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg ${!turbine?.isActive ? 'bg-[#F1F0EB] text-[#6B6B6B] border border-[#EBEBEA] cursor-not-allowed' : connectionStatus === 'CONNECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' : 'bg-[#2F2F2F] text-[#FFFEFC] hover:bg-[#232323]'}`}>{connectionStatus === 'CONNECTING' ? <RefreshCw className="animate-spin mr-2" /> : connectionStatus === 'CONNECTED' ? <Zap className="mr-2" /> : <Play className="mr-2" />}{connectionStatus === 'CONNECTING' ? 'Establishing Handshake...' : connectionStatus === 'CONNECTED' ? 'Terminate Stream' : 'Initialize Stream'}</button>


              {connectionStatus === 'CONNECTED' && (
                <button
                  onClick={handleMuteToggle}
                  className={`w-full py-2 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg text-sm border ${isMuted
                    ? 'bg-slate-800 text-[#FFFEFC] border-slate-700 hover:bg-slate-700'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/20'
                    }`}
                >
                  {isMuted ? <VolumeX size={16} className="mr-2" /> : <Volume2 size={16} className="mr-2" />}
                  {isMuted ? 'Unmute Playback' : 'Mute Playback'}
                </button>
              )}


              <div className="flex justify-between items-center text-xs text-slate-500 px-2"><span>Edge Processing: {turbine.connection.edgeProcessing.enabled ? 'ON' : 'OFF'}</span><button onClick={handleEdgeToggle} className={`w-8 h-4 rounded-full relative transition-colors ${turbine.connection.edgeProcessing.enabled ? 'bg-brand-accent' : 'bg-industrial-600'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${turbine.connection.edgeProcessing.enabled ? 'left-4.5' : 'left-0.5'}`}></div></button></div>
            </div></div></div>


            <div className="glass-panel p-6 rounded-xl border border-industrial-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Cpu size={100} /></div>
              <h3 className="text-white font-bold mb-4 flex items-center z-10"><Zap size={18} className="mr-2 text-brand-warning" /> Real-Time Inference</h3>
              <div className="flex-1 space-y-4 z-10">
                <button onClick={handleAnalyze} disabled={loadingAI || !audioEngine.isPlaying || !turbine?.isActive} className="w-full py-3 bg-industrial-800 border border-industrial-600 rounded-lg text-slate-300 hover:text-white hover:border-brand-neon transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {loadingAI ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Search className="mr-2" size={16} />}
                  {loadingAI ? 'Processing Tensor Data...' : 'Run Diagnostic Model'}
                </button>
                {report ? (
                  <div className="bg-[#FFFEFC] p-4 rounded-lg border border-[#EBEBEA] animate-slide-up">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${report.severity === 'CRITICAL' ? 'bg-red-500 text-white' : report.severity === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>{report.severity}</span>
                      <span className="text-[10px] text-slate-500">{new Date(report.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#161616] mb-1">{report.diagnosis}</h4>
                    <p className="text-xs text-[#4F4F4F] mb-3">{report.aiInsight}</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Recommended Actions:</p>
                      {report.actionItems.slice(0, 2).map((action, i) => (<div key={i} className="flex items-start text-xs text-[#4F4F4F]"><ArrowRight size={10} className="mr-1 mt-0.5 text-[#6B6B6B]" /> {action}</div>))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-20 text-slate-500 text-xs text-center border-2 border-dashed border-industrial-800 rounded-lg"><p>Awaiting analysis trigger...</p></div>
                )}
              </div>
            </div>
          </div>


          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-industrial-700"><h3 className="text-white font-bold mb-4 flex items-center"><Headphones size={18} className="mr-2 text-brand-accent" /> Signal Metrics</h3><div className="grid grid-cols-2 gap-4"><div className="bg-industrial-800/50 p-3 rounded border border-industrial-700"><p className="text-[10px] text-gray-800 uppercase">RMS Level</p><p className="text-2xl font-mono text-white">{metrics?.rms.toFixed(3) || '0.000'}</p></div><div className="bg-industrial-800/50 p-3 rounded border border-industrial-700"><p className="text-[10px] text-gray-800 uppercase">Zero-Crossing</p><p className="text-2xl font-mono text-white">{metrics?.zcr.toFixed(3) || '0.000'}</p></div><div className="col-span-2 bg-industrial-800/50 p-3 rounded border border-industrial-700 flex justify-between items-center"><div><p className="text-[10px] text-gray-800 uppercase">Peak Frequency</p><p className="text-2xl font-mono text-brand-neon">{metrics?.peak.toFixed(0) || '0'} Hz</p></div><Activity className="text-slate-600" size={32} /></div></div></div>
          </div>
        </div>
      )}

    </div>
  );
};

const ReportsPage = () => {
  const [reports, setReports] = useState<AnalysisReport[]>(appStore.getReports());
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

  useEffect(() => { setReports(appStore.getReports()); return appStore.subscribe(() => setReports([...appStore.getReports()])); }, []);

  const exportCSV = () => {
    const headers = ["ID", "Timestamp", "Turbine", "Severity", "Diagnosis", "RUL", "Confidence"];
    const rows = reports.map(r => [r.id, r.timestamp, r.turbineId, r.severity, r.diagnosis.replace(/,/g, ' '), r.rul, r.confidence]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `windwhisper_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Export Downloaded");
  };

  const downloadPDF = (r: AnalysisReport) => {
    if (!jsPDF) { showToast("PDF Library not loaded.", { type: 'error' }); return; }

    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const footerReserve = 25;

    let isFirstPage = true;

    const setPageBackground = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const drawHeader = (includeTitle = false) => {
      if (includeTitle) {
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("WindWhisper AI", margin, 18);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text("Industrial Diagnostic Report", margin, 26);

        doc.setFontSize(9);
        doc.text(`Report ID: ${r.id}`, pageWidth - margin, 18, { align: 'right' });
        doc.text(`Generated: ${new Date(r.timestamp).toLocaleString()}`, pageWidth - margin, 26, { align: 'right' });

        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.8);
        doc.line(margin, 38, pageWidth - margin, 38);
      } else {
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 20, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`${r.turbineId} - Report ${r.id}`, margin, 12);
        doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin, 12, { align: 'right' });
      }
    };

    const drawFooter = () => {
      const footerY = pageHeight - 40;

      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.8);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFillColor(20, 30, 48);
      doc.rect(margin, footerY + 2, contentWidth, 33, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      let footerRowY = footerY + 10;

      doc.text(`Confidence Score: ${(r.confidence * 100).toFixed(1)}%`, margin + 5, footerRowY);
      footerRowY += 6;


      const rulText = r.rul || 'N/A';
      const maxRulWidth = contentWidth - 10;
      const rulLines = doc.splitTextToSize(`RUL Estimate: ${rulText}`, maxRulWidth);
      doc.text(rulLines, margin + 5, footerRowY);
      footerRowY += 6;


      const weatherText = r.weatherContext || 'N/A';
      const maxWeatherWidth = contentWidth - 10;
      const weatherLines = doc.splitTextToSize(`Weather: ${weatherText}`, maxWeatherWidth);
      doc.text(weatherLines, margin + 5, footerRowY);


      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text("Generated by WindWhisper AI Platform", pageWidth / 2, footerY + 30, { align: 'center' });
    };

    const ensureSpace = (needed: number, y: number) => {
      if (y + needed > pageHeight - footerReserve - margin) {
        doc.addPage();
        isFirstPage = false;
        setPageBackground();
        drawHeader(false);
        return 30;
      }
      return y;
    };

    setPageBackground();
    drawHeader(true);

    let y = 55;

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Asset: ${r.turbineId}`, margin + 5, y + 9);

    const sevColor = r.severity === 'CRITICAL'
      ? [239, 68, 68]
      : r.severity === 'HIGH'
        ? [245, 158, 11]
        : [16, 185, 129];

    doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
    doc.text(`${r.severity}`, pageWidth - margin - 5, y + 9, { align: 'right' });

    y += 30;

    const addSection = (title: string, text: string, color: number[] = [16, 185, 129]) => {
      y = ensureSpace(20, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, margin, y);

      const titleWidth = doc.getTextWidth(title);
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 1, margin + titleWidth, y + 1);

      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(220, 220, 220);

      const lines = doc.splitTextToSize(text || 'N/A', contentWidth);
      const lineHeight = 5.5;
      const blockHeight = lines.length * lineHeight;

      y = ensureSpace(blockHeight, y);
      doc.text(lines, margin, y);
      y += blockHeight + 10;
    };

    addSection("Primary Diagnosis", r.diagnosis, [16, 185, 129]);
    addSection("Root Cause Analysis", r.rootCause || "Undetermined", [59, 130, 246]);
    addSection("AI Technical Insight", r.aiInsight, [168, 85, 247]);

    y = ensureSpace(20, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11);
    doc.text("Recommended Maintenance Actions", margin, y);

    const actionTitleWidth = doc.getTextWidth("Recommended Maintenance Actions");
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1, margin + actionTitleWidth, y + 1);

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);

    r.actionItems.forEach((item, idx) => {
      const bullet = `${idx + 1}.`;
      const cleanItem = (item || '').replace(/^\s*\d+\.\s*/, '');
      const lines = doc.splitTextToSize(cleanItem, contentWidth - 10);
      const h = lines.length * 5.5;
      y = ensureSpace(h + 2, y);

      // If ensureSpace created a new page, header/footer may have changed text color.
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(bullet, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, margin + 10, y);
      y += h + 3;
    });

    if (r.spareParts?.length) {
      y = ensureSpace(20, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(99, 102, 241);
      doc.text("Required Spare Parts", margin, y);

      const partsWidth = doc.getTextWidth("Required Spare Parts");
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 1, margin + partsWidth, y + 1);

      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);

      r.spareParts.forEach((part, idx) => {
        const bullet = `${idx + 1}.`;
        const lines = doc.splitTextToSize(part, contentWidth - 10);
        const h = lines.length * 5.5;
        y = ensureSpace(h + 2, y);

        doc.setFont('helvetica', 'bold');
        doc.text(bullet, margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 10, y);
        y += h + 3;
      });
    }

    drawFooter();

    doc.save(`WindWhisper_Report_${r.id}.pdf`);
    showToast("Report PDF Downloaded");
  };
  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6"><div><h2 className="text-3xl font-bold text-white">Diagnostic Logs</h2><p className="text-gray-800 text-sm">Historical AI inference records</p></div><button onClick={exportCSV} className="btn-primary flex items-center space-x-2"><FileOutput size={16} /><span>Export All (CSV)</span></button></div>

      <div className="glass-panel rounded-xl overflow-hidden border border-industrial-700 animate-fade-in">
        {reports.length === 0 ? <div className="p-10 text-center text-slate-500">No reports generated yet.</div> : (
          <table className="w-full text-left">
            <thead><tr className="bg-industrial-800/80 text-gray-800 text-xs uppercase font-semibold border-b border-industrial-700"><th className="p-4">Date</th><th className="p-4">Asset</th><th className="p-4">Diagnosis</th><th className="p-4">Severity</th><th className="p-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-industrial-700/50 text-sm">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-[#EFEEE9] transition-colors">
                  <td className="p-4 text-slate-300 font-mono text-xs">{formatDate(r.timestamp)}</td><td className="p-4 text-white font-bold">{r.turbineId}</td><td className="p-4 text-slate-300">{r.diagnosis}</td><td className="p-4"><span className={`text-[10px] px-2 py-1 rounded font-bold ${r.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : r.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{r.severity}</span></td><td className="p-4 text-right"><button onClick={() => setSelectedReport(r)} className="text-brand-accent hover:text-[#161616] text-xs font-bold border border-industrial-600 px-3 py-1 rounded hover:bg-[#EFEEE9] transition-all">View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {selectedReport && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4">

          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}></div>


          <div className="relative bg-industrial-900 border border-industrial-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-industrial-800 flex justify-between items-center bg-industrial-800/50"><div><h3 className="text-xl font-bold text-white">Analysis Report</h3><p className="text-xs text-gray-800 font-mono">{selectedReport.id}</p></div><button onClick={() => setSelectedReport(null)} className="text-gray-800 hover:text-white"><X size={24} /></button></div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start"><div><p className="text-xs font-bold text-slate-500 uppercase">Diagnosis</p><p className="text-lg font-bold text-white">{selectedReport.diagnosis}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-500 uppercase">Severity</p><p className={`text- font-bold ${selectedReport.severity === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500'}`}>{selectedReport.severity}</p></div></div>
              <div className="bg-industrial-800/50 p-4 rounded border border-industrial-700"><p className="text-xs font-bold text-brand-neon uppercase mb-2">AI Insight</p><p className="text-sm text-slate-300 leading-relaxed">{selectedReport.aiInsight}</p></div>
              <div className="grid grid-cols-2 gap-6"><div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Root Cause</p><p className="text-sm text-white">{selectedReport.rootCause || 'Undetermined'}</p></div><div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Confidence Score</p><div className="w-full bg-industrial-800 h-2 rounded-full overflow-hidden"><div className="h-full bg-brand-accent" style={{ width: `${selectedReport.confidence * 100}%` }}></div></div><p className="text-xs text-right text-brand-accent mt-1">{(selectedReport.confidence * 100).toFixed(0)}%</p></div></div>
              <div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Recommended Action Items</p><ul className="space-y-2">{selectedReport.actionItems.map((item, i) => (<li key={i} className="flex items-start text-sm text-slate-300 bg-industrial-950 p-2 rounded border border-industrial-800"><CheckCircle size={14} className="mr-2 mt-0.5 text-brand-neon flex-shrink-0" />{item}</li>))}</ul></div>
              {selectedReport.spareParts && selectedReport.spareParts.length > 0 && (<div><p className="text-xs font-bold text-slate-500 uppercase mb-2">Required Spare Parts</p><div className="flex flex-wrap gap-2">{selectedReport.spareParts.map((part, i) => (<span key={i} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-500/20">{part}</span>))}</div></div>)}
            </div>
            <div className="p-4 border-t border-industrial-800 bg-industrial-800/30 flex justify-end space-x-3"><button onClick={() => setSelectedReport(null)} className="px-4 py-2 text-sm text-gray-800 hover:text-white">Close</button><button onClick={() => downloadPDF(selectedReport)} className="btn-primary flex items-center space-x-2 text-sm"><Download size={16} /><span>Download PDF</span></button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings>(appStore.getSettings());
  const [user, setUser] = useState<User | null>(appStore.getUser());

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', role: '', avatar: '' });

  useEffect(() => {
    setUser(appStore.getUser());
    setSettings(appStore.getSettings());
    return appStore.subscribe(() => {
      setUser(appStore.getUser());
      setSettings(appStore.getSettings());
    });
  }, []);


  useEffect(() => {
    if (user) setProfileForm({ name: user.name, role: user.role, avatar: user.avatar || '' });
  }, [user]);

  const handleSaveSettings = () => {
    appStore.updateSettings(settings);
    // Placeholder for future email-alert delivery integration (API hook-up planned).
    if (settings.notifications.email && user?.email) showToast(`System configuration saved. Email alerts will be sent to ${user.email}.`);
    else showToast("System configuration saved.");
  };

  const handleSaveProfile = () => {
    appStore.updateProfile({ name: profileForm.name, role: profileForm.role, avatar: profileForm.avatar });
    setEditingProfile(false);
    showToast("Profile Updated");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      <h2 className="text-3xl font-bold text-white mb-8">System Configuration</h2>


      <div className="glass-panel p-8 rounded-xl border border-industrial-700 relative group">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-bold text-white flex items-center"><UserIcon className="mr-2 text-brand-neon" /> User Profile</h3>
          {!editingProfile ? (
            <button onClick={() => setEditingProfile(true)} className="text-gray-800 hover:text-brand-accent p-2 rounded hover:bg-white/5 transition-colors"><Edit2 size={16} /></button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={() => setEditingProfile(false)} className="text-gray-800 hover:text-white text-xs px-2">Cancel</button>
              <button onClick={handleSaveProfile} className="text-brand-neon hover:text-emerald-400 text-xs font-bold px-2">Save</button>
            </div>
          )}
        </div>

        {editingProfile ? (
          <div className="grid grid-cols-1 gap-4 animate-fade-in">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-industrial-800 border border-industrial-600 flex items-center justify-center overflow-hidden">
                {profileForm.avatar ? <img src={profileForm.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-500" />}
              </div>
              <div className="flex-1">
                <Input label="Avatar URL" value={profileForm.avatar} onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
              <Input label="Role / Title" value={profileForm.role} onChange={e => setProfileForm({ ...profileForm, role: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden border-2 border-white/10">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white">{user?.name}</h4>
              <p className="text-gray-800">{user?.email}</p>
              <p className="text-xs text-brand-accent mt-1 font-mono uppercase bg-brand-accent/10 inline-block px-2 py-1 rounded">{user?.role}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-industrial-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white font-bold flex items-center"><Settings className="mr-2 text-brand-neon" /> System Preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-industrial-800/30 rounded border border-industrial-700/50">
              <div className="space-y-0.5">
                <span className="text-sm text-slate-300 block">Email Notifications</span>
                <span className="text-[11px] text-slate-500 block">Alerts will be delivered to your account email.</span>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, notifications: { ...s.notifications, email: !s.notifications.email } }))} className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications.email ? 'bg-brand-neon' : 'bg-industrial-600'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.notifications.email ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-industrial-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold flex items-center"><Activity className="mr-2 text-brand-neon" /> Alert Thresholds</h3>
            <button onClick={handleSaveSettings} className="btn-primary text-sm flex items-center"><Save size={14} className="mr-2" /> Save Configuration</button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Acoustic Health Minimum</label>
                <span className="text-xs font-mono text-brand-neon">{settings.alertThresholds.acoustic}%</span>
              </div>
              <input type="range" min="0" max="100" value={settings.alertThresholds.acoustic} onChange={e => setSettings(s => ({ ...s, alertThresholds: { ...s.alertThresholds, acoustic: parseInt(e.target.value) } }))} className="w-full h-2 bg-[#DADAD7] rounded-lg appearance-none cursor-pointer accent-gray-600" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Vibration Health Minimum</label>
                <span className="text-xs font-mono text-brand-neon">{settings.alertThresholds.vibration}%</span>
              </div>
              <input type="range" min="0" max="100" value={settings.alertThresholds.vibration} onChange={e => setSettings(s => ({ ...s, alertThresholds: { ...s.alertThresholds, vibration: parseInt(e.target.value) } }))} className="w-full h-2 bg-[#DADAD7] rounded-lg appearance-none cursor-pointer accent-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherPage = () => {
  const [turbines, setTurbines] = useState(appStore.getTurbines());
  const [selectedId, setSelectedId] = useState<string>(turbines.length ? turbines[0].id : '');
  const [weather, setWeather] = useState<WeatherData | undefined>(undefined);
  const [forecast, setForecast] = useState<WeatherForecast | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTurbines(appStore.getTurbines());
    if (turbines.length && !selectedId) setSelectedId(turbines[0].id);
    const unsub = appStore.subscribe(() => setTurbines([...appStore.getTurbines()]));
    return unsub;
  }, []);

  useEffect(() => {
    const load = async () => {
      const t = appStore.getTurbine(selectedId);
      if (t) {
        setLoading(true);
        const data = await fetchWeather(t.location.lat, t.location.lng);
        if (data) {
          setWeather(data.current);
          setForecast(data.forecast);
        }
        setLoading(false);
      }
    };
    if (selectedId) load();
  }, [selectedId]);

  const t = appStore.getTurbine(selectedId);


  const calculatePredictedPower = (windKmh: number) => {
    if (!t) return 0;
    const windMs = windKmh / 3.6;
    const specs = t.specs as any;
    const ratedMs = specs.ratedSpeed || 13.0;
    const cutIn = specs.cutInSpeed || 3.0;
    const cutOut = specs.cutOutSpeed || 25.0;

    if (windMs < cutIn || windMs > cutOut) return 0;
    if (windMs >= ratedMs) return t.specs.ratedPower;

    // physics formula: P = 0.5*rho*A*Cp*v^3
    // chosen bcos this is much more accurate than simple interpolation and yields values > 0 quickly after cut-in
    const rho = 1.225; // standard air density (kg/m^3)
    const r = t.specs.rotorDiameter / 2;
    const A = Math.PI * r * r; // swept area
    const Cp = 0.40; // turbine efficiency coefficient (typical modern turbine)

    const watts = 0.5 * rho * A * Cp * Math.pow(windMs, 3);
    const mw = watts / 1000000;

    return Math.min(t.specs.ratedPower, mw);
  };

  if (turbines.length === 0) return <div className="p-10 text-center text-slate-500">No assets deployed to track weather.</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold text-white">Meteorological Intelligence</h2><p className="text-gray-800 text-sm">Hyper-local forecasting & power prediction</p></div>
        <div className="w-64"><Select options={turbines.map(t => ({ value: t.id, label: t.name }))} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} /></div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 glass-panel p-6 rounded-xl border border-industrial-700 flex flex-col items-center justify-center text-center">
          {loading ? <RefreshCw className="animate-spin text-brand-neon" size={32} /> : (
            <>
              <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mb-4">
                {weather?.weatherCode !== undefined && weather.weatherCode > 80 ? <CloudLightning size={40} className="text-brand-accent" /> :
                  weather?.weatherCode !== undefined && weather.weatherCode > 50 ? <CloudRain size={40} className="text-brand-accent" /> :
                    weather?.weatherCode !== undefined && weather.weatherCode < 3 ? <Sun size={40} className="text-brand-warning" /> : <Cloud size={40} className="text-slate-300" />}
              </div>
              <h3 className="text-4xl font-bold text-white mb-1">{weather?.temp}°C</h3>
              <p className="text-brand-accent font-bold uppercase text-sm mb-4">{weather ? getWeatherCodeDescription(weather.weatherCode) : 'Loading...'}</p>
              <div className="grid grid-cols-2 gap-4 w-full text-xs">
                <div className="bg-industrial-800/50 p-2 rounded"><p className="text-gray-800">Pressure</p><p className="text-white font-mono">{weather?.pressure} hPa</p></div>
                <div className="bg-industrial-800/50 p-2 rounded"><p className="text-gray-800">Humidity</p><p className="text-white font-mono">{weather?.humidity}%</p></div>
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-3 glass-panel p-8 rounded-xl border border-industrial-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wind size={150} /></div>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center"><Wind className="mr-2 text-brand-neon" /> Wind Profile</h3>
          <div className="grid grid-cols-3 gap-8 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Wind Speed</p>
              <p className="text-4xl font-bold text-white font-mono">{weather?.windSpeed} <span className="text-base text-gray-800 font-sans">km/h</span></p>
              <div className="w-full bg-industrial-800 h-1.5 mt-3 rounded-full overflow-hidden"><div className="h-full bg-brand-neon" style={{ width: `${Math.min(100, (weather?.windSpeed || 0) * 2)}%` }}></div></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Gusts</p>
              <p className="text-4xl font-bold text-white font-mono">{weather?.windGusts} <span className="text-base text-gray-800 font-sans">km/h</span></p>
              <div className="w-full bg-industrial-800 h-1.5 mt-3 rounded-full overflow-hidden"><div className="h-full bg-brand-warning" style={{ width: `${Math.min(100, (weather?.windGusts || 0) * 2)}%` }}></div></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Direction</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-600 flex items-center justify-center mr-3 bg-industrial-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${weather?.windDirection}deg)` }}>
                    <ArrowRight size={20} className="text-white -rotate-90" />
                  </div>
                  <span className="text-[8px] absolute top-1 font-bold text-slate-500">N</span>
                </div>
                <p className="text-2xl font-bold text-white">{weather?.windDirection}°</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-industrial-700/50 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Icing Risk</p>
              <span className={`px-3 py-1 rounded text-xs font-bold ${weather?.icingRisk === 'HIGH' ? 'bg-red-500 text-white' : weather?.icingRisk === 'MEDIUM' ? 'bg-amber-500 text-black' : 'bg-[#DADAD7] text-[#161616]'}`}>{weather?.icingRisk || 'CALCULATING'}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Turbulence Intensity</p>
              <span className="text-sm text-white font-mono">{(weather?.turbulenceIntensity || 0.1) * 100}% <span className="text-slate-500">(Est.)</span></span>
            </div>
          </div>
        </div>
      </div>


      <div className="glass-panel p-6 rounded-xl border border-industrial-700">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center"><Activity className="mr-2 text-brand-accent" /> 7-Day Production Forecast</h3>
        <div className="grid grid-cols-7 gap-4">
          {forecast?.daily.map((day, i) => (
            <div key={i} className="bg-industrial-800/30 rounded-lg p-3 border border-industrial-700/50 flex flex-col items-center text-center">
              <p className="text-xs font-bold text-gray-800 mb-2 uppercase">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
              <div className="mb-2">
                {day.weatherCode > 80 ? <CloudLightning size={20} className="text-slate-300" /> : day.weatherCode < 3 ? <Sun size={20} className="text-brand-warning" /> : <Cloud size={20} className="text-gray-800" />}
              </div>
              <div className="text-xs space-y-1 w-full">
                <div className="flex justify-between px-1"><span className="text-red-400">{Math.round(day.tempMax)}°</span><span className="text-blue-400">{Math.round(day.tempMin)}°</span></div>
                <div className="bg-industrial-900 rounded py-1 px-1 mt-1 border border-industrial-700">
                  <p className="text-[10px] text-slate-500 uppercase">Est. Power</p>
                  <p className="text-xs font-bold text-brand-neon">{calculatePredictedPower(day.maxWindSpeed).toFixed(1)}MW</p>
                </div>
              </div>
            </div>
          ))}
          {!forecast && Array(7).fill(0).map((_, i) => <div key={i} className="h-32 bg-industrial-800/30 rounded-lg animate-pulse"></div>)}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(appStore.getUser());
  const [activePath, setActivePath] = useState('/');
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setActivePath(location.pathname);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    setUser(appStore.getUser());
    const unsub = appStore.subscribe(() => {
      setUser(appStore.getUser());
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    appStore.logout();
    window.location.hash = '/';
  };

  if (!user) {
    return (
      <>
        <AppStyles />
        <AuthPage onLogin={setUser} />
      </>
    );
  }

  return (
    <>
      <AppStyles />
      <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#191919] selection:bg-brand-neon/30 flex">
        <Sidebar
          activePath={activePath}
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfile(true)}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen relative overflow-hidden transition-all duration-300">

          <div className="md:hidden flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-neon/10 rounded flex items-center justify-center text-brand-neon">
                <Wind size={20} />
              </div>
              <span className="font-bold text-white">WindWhisper</span>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-800 hover:text-white bg-industrial-800 rounded-lg border border-industrial-700">
              <MenuIcon size={20} />
            </button>
          </div>


          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-brand-neon/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/fleet" element={<FleetManager />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>


        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowProfile(false)}></div>
            <div className="relative bg-industrial-900 border border-industrial-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-slide-up">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">User Profile</h3><button onClick={() => setShowProfile(false)}><X className="text-gray-800 hover:text-white" /></button></div>
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0).toUpperCase()}</div>
                <h4 className="text-xl font-bold text-white">{user.name}</h4>
                <p className="text-gray-800">{user.email}</p>
                <span className="mt-2 px-3 py-1 bg-industrial-800 rounded-full text-xs font-mono text-brand-neon uppercase border border-industrial-700">{user.role}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-industrial-800/50 rounded border border-industrial-700"><span className="text-gray-800 text-sm">User ID</span><span className="text-slate-200 text-xs font-mono">{user.id}</span></div>
                <div className="flex justify-between p-3 bg-industrial-800/50 rounded border border-industrial-700"><span className="text-gray-800 text-sm">Phone</span><span className="text-slate-200 text-sm">{user.phoneNumber || 'Not Set'} {user.phoneVerified && '✅'}</span></div>
                <div className="flex justify-between p-3 bg-industrial-800/50 rounded border border-industrial-700"><span className="text-gray-800 text-sm">2FA Security</span><span className={`text-sm font-bold ${user.deviceIds && user.deviceIds.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{user.deviceIds?.length ? 'Active' : 'Disabled'}</span></div>
              </div>
              <button onClick={() => { setShowProfile(false); window.location.hash = '/settings'; }} className="mt-6 w-full py-3 bg-industrial-800 hover:bg-industrial-700 text-white rounded-lg font-bold text-sm transition-colors border border-industrial-600">Edit Profile & Settings</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Root = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default Root;
