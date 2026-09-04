'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AppSettings } from '@/types';
import {
  Settings,
  Moon,
  Sun,
  Globe,
  RefreshCw,
  Bell,
  Eye,
  Check,
  Shield,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, t } = useDashboard();
  const [formData, setFormData] = useState<AppSettings>(() => ({ ...settings }));

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div id="settings-view" className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
          {t('settingsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {t('settingsSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General (Theme & Language) */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-zinc-200">
            <Moon className="w-4 h-4 text-emerald-400" />
            <span>{t('sectionGeneral')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Theme selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('themeLabel')}
              </label>
              <select
                id="setting-theme"
                value={formData.theme}
                onChange={(e) => handleChange('theme', e.target.value as any)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="dark">{t('themeDark')}</option>
                <option value="light">{t('themeLight')} (White Mode)</option>
                <option value="system">{t('themeSystem')}</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                {settings.language === 'de'
                  ? 'Wähle zwischen modernem Dark-Mode oder hellem White-Mode.'
                  : 'High-contrast developer theme with minimal eye fatigue or clean light mode.'}
              </p>
            </div>

            {/* Language selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('languageLabel')}
              </label>
              <select
                id="setting-language"
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value as any)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="de">{t('langDe')}</option>
                <option value="en">{t('langEn')}</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                {settings.language === 'de'
                  ? 'Komplette Benutzeroberfläche auf Deutsch oder Englisch.'
                  : 'Dashboard interface and localization language.'}
              </p>
            </div>
          </div>

          {/* Quick Theme Switcher Cards */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              {settings.language === 'de' ? 'Schnellauswahl Farbschema' : 'Quick Theme Preset'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('theme', 'dark')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  formData.theme === 'dark'
                    ? 'border-emerald-500/50 bg-zinc-950 text-zinc-100 shadow-md ring-1 ring-emerald-500/40'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                )}
              >
                <Moon className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-200">Dark Mode</div>
                  <div className="text-[10px] text-zinc-500">Developer Dark Palette</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('theme', 'light')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  formData.theme === 'light'
                    ? 'border-emerald-500/50 bg-zinc-100 text-zinc-900 shadow-md ring-1 ring-emerald-500/40'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                )}
              >
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-200">White Mode</div>
                  <div className="text-[10px] text-zinc-500">Clean Light Palette</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Dashboard Preferences */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-zinc-200">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>{t('sectionDashboard')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Refresh Interval */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('refreshIntervalLabel')}
              </label>
              <select
                id="setting-refresh-interval"
                value={formData.refreshInterval}
                onChange={(e) => handleChange('refreshInterval', Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={2}>2s ({settings.language === 'de' ? 'Echtzeit / Hoch' : 'High Frequency'})</option>
                <option value={5}>5s ({settings.language === 'de' ? 'Standard' : 'Standard'})</option>
                <option value={10}>10s ({settings.language === 'de' ? 'Bandbreite sparen' : 'Bandwidth Saver'})</option>
                <option value={30}>30s ({settings.language === 'de' ? 'Entspannt' : 'Relaxed'})</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Telemetry polling frequency for health, position, and ping.
              </p>
            </div>

            {/* Auto-scroll Logs */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('autoScrollLogs')}</span>
                <span className="text-[11px] text-zinc-500 block">
                  {settings.language === 'de'
                    ? 'Terminalansicht automatisch an neue Zeilen anheften'
                    : 'Automatically pin logs view to latest terminal lines'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('autoScrollLogs', !formData.autoScrollLogs)}
                className={cn(
                  'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
                  formData.autoScrollLogs ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    formData.autoScrollLogs ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Notifications */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-zinc-200">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>{t('sectionNotifications')}</span>
          </div>

          <div className="space-y-3">
            {/* Desktop Notifications */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('desktopAlerts')}</span>
                <span className="text-[11px] text-zinc-500 block">
                  {settings.language === 'de'
                    ? 'Push-Warnungen senden bei Disconnect oder Schaden'
                    : 'Trigger push alerts when a client disconnects or takes damage'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('desktopNotifications', !formData.desktopNotifications)}
                className={cn(
                  'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
                  formData.desktopNotifications ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    formData.desktopNotifications ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Discord Webhook URL */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t('discordWebhook')}
              </label>
              <input
                id="setting-webhook-url"
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={formData.webhookUrl}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Receive instant channel pings when AutoSell triggers or bot restarts occur.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Appearance */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-sm font-semibold text-zinc-200">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>{t('sectionAppearance')}</span>
          </div>

          <div className="space-y-3">
            {/* Compact Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('compactMode')}</span>
                <span className="text-[11px] text-zinc-500 block">
                  {settings.language === 'de'
                    ? 'Kompaktere Abstände für Multi-Monitor-Setups'
                    : 'Compress table rows and card padding for dense multi-monitor setups'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('compactMode', !formData.compactMode)}
                className={cn(
                  'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
                  formData.compactMode ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    formData.compactMode ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Show Coordinates in Header */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  {t('showCoords')}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  {settings.language === 'de'
                    ? 'Koordinaten (X/Y/Z) direkt in den Client-Karten anzeigen'
                    : 'Display X/Y/Z directly in client card badges'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('showCoordinatesInHeader', !formData.showCoordinatesInHeader)}
                className={cn(
                  'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
                  formData.showCoordinatesInHeader ? 'bg-emerald-500' : 'bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    formData.showCoordinatesInHeader ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="settings-save-btn"
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('savePreferencesBtn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

