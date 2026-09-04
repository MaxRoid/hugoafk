'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  X,
  Lock,
  Shield,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    loginWithDiscord,
    t,
    settings,
  } = useDashboard();

  if (!isAuthModalOpen) return null;

  const isDe = settings.language === 'de';

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        id="auth-modal-content"
        className="relative w-full max-w-md rounded-2xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="auth-modal-close"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          aria-label={t('actionClose')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              {isDe ? 'Konto wechseln / Anmelden' : 'Switch Account / Sign In'}
            </h2>
            <p className="text-xs text-zinc-400">
              HugoAFK OAuth Gateway
            </p>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            id="auth-modal-discord-btn"
            type="button"
            onClick={() => {
              setIsAuthModalOpen(false);
              loginWithDiscord();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>{t('loginWithDiscord')}</span>
          </button>

          <button
            id="auth-modal-google-btn"
            type="button"
            onClick={() => {
              setIsAuthModalOpen(false);
              loginWithGoogle();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

        {/* Security Info */}
        <div className="rounded-xl p-3 bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>{isDe ? 'Exklusiver OAuth Zugang' : 'Exclusive OAuth Access'}</span>
          </div>
          <p>
            {isDe
              ? 'Anmeldung ausschließlich über autorisierte OAuth 2.0 Provider (Discord & Google). Berechtigungen werden serverseitig gesteuert.'
              : 'Sign in exclusively via authorized OAuth 2.0 providers (Discord & Google). Permissions are enforced server-side.'}
          </p>
        </div>
      </div>
    </div>
  );
};
