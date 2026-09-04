'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  Bot,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Radio,
  Server,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoginScreen: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithDiscord,
    settings,
    toggleTheme,
    setLanguage,
    t,
  } = useDashboard();

  const isDe = settings.language === 'de';
  const isLight = settings.theme === 'light';
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters for OAuth errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      if (errorParam) {
        if (errorParam === 'discord_oauth_not_configured') {
          setErrorMsg(
            isDe
              ? 'Discord OAuth ist noch nicht eingerichtet. Bitte trage deine DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET in die .env Datei ein.'
              : 'Discord OAuth is not configured yet. Please enter your DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET in the .env file.'
          );
        } else if (errorParam === 'google_oauth_not_configured') {
          setErrorMsg(
            isDe
              ? 'Google OAuth ist noch nicht eingerichtet. Bitte trage deine GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in die .env Datei ein.'
              : 'Google OAuth is not configured yet. Please enter your GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in the .env file.'
          );
        } else {
          setErrorMsg(
            isDe
              ? `Anmeldefehler: ${decodeURIComponent(errorParam)}`
              : `Authentication error: ${decodeURIComponent(errorParam)}`
          );
        }
      }
    }
  }, [isDe]);

  return (
    <div
      id="login-screen-root"
      suppressHydrationWarning
      className={cn(
        'min-h-screen w-full flex flex-col justify-between transition-colors duration-200 p-4 sm:p-6 lg:p-8',
        isLight
          ? 'bg-slate-100 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900'
          : 'bg-zinc-950 text-zinc-100 selection:bg-emerald-500/25 selection:text-emerald-300'
      )}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className={cn(
            'absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-3xl opacity-15',
            isLight ? 'bg-emerald-400' : 'bg-emerald-500'
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-10',
            isLight ? 'bg-blue-400' : 'bg-blue-600'
          )}
        />
      </div>

      {/* Top Bar: Brand, Quick Language/Theme Toggles */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wider uppercase font-mono">HugoAFK</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v4.2
              </span>
            </div>
            <p className={cn('text-[10px]', isLight ? 'text-slate-500' : 'text-zinc-500')}>
              Minecraft Bot Fleet Orchestrator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(isDe ? 'en' : 'de')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            )}
            title="Language / Sprache"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono uppercase">{settings.language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'p-1.5 rounded-lg border transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            )}
            title="Toggle theme"
          >
            {isLight ? <Moon className="w-3.5 h-3.5 text-slate-600" /> : <Sun className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div
          className={cn(
            'relative rounded-2xl p-6 sm:p-8 border shadow-xl transition-all',
            isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-zinc-900/90 border-zinc-800 shadow-black/40'
          )}
        >
          {/* Header Title inside Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className={cn('text-xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-zinc-100')}>
              {isDe ? 'HugoAFK Anmelden' : 'HugoAFK Sign In'}
            </h1>
            <p className={cn('text-xs mt-1 max-w-xs mx-auto', isLight ? 'text-slate-500' : 'text-zinc-400')}>
              {isDe
                ? 'Sicherer & exklusiver Zugang über Discord oder Google.'
                : 'Secure & exclusive access via Discord or Google.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 mb-5 text-xs text-rose-400 font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* OAuth Buttons Section */}
          <div className="space-y-3 mb-6">
            {/* Discord Sign In */}
            <button
              id="login-discord-btn"
              type="button"
              onClick={() => loginWithDiscord()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] group cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>{t('loginWithDiscord')}</span>
            </button>

            {/* Google Sign In */}
            <button
              id="login-google-btn"
              type="button"
              onClick={() => loginWithGoogle()}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold transition-all shadow-xs active:scale-[0.98] group cursor-pointer',
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-zinc-100'
              )}
            >
              <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{t('loginWithGoogle')}</span>
            </button>
          </div>

          {/* Owner & Security Note */}
          <div
            className={cn(
              'rounded-xl p-3 border text-[11px] leading-relaxed',
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{isDe ? 'Administrator & Owner Schutz' : 'Administrator & Owner Protection'}</span>
            </div>
            <p>
              {isDe
                ? 'Der Server-Inhaber (Owner) erhält über die in der Server-Konfiguration hinterlegte Discord-ID automatisch volle Administrator-Rechte.'
                : 'The server owner automatically receives full administrator privileges matching the Discord ID configured on the server.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 py-3 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Gateway Node: EU-Central #1</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-zinc-400" />
            <span>Mineflayer Core v1.21.11</span>
          </span>
        </div>
        <div>
          <span>HugoAFK © {new Date().getFullYear()} — Autonomous Bot Orchestrator</span>
        </div>
      </footer>
    </div>
  );
};
