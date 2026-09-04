'use client';

import React from 'react';
import { MinecraftClient } from '@/types';
import { formatRuntime } from '@/lib/formatters';
import {
  Server,
  Layers,
  Wifi,
  Clock,
  Compass,
  Heart,
  Utensils,
  Shield,
  Activity,
  Cpu,
  Zap,
} from 'lucide-react';

interface ClientOverviewProps {
  client: MinecraftClient;
}

export const ClientOverview: React.FC<ClientOverviewProps> = ({ client }) => {
  const isOnline = client.status === 'online';

  return (
    <div id="client-overview-tab" className="space-y-6">
      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Health */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Health</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {isOnline ? `${client.health} / ${client.maxHealth}` : '--'}
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: isOnline ? `${(client.health / client.maxHealth) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Food */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Food</span>
            <Utensils className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {isOnline ? `${client.food} / ${client.maxFood}` : '--'}
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: isOnline ? `${(client.food / client.maxFood) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Ping */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Latency</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {isOnline ? `${client.ping} ms` : '--'}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Direct TCP socket</p>
        </div>

        {/* Total Runtime */}
        <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium">Runtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {formatRuntime(client.runtimeSeconds)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Uptime counter</p>
        </div>
      </div>

      {/* Two-Column Details: Position & Connection Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* World Position Card */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-zinc-200">World Coordinates</h4>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              {client.position.dimension}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-[11px] text-zinc-400 block font-sans">X Coordinate</span>
              <span className="text-base font-bold text-zinc-100 mt-1 block">
                {isOnline ? client.position.x.toFixed(1) : '--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-[11px] text-zinc-400 block font-sans">Y Coordinate</span>
              <span className="text-base font-bold text-zinc-100 mt-1 block">
                {isOnline ? client.position.y.toFixed(1) : '--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <span className="text-[11px] text-zinc-400 block font-sans">Z Coordinate</span>
              <span className="text-base font-bold text-zinc-100 mt-1 block">
                {isOnline ? client.position.z.toFixed(1) : '--'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
            <span>Facing Orientation:</span>
            <span className="font-mono text-zinc-200">{client.position.facing}</span>
          </div>
        </div>

        {/* Server & Node Session Details */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-zinc-200">Connection Details</h4>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
              TLS Encrypted
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-zinc-850/60">
              <span className="text-zinc-400">Server Host</span>
              <span className="font-mono text-zinc-200 font-semibold">{client.server}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-850/60">
              <span className="text-zinc-400">Target Port</span>
              <span className="font-mono text-zinc-200">{client.port}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-850/60">
              <span className="text-zinc-400">Protocol Version</span>
              <span className="text-zinc-200">{client.version}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-850/60">
              <span className="text-zinc-400">Authentication Mode</span>
              <span className="text-zinc-200">{client.authMethod} OAuth</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Auto Reconnect Policy</span>
              <span className="text-emerald-400 font-medium">
                {client.autoReconnect ? 'Enabled (Exponential)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated System Resource Footprint */}
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-zinc-500" />
          <span>Container CPU: <strong className="text-zinc-200 font-mono">1.2%</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <span>RAM Allocation: <strong className="text-zinc-200 font-mono">142 MB / 512 MB</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-500" />
          <span>Network In/Out: <strong className="text-zinc-200 font-mono">1.4 MB / 420 KB</strong></span>
        </div>
      </div>
    </div>
  );
};
