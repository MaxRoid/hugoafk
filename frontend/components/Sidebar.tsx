'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ViewType } from '@/types';
import {
  LayoutDashboard,
  Bot,
  Blocks,
  Terminal,
  Settings,
  Server,
  Activity,
  Shield,
  X,
  Radio,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    clients,
    nodes,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    logout,
    t,
    settings,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useDashboard();

  const onlineClientsCount = clients.filter((c) => c.status === 'online').length;
  const totalClientsCount = clients.length;

  const navItems: { id: ViewType; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'clients', label: t('navClients'), icon: Bot, badge: totalClientsCount },
    { id: 'addons', label: t('navAddons'), icon: Blocks },
    { id: 'logs', label: t('navLogs'), icon: Terminal },
    ...(currentUser?.role === 'admin'
      ? [{ id: 'admin-nodes' as ViewType, label: t('navAdminNodes'), icon: Server, badge: nodes.length }]
      : []),
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    setIsMobileNavOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-zinc-950/95 border-r border-zinc-800/80 p-4 text-zinc-300">
      {/* Top section: Logo & Nav */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
            title="HugoAFK Dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-emerald-400 shadow-sm group-hover:border-emerald-500/40 transition-colors">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  Hugo<span className="text-emerald-400">AFK</span>
                </span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                  v1.5
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Server Bot Management</p>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            id="mobile-sidebar-close"
            onClick={() => setIsMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            aria-label={t('actionClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live system pulse banner */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-zinc-300 font-medium">Cluster Gateway</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/90 font-medium">
            {onlineClientsCount}/{totalClientsCount} Active
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id ||
              (activeView === 'client-detail' && item.id === 'clients');

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 text-left',
                  isActive
                    ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-300'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium',
                      isActive
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Server status & User Profile */}
      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900">
        {/* Server Status Badge */}
        <div
          id="sidebar-server-status"
          onClick={() => handleNavClick('admin-nodes')}
          className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-2.5 flex items-center justify-between text-xs cursor-pointer hover:border-zinc-800 transition-colors"
          title="Click to view cluster nodes"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-200 leading-tight">
                {nodes[0]?.name || 'EU-Central Node'}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                {nodes.filter((n) => n.status === 'online').length}/{nodes.length} Nodes online
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">18ms</span>
        </div>

        {/* User Profile / Auth Bar */}
        {currentUser ? (
          <div
            id="sidebar-user-profile"
            className="flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-2.5"
          >
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-2.5 min-w-0 text-left flex-1 hover:opacity-80 transition-opacity"
              title="Konto wechseln / Auth"
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono',
                  currentUser.role === 'admin'
                    ? 'bg-emerald-950/80 border border-emerald-800/50 text-emerald-400'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                )}
              >
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate flex items-center gap-1">
                  <span>{currentUser.username}</span>
                  {currentUser.role === 'admin' && (
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-medium">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-400 truncate font-mono">
                  {currentUser.email}
                </p>
              </div>
            </button>

            <button
              id="sidebar-logout-btn"
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title={t('authSignOut')}
              aria-label={t('authSignOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            id="sidebar-auth-cta"
            className="flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-2.5"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">
                {settings.language === 'de' ? 'Gast-Modus' : 'Guest'}
              </span>
            </div>
            <button
              id="sidebar-login-btn"
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('authSignIn')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col fixed inset-y-0 left-0 z-30"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileNavOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in duration-150"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            id="mobile-sidebar-drawer"
            className="fixed inset-y-0 left-0 w-72 max-w-full z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
