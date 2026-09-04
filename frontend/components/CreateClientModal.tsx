'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { X, Server, Shield, Bot, Radio, Cpu } from 'lucide-react';

export const CreateClientModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createClient, users, currentUser } = useDashboard();

  const [name, setName] = useState('');
  const [server, setServer] = useState('');
  const [port, setPort] = useState<number>(25565);
  const [version, setVersion] = useState('Auto-Detect');
  const [authMethod, setAuthMethod] = useState<'Microsoft' | 'Offline'>('Microsoft');
  const [afkEnabled, setAfkEnabled] = useState<boolean>(true);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [assignedOwnerId, setAssignedOwnerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Client Name ist erforderlich');
      return;
    }
    if (trimmedName.length < 3 || trimmedName.length > 16) {
      setError('Minecraft-Spielernamen müssen zwischen 3 und 16 Zeichen lang sein (aktuell: ' + trimmedName.length + ').');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setError('Der Spielername darf nur Buchstaben, Zahlen und Unterstriche enthalten (keine Leerzeichen oder Sonderzeichen).');
      return;
    }
    if (!server.trim()) {
      setError('Server Address is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createClient({
        name: trimmedName,
        server: server.trim(),
        port: Number(port) || 25565,
        version,
        authMethod,
        afkEnabled,
        autoReconnect,
        ownerId: assignedOwnerId || currentUser?.id,
      });

      // Reset form
      setName('');
      setServer('');
      setPort(25565);
      setVersion('Auto-Detect');
      setAuthMethod('Microsoft');
      setAfkEnabled(true);
      setAutoReconnect(true);
      setAssignedOwnerId('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-client-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCreateModalOpen(false);
      }}
    >
      <div
        id="create-client-modal-content"
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-150 my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-100">Create New Client</h2>
              <p className="text-xs text-zinc-400">Deploy an automated Minecraft bot instance</p>
            </div>
          </div>

          <button
            id="create-client-close-btn"
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Admin Feature: Pterodactyl-style Owner Assignment */}
          {currentUser?.role === 'admin' && users.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/20">
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5 flex items-center justify-between">
                <span>Besitzer zuweisen (Pterodactyl Sub-User)</span>
                <span className="text-[10px] text-zinc-500 font-mono">👑 Admin</span>
              </label>
              <select
                id="input-assign-owner"
                value={assignedOwnerId}
                onChange={(e) => setAssignedOwnerId(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="">Standard (Mir selbst zuweisen)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.username} ({u.email})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">
                Der Bot erscheint direkt im Dashboard des ausgewählten Benutzers.
              </p>
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Client Name <span className="text-emerald-400">*</span>
            </label>
            <input
              id="input-client-name"
              type="text"
              required
              placeholder="e.g. HugoBot, FarmBot, Trader01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
            />
          </div>

          {/* Server Address & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Server Address <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-server-address"
                type="text"
                required
                placeholder="e.g. play.hugosmp.net or localhost"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Port</label>
              <input
                id="input-server-port"
                type="number"
                placeholder="25565"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10) || 25565)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
              />
            </div>
          </div>

          {/* Minecraft Version */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Minecraft Version
            </label>
            <select
              id="select-client-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
            >
              <option value="Auto-Detect">Auto-Detect (Empfohlen für alle Server)</option>
              <option value="Minecraft 1.21.4">Minecraft 1.21.4 (Aktuell)</option>
              <option value="Minecraft 1.21.1">Minecraft 1.21.1</option>
              <option value="Minecraft 1.20.4">Minecraft 1.20.4</option>
              <option value="Minecraft 1.19.4">Minecraft 1.19.4</option>
              <option value="Minecraft 1.18.2">Minecraft 1.18.2</option>
              <option value="Minecraft 1.16.5">Minecraft 1.16.5</option>
            </select>
          </div>

          {/* Authentication Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  authMethod === 'Microsoft'
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="authMethod"
                  value="Microsoft"
                  checked={authMethod === 'Microsoft'}
                  onChange={() => setAuthMethod('Microsoft')}
                  className="text-emerald-500 focus:ring-emerald-500/40"
                />
                <div className="text-xs">
                  <p className="font-semibold text-zinc-200">Microsoft Auth</p>
                  <p className="text-[10px] text-zinc-400">OAuth / Xbox Live Account</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  authMethod === 'Offline'
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="authMethod"
                  value="Offline"
                  checked={authMethod === 'Offline'}
                  onChange={() => setAuthMethod('Offline')}
                  className="text-emerald-500 focus:ring-emerald-500/40"
                />
                <div className="text-xs">
                  <p className="font-semibold text-zinc-200">Offline Mode</p>
                  <p className="text-[10px] text-zinc-400">Cracked / Test server</p>
                </div>
              </label>
            </div>
          </div>

          {/* Automation Switches */}
          <div className="pt-2 border-t border-zinc-850 space-y-2.5">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition-colors">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">AFK Mode Enabled</span>
                <span className="text-[11px] text-zinc-400 block">
                  Automatically enable AntiAFK module to avoid inactivity kicks
                </span>
              </div>
              <input
                id="checkbox-afk-enabled"
                type="checkbox"
                checked={afkEnabled}
                onChange={(e) => setAfkEnabled(e.target.checked)}
                className="h-4 w-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition-colors">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">Auto Reconnect</span>
                <span className="text-[11px] text-zinc-400 block">
                  Re-connect on server restarts, proxy drops, or timed-out packets
                </span>
              </div>
              <input
                id="checkbox-autoreconnect-enabled"
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="h-4 w-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0"
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 pt-3 flex items-center justify-end gap-2.5">
            <button
              id="create-client-cancel-btn"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-client-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Provisioning...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
