'use client';

import React, { useState } from 'react';
import { MinecraftClient, LogLevel } from '@/types';
import { useDashboard } from '@/context/DashboardContext';
import {
  Terminal,
  Search,
  Filter,
  Trash2,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientLogsProps {
  client: MinecraftClient;
}

export const ClientLogs: React.FC<ClientLogsProps> = ({ client }) => {
  const { clearClientLogs, addToast } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const filteredLogs = client.logs.filter((log) => {
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.timestamp.includes(searchQuery);
    return matchesLevel && matchesSearch;
  });

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Copied to clipboard', `${filteredLogs.length} log lines copied.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${client.name.toLowerCase()}-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Logs downloaded', 'Exported log file.', 'success');
  };

  return (
    <div id="client-logs-tab" className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="client-logs-search-input"
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-8.5 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>

        {/* Level Filters & Export Actions */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px]">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-mono font-medium transition-colors',
                  selectedLevel === lvl
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy filtered logs"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            title="Export logs as TXT"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={() => clearClientLogs(client.id)}
            title="Clear logs"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Terminal Window */}
      <div
        id="client-logs-terminal"
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 h-[440px] overflow-y-auto font-mono text-xs space-y-1 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
            No log entries found matching criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isInfo = log.level === 'INFO';
            const isWarn = log.level === 'WARN';
            const isError = log.level === 'ERROR';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-zinc-900/50 transition-colors"
              >
                <span className="text-zinc-600 text-[11px] shrink-0 select-none">
                  [{log.timestamp}]
                </span>

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

                <span className="text-zinc-300 break-words leading-relaxed">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
