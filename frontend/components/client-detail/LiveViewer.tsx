'use client';

import React, { useState } from 'react';
import { MinecraftClient } from '@/types';
import { useDashboard } from '@/context/DashboardContext';
import {
  VideoOff,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  Radio,
  MonitorOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveViewerProps {
  client: MinecraftClient;
}

export const LiveViewer: React.FC<LiveViewerProps> = ({ client }) => {
  const { addToast } = useDashboard();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = () => {
    setIsReconnecting(true);
    addToast('Connecting to Viewer Stream', `Awaiting WebRTC peer handshake for ${client.name}...`, 'info');

    setTimeout(() => {
      setIsReconnecting(false);
      addToast(
        'Viewer handshake timed out',
        'Headless rendering pipeline inactive. Start Mineflayer viewer plugin or verify WebRTC bridge port 3000.',
        'warning'
      );
    }, 2800);
  };

  return (
    <div id="client-live-view-tab" className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Live View Camera</h3>
          <p className="text-xs text-zinc-400">
            Real-time viewport stream rendered from bot perspective
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="flex h-2 w-2 rounded-full bg-zinc-600" />
          <span>Stream Offline</span>
        </div>
      </div>

      {/* Large Dark Viewer Canvas Placeholder */}
      <div
        id="live-viewer-canvas"
        className="relative w-full h-[460px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col items-center justify-center text-center p-6 select-none"
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Viewport UI overlays */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 backdrop-blur-sm">
          <Camera className="w-3.5 h-3.5 text-zinc-500" />
          <span>CAM-01 • {client.position.dimension}</span>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 backdrop-blur-sm">
          <span>FOV: 70° • 1080p</span>
        </div>

        {/* Center Disconnected State */}
        <div className="relative z-10 max-w-sm flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mb-4 shadow-xl">
            {isReconnecting ? (
              <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin" />
            ) : (
              <MonitorOff className="h-7 w-7 text-zinc-500" />
            )}
          </div>

          <h4 className="text-base font-bold text-zinc-100 tracking-tight">Live View</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Viewer connection unavailable
          </p>

          <p className="text-[11px] text-zinc-500 mt-2 max-w-xs font-mono">
            {isReconnecting
              ? 'Attempting socket handshake on ws://localhost:3000/viewer...'
              : 'WebRTC / Prismarine-viewer frame pipe is in standby mode'}
          </p>

          {/* Reconnect Viewer Button */}
          <button
            id="reconnect-viewer-btn"
            type="button"
            disabled={isReconnecting}
            onClick={handleReconnect}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isReconnecting && 'animate-spin text-emerald-400')} />
            <span>{isReconnecting ? 'Connecting...' : 'Reconnect Viewer'}</span>
          </button>
        </div>

        {/* Bottom coordinates bar */}
        <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-850">
          <span>X: {client.position.x.toFixed(1)} Y: {client.position.y.toFixed(1)} Z: {client.position.z.toFixed(1)}</span>
          <span>Pitch: -4.2° • Yaw: 180.0°</span>
        </div>
      </div>
    </div>
  );
};
