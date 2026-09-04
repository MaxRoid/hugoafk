'use client';

import React from 'react';
import { MinecraftClient } from '@/types';
import { useDashboard } from '@/context/DashboardContext';
import {
  Blocks,
  Sliders,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientAddonsProps {
  client: MinecraftClient;
}

export const ClientAddons: React.FC<ClientAddonsProps> = ({ client }) => {
  const {
    addons,
    toggleClientAddon,
    uninstallAddonFromClient,
    openConfigModal,
    setActiveView,
    openInstallModal,
  } = useDashboard();

  return (
    <div id="client-addons-tab" className="space-y-4">
      {/* Tab Header & CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Installed Addons</h3>
          <p className="text-xs text-zinc-400">
            Modular routines actively loaded into {client.name}
          </p>
        </div>

        <button
          id="client-addons-catalog-btn"
          type="button"
          onClick={() => setActiveView('addons')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add More Addons</span>
        </button>
      </div>

      {/* List of Addons */}
      {client.activeAddons.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-400">
          <Blocks className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-300">No Addons Installed</p>
          <p className="text-xs text-zinc-500 mt-1">
            Install automation modules to make {client.name} farm, sell, or prevent AFK kicks.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('addons')}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors"
          >
            Browse Addons Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {client.activeAddons.map((installed) => {
            const addonMeta = addons.find((a) => a.id === installed.addonId);
            const title = addonMeta ? addonMeta.name : installed.addonId;
            const description = addonMeta?.description || 'Modular client plugin';
            const version = addonMeta?.version || '1.0.0';

            return (
              <div
                key={installed.addonId}
                id={`client-addon-card-${installed.addonId}`}
                className={cn(
                  'flex flex-col justify-between p-4 rounded-xl border transition-all duration-150',
                  installed.enabled
                    ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    : 'border-zinc-850 bg-zinc-950/40 opacity-75'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-100 truncate">{title}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          v{version}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    </div>

                    {/* Status Toggle Switch */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {installed.enabled ? (
                          <span className="text-emerald-400 font-medium">Enabled</span>
                        ) : (
                          <span className="text-zinc-500">Disabled</span>
                        )}
                      </span>
                      <button
                        type="button"
                        id={`toggle-addon-${installed.addonId}`}
                        onClick={() => toggleClientAddon(client.id, installed.addonId)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          installed.enabled ? 'bg-emerald-500' : 'bg-zinc-800'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                            installed.enabled ? 'translate-x-4.5' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Configure & Uninstall */}
                <div className="mt-4 pt-3 border-t border-zinc-850/80 flex items-center justify-between">
                  <button
                    id={`configure-addon-btn-${installed.addonId}`}
                    type="button"
                    onClick={() => {
                      if (addonMeta) {
                        openConfigModal(addonMeta, client.id, installed.config);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors"
                  >
                    <Sliders className="w-3 h-3 text-zinc-400" />
                    <span>Configure</span>
                  </button>

                  <button
                    id={`uninstall-addon-btn-${installed.addonId}`}
                    type="button"
                    onClick={() => uninstallAddonFromClient(client.id, installed.addonId)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Uninstall</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
