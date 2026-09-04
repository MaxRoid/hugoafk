'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ClientStatusBadge } from '@/components/ClientStatusBadge';
import { ClientOverview } from '@/components/client-detail/ClientOverview';
import { ClientAddons } from '@/components/client-detail/ClientAddons';
import { ChatPanel } from '@/components/client-detail/ChatPanel';
import { InventoryGrid } from '@/components/client-detail/InventoryGrid';
import { LiveViewer } from '@/components/client-detail/LiveViewer';
import { ClientLogs } from '@/components/client-detail/ClientLogs';
import { formatRuntime } from '@/lib/formatters';
import { ClientDetailTab } from '@/types';
import {
  Play,
  Square,
  RotateCw,
  ArrowLeft,
  Server,
  Activity,
  Boxes,
  MessageSquare,
  Package,
  Video,
  Terminal,
  Compass,
  Trash2,
  Key,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ClientDetailView: React.FC = () => {
  const {
    selectedClient,
    setActiveView,
    activeTab,
    setActiveTab,
    startClient,
    stopClient,
    restartClient,
    deleteClient,
    currentUser,
  } = useDashboard();

  if (!selectedClient) {
    return (
      <div className="py-20 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-400">
        <p className="text-base font-semibold text-zinc-200">No Client Selected</p>
        <p className="text-xs text-zinc-500 mt-1">Please select an active bot from the Clients list.</p>
        <button
          type="button"
          onClick={() => setActiveView('clients')}
          className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const isOnline = selectedClient.status === 'online';
  const isStarting = selectedClient.status === 'starting';
  const isStopped = selectedClient.status === 'stopped' || selectedClient.status === 'offline';

  const tabs: { id: ClientDetailTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    ...(currentUser?.role === 'admin' ? [{ id: 'addons' as ClientDetailTab, label: 'Addons', icon: Boxes, count: selectedClient.activeAddons.length }] : []),
    { id: 'chat', label: 'Chat', icon: MessageSquare, count: selectedClient.chatHistory.length },
    { id: 'inventory', label: 'Inventory', icon: Package, count: selectedClient.inventory.length },
    { id: 'live-view', label: 'Live View', icon: Video },
    { id: 'logs', label: 'Logs', icon: Terminal, count: selectedClient.logs.length },
  ];

  return (
    <div id="client-detail-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <button
            id="client-detail-back-btn"
            type="button"
            onClick={() => setActiveView('clients')}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                {selectedClient.name}
              </h1>
              <ClientStatusBadge status={selectedClient.status} size="md" />
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1 font-mono text-zinc-300">
                <Server className="w-3 h-3 text-zinc-500" />
                {selectedClient.server}:{selectedClient.port}
              </span>
              <span>•</span>
              <span>{selectedClient.version}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Stop/Start, Restart, Delete */}
        <div className="flex items-center gap-2">
          {/* Start or Stop */}
          {isStopped ? (
            <button
              id="client-detail-start-btn"
              type="button"
              onClick={() => startClient(selectedClient.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-sm transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Client</span>
            </button>
          ) : (
            <button
              id="client-detail-stop-btn"
              type="button"
              onClick={() => stopClient(selectedClient.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Client</span>
            </button>
          )}

          {/* Restart */}
          <button
            id="client-detail-restart-btn"
            type="button"
            onClick={() => restartClient(selectedClient.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-800 transition-colors"
          >
            <RotateCw className={cn('w-3.5 h-3.5', isStarting && 'animate-spin text-amber-400')} />
            <span>Restart</span>
          </button>

          {/* Delete */}
          <button
            id="client-detail-delete-btn"
            type="button"
            onClick={() => deleteClient(selectedClient.id)}
            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 border border-zinc-800 transition-colors"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Microsoft Auth Action Banner */}
      {selectedClient.deviceCode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 animate-in fade-in duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Microsoft Login erforderlich</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  {selectedClient.deviceCode.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Klicke auf den Button, um den Bot einmalig bei Microsoft freizuschalten.
              </p>
            </div>
          </div>
          <a
            href={selectedClient.deviceCode.directUrl || selectedClient.deviceCode.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-bold transition-all shadow-md shrink-0"
          >
            <span>Auf Microsoft bestätigen</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Quick Statistics Horizontal Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs font-mono">
        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Ping</span>
          <span className="font-bold text-emerald-400 text-sm">{isOnline ? `${selectedClient.ping}ms` : '--'}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Health</span>
          <span className="font-bold text-rose-400 text-sm">{isOnline ? `${selectedClient.health}/20` : '--'}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Food</span>
          <span className="font-bold text-amber-400 text-sm">{isOnline ? `${selectedClient.food}/20` : '--'}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">X</span>
          <span className="font-bold text-zinc-200 text-sm">{isOnline ? selectedClient.position.x.toFixed(1) : '--'}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Y</span>
          <span className="font-bold text-zinc-200 text-sm">{isOnline ? selectedClient.position.y.toFixed(1) : '--'}</span>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Z</span>
          <span className="font-bold text-zinc-200 text-sm">{isOnline ? selectedClient.position.z.toFixed(1) : '--'}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-850">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-sans">Runtime</span>
          <span className="font-bold text-cyan-400 text-sm truncate block">
            {formatRuntime(selectedClient.runtimeSeconds)}
          </span>
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="border-b border-zinc-800">
        <nav className="flex items-center gap-2 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`client-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'border-emerald-400 text-emerald-400 font-semibold bg-zinc-900/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-400' : 'text-zinc-500')} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.2 rounded',
                      isActive ? 'bg-emerald-950/80 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Panel Content */}
      <div className="pt-2">
        {activeTab === 'overview' && <ClientOverview client={selectedClient} />}
        {activeTab === 'addons' && <ClientAddons client={selectedClient} />}
        {activeTab === 'chat' && <ChatPanel client={selectedClient} />}
        {activeTab === 'inventory' && <InventoryGrid client={selectedClient} />}
        {activeTab === 'live-view' && <LiveViewer client={selectedClient} />}
        {activeTab === 'logs' && <ClientLogs client={selectedClient} />}
      </div>
    </div>
  );
};
