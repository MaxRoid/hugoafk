'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { X, Blocks, Check, Bot } from 'lucide-react';
import { ClientStatusBadge } from './ClientStatusBadge';

export const InstallAddonModal: React.FC = () => {
  const {
    installModalAddon,
    closeInstallModal,
    clients,
    installAddonToClients,
  } = useDashboard();

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  if (!installModalAddon) return null;

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAll = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map((c) => c.id));
    }
  };

  const handleInstall = () => {
    if (selectedClientIds.length === 0) return;
    installAddonToClients(installModalAddon.id, selectedClientIds);
  };

  return (
    <div
      id="install-addon-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeInstallModal();
      }}
    >
      <div
        id="install-addon-modal-content"
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
              <Blocks className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-100">
                Install {installModalAddon.name}?
              </h2>
              <p className="text-xs text-zinc-400">
                {installModalAddon.name} will be installed on your selected clients.
              </p>
            </div>
          </div>

          <button
            id="install-addon-close-btn"
            onClick={closeInstallModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client Selection List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300">Target Clients</span>
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {selectedClientIds.length === clients.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {clients.map((client) => {
              const isSelected = selectedClientIds.includes(client.id);
              const isAlreadyInstalled = client.activeAddons.some(
                (a) => a.addonId === installModalAddon.id
              );

              return (
                <div
                  key={client.id}
                  onClick={() => {
                    if (!isAlreadyInstalled) toggleClientSelection(client.id);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isAlreadyInstalled
                      ? 'border-zinc-850 bg-zinc-900/30 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-500/50 bg-emerald-950/20 cursor-pointer'
                      : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isAlreadyInstalled}
                      checked={isSelected || isAlreadyInstalled}
                      onChange={() => {
                        if (!isAlreadyInstalled) toggleClientSelection(client.id);
                      }}
                      className="h-4 w-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/40"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">
                        {client.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 block font-mono">
                        {client.server}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isAlreadyInstalled ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Already Installed
                      </span>
                    ) : (
                      <ClientStatusBadge status={client.status} size="sm" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-end gap-2.5">
          <button
            id="install-addon-cancel-btn"
            type="button"
            onClick={closeInstallModal}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="install-addon-submit-btn"
            type="button"
            disabled={selectedClientIds.length === 0}
            onClick={handleInstall}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Install Addon ({selectedClientIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
