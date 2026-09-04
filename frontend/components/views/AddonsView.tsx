'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Addon, AddonCategory } from '@/types';
import {
  Blocks,
  Search,
  Sliders,
  CheckCircle2,
  Download,
  Filter,
  Bot,
  Zap,
  Check,
  Sparkles,
  FolderPlus,
  RefreshCw,
  Trash2,
  Puzzle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiAddonModal } from '@/components/AiAddonModal';
import { InstallCustomAddonModal } from '@/components/InstallCustomAddonModal';

export const AddonsView: React.FC = () => {
  const { addons, clients, openInstallModal, openConfigModal, addToast, refreshData } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCustomInstallModalOpen, setIsCustomInstallModalOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const categories = ['All', 'Automation', 'Movement', 'Utility', 'Management'];

  // Calculate installation count across all clients for each addon
  const getInstallationCount = (addonId: string) => {
    return clients.filter((c) => c.activeAddons.some((a) => a.addonId === addonId)).length;
  };

  const handleReload = async () => {
    try {
      setIsReloading(true);
      const res = await fetch('/api/addons/reload', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reload failed');

      addToast(
        'Plugins aktualisiert',
        `${data.count} Addons erfolgreich aus dem /addons/ Ordner neu geladen.`,
        'success'
      );
      if (refreshData) await refreshData();
    } catch (err: any) {
      addToast('Fehler beim Neuladen', err?.message || 'Konnte Addons nicht neu laden', 'error');
    } finally {
      setIsReloading(false);
    }
  };

  const handleDeleteCustomAddon = async (addon: Addon) => {
    if (!window.confirm(`Möchtest du das Plugin "${addon.name}" wirklich aus /addons/ löschen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/addons/custom/${addon.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen');

      addToast('Plugin gelöscht', `Plugin "${addon.name}" wurde entfernt.`, 'info');
      if (refreshData) await refreshData();
    } catch (err: any) {
      addToast('Fehler beim Löschen', err?.message || 'Löschen nicht möglich', 'error');
    }
  };

  const filteredAddons = addons.filter((addon) => {
    const matchesCategory =
      selectedCategory === 'All' || addon.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      addon.name.toLowerCase().includes(q) ||
      addon.description.toLowerCase().includes(q) ||
      addon.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div id="addons-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Addons & Plugins</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
              {addons.length} verfügbar
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Modulare Erweiterungen wie bei einem Minecraft-Server (Plug &amp; Play).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors disabled:opacity-50"
            title="Sucht nach neuen Ordnern im /addons/ Verzeichnis"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isReloading && 'animate-spin text-emerald-400')} />
            <span>Neu laden</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomInstallModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Plugin hinzufügen</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>KI Prompt Generator</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="addons-search-input"
            type="text"
            placeholder="Search addons by name or routine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`addon-filter-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Addons Grid */}
      {filteredAddons.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-400">
          <Blocks className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">Keine Addons gefunden</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Kein Addon entspricht &quot;{searchQuery || selectedCategory}&quot;. Erstelle ein neues Plugin oder wähle eine andere Kategorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => {
            const installCount = getInstallationCount(addon.id);
            const isInstalled = installCount > 0;
            const isCustom = !addon.isBuiltIn;

            return (
              <div
                key={addon.id}
                id={`addon-card-${addon.id}`}
                className="flex flex-col justify-between p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm transition-all duration-200 hover:border-zinc-750 hover:bg-zinc-900/80 group relative"
              >
                <div>
                  {/* Top line: Category badge, custom badge & version */}
                  <div className="flex items-center justify-between text-[11px] mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium">
                        {addon.category}
                      </span>
                      {isCustom && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/50 text-purple-300 border border-purple-800/60 font-mono text-[10px]">
                          <Puzzle className="w-3 h-3" />
                          <span>Plug &amp; Play</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-500">v{addon.version}</span>
                      {isInstalled && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>Active ({installCount})</span>
                        </span>
                      )}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomAddon(addon)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Plugin aus /addons/ löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {addon.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed min-h-[36px]">
                    {addon.description}
                  </p>

                  {/* Author & Specs */}
                  <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Von: <strong className="text-zinc-400">{addon.author || 'Community'}</strong></span>
                    <span>{addon.configSchema?.length || 0} Parameter</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-zinc-850 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openConfigModal(addon)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Konfigurieren</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openInstallModal(addon)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isInstalled ? 'Auf weitere Bots' : 'Aktivieren'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Prompt Generator Modal */}
      <AiAddonModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Custom Addon Installer Modal */}
      <InstallCustomAddonModal
        isOpen={isCustomInstallModalOpen}
        onClose={() => setIsCustomInstallModalOpen(false)}
      />
    </div>
  );
};
