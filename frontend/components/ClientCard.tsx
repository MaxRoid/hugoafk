'use client';

import React from 'react';
import { MinecraftClient } from '@/types';
import { useDashboard } from '@/context/DashboardContext';
import { ClientStatusBadge } from './ClientStatusBadge';
import { formatRuntime } from '@/lib/formatters';
import {
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Trash2,
  Wifi,
  Clock,
  Boxes,
  Server,
  Layers,
  User,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCardProps {
  client: MinecraftClient;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  const {
    setActiveView,
    startClient,
    stopClient,
    restartClient,
    deleteClient,
    addons,
    users,
    currentUser,
    assignClientOwner,
  } = useDashboard();

  const isOnline = client.status === 'online';
  const isStarting = client.status === 'starting';
  const isStopped = client.status === 'stopped' || client.status === 'offline';

  const installedAddonNames = client.activeAddons
    .filter((a) => a.enabled)
    .map((a) => {
      const addon = addons.find((item) => item.id === a.addonId);
      return addon ? addon.name : a.addonId;
    });

  const lastErrorOrWarn =
    !isOnline && client.logs && client.logs.length > 0
      ? client.logs
          .slice()
          .reverse()
          .find((l) => l.level === 'ERROR' || l.level === 'WARN')
      : null;

  return (
    <div
      id={`client-card-${client.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all duration-200 hover:border-zinc-750 hover:bg-zinc-900/80"
    >
      {/* Card Header: Client Name & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-400">
              <Server className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="truncate">{client.server}</span>
            </div>

            {/* Pterodactyl-style Owner Badge & Reassignment */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 font-mono text-[10px]">
                <User className="w-3 h-3 text-emerald-400" />
                <span className="text-zinc-500">Owner:</span>
                <span className="font-semibold text-zinc-200">{client.ownerUsername || 'Admin'}</span>
              </span>

              {currentUser?.role === 'admin' && users.length > 0 && (
                <select
                  value={client.ownerId || ''}
                  onChange={(e) => assignClientOwner(client.id, e.target.value)}
                  className="rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] px-1.5 py-0.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  title="Besitzer zuweisen (Pterodactyl User)"
                >
                  <option value="" disabled>Zuweisen...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      → {u.username}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <ClientStatusBadge status={client.status} size="sm" />
        </div>

        {/* Microsoft Auth Action Banner */}
        {client.deviceCode && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Microsoft Login erforderlich</span>
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                {client.deviceCode.code}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2.5 leading-tight">
              Klicke auf den Button, um den Bot einmalig bei Microsoft freizuschalten.
            </p>
            <a
              href={client.deviceCode.directUrl || client.deviceCode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 text-xs font-bold transition-all shadow-md"
            >
              <span>Auf Microsoft bestätigen</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Client Specs Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="truncate">{client.version.replace('Minecraft ', 'MC ')}</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
            <Wifi className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isOnline ? `${client.ping}ms` : '--'}</span>
          </div>

          <div className="col-span-2 flex items-center gap-1.5 text-zinc-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px]">{formatRuntime(client.runtimeSeconds)}</span>
            <span className="text-zinc-600 text-[10px]">runtime</span>
          </div>
        </div>

        {/* Active Addons Tags */}
        <div className="mt-3 pt-2.5 border-t border-zinc-850">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1.5">
            <Boxes className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Active Addons</span>
          </div>
          <div className="flex flex-wrap gap-1 min-h-[22px]">
            {installedAddonNames.length > 0 ? (
              installedAddonNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-zinc-400 italic">No active addons</span>
            )}
          </div>
        </div>

        {/* Status / Kick Alert (if not online) */}
        {lastErrorOrWarn && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-[11px] text-red-300">
            <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-red-400">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>Server-Meldung</span>
            </div>
            <p className="mt-0.5 text-zinc-300 text-[11px] leading-tight line-clamp-2">
              {lastErrorOrWarn.message}
            </p>
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
        {/* Manage Button (Deep View) */}
        <button
          id={`manage-client-btn-${client.id}`}
          type="button"
          onClick={() => setActiveView('client-detail', client.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Manage</span>
        </button>

        {/* Restart Button */}
        <button
          id={`restart-client-btn-${client.id}`}
          type="button"
          onClick={() => restartClient(client.id)}
          title="Restart Client"
          aria-label="Restart Client"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
        >
          <RotateCw className={cn('w-3.5 h-3.5', isStarting && 'animate-spin text-amber-400')} />
        </button>

        {/* Start / Stop Button */}
        {isStopped ? (
          <button
            id={`start-client-btn-${client.id}`}
            type="button"
            onClick={() => startClient(client.id)}
            title="Start Client"
            aria-label="Start Client"
            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/50 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            id={`stop-client-btn-${client.id}`}
            type="button"
            onClick={() => stopClient(client.id)}
            title="Stop Client"
            aria-label="Stop Client"
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        {/* Delete Button */}
        <button
          id={`delete-client-btn-${client.id}`}
          type="button"
          onClick={() => deleteClient(client.id)}
          title="Delete Client"
          aria-label="Delete Client"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
