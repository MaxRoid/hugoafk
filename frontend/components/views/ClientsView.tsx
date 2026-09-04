'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ClientCard } from '@/components/ClientCard';
import { ClientStatusBadge } from '@/components/ClientStatusBadge';
import { formatRuntime } from '@/lib/formatters';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Trash2,
  Bot,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientStatus } from '@/types';

export const ClientsView: React.FC = () => {
  const {
    clients,
    addons,
    setIsCreateModalOpen,
    setActiveView,
    startClient,
    stopClient,
    restartClient,
    deleteClient,
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filterOptions = ['All', 'Online', 'Offline', 'Starting', 'Stopped'];

  const filteredClients = clients.filter((client) => {
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'Online') matchesStatus = client.status === 'online';
    else if (statusFilter === 'Offline') matchesStatus = client.status === 'offline';
    else if (statusFilter === 'Starting') matchesStatus = client.status === 'starting';
    else if (statusFilter === 'Stopped') matchesStatus = client.status === 'stopped';

    // Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      client.name.toLowerCase().includes(q) ||
      client.server.toLowerCase().includes(q) ||
      client.version.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div id="clients-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">Clients</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your deployed Minecraft bot instances, connections, and routines
          </p>
        </div>

        <button
          id="clients-page-create-btn"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Client</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="clients-search-input"
            type="text"
            placeholder="Search by name, server, or version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
          />
        </div>

        {/* Filter Pills + View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Status Filters */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs overflow-x-auto">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                id={`filter-clients-${opt.toLowerCase()}`}
                onClick={() => setStatusFilter(opt)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  statusFilter === opt
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs shrink-0">
            <button
              type="button"
              id="clients-viewmode-grid"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="clients-viewmode-table"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'table' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Grid or Table */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-400">
          <Bot className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No Clients Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No Minecraft bots match &quot;{searchQuery || statusFilter}&quot;. Try clearing filters or create a new client.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700 hover:bg-zinc-750 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        /* Modern Responsive Table View */
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Server</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Ping</th>
                  <th className="px-4 py-3">Runtime</th>
                  <th className="px-4 py-3">Active Addons</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {filteredClients.map((client) => {
                  const isOnline = client.status === 'online';
                  const isStarting = client.status === 'starting';
                  const isStopped = client.status === 'stopped' || client.status === 'offline';

                  const activeAddonsList = client.activeAddons
                    .filter((a) => a.enabled)
                    .map((a) => {
                      const meta = addons.find((item) => item.id === a.addonId);
                      return meta ? meta.name : a.addonId;
                    });

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 font-semibold text-zinc-100 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveView('client-detail', client.id)}
                          className="hover:text-emerald-400 transition-colors text-left flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-emerald-400 transition-colors" />
                          <span>{client.name}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ClientStatusBadge status={client.status} size="sm" />
                      </td>

                      {/* Server */}
                      <td className="px-4 py-3.5 font-mono text-zinc-300 whitespace-nowrap">
                        {client.server}:{client.port}
                      </td>

                      {/* Version */}
                      <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap">
                        {client.version.replace('Minecraft ', '')}
                      </td>

                      {/* Ping */}
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        {isOnline ? (
                          <span className="text-emerald-400">{client.ping}ms</span>
                        ) : (
                          <span className="text-zinc-600">--</span>
                        )}
                      </td>

                      {/* Runtime */}
                      <td className="px-4 py-3.5 font-mono text-zinc-300 whitespace-nowrap">
                        {formatRuntime(client.runtimeSeconds)}
                      </td>

                      {/* Addons */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {activeAddonsList.length > 0 ? (
                            activeAddonsList.map((addonName) => (
                              <span
                                key={addonName}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                              >
                                {addonName}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveView('client-detail', client.id)}
                            className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                          >
                            Manage
                          </button>

                          <button
                            type="button"
                            onClick={() => restartClient(client.id)}
                            title="Restart"
                            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            <RotateCw className={cn('w-3.5 h-3.5', isStarting && 'animate-spin text-amber-400')} />
                          </button>

                          {isStopped ? (
                            <button
                              type="button"
                              onClick={() => startClient(client.id)}
                              title="Start"
                              className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => stopClient(client.id)}
                              title="Stop"
                              className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteClient(client.id)}
                            title="Delete"
                            className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
