'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Users,
  Shield,
  Search,
  Plus,
  RotateCcw,
  Wrench,
  Trash2,
  Lock,
  Radio,
  Sparkles,
  Zap,
  AlertTriangle,
  Send,
  Database,
  Terminal,
  Volume2,
  Clock,
  CheckCircle2,
  Crown,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServerNode } from '@/types';

type AdminTab = 'fleet' | 'nodes' | 'users' | 'system' | 'audit';

export const AdminNodesView: React.FC = () => {
  const {
    nodes,
    clients,
    users,
    currentUser,
    restartNodeDaemon,
    toggleNodeMaintenance,
    deleteNode,
    addNode,
    toggleUserRole,
    toggleUserStatus,
    updateUserQuota,
    assignClientOwner,
    sendFleetCommand,
    emergencyStopAll,
    startAllBots,
    restartAllBots,
    getSystemStats,
    vacuumDatabase,
    clearSystemLogs,
    getAuditLogs,
    broadcastAnnouncement,
    openConfirm,
    addToast,
    settings,
    t,
  } = useDashboard();

  const isDe = settings.language === 'de';
  const isAdmin = currentUser?.role === 'admin';

  // State
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('fleet');
  const [userSearch, setUserSearch] = useState('');
  const [restartingNodeId, setRestartingNodeId] = useState<string | null>(null);

  // Fleet Control State
  const [fleetCommand, setFleetCommand] = useState('');
  const [isSendingFleetCmd, setIsSendingFleetCmd] = useState(false);
  const [fleetLog, setFleetLog] = useState<string[]>([]);

  // Announcement State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementLevel, setAnnouncementLevel] = useState<'info' | 'warning' | 'emergency'>('info');

  // Diagnostics State
  const [sysStats, setSysStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Add Node Form State
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeIp, setNewNodeIp] = useState('');
  const [newNodeRegion, setNewNodeRegion] = useState('EU-Central (Frankfurt)');
  const [newNodeMaxBots, setNewNodeMaxBots] = useState(25);

  const onlineClientsCount = clients.filter((c) => c.status === 'online').length;

  // Load diagnostics & audit logs
  const loadDiagnostics = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingStats(true);
    try {
      const [statsRes, auditRes] = await Promise.allSettled([
        getSystemStats(),
        getAuditLogs(),
      ]);
      if (statsRes.status === 'fulfilled') {
        setSysStats(statsRes.value);
      }
      if (auditRes.status === 'fulfilled') {
        setAuditLogs(auditRes.value?.auditLogs || []);
      }
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAdmin, getSystemStats, getAuditLogs]);

  useEffect(() => {
    if (activeAdminTab === 'system' || activeAdminTab === 'audit') {
      loadDiagnostics();
    }
  }, [activeAdminTab, loadDiagnostics]);

  if (!isAdmin) {
    return (
      <div id="admin-access-denied" className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">
          {isDe ? 'Zugriff verweigert (Admin Only)' : 'Access Denied (Admin Only)'}
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mt-2 leading-relaxed">
          {isDe
            ? 'Dieser Bereich ist ausschließlich für den Server-Inhaber (Owner) und autorisierte Administratoren reserviert.'
            : 'This area is restricted to the server owner and authorized administrators only.'}
        </p>
      </div>
    );
  }

  // Handle Fleet Broadcast Command
  const handleExecuteFleetCommand = async (e?: React.FormEvent, customCmd?: string) => {
    if (e) e.preventDefault();
    const cmd = customCmd || fleetCommand;
    if (!cmd.trim()) return;

    setIsSendingFleetCmd(true);
    try {
      const res = await sendFleetCommand(cmd);
      setFleetLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Gesendet an ${res.botsReached} Bots: "${cmd}"`,
        ...prev.slice(0, 40),
      ]);
      if (!customCmd) setFleetCommand('');
    } finally {
      setIsSendingFleetCmd(false);
    }
  };

  // Handle Emergency Stop
  const handleEmergencyStop = () => {
    openConfirm({
      title: isDe ? '🚨 NOTFALL-KILLSWITCH: Alle Bots stoppen?' : '🚨 EMERGENCY KILLSWITCH: Stop All Bots?',
      description: isDe
        ? `Möchtest du wirklich SOFORT alle ${onlineClientsCount} aktiven Minecraft-Bots vom Server trennen? Diese Aktion wird sofort ausgeführt.`
        : `Are you sure you want to IMMEDIATELY disconnect all ${onlineClientsCount} active bots?`,
      onConfirm: async () => {
        const res = await emergencyStopAll();
        setFleetLog((prev) => [
          `[${new Date().toLocaleTimeString()}] 🚨 NOTFALL-KILLSWITCH ausgeführt: ${res.botsStopped} Bots gestoppt.`,
          ...prev.slice(0, 40),
        ]);
      },
      isDestructive: true,
      confirmLabel: isDe ? 'Jetzt stoppen' : 'Stop Now',
    });
  };

  // Handle Broadcast Announcement
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    await broadcastAnnouncement(announcementMsg, announcementLevel);
    setAnnouncementMsg('');
  };

  // Handle Create Node
  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName || !newNodeIp) return;
    await addNode({
      name: newNodeName,
      ip: newNodeIp,
      region: newNodeRegion,
      maxBots: Number(newNodeMaxBots),
    });
    setNewNodeName('');
    setNewNodeIp('');
    setIsAddNodeOpen(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div id="admin-nodes-view" className="space-y-6 animate-in fade-in duration-200">
      {/* View Header with Owner Prestige Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-emerald-950/20 p-5 sm:p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-md">
            <Crown className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
                {isDe ? 'Owner & Admin Command Center' : 'Owner & Admin Command Center'}
              </h1>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono text-amber-400 font-bold tracking-wide uppercase">
                {isDe ? '👑 Root Access' : '👑 Root Access'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isDe
                ? 'Zentrale Flottensteuerung, Massenbefehle, Notfall-Killswitch, Node-Cluster & System-Wartung.'
                : 'Central fleet management, mass commands, emergency killswitch, cluster nodes & database maintenance.'}
            </p>
          </div>
        </div>

        {/* Quick Top Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Aktive Bots</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{onlineClientsCount} / {clients.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Cluster Nodes</span>
            <span className="text-sm font-bold text-zinc-200 font-mono">{nodes.length}</span>
          </div>
        </div>
      </div>

      {/* Admin Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('fleet')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeAdminTab === 'fleet'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isDe ? '⚡ Flotten-Steuerung (Mass Actions)' : '⚡ Fleet Control'}</span>
          {onlineClientsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950/30 text-zinc-950 font-mono">
              {onlineClientsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('nodes')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeAdminTab === 'nodes'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <Server className="w-3.5 h-3.5" />
          <span>{isDe ? '🖥️ Cluster & Nodes' : '🖥️ Cluster & Nodes'}</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeAdminTab === 'users'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isDe ? '👥 Benutzer & Quotas' : '👥 Users & Quotas'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-400 font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('system')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeAdminTab === 'system'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isDe ? '📊 System & SQLite-Wartung' : '📊 System & SQLite'}</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            activeAdminTab === 'audit'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isDe ? '🛡️ Audit & Sicherheit' : '🛡️ Audit Logs'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FLEET CONTROL & MASS ACTIONS                                      */}
      {/* ========================================================================= */}
      {activeAdminTab === 'fleet' && (
        <div className="space-y-6">
          {/* Emergency Killswitch & Fast Fleet Actions Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EMERGENCY KILLSWITCH CARD */}
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-950 p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                    <Flame className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-300">
                      {isDe ? 'Flotten Notfall-Killswitch' : 'Fleet Emergency Killswitch'}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isDe
                        ? 'Trennt unverzüglich alle aktiven Minecraft-Bots vom Server (z. B. bei Server-Restart, Ban-Wellen oder Anticheat-Verdacht).'
                        : 'Immediately disconnects all active Minecraft bots from the servers.'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold shrink-0">
                  {onlineClientsCount} {isDe ? 'Verbunden' : 'Connected'}
                </span>
              </div>

              <button
                id="admin-emergency-killswitch-btn"
                onClick={handleEmergencyStop}
                disabled={onlineClientsCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-rose-900/40 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isDe ? '🚨 ALLE BOTS SOFORT STOPPEN (PANIC BUTTON)' : '🚨 STOP ALL BOTS IMMEDIATELY'}</span>
              </button>
            </div>

            {/* QUICK FLEET ACTIONS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {isDe ? 'Flotten-Aktionen' : 'Fleet Actions'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {isDe ? 'Massenoperationen für die gesamte Client-Flotte.' : 'Mass operations for your bot fleet.'}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => startAllBots()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isDe ? 'Alle Offline-Bots starten' : 'Start All Offline Bots'}</span>
                </button>

                <button
                  onClick={() => restartAllBots()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isDe ? 'Alle aktiven Bots neu starten' : 'Restart All Active Bots'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mass Command Console */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-100">
                  {isDe ? 'Massen-Befehlskonsole (Global Fleet Broadcast)' : 'Mass Command Console'}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                {isDe ? `Erreicht ${onlineClientsCount} Online-Bots` : `Reaches ${onlineClientsCount} online bots`}
              </span>
            </div>

            {/* Quick Command Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-medium mr-1">
                {isDe ? 'Schnell-Befehle:' : 'Quick Presets:'}
              </span>
              {['/spawn', '/sell all', '/hub', '/lobby', '/afk', '/help'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleExecuteFleetCommand(undefined, cmd)}
                  disabled={onlineClientsCount === 0}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-300 text-xs font-mono font-medium transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Command Input Bar */}
            <form onSubmit={handleExecuteFleetCommand} className="flex gap-2">
              <input
                type="text"
                value={fleetCommand}
                onChange={(e) => setFleetCommand(e.target.value)}
                placeholder={isDe ? 'Befehl oder Chatnachricht an alle Bots (z. B. /sell all oder /msg Spieler Hi)...' : 'Command or message to all online bots...'}
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isSendingFleetCmd || !fleetCommand.trim() || onlineClientsCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingFleetCmd ? '...' : (isDe ? 'Ausführen' : 'Execute')}</span>
              </button>
            </form>

            {/* Realtime Fleet Action Stream */}
            {fleetLog.length > 0 && (
              <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1">
                {fleetLog.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Dashboard Announcement Broadcaster */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                {isDe ? 'Live Dashboard-Durchsage an alle Nutzer' : 'Live Dashboard Announcement'}
              </h3>
            </div>
            <form onSubmit={handleSendAnnouncement} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                placeholder={isDe ? 'Wichtige Ankündigung im Dashboard einblenden (Socket.IO Broadcast)...' : 'Broadcast announcement to all viewers...'}
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <select
                value={announcementLevel}
                onChange={(e: any) => setAnnouncementLevel(e.target.value)}
                className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="info">Info</option>
                <option value="warning">Warnung</option>
                <option value="emergency">Notfall</option>
              </select>
              <button
                type="submit"
                disabled={!announcementMsg.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                {isDe ? 'Senden' : 'Broadcast'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLUSTER NODES                                                     */}
      {/* ========================================================================= */}
      {activeAdminTab === 'nodes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {isDe ? 'Cluster Gateway Nodes' : 'Cluster Gateway Nodes'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isDe ? 'Verwalte Host-Server und Bot-Worker Instanzen.' : 'Manage daemon host servers and worker nodes.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddNodeOpen(!isAddNodeOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isDe ? 'Neuer Node' : 'Add Node'}</span>
            </button>
          </div>

          {/* Add Node Drawer */}
          {isAddNodeOpen && (
            <form onSubmit={handleCreateNode} className="p-4 rounded-2xl border border-emerald-500/30 bg-zinc-900/90 space-y-3">
              <h3 className="text-xs font-bold uppercase text-emerald-400">
                {isDe ? 'Neuen Cluster Node hinzufügen' : 'Register New Gateway Node'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Node Name (z. B. Worker-02)"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Host / IP (z. B. 192.168.1.50)"
                  value={newNodeIp}
                  onChange={(e) => setNewNodeIp(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Region (z. B. EU-West)"
                  value={newNodeRegion}
                  onChange={(e) => setNewNodeRegion(e.target.value)}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Max Bots (z. B. 25)"
                  value={newNodeMaxBots}
                  onChange={(e) => setNewNodeMaxBots(Number(e.target.value))}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddNodeOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 text-xs font-bold"
                >
                  {isDe ? 'Node speichern' : 'Save Node'}
                </button>
              </div>
            </form>
          )}

          {/* Nodes Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Node</th>
                  <th className="px-4 py-3 font-semibold">Host & Region</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">CPU / RAM</th>
                  <th className="px-4 py-3 font-semibold">Bot Slots</th>
                  <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-400" />
                        <span>{node.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                      {node.ip} ({node.region})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          node.status === 'online'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        )}
                      >
                        {node.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      CPU: {node.cpuUsage}% | RAM: {node.memoryUsedMb}/{node.memoryTotalMb} MB
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {node.botCount} / {node.maxBots}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => restartNodeDaemon(node.id)}
                          title="Restart Daemon"
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleNodeMaintenance(node.id)}
                          title="Toggle Maintenance"
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        {node.id !== 'node-local-1' && (
                          <button
                            onClick={() => deleteNode(node.id)}
                            title="Delete Node"
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USER & ROLE MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {isDe ? 'Benutzerverwaltung & Berechtigungen' : 'User Management & Permissions'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isDe ? 'Rollen, Bot-Quotas und Benutzerstatus verwalten.' : 'Manage user roles, quotas, and access.'}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder={isDe ? 'Benutzer suchen...' : 'Search users...'}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Rolle & Status</th>
                  <th className="px-4 py-3 font-semibold">Bot Quota</th>
                  <th className="px-4 py-3 font-semibold">Zugewiesene Bots (Pterodactyl)</th>
                  <th className="px-4 py-3 font-semibold text-right">Registriert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((u) => {
                  const isUserOwner = u.role === 'admin' && (u.username.toLowerCase() === 'admin' || u.botQuota >= 100);
                  const userBots = clients.filter((c) => c.ownerId === u.id);
                  const availableBotsToAssign = clients.filter((c) => c.ownerId !== u.id);

                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isUserOwner && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleUserRole(u.id)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer',
                              u.role === 'admin'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            )}
                          >
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer',
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            )}
                          >
                            {u.status}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-zinc-200 font-bold">{u.botQuota} Slots</span>
                          <div className="flex items-center gap-1 ml-2">
                            {[5, 10, 25, 100].map((q) => (
                              <button
                                key={q}
                                onClick={() => updateUserQuota(u.id, q)}
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer',
                                  u.botQuota === q
                                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                )}
                              >
                                {q === 100 ? '∞' : q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Pterodactyl-style Bot Assignment Cell */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">
                              {userBots.length} / {u.botQuota} Bots:
                            </span>
                            {availableBotsToAssign.length > 0 && (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignClientOwner(e.target.value, u.id);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-[10px] rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-emerald-400 px-1.5 py-0.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                              >
                                <option value="" disabled>+ Bot zuweisen...</option>
                                {availableBotsToAssign.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    + {b.name} ({b.server})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {userBots.length === 0 ? (
                              <span className="text-[10px] text-zinc-500 italic">Keine Bots zugewiesen</span>
                            ) : (
                              userBots.map((b) => (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[10px] text-zinc-200 font-mono"
                                >
                                  <span>{b.name}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(u.createdDate).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM & SQLITE DIAGNOSTICS                                       */}
      {/* ========================================================================= */}
      {activeAdminTab === 'system' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {isDe ? 'System-Diagnose & SQLite Datenbank-Wartung' : 'System & SQLite Maintenance'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isDe ? 'Echtzeit-Telemetrie des Node-Prozesses und Datenbank-Optimierung.' : 'Node.js runtime diagnostics and database health.'}
              </p>
            </div>
            <button
              onClick={loadDiagnostics}
              disabled={isLoadingStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', isLoadingStats && 'animate-spin')} />
              <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/70">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">SQLite DB Größe</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {sysStats?.database?.sizeFormatted || '...'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                {sysStats?.database?.totalClients || 0} Bots / {sysStats?.database?.totalUsers || 0} User
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/70">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Gespeicherte Logs</span>
              <span className="text-lg font-bold font-mono text-zinc-100">
                {sysStats?.database?.totalLogs || 0}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                {sysStats?.database?.totalChats || 0} Chatnachrichten
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/70">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Node Heap Memory</span>
              <span className="text-lg font-bold font-mono text-blue-400">
                {sysStats?.process?.heapUsedMb || 0} MB
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                von {sysStats?.process?.heapTotalMb || 0} MB reserviert
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/70">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Gateway Uptime</span>
              <span className="text-lg font-bold font-mono text-purple-400">
                {Math.floor((sysStats?.process?.uptimeSeconds || 0) / 60)} min
              </span>
              <span className="text-[10px] text-zinc-500 block mt-1">
                Node {sysStats?.process?.nodeVersion || 'v24'}
              </span>
            </div>
          </div>

          {/* Database Actions */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {isDe ? 'Wartungs-Aktionen' : 'Maintenance Routines'}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => vacuumDatabase()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isDe ? 'Datenbank optimieren (SQLite VACUUM)' : 'Optimize Database (VACUUM)'}</span>
              </button>

              <button
                onClick={() => clearSystemLogs(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDe ? 'Alte Logs bereinigen (behält letzte 500)' : 'Trim Old Logs (Keep 500)'}</span>
              </button>

              <button
                onClick={() => {
                  openConfirm({
                    title: isDe ? 'Alle Logs & Chats leeren?' : 'Purge All Logs & Chats?',
                    description: isDe ? 'Alle historischen Bot-Logs und Chat-Protokolle werden unwiderruflich gelöscht.' : 'Permanently deletes all historical logs.',
                    onConfirm: () => clearSystemLogs(true),
                    isDestructive: true,
                    confirmLabel: isDe ? 'Unwiderruflich löschen' : 'Delete All',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isDe ? 'Alle Logs komplett leeren' : 'Purge All Logs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT & SECURITY LOG                                              */}
      {/* ========================================================================= */}
      {activeAdminTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {isDe ? 'Sicherheits- & Audit-Protokoll' : 'Security & Audit Log'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isDe ? 'Lückenlose Aufzeichnung aller administrativen Eingriffe und Flotten-Aktionen.' : 'Chronological audit trail of all administrative actions.'}
              </p>
            </div>
            <button
              onClick={loadDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {isDe ? 'Noch keine Audit-Einträge vorhanden.' : 'No audit entries recorded yet.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-mono border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Zeitpunkt</th>
                    <th className="px-4 py-3 font-semibold">Aktion</th>
                    <th className="px-4 py-3 font-semibold">Administrator</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                            log.action.includes('KILLSWITCH')
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : log.action.includes('FLEET')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-200">
                        {log.user}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
