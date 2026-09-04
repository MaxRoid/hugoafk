import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';
import dns from 'node:dns';

// Force IPv4 first and use Cloudflare/Google DNS to prevent 15+ minute SRV/DNS resolution hangs on Linux VPS
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);
  https.globalAgent.options.family = 4;
} catch {}

// Handle network disconnects gracefully
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'ECONNRESET' || err?.message?.includes('ECONNRESET')) {
    // Normal Minecraft server disconnect / TCP socket reset, safely ignored
    return;
  }
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'ECONNRESET' || reason?.message?.includes('ECONNRESET')) {
    return;
  }
  console.error('[Process] Unhandled Rejection:', reason);
});

// Load environment variables from .env if present
try {
  const rootEnv = path.resolve(process.cwd(), '../.env');
  if (fs.existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  } else if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
} catch (e) {
  console.warn('[Config] Could not load .env file:', (e as any)?.message);
}
import { initDatabase } from './database/db.js';
import { botManager } from './clients/BotManager.js';
import { initSocketServer } from './websocket/socketServer.js';
import { authRouter } from './api/routes/auth.js';
import { clientsRouter } from './api/routes/clients.js';
import { addonsRouter } from './api/routes/addons.js';
import { nodesRouter } from './api/routes/nodes.js';
import { settingsRouter } from './api/routes/settings.js';
import { adminRouter } from './api/routes/admin.js';

// Initialize Database & Bot Manager
initDatabase();
botManager.init();

const app = express();

// Determine if SSL / HTTPS is configured
const isSslEnabled =
  (process.env.SSL_ENABLED === 'true' || process.env.HTTPS_ENABLED === 'true') &&
  Boolean(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH);

let server: http.Server | https.Server;

if (isSslEnabled) {
  try {
    const keyPath = path.resolve(process.env.SSL_KEY_PATH!);
    const certPath = path.resolve(process.env.SSL_CERT_PATH!);

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      throw new Error(`SSL files not found: ${keyPath} or ${certPath}`);
    }

    const sslOptions: https.ServerOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    if (process.env.SSL_CA_PATH && fs.existsSync(process.env.SSL_CA_PATH)) {
      sslOptions.ca = fs.readFileSync(path.resolve(process.env.SSL_CA_PATH));
    }

    server = https.createServer(sslOptions, app);
    console.log('[Security] Native SSL/TLS enabled for HTTPS & Secure WebSocket (WSS)');
  } catch (err: any) {
    console.warn(`[Security] Could not initialize SSL (${err?.message}), falling back to standard HTTP.`);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/addons', addonsRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    daemon: 'HugoAFK Gateway v4.2',
    timestamp: new Date().toISOString(),
  });
});

// Paid Features Architectural Stub (Prepared for future tier extension)
export interface PlanCapabilities {
  maxClients: number;
  advancedAddons: boolean;
  apiAccess: boolean;
  customAddons: boolean;
}

export function getUserPlanCapabilities(role: string = 'user'): PlanCapabilities {
  // In V1, all users have access to all implemented features!
  return {
    maxClients: 25,
    advancedAddons: true,
    apiAccess: true,
    customAddons: true,
  };
}

// Initialize Socket.IO Gateway
initSocketServer(server);

const PORT = Number(process.env.PORT) || 3001;
const protocol = isSslEnabled ? 'https' : 'http';
server.listen(PORT, () => {
  console.log(`[HugoAFK] Server backend listening on ${protocol}://localhost:${PORT}`);
  console.log(`[HugoAFK] WebSocket real-time gateway initialized (${protocol === 'https' ? 'WSS' : 'WS'})`);
});
