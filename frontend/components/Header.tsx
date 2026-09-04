'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  Menu,
  Plus,
  Bot,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  User,
  LogIn,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    selectedClient,
    setIsCreateModalOpen,
    setIsMobileNavOpen,
    clients,
    settings,
    toggleTheme,
    setLanguage,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    t,
  } = useDashboard();

  const isLight = settings.theme === 'light';

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return t('navDashboard');
      case 'clients':
        return t('navClients');
      case 'client-detail':
        return selectedClient ? selectedClient.name : 'Client Management';
      case 'addons':
        return t('navAddons');
      case 'logs':
        return t('navLogs');
      case 'admin-nodes':
        return t('navAdminNodes');
      case 'settings':
        return t('navSettings');
      default:
        return t('navDashboard');
    }
  };

  return (
    <header
      id="top-header"
      className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md"
    >
      {/* Left side: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          onClick={() => setIsMobileNavOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 md:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span
            onClick={() => setActiveView('dashboard')}
            className="cursor-pointer hover:text-zinc-200 transition-colors font-medium"
          >
            HugoAFK
          </span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          {activeView === 'client-detail' ? (
            <>
              <span
                onClick={() => setActiveView('clients')}
                className="cursor-pointer hover:text-zinc-200 transition-colors font-medium"
              >
                {t('navClients')}
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                {selectedClient?.name || 'Client Details'}
              </span>
            </>
          ) : (
            <span className="font-semibold text-zinc-100">{getViewTitle()}</span>
          )}
        </div>
      </div>

      {/* Right side: Language, Theme, Auth, Create Bot */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher Button */}
        <div
          id="header-lang-switcher"
          className="flex items-center rounded-xl bg-zinc-900/80 border border-zinc-800 p-0.5 text-xs"
        >
          <button
            type="button"
            onClick={() => setLanguage('de')}
            className={cn(
              'px-2 py-1 rounded-lg font-bold font-mono transition-colors text-[11px]',
              settings.language === 'de'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
            title="Deutsch (German)"
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={cn(
              'px-2 py-1 rounded-lg font-bold font-mono transition-colors text-[11px]',
              settings.language === 'en'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Theme Toggle (White mode / Dark mode) */}
        <button
          id="header-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-850 transition-colors"
          title={isLight ? 'Zu Dunkelmodus wechseln' : 'Zu Weißmodus wechseln'}
          aria-label="Toggle white/dark theme"
        >
          {isLight ? (
            <Moon className="h-4 w-4 text-indigo-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>

        {/* Auth / User button */}
        {currentUser ? (
          <button
            id="header-user-btn"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs"
            title="Account & Auth"
          >
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold font-mono',
                currentUser.role === 'admin'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-300'
              )}
            >
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-medium text-zinc-200">{currentUser.username}</span>
          </button>
        ) : (
          <button
            id="header-login-btn"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-850 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('btnSignIn')}</span>
          </button>
        )}

        {/* Create Client CTA */}
        <button
          id="header-create-client-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">{t('createClientBtn')}</span>
          <span className="sm:hidden">{t('createClientBtn')}</span>
        </button>
      </div>
    </header>
  );
};

