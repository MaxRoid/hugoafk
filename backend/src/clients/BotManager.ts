import { EventEmitter } from 'node:events';
import { db } from '../database/db.js';
import { MineflayerBot } from './MineflayerBot.js';
import { addonManager } from '../addons/AddonManager.js';

export class BotManager extends EventEmitter {
  private activeBots: Map<string, MineflayerBot> = new Map();

  constructor() {
    super();
  }

  public init() {
    // Reset any previously stuck starting/online states on server startup
    db.exec(`UPDATE clients SET status = 'offline' WHERE status = 'starting' OR status = 'online'`);

    // Auto-start bots that have auto_start enabled
    const autoStartClients = db.prepare('SELECT id FROM clients WHERE auto_start = 1').all() as any[];
    for (const c of autoStartClients) {
      setTimeout(() => {
        this.startClient(c.id).catch((err) => {
          console.error(`Failed to auto-start client ${c.id}:`, err?.message);
        });
      }, 3000);
    }
  }

  public getBot(id: string): MineflayerBot | undefined {
    return this.activeBots.get(id);
  }

  public async getClients(user?: any): Promise<any[]> {
    let query = `
      SELECT c.*, u.username as owner_username
      FROM clients c
      LEFT JOIN users u ON c.owner_id = u.id
    `;
    const params: any[] = [];
    if (user && user.role !== 'admin') {
      query += ` WHERE c.owner_id = ? `;
      params.push(user.id);
    }
    query += ` ORDER BY c.created_at DESC `;
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.formatClient(r));
  }

  public async getClient(id: string, user?: any): Promise<any | null> {
    const row = db.prepare(`
      SELECT c.*, u.username as owner_username
      FROM clients c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `).get(id) as any;
    if (!row) return null;
    if (user && user.role !== 'admin' && row.owner_id && row.owner_id !== user.id) {
      return null;
    }
    return this.formatClient(row);
  }

  private formatClient(row: any): any {
    const activeBot = this.activeBots.get(row.id);
    const activeAddons = addonManager.getClientAddonsFromDb(row.id);

    // Fetch recent logs
    const logs = db
      .prepare('SELECT id, client_id as clientId, timestamp, level, message FROM client_logs WHERE client_id = ? ORDER BY rowid DESC LIMIT 150')
      .all(row.id) as any[];

    // Fetch recent chat history
    const chatHistory = db
      .prepare('SELECT id, client_id as clientId, timestamp, sender, message, is_system as isSystem, is_bot as isBot FROM client_chat WHERE client_id = ? ORDER BY rowid DESC LIMIT 150')
      .all(row.id) as any[];

    return {
      id: row.id,
      name: row.name,
      server: row.server,
      port: row.port,
      version: row.version,
      authMethod: row.auth_method,
      status: activeBot ? activeBot.status : row.status || 'offline',
      ping: activeBot ? activeBot.ping : row.ping || 0,
      runtimeSeconds: activeBot ? activeBot.runtimeSeconds : row.runtime_seconds || 0,
      health: activeBot ? activeBot.health : row.health || 20,
      maxHealth: row.max_health || 20,
      food: activeBot ? activeBot.food : row.food || 20,
      maxFood: row.max_food || 20,
      position: activeBot ? activeBot.position : {
        x: row.position_x || 0,
        y: row.position_y || 64,
        z: row.position_z || 0,
        yaw: row.position_yaw || 0,
        pitch: row.position_pitch || 0,
        dimension: row.dimension || 'overworld',
        facing: 'North',
      },
      activeAddons,
      chatHistory: chatHistory.reverse(),
      inventory: activeBot ? activeBot.getInventory() : [],
      logs: logs.reverse(),
      ownerId: row.owner_id || null,
      ownerUsername: row.owner_username || 'Admin',
      deviceCode: activeBot?.pendingDeviceCode || null,
      createdAt: row.created_at,
      autoStart: Boolean(row.auto_start),
      autoReconnect: Boolean(row.auto_reconnect),
    };
  }

  public async assignClientOwner(id: string, ownerId: string): Promise<any> {
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(ownerId) as any;
    if (!user) {
      throw new Error(`User with ID "${ownerId}" not found.`);
    }

    db.prepare('UPDATE clients SET owner_id = ? WHERE id = ?').run(ownerId, id);
    const updated = await this.getClient(id);
    this.emit('client:update', { client: updated });
    return updated;
  }

  public async createClient(data: {
    name: string;
    server: string;
    port?: number;
    version?: string;
    authMethod?: 'Microsoft' | 'Offline';
    autoStart?: boolean;
    autoReconnect?: boolean;
    afkEnabled?: boolean;
    ownerId?: string;
  }): Promise<any> {
    const id = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const port = Number(data.port) || 25565;
    const version = data.version || 'Minecraft 1.21.11';
    const authMethod = data.authMethod || 'Microsoft';
    const now = new Date().toISOString();

    // Default to first admin if no owner supplied
    let ownerId: string | null = data.ownerId || null;
    if (!ownerId) {
      const defaultOwner = (db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any) ||
        (db.prepare('SELECT id FROM users LIMIT 1').get() as any);
      ownerId = defaultOwner?.id || null;
    }

    db.prepare(`
      INSERT INTO clients (id, name, server, port, version, auth_method, status, auto_start, auto_reconnect, owner_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'offline', ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.server,
      port,
      version,
      authMethod,
      data.autoStart ? 1 : 0,
      data.autoReconnect !== false ? 1 : 0,
      ownerId || null,
      now
    );

    // Install standard starter addons for the new client
    addonManager.installAddon('anti-afk', id, { enabled: data.afkEnabled !== false });
    addonManager.installAddon('auto-reconnect', id, { enabled: data.autoReconnect !== false });
    addonManager.installAddon('auto-respawn', id, { enabled: true });
    addonManager.installAddon('auto-eat', id, { enabled: true });

    return this.getClient(id);
  }

  public async startClient(id: string): Promise<any> {
    let bot = this.activeBots.get(id);

    if (!bot) {
      const clientData = await this.getClient(id);
      if (!clientData) {
        throw new Error(`Client with id "${id}" not found.`);
      }

      bot = new MineflayerBot({
        id: clientData.id,
        name: clientData.name,
        server: clientData.server,
        port: clientData.port,
        version: clientData.version,
        authMethod: clientData.authMethod,
        runtimeSeconds: clientData.runtimeSeconds,
      });

      this.forwardBotEvents(bot);
      this.activeBots.set(id, bot);
    }

    await bot.start();
    return this.getClient(id);
  }

  public async stopClient(id: string): Promise<any> {
    const bot = this.activeBots.get(id);
    if (bot) {
      await bot.stop();
      this.activeBots.delete(id);
    } else {
      db.prepare("UPDATE clients SET status = 'stopped' WHERE id = ?").run(id);
    }
    return this.getClient(id);
  }

  public async restartClient(id: string): Promise<any> {
    await this.stopClient(id);
    await new Promise((r) => setTimeout(r, 1500));
    return this.startClient(id);
  }

  public async deleteClient(id: string): Promise<boolean> {
    await this.stopClient(id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return true;
  }

  public async sendChat(id: string, message: string): Promise<boolean> {
    const bot = this.activeBots.get(id);
    if (!bot) {
      throw new Error('Bot is not currently connected');
    }
    bot.sendChat(message);
    return true;
  }

  public async clearLogs(id: string): Promise<boolean> {
    db.prepare('DELETE FROM client_logs WHERE client_id = ?').run(id);
    return true;
  }

  public async broadcastChat(message: string): Promise<number> {
    let sentCount = 0;
    for (const [id, bot] of this.activeBots.entries()) {
      try {
        if (bot.status === 'online') {
          bot.sendChat(message);
          sentCount++;
        }
      } catch (err: any) {
        console.warn(`[Fleet] Failed to send chat to bot ${id}:`, err?.message);
      }
    }
    return sentCount;
  }

  public async stopAllClients(): Promise<number> {
    const activeIds = Array.from(this.activeBots.keys());
    for (const id of activeIds) {
      try {
        await this.stopClient(id);
      } catch (e) {}
    }
    db.prepare("UPDATE clients SET status = 'stopped' WHERE status = 'online' OR status = 'starting'").run();
    return activeIds.length;
  }

  public async startAllClients(): Promise<number> {
    const all = db.prepare("SELECT id FROM clients WHERE status != 'online' AND status != 'starting'").all() as any[];
    let started = 0;
    for (const row of all) {
      setTimeout(() => {
        this.startClient(row.id).catch((err) => {
          console.error(`Fleet start failed for ${row.id}:`, err?.message);
        });
      }, started * 800);
      started++;
    }
    return started;
  }

  public async restartAllClients(): Promise<number> {
    const activeIds = Array.from(this.activeBots.keys());
    for (const id of activeIds) {
      setTimeout(() => {
        this.restartClient(id).catch(() => {});
      }, 500);
    }
    return activeIds.length;
  }

  private forwardBotEvents(bot: MineflayerBot) {
    bot.on('status', (payload) => {
      if (payload.status === 'offline' || payload.status === 'stopped') {
        this.activeBots.delete(bot.id);
      }
      this.emit('client:status', payload);
    });
    bot.on('chat', (payload) => this.emit('client:chat', payload));
    bot.on('log', (payload) => this.emit('client:log', payload));
    bot.on('stats', (payload) => this.emit('client:stats', payload));
    bot.on('position', (payload) => this.emit('client:position', payload));
    bot.on('inventory', (payload) => this.emit('client:inventory', payload));
    bot.on('device_code', (payload) => this.emit('client:device_code', payload));
    bot.on('botKicked', (payload) =>
      this.emit('client:kicked', { clientId: bot.id, clientName: bot.name, reason: payload.reason })
    );
    bot.on('botError', (payload) =>
      this.emit('client:error', {
        clientId: bot.id,
        clientName: bot.name,
        error: payload.error?.message || String(payload.error),
      })
    );

    bot.on('requestRestart', ({ clientId }) => {
      this.restartClient(clientId).catch((err) => {
        console.error(`AutoReconnect restart failed for ${clientId}:`, err?.message);
      });
    });
  }
}

export const botManager = new BotManager();
