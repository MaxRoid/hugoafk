'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ExternalLink, Copy, Check, Key, Loader2, X, Smartphone } from 'lucide-react';

export const MicrosoftAuthModal: React.FC = () => {
  const { clients } = useDashboard();
  const [dismissedCode, setDismissedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Find the first client currently waiting for Microsoft auth
  const waitingClient = clients.find(
    (c) => c.deviceCode && c.status === 'starting' && c.deviceCode.code !== dismissedCode
  );

  if (!waitingClient || !waitingClient.deviceCode) {
    return null;
  }

  const { code, directUrl } = waitingClient.deviceCode;
  const targetUrl = directUrl || `https://www.microsoft.com/link?otc=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenAuth = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="microsoft-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="microsoft-auth-modal"
        className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-amber-950/20 text-zinc-100 animate-in zoom-in-95 duration-200"
      >
        {/* Dismiss Button */}
        <button
          onClick={() => setDismissedCode(code)}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-850 transition-colors"
          title="Schließen (kann auf der Bot-Karte wieder geöffnet werden)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Microsoft Login erforderlich</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Bot <span className="font-semibold text-emerald-400 font-mono">{waitingClient.name}</span> will sich mit{' '}
              <span className="text-zinc-300 font-mono">{waitingClient.server}</span> verbinden.
            </p>
          </div>
        </div>

        {/* Code Highlight Box */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center mb-5">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Dein einmaliger Bestätigungscode
          </span>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-amber-300 select-all">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors"
              title="Code in Zwischenablage kopieren"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && <span className="text-xs text-emerald-400 font-medium">In Zwischenablage kopiert!</span>}
        </div>

        {/* Steps Explanation */}
        <div className="space-y-2 mb-6 text-xs text-zinc-400 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-850">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <span>Klicke auf <strong>&quot;Auf Microsoft anmelden&quot;</strong> (öffnet die offizielle Microsoft-Seite).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <span>Logge dich mit dem Microsoft-Konto ein, auf dem Minecraft gekauft wurde.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <span>Der Bot verbindet sich danach <strong>automatisch</strong>. Dieses Fenster schließt sich von selbst!</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleOpenAuth}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mb-3"
        >
          <span>Auf diesem Gerät anmelden</span>
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Mobile / Smartphone Option with QR Code */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-zinc-200 block">Über das Smartphone anmelden?</span>
                <span className="text-[11px] text-zinc-400 block">
                  QR-Code mit Handy scannen oder <strong>microsoft.com/link</strong> öffnen
                </span>
              </div>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(targetUrl)}&bgcolor=24-24-27&color=251-191-36`}
              alt="Microsoft Login QR Code"
              className="w-16 h-16 rounded-xl border border-zinc-700/60 p-1 bg-zinc-900 shrink-0"
              title="Mit Handy scannen"
            />
          </div>
        </div>

        {/* Live waiting indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Warte auf Bestätigung im Browser...</span>
        </div>
      </div>
    </div>
  );
};
