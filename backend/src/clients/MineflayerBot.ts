import mineflayer from 'mineflayer';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import dns from 'node:dns';
import { EventEmitter } from 'node:events';
import { db } from '../database/db.js';
import { addonManager } from '../addons/AddonManager.js';
import { AddonLogger } from '../addons/types.js';

export interface BotTelemetry {
  status: 'online' | 'starting' | 'stopped' | 'offline' | 'error' | 'reconnecting';
  ping: number;
  runtimeSeconds: number;
  health: number;
  maxHealth: number;
  food: number;
  maxFood: number;
  position: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    dimension: string;
    facing?: string;
  };
}

export class MineflayerBot extends EventEmitter {
  public id: string;
  public name: string;
  public server: string;
  public port: number;
  public version: string;
  public authMethod: 'Microsoft' | 'Offline';
  public bot: any = null;
  public status: 'online' | 'starting' | 'stopped' | 'offline' | 'error' | 'reconnecting' = 'offline';
  public runtimeSeconds: number = 0;
  public ping: number = 0;
  public health: number = 20;
  public food: number = 20;
  public pendingDeviceCode: { url: string; code: string; directUrl: string } | null = null;
  public position = {
    x: 0,
    y: 64,
    z: 0,
    yaw: 0,
    pitch: 0,
    dimension: 'overworld',
    facing: 'North',
  };

  private runtimeTimer: NodeJS.Timeout | null = null;
  private isIntentionalStop: boolean = false;

  constructor(clientData: {
    id: string;
    name: string;
    server: string;
    port: number;
    version: string;
    authMethod: 'Microsoft' | 'Offline';
    runtimeSeconds?: number;
  }) {
    super();
    this.id = clientData.id;
    this.name = clientData.name;
    this.server = clientData.server;
    this.port = clientData.port;
    this.version = clientData.version;
    this.authMethod = clientData.authMethod;
    this.runtimeSeconds = clientData.runtimeSeconds || 0;
  }

  public log(level: 'INFO' | 'WARN' | 'ERROR' | 'CHAT' | 'DEBUG', message: string) {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Mirror to PM2 console for easier debugging
    if (level === 'ERROR' || level === 'WARN') {
      console.error(`[${this.name}] [${level}] ${message}`);
    } else {
      console.log(`[${this.name}] [${level}] ${message}`);
    }

    try {
      db.prepare(`
        INSERT INTO client_logs (id, client_id, timestamp, level, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(logId, this.id, timestamp, level, message);
    } catch {
      // ignore
    }

    this.emit('log', {
      id: logId,
      clientId: this.id,
      clientName: this.name,
      timestamp,
      level,
      message,
    });
  }

  public createAddonLogger(addonName: string): AddonLogger {
    return {
      info: (msg) => this.log('INFO', `[${addonName}] ${msg}`),
      warn: (msg) => this.log('WARN', `[${addonName}] ${msg}`),
      error: (msg) => this.log('ERROR', `[${addonName}] ${msg}`),
      debug: (msg) => this.log('DEBUG', `[${addonName}] ${msg}`),
    };
  }

  public async start(): Promise<void> {
    if (this.bot) {
      throw new Error(`Bot ${this.name} is already running.`);
    }

    this.isIntentionalStop = false;
    this.status = 'starting';
    this.updateDbStatus('starting');
    this.emit('status', { clientId: this.id, status: 'starting' });
    this.log('INFO', `Initiating connection to ${this.server}:${this.port}...`);

    // Prepare auth profile cache dir
    const baseDataDir = fs.existsSync(path.resolve(process.cwd(), 'data'))
      ? path.resolve(process.cwd(), 'data')
      : path.resolve(process.cwd(), '../data');
    const authCacheDir = path.join(baseDataDir, 'auth-cache', this.id);
    if (!fs.existsSync(authCacheDir)) {
      fs.mkdirSync(authCacheDir, { recursive: true });
    }

    if (this.authMethod === 'Microsoft') {
      // Check if this bot already has valid cached tokens
      const currentFiles = fs.existsSync(authCacheDir) ? fs.readdirSync(authCacheDir).filter((f) => f.endsWith('.json')) : [];
      const hasTokens = currentFiles.some((f) => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(authCacheDir, f), 'utf8'));
          return content && Object.keys(content).length > 0 && (content.token || content.mca || content.userToken);
        } catch { return false; }
      });

      if (!hasTokens) {
        // Automatically adopt existing Microsoft login from shared cache or any other bot!
        const allCachesDir = path.join(baseDataDir, 'auth-cache');
        if (fs.existsSync(allCachesDir)) {
          const dirs = fs.readdirSync(allCachesDir).filter((d) => d !== this.id && fs.statSync(path.join(allCachesDir, d)).isDirectory());
          const sortedDirs = dirs.sort((a, b) => (a === 'shared' ? -1 : b === 'shared' ? 1 : 0));
          for (const dir of sortedDirs) {
            const candidateDir = path.join(allCachesDir, dir);
            const candidateFiles = fs.readdirSync(candidateDir).filter((f) => f.endsWith('.json'));
            const candidateHasTokens = candidateFiles.some((f) => {
              try {
                const content = JSON.parse(fs.readFileSync(path.join(candidateDir, f), 'utf8'));
                return content && Object.keys(content).length > 0 && (content.token || content.mca || content.userToken);
              } catch { return false; }
            });

            if (candidateHasTokens) {
              for (const file of candidateFiles) {
                try {
                  fs.copyFileSync(path.join(candidateDir, file), path.join(authCacheDir, file));
                } catch {}
              }
              this.log('INFO', `Vorhandener Microsoft-Login gefunden. Sitzung automatisch übernommen!`);
              break;
            }
          }
        }
      }
    }

    // Fast SRV pre-resolution with 3-second timeout to prevent 15-minute connection hangs
    let targetHost = this.server;
    let targetPort = this.port;

    if (net.isIP(targetHost) === 0 && targetHost !== 'localhost') {
      try {
        const srvPromise = dns.promises.resolveSrv(`_minecraft._tcp.${targetHost}`);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SRV timeout')), 3000)
        );
        const addresses = (await Promise.race([srvPromise, timeoutPromise])) as dns.SrvRecord[];
        if (addresses && addresses.length > 0) {
          targetHost = addresses[0].name;
          targetPort = addresses[0].port;
          this.log('INFO', `SRV-Record aufgelöst: ${this.server} -> ${targetHost}:${targetPort}`);
        }
      } catch {
        // Fallback to direct host:port immediately without hanging
      }
    }

    // Sanitize username for Minecraft protocol (max 16 chars, alphanumeric and underscore)
    let validUsername = this.name.replace(/[^a-zA-Z0-9_]/g, '');
    if (validUsername.length > 16) {
      validUsername = validUsername.substring(0, 16);
    }
    if (validUsername.length < 3) {
      validUsername = `Bot_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Version parsing: if version is 'Auto-Detect', pass version: false so Mineflayer auto-pings and negotiates!
    let mcVersion: string | boolean = false;
    if (this.version && !this.version.toLowerCase().includes('auto')) {
      const v = this.version;
      if (v.includes('1.21.11')) mcVersion = '1.21.11';
      else if (v.includes('1.21.4')) mcVersion = '1.21.4';
      else if (v.includes('1.21.1')) mcVersion = '1.21.1';
      else if (v.includes('1.21')) mcVersion = '1.21.11';
      else if (v.includes('1.20.4')) mcVersion = '1.20.4';
      else if (v.includes('1.20.1')) mcVersion = '1.20.1';
      else if (v.includes('1.20')) mcVersion = '1.20.4';
      else if (v.includes('1.19')) mcVersion = '1.19.4';
      else if (v.includes('1.18')) mcVersion = '1.18.2';
      else if (v.includes('1.17')) mcVersion = '1.17.1';
      else if (v.includes('1.16')) mcVersion = '1.16.5';
      else if (v.includes('1.12')) mcVersion = '1.12.2';
      else if (v.includes('1.8')) mcVersion = '1.8.9';
    }

    const botOptions: any = {
      host: targetHost,
      port: targetPort,
      fakeHost: this.server,
      connect: (client: any) => {
        this.log('INFO', `Verbinde TCP Socket mit ${targetHost}:${targetPort}...`);
        const socket = net.connect(targetPort, targetHost);
        client.setSocket(socket);
        if (socket.connecting) {
          socket.on('connect', () => {
            this.log('INFO', `TCP-Verbindung hergestellt! Sende Minecraft-Handshake...`);
          });
        } else {
          this.log('INFO', `TCP-Verbindung hergestellt! Sende Minecraft-Handshake...`);
          client.emit('connect');
        }
        socket.on('error', (err: any) => {
          this.log('ERROR', `TCP-Verbindungsfehler zu ${targetHost}:${targetPort}: ${err?.message || err}`);
        });
      },
      username: validUsername,
      auth: this.authMethod === 'Microsoft' ? 'microsoft' : 'offline',
      profilesFolder: authCacheDir,
      checkTimeoutInterval: 60000,
      onMsaCode: (data: any) => {
        const url = data.verification_uri || 'https://www.microsoft.com/link';
        const code = data.user_code;
        const directUrl = `https://www.microsoft.com/link?otc=${code}`;
        const msg = data.message || `Microsoft Device Login: Go to ${url} and enter code ${code}`;
        this.log('WARN', `[AUTH] ${msg}`);
        this.pendingDeviceCode = { url, code, directUrl };
        this.emit('device_code', {
          clientId: this.id,
          message: 'Microsoft Device Authentication Required',
          url,
          code,
          directUrl,
        });
      },
    };

    if (mcVersion) {
      botOptions.version = mcVersion;
    }

    try {
      this.bot = mineflayer.createBot(botOptions);
      this.setupBotListeners();
    } catch (err: any) {
      this.status = 'error';
      this.updateDbStatus('error');
      this.log('ERROR', `Failed to initialize bot: ${err?.message}`);
      this.emit('status', { clientId: this.id, status: 'error' });
      throw err;
    }
  }

  private setupBotListeners() {
    if (!this.bot) return;

    if (this.bot._client) {
      this.bot._client.on('session', (session: any) => {
        this.pendingDeviceCode = null;
        const playerName = session?.selectedProfile?.name || this.name;
        this.log('INFO', `Microsoft-Login erfolgreich bestätigt! Angemeldet als "${playerName}". Verbinde mit Server...`);
        this.emit('client:update', { clientId: this.id, deviceCode: null });
      });

      this.bot._client.on('encryption_begin', () => {
        this.log('INFO', 'Server fordert Verschlüsselung an. Authentifiziere Sitzung mit Mojang...');
      });

      this.bot._client.on('packet', (data: any, meta: any) => {
        if (meta.name === 'disconnect' || meta.name === 'kick_disconnect') {
          let reason = data?.reason;
          try {
            if (typeof reason === 'string') {
              try {
                const parsed = JSON.parse(reason);
                reason = parsed.text || parsed.extra?.map((e: any) => e.text).join('') || reason;
              } catch {}
            } else if (typeof reason === 'object') {
              reason = reason.text || reason.extra?.map((e: any) => e.text).join('') || JSON.stringify(reason);
            }
          } catch {}
          this.log('WARN', `Server-Meldung (Disconnect): ${reason || JSON.stringify(data)}`);
        }
      });
    }

    this.bot.on('login', () => {
      this.pendingDeviceCode = null;
      this.log('INFO', `Handshake successful. Joining world (${this.server}:${this.port})...`);
      
      // Save copy of valid tokens to shared cache so any future bot can reuse this login
      try {
        const baseDataDir = fs.existsSync(path.resolve(process.cwd(), 'data'))
          ? path.resolve(process.cwd(), 'data')
          : path.resolve(process.cwd(), '../data');
        const authCacheDir = path.join(baseDataDir, 'auth-cache', this.id);
        const sharedDir = path.join(baseDataDir, 'auth-cache', 'shared');
        if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });
        if (fs.existsSync(authCacheDir)) {
          const files = fs.readdirSync(authCacheDir).filter((f) => f.endsWith('.json'));
          for (const file of files) {
            fs.copyFileSync(path.join(authCacheDir, file), path.join(sharedDir, file));
          }
        }
      } catch {}
    });

    this.bot.on('spawn', () => {
      this.status = 'online';
      this.updateDbStatus('online');
      this.log('INFO', `Bot entity spawned in world (${this.bot.game?.dimension || 'overworld'}). Online!`);
      this.emit('status', { clientId: this.id, status: 'online' });

      // Start uptime counter
      if (this.runtimeTimer) clearInterval(this.runtimeTimer);
      this.runtimeTimer = setInterval(() => {
        this.runtimeSeconds++;
        this.ping = this.bot?.player?.ping || Math.floor(10 + Math.random() * 15);
        this.emit('stats', {
          clientId: this.id,
          ping: this.ping,
          runtimeSeconds: this.runtimeSeconds,
          health: this.health,
          food: this.food,
        });

        // Periodic db save every 30s
        if (this.runtimeSeconds % 30 === 0) {
          try {
            db.prepare('UPDATE clients SET runtime_seconds = ?, ping = ? WHERE id = ?').run(
              this.runtimeSeconds,
              this.ping,
              this.id
            );
          } catch {}
        }
      }, 1000);

      this.updatePosition();
      this.emitInventory();

      // Initialize all active addons for this client
      addonManager.startAddonsForBot(
        this.id,
        this.name,
        this.bot,
        this,
        (addonName) => this.createAddonLogger(addonName),
        (msg) => this.sendChat(msg)
      );
    });

    this.bot.on('messagestr', (message: string, position: string) => {
      if (!message.trim()) return;
      const timestamp = new Date().toTimeString().split(' ')[0];
      const chatMsgId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const isSystem = position === 'system' || position === 'game_info';

      // Parse sender
      let sender = 'Server';
      let cleanMessage = message;
      const match = message.match(/^<([^>]+)>\s*(.*)$/);
      if (match) {
        sender = match[1];
        cleanMessage = match[2];
      }

      const isBot = sender.toLowerCase() === this.name.toLowerCase();

      try {
        db.prepare(`
          INSERT INTO client_chat (id, client_id, timestamp, sender, message, is_system, is_bot)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(chatMsgId, this.id, timestamp, sender, cleanMessage, isSystem ? 1 : 0, isBot ? 1 : 0);
      } catch {}

      this.emit('chat', {
        id: chatMsgId,
        clientId: this.id,
        timestamp,
        sender,
        message: cleanMessage,
        isSystem,
        isBot,
      });
    });

    this.bot.on('health', () => {
      this.health = Math.round(this.bot.health || 20);
      this.food = Math.round(this.bot.food || 20);
      this.emit('stats', {
        clientId: this.id,
        health: this.health,
        food: this.food,
        ping: this.ping,
        runtimeSeconds: this.runtimeSeconds,
      });
    });

    let lastMoveEmitted = 0;
    this.bot.on('move', () => {
      const now = Date.now();
      if (now - lastMoveEmitted > 1000) {
        lastMoveEmitted = now;
        this.updatePosition();
      }
    });

    const handleDisconnect = (reason: string, isError: boolean = false) => {
      if (this.status === 'offline' || this.status === 'stopped') return;
      this.cleanup();
      const nextStatus = this.isIntentionalStop ? 'stopped' : 'offline';
      this.status = nextStatus;
      this.updateDbStatus(nextStatus);
      this.log(isError ? 'WARN' : 'INFO', `Disconnected from server (${reason || 'connection closed'}).`);
      this.emit('status', { clientId: this.id, status: nextStatus });
      this.emit('botEnd', { reason });
    };

    this.bot.on('kicked', (reason: any) => {
      const reasonStr = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
      this.log('WARN', `Kicked from server: ${reasonStr}`);
      this.emit('botKicked', { reason: reasonStr });
      handleDisconnect(`Kicked: ${reasonStr}`, true);
    });

    this.bot.on('end', (reason: string) => {
      handleDisconnect(reason);
    });

    this.bot.on('error', (err: Error) => {
      const errMsg = err?.message || 'Unknown Mineflayer error';
      if (errMsg.includes('does the account own minecraft')) {
        this.log('ERROR', `[AUTH HINWEIS] Der angemeldete Microsoft-Account besitzt keine Minecraft Java Edition Lizenz! Bitte nutze das Microsoft-Konto, auf dem Minecraft gekauft wurde, oder starte einen Bot im Offline/Cracked-Modus.`);
      } else if (errMsg.includes('ECONNRESET')) {
        this.log('WARN', `Verbindung vom Server abrupt beendet (ECONNRESET).`);
      } else {
        this.log('ERROR', `Mineflayer Error: ${errMsg}`);
      }
      this.emit('botError', { error: err });
      handleDisconnect(errMsg, true);
    });

    // Catch low-level socket errors to avoid unhandled ECONNRESET
    if (this.bot._client) {
      this.bot._client.on('error', (err: any) => {
        handleDisconnect(err?.message || 'Socket error', true);
      });
      if (this.bot._client.socket) {
        this.bot._client.socket.on('error', (err: any) => {
          handleDisconnect(err?.message || 'TCP socket error', true);
        });
      }
    }
  }

  private updatePosition() {
    if (!this.bot?.entity) return;
    const pos = this.bot.entity.position;
    this.position = {
      x: Number(pos.x.toFixed(2)),
      y: Number(pos.y.toFixed(2)),
      z: Number(pos.z.toFixed(2)),
      yaw: Number(this.bot.entity.yaw.toFixed(2)),
      pitch: Number(this.bot.entity.pitch.toFixed(2)),
      dimension: this.bot.game?.dimension || 'overworld',
      facing: this.calculateFacing(this.bot.entity.yaw),
    };

    this.emit('position', { clientId: this.id, position: this.position });
  }

  private calculateFacing(yaw: number): string {
    const degrees = (((yaw * 180) / Math.PI + 180) % 360 + 360) % 360;
    if (degrees >= 315 || degrees < 45) return 'North';
    if (degrees >= 45 && degrees < 135) return 'East';
    if (degrees >= 135 && degrees < 225) return 'South';
    return 'West';
  }

  public getInventory(): any[] {
    if (!this.bot?.inventory) return [];
    const items = this.bot.inventory.slots || [];
    return items
      .map((item: any, slot: number) => {
        if (!item) return null;
        return {
          slot,
          id: item.name,
          name: item.displayName || item.name,
          count: item.count || 1,
          maxStackSize: item.stackSize || 64,
          maxCount: item.stackSize || 64,
          durability: item.durabilityUsed !== undefined ? item.maxDurability - item.durabilityUsed : undefined,
          maxDurability: item.maxDurability,
        };
      })
      .filter(Boolean);
  }

  public emitInventory() {
    const inv = this.getInventory();
    this.emit('inventory', { clientId: this.id, inventory: inv });
  }

  public sendChat(message: string) {
    if (!this.bot) {
      throw new Error(`Bot ${this.name} is not connected.`);
    }

    this.bot.chat(message);

    const timestamp = new Date().toTimeString().split(' ')[0];
    const chatMsgId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      db.prepare(`
        INSERT INTO client_chat (id, client_id, timestamp, sender, message, is_system, is_bot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(chatMsgId, this.id, timestamp, this.name, message, 0, 1);
    } catch {}

    this.emit('chat', {
      id: chatMsgId,
      clientId: this.id,
      timestamp,
      sender: this.name,
      message,
      isSystem: false,
      isBot: true,
    });
  }

  public async stop(): Promise<void> {
    this.isIntentionalStop = true;
    this.cleanup();

    if (this.bot) {
      try {
        this.bot.quit();
      } catch {}
      this.bot = null;
    }

    this.status = 'stopped';
    this.updateDbStatus('stopped');
    this.emit('status', { clientId: this.id, status: 'stopped' });
    this.log('INFO', `Bot stopped by user.`);
  }

  public async restart(): Promise<void> {
    await this.stop();
    await new Promise((r) => setTimeout(r, 2000));
    await this.start();
  }

  private cleanup() {
    if (this.runtimeTimer) {
      clearInterval(this.runtimeTimer);
      this.runtimeTimer = null;
    }
    addonManager.stopAllAddonsForClient(this.id);
  }

  private updateDbStatus(status: string) {
    try {
      db.prepare('UPDATE clients SET status = ?, runtime_seconds = ? WHERE id = ?').run(
        status,
        this.runtimeSeconds,
        this.id
      );
    } catch {}
  }
}
