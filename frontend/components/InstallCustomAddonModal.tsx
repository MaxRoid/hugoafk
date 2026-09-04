'use client';

import React, { useState } from 'react';
import {
  Upload,
  X,
  Check,
  FolderPlus,
  FileCode,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';

interface InstallCustomAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreset?: { folderName: string; manifest: any; code: string } | null;
}

export const InstallCustomAddonModal: React.FC<InstallCustomAddonModalProps> = ({
  isOpen,
  onClose,
  initialPreset,
}) => {
  const { addToast, refreshData } = useDashboard();

  const [folderName, setFolderName] = useState(initialPreset?.folderName || 'my-custom-plugin');
  const [manifestText, setManifestText] = useState(
    initialPreset?.manifest
      ? JSON.stringify(initialPreset.manifest, null, 2)
      : JSON.stringify(
          {
            id: 'my-custom-plugin',
            name: 'Mein Neues Plugin',
            version: '1.0.0',
            author: 'Community Dev',
            description: 'Beschreibung meines benutzerdefinierten Plug-and-Play Addons.',
            category: 'Utility',
            tags: ['Custom', 'Plug & Play'],
            icon: 'Puzzle',
            configSchema: [
              {
                key: 'active',
                label: 'Aktivieren',
                type: 'boolean',
                defaultValue: true,
              },
            ],
          },
          null,
          2
        )
  );

  const [codeText, setCodeText] = useState(
    initialPreset?.code ||
      `export async function init(context) {
  const { bot, clientName, logger, config, sendChat } = context;
  logger.info(\`Plugin gestartet für \${clientName}\`);
}

export async function stop(context) {
  const { logger } = context;
  logger.info('Plugin gestoppt.');
}

export default { init, stop };`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedManifest: any;
    try {
      parsedManifest = JSON.parse(manifestText);
    } catch (err: any) {
      setError(`Fehler im addon.json (Ungültiges JSON): ${err?.message}`);
      return;
    }

    if (!codeText.includes('init')) {
      setError('Die index.js muss eine "export async function init(context)" enthalten.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/addons/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: folderName.trim(),
          manifest: parsedManifest,
          code: codeText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Installieren des Addons');
      }

      addToast(
        'Plug & Play Addon Installiert!',
        `Plugin "${parsedManifest.name}" wurde erfolgreich in /addons/${folderName} gespeichert und aktiviert.`,
        'success'
      );

      if (refreshData) await refreshData();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Installation fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>Plug & Play Plugin Installieren</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Fügt einen neuen Addon-Ordner in <code className="text-zinc-300 font-mono">/addons/</code> ein.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Ordnername in /addons/ <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. auto-miner, discord-bridge"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-amber-400" />
                <span>addon.json (Manifest & Schema)</span>
              </label>
            </div>
            <textarea
              rows={6}
              value={manifestText}
              onChange={(e) => setManifestText(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>index.js (Addon Logik)</span>
              </label>
            </div>
            <textarea
              rows={8}
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Installiere...' : 'In /addons/ speichern & aktivieren'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
