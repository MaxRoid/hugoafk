'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { LogLevel } from '@/types';
import {
  Terminal,
  Search,
  Trash2,
  Download,
  Copy,
  Check,
  Radio,
  Bot,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const LogsView: React.FC = () => {
  const { globalLogs, clearGlobalLogs, clients, addToast } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [copied, setCopied] = useState(false);

  const levelOptions = ['All', 'Info', 'Warning', 'Error'];

  const filteredLogs = globalLogs.filter((log) => {
    // Level filter
    let matchesLevel = true;
    if (levelFilter === 'Info') matchesLevel = log.level === 'INFO';
    else if (levelFilter === 'Warning') matchesLevel = log.level === 'WARN';
    else if (levelFilter === 'Error') matchesLevel = log.level === 'ERROR';

    // Client filter
    const matchesClient = clientFilter === 'All' || log.clientId === clientFilter;

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      log.message.toLowerCase().includes(q) ||
      log.clientName.toLowerCase().includes(q) ||
      log.timestamp.includes(q);

    return matchesLevel && matchesClient && matchesSearch;
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} | ${l.clientName} | ${l.level} | ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Copied to clipboard', `${filteredLogs.length} log lines copied.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = filteredLogs
      .map((l) => `${l.timestamp} | ${l.clientName} | ${l.level} | ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hugoafk-global-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Logs downloaded', 'Saved global log stream.', 'success');
  };

  return (
    <div id="global-logs-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            System &amp; Client Logs
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Aggregated real-time audit stream from all Mineflayer client daemons
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Stream</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy logs"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download logs"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearGlobalLogs}
            title="Clear all logs"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="global-logs-search"
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
        </div>

        {/* Client dropdown */}
        <div>
          <select
            id="global-logs-client-select"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          >
            <option value="All">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.server})
              </option>
            ))}
          </select>
        </div>

        {/* Level pills */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          {levelOptions.map((lvl) => (
            <button
              key={lvl}
              type="button"
              id={`logs-filter-level-${lvl.toLowerCase()}`}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'flex-1 py-1 rounded-lg font-medium transition-colors text-center font-mono',
                levelFilter === lvl
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      <div
        id="global-logs-terminal"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 h-[550px] overflow-y-auto font-mono text-xs space-y-1.5 select-text shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600">
            No log entries match the selected filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isInfo = log.level === 'INFO';
            const isWarn = log.level === 'WARN';
            const isError = log.level === 'ERROR';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-850"
              >
                {/* Timestamp */}
                <span className="text-zinc-600 text-[11px] shrink-0 select-none">
                  {log.timestamp}
                </span>

                <span className="text-zinc-700 select-none">|</span>

                {/* Client Name Badge */}
                <span className="font-semibold text-zinc-300 shrink-0 select-none min-w-[70px]">
                  {log.clientName}
                </span>

                <span className="text-zinc-700 select-none">|</span>

                {/* Level Badge */}
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 select-none border',
                    isInfo && 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
                    isWarn && 'bg-amber-950/40 text-amber-400 border-amber-900/50',
                    isError && 'bg-rose-950/40 text-rose-400 border-rose-900/50'
                  )}
                >
                  {log.level}
                </span>

                <span className="text-zinc-700 select-none">|</span>

                {/* Message */}
                <span className="text-zinc-200 break-words leading-relaxed flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
