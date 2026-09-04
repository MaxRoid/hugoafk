'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { StatCard } from '@/components/StatCard';
import { ClientCard } from '@/components/ClientCard';
import { formatRuntime, formatShortRuntime } from '@/lib/formatters';
import {
  Bot,
  Wifi,
  PowerOff,
  Clock,
  Plus,
  ArrowUpRight,
  Radio,
  Server,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { clients, nodes, setActiveView, setIsCreateModalOpen, t, settings } = useDashboard();

  const totalClients = clients.length;
  const onlineClients = clients.filter((c) => c.status === 'online').length;
  const offlineClients = clients.filter(
    (c) => c.status === 'offline' || c.status === 'stopped'
  ).length;

  const totalRuntimeSeconds = clients.reduce((acc, c) => acc + c.runtimeSeconds, 0);

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            {t('navDashboard')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="dashboard-new-client-btn"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('createClientBtn')}</span>
          </button>
        </div>
      </div>

      {/* Cluster Nodes Quick Bar */}
      <div
        id="dashboard-nodes-banner"
        onClick={() => setActiveView('admin-nodes')}
        className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 px-4 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-cyan-500/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <span>{t('adminTitle')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                {nodes.filter((n) => n.status === 'online').length}/{nodes.length} Nodes Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {settings.language === 'de'
                ? 'Verwalte Host-Knoten, Daemon-Instanzen, Bot-Verteilung und Benutzerquoten'
                : 'Manage host server nodes, daemon instances, bot routing, and user quotas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 shrink-0">
          <span>{settings.language === 'de' ? 'Knoten öffnen' : 'Open Nodes'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 4 Small Metric / Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-total-clients"
          title={t('statTotalBots')}
          value={totalClients}
          subtext={settings.language === 'de' ? 'Konfigurierte Bots' : 'Provisioned bots'}
          icon={Bot}
          indicatorColor="cyan"
          onClick={() => setActiveView('clients')}
        />

        <StatCard
          id="stat-online-clients"
          title={t('statActiveOnline')}
          value={onlineClients}
          subtext={`${onlineClients} ${settings.language === 'de' ? 'aktive Instanzen' : 'running instances'}`}
          icon={Wifi}
          indicatorColor="emerald"
          onClick={() => setActiveView('clients')}
        />

        <StatCard
          id="stat-offline-clients"
          title={t('statOffline')}
          value={offlineClients}
          subtext={settings.language === 'de' ? 'Standby oder gestoppt' : 'Standby or stopped'}
          icon={PowerOff}
          indicatorColor={offlineClients > 0 ? 'rose' : 'zinc'}
          onClick={() => setActiveView('clients')}
        />

        <StatCard
          id="stat-total-runtime"
          title={t('statTotalRuntime')}
          value={formatShortRuntime(totalRuntimeSeconds)}
          subtext={formatRuntime(totalRuntimeSeconds)}
          icon={Clock}
          indicatorColor="zinc"
        />
      </div>

      {/* Clients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">
              {t('activeBotsSection')}
            </h2>
            <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {clients.length}
            </span>
          </div>

          <button
            id="view-all-clients-btn"
            type="button"
            onClick={() => setActiveView('clients')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <span>{t('viewAllClients')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </div>
  );
};
