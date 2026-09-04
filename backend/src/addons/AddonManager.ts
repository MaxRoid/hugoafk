import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { HugoAddon, AddonContext, AddonLogger } from './types.js';
import { AutoSellAddon } from './core/AutoSellAddon.js';
import { AntiAfkAddon } from './core/AntiAfkAddon.js';
import { AutoReconnectAddon } from './core/AutoReconnectAddon.js';
import { AutoRespawnAddon } from './core/AutoRespawnAddon.js';
import { AutoEatAddon } from './core/AutoEatAddon.js';
import { addonLoader } from './AddonLoader.js';
import { db } from '../database/db.js';

export class AddonManager {
  private availableAddons: Map<string, HugoAddon> = new Map();
  // Map of clientId -> Map of addonId -> AddonContext
  private activeClientAddons: Map<string, Map<string, AddonContext>> = new Map();
  private dirWatcher: fs.FSWatcher | null = null;

  constructor() {
    this.registerBuiltInAddons();
    this.loadExternalAddons();
    this.watchAddonsDirectory();
  }

  private registerBuiltInAddons() {
    this.registerAddon(AutoSellAddon);
    this.registerAddon(AntiAfkAddon);
    this.registerAddon(AutoReconnectAddon);
    this.registerAddon(AutoRespawnAddon);
    this.registerAddon(AutoEatAddon);
  }

  public async loadExternalAddons() {
    try {
      const external = await addonLoader.loadAllExternalAddons();
      for (const [id, addon] of external.entries()) {
        this.availableAddons.set(id, addon);
      }
    } catch (err: any) {
      console.error('[AddonManager] Error loading external addons:', err?.message);
    }
  }

  public async reloadAddons(): Promise<number> {
    // Keep built-ins, re-scan external
    const builtInIds = new Set(['autosell', 'anti-afk', 'auto-reconnect', 'auto-respawn', 'auto-eat']);
    for (const id of Array.from(this.availableAddons.keys())) {
      if (!builtInIds.has(id)) {
        this.availableAddons.delete(id);
      }
    }
    await this.loadExternalAddons();
    return this.availableAddons.size;
  }

  public deleteCustomAddon(addonId: string): boolean {
    const addon = this.getAddon(addonId);
    if (!addon) return false;
    if (addon.isBuiltIn) {
      throw new Error(`Cannot delete built-in addon "${addon.name}"`);
    }

    // Stop on all active bots
    for (const [clientId, clientMap] of this.activeClientAddons.entries()) {
      if (clientMap.has(addonId)) {
        this.stopAddonForClient(clientId, addonId);
      }
    }

    // Remove from DB
    try {
      db.prepare('DELETE FROM client_addons WHERE addon_id = ?').run(addonId);
    } catch {}

    // Remove from in-memory map
    this.availableAddons.delete(addonId);

    // Delete folder from filesystem
    const addonsDir = addonLoader.getAddonsDirectory();
    const folderPath = path.join(addonsDir, addonId);
    if (fs.existsSync(folderPath)) {
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
      } catch (err: any) {
        console.error(`[AddonManager] Could not delete folder for ${addonId}:`, err?.message);
      }
    }

    return true;
  }

  private watchAddonsDirectory() {
    try {
      const dir = addonLoader.getAddonsDirectory();
      if (!fs.existsSync(dir)) return;

      let debounceTimer: any = null;
      this.dirWatcher = fs.watch(dir, { recursive: false }, (_eventType, filename) => {
        if (!filename) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`[AddonManager] Detected change in addons directory (${filename}), refreshing plugins...`);
          this.reloadAddons().catch(() => {});
        }, 1200);
      });
    } catch (err: any) {
      console.warn('[AddonManager] Could not start directory watcher for addons:', err?.message);
    }
  }

  public registerAddon(addon: HugoAddon) {
    this.availableAddons.set(addon.id, addon);
  }

  public getAvailableAddons(): HugoAddon[] {
    return Array.from(this.availableAddons.values());
  }

  public getAddon(id: string): HugoAddon | undefined {
    return this.availableAddons.get(id);
  }

  public getClientAddonsFromDb(clientId: string): { addonId: string; enabled: boolean; config: Record<string, any> }[] {
    const rows = db.prepare('SELECT addon_id, enabled, config_json FROM client_addons WHERE client_id = ?').all(clientId) as any[];
    return rows.map((r) => {
      let config = {};
      try {
        config = JSON.parse(r.config_json);
      } catch {}
      return {
        addonId: r.addon_id,
        enabled: Boolean(r.enabled),
        config,
      };
    });
  }

  public installAddon(addonId: string, clientId: string, initialConfig?: Record<string, any>) {
    const addon = this.getAddon(addonId);
    if (!addon) throw new Error(`Addon "${addonId}" not found`);

    const defaultConfig: Record<string, any> = {};
    addon.configSchema.forEach((field) => {
      defaultConfig[field.key] = field.defaultValue;
    });
    const config = { ...defaultConfig, ...(initialConfig || {}) };

    db.prepare(`
      INSERT OR REPLACE INTO client_addons (client_id, addon_id, enabled, config_json)
      VALUES (?, ?, 1, ?)
    `).run(clientId, addonId, JSON.stringify(config));
  }

  public uninstallAddon(addonId: string, clientId: string) {
    this.stopAddonForClient(clientId, addonId);
    db.prepare('DELETE FROM client_addons WHERE client_id = ? AND addon_id = ?').run(clientId, addonId);
  }

  public toggleAddon(addonId: string, clientId: string, enabled: boolean) {
    db.prepare('UPDATE client_addons SET enabled = ? WHERE client_id = ? AND addon_id = ?').run(
      enabled ? 1 : 0,
      clientId,
      addonId
    );

    if (enabled) {
      // Re-trigger if client is running
    } else {
      this.stopAddonForClient(clientId, addonId);
    }
  }

  public saveAddonConfig(addonId: string, clientId: string, config: Record<string, any>) {
    const existing = db
      .prepare('SELECT config_json FROM client_addons WHERE client_id = ? AND addon_id = ?')
      .get(clientId, addonId) as any;

    let merged = config;
    if (existing) {
      try {
        merged = { ...JSON.parse(existing.config_json), ...config };
      } catch {}
    }

    db.prepare('UPDATE client_addons SET config_json = ? WHERE client_id = ? AND addon_id = ?').run(
      JSON.stringify(merged),
      clientId,
      addonId
    );
  }

  public startAddonsForBot(
    clientId: string,
    clientName: string,
    bot: any,
    events: EventEmitter,
    loggerFactory: (addonName: string) => AddonLogger,
    sendChat: (msg: string) => void
  ) {
    const installed = this.getClientAddonsFromDb(clientId);
    let clientMap = this.activeClientAddons.get(clientId);
    if (!clientMap) {
      clientMap = new Map();
      this.activeClientAddons.set(clientId, clientMap);
    }

    for (const item of installed) {
      if (!item.enabled) continue;
      const addon = this.getAddon(item.addonId);
      if (!addon) continue;

      const context: AddonContext = {
        bot,
        clientId,
        clientName,
        logger: loggerFactory(addon.name),
        events,
        config: item.config,
        sendChat,
        saveConfig: (cfg) => this.saveAddonConfig(item.addonId, clientId, cfg),
      };

      try {
        addon.init(context);
        clientMap.set(addon.id, context);
      } catch (err: any) {
        context.logger.error(`Failed to initialize addon ${addon.name}: ${err?.message}`);
      }
    }
  }

  public stopAddonForClient(clientId: string, addonId: string) {
    const clientMap = this.activeClientAddons.get(clientId);
    if (!clientMap) return;

    const context = clientMap.get(addonId);
    if (context) {
      const addon = this.getAddon(addonId);
      if (addon) {
        try {
          addon.stop(context);
        } catch (err: any) {
          context.logger.error(`Error stopping addon ${addon.name}: ${err?.message}`);
        }
      }
      clientMap.delete(addonId);
    }
  }

  public stopAllAddonsForClient(clientId: string) {
    const clientMap = this.activeClientAddons.get(clientId);
    if (!clientMap) return;

    for (const [addonId, context] of clientMap.entries()) {
      const addon = this.getAddon(addonId);
      if (addon) {
        try {
          addon.stop(context);
        } catch (err: any) {
          context.logger.error(`Error stopping addon ${addon.name}: ${err?.message}`);
        }
      }
    }
    clientMap.clear();
    this.activeClientAddons.delete(clientId);
  }
}

export const addonManager = new AddonManager();
