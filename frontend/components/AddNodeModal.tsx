'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { X, Server, Globe, Shield, Plus, Cpu, Activity } from 'lucide-react';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ isOpen, onClose }) => {
  const { addNode, t, settings } = useDashboard();

  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [flag, setFlag] = useState('🇩🇪');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(8443);
  const [maxBots, setMaxBots] = useState(25);
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !host.trim()) return;

    addNode({
      name: name.trim(),
      region: region.trim() || 'Global Node',
      flag: flag || '🌐',
      status: 'online',
      host: host.trim(),
      port: Number(port) || 8443,
      daemonVersion: 'v4.2.8',
      memoryTotalMb: 16384,
      maxBots: Number(maxBots) || 20,
      pingMs: 18,
      networkThroughput: '0.8 MB/s',
    });

    setName('');
    setRegion('');
    setHost('');
    setToken('');
    onClose();
  };

  return (
    <div
      id="add-node-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="add-node-modal-content"
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="add-node-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          aria-label={t('actionClose')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">
              {settings.language === 'de' ? 'Server-Knoten registrieren' : 'Register Host Node'}
            </h2>
            <p className="text-xs text-zinc-400">
              {settings.language === 'de'
                ? 'Verbinde einen neuen Mineflayer-Daemon-Knoten mit dem HugoAFK Cluster'
                : 'Connect a new Mineflayer daemon host to the HugoAFK cluster'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('nodeName')} *
              </label>
              <input
                id="node-input-name"
                type="text"
                required
                placeholder="Node-EU-North-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('nodeRegion')}
              </label>
              <div className="flex gap-2">
                <input
                  id="node-input-flag"
                  type="text"
                  placeholder="🇩🇪"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="w-14 rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-2 text-center text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <input
                  id="node-input-region"
                  type="text"
                  placeholder="Stockholm, Sweden"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('nodeHost')} *
              </label>
              <input
                id="node-input-host"
                type="text"
                required
                placeholder="195.201.84.12 oder node.domain.net"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('nodePort')}
              </label>
              <input
                id="node-input-port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {settings.language === 'de' ? 'Maximale Bot-Instanzen' : 'Max Bot Capacity'}
              </label>
              <input
                id="node-input-capacity"
                type="number"
                min="1"
                max="100"
                value={maxBots}
                onChange={(e) => setMaxBots(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Daemon Token (Secret)
              </label>
              <input
                id="node-input-token"
                type="password"
                placeholder="hugo_daemon_secret_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-cyan-300/90 leading-relaxed flex items-start gap-2">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              {settings.language === 'de'
                ? 'Der HugoAFK Daemon synchronisiert Bot-Sockets automatisch und hält persistente Keep-Alive Heartbeats aufrecht.'
                : 'The HugoAFK daemon automatically synchronizes bot sockets and maintains persistent keep-alive heartbeats.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              id="add-node-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              {t('actionCancel')}
            </button>
            <button
              id="add-node-submit-btn"
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{settings.language === 'de' ? 'Knoten verbinden' : 'Connect Node'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
