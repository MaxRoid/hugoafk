import { Router, Request, Response } from 'express';
import { db } from '../../database/db.js';
import { botManager } from '../../clients/BotManager.js';
import { io } from '../../websocket/socketServer.js';
import { requireAdmin } from './auth.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const adminRouter = Router();

// Log audit event helper
export function recordAuditLog(action: string, user: string, details: string, ip?: string) {
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, user, details, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, timestamp, action, user, details, ip || '127.0.0.1');
  } catch (e) {
    console.error('[AuditLog] Error recording audit event:', e);
  }
}

// POST /api/admin/fleet/command — Execute command/chat on ALL online bots
adminRouter.post('/fleet/command', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    if (!command || !command.trim()) {
      res.status(400).json({ error: 'Command or message is required' });
      return;
    }

    const count = await botManager.broadcastChat(command.trim());
    recordAuditLog('FLEET_COMMAND', (req as any).user?.username || 'Admin', `Sent "${command}" to ${count} active bots`);

    res.json({ success: true, botsReached: count, command });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to execute fleet command' });
  }
});

// POST /api/admin/fleet/stop-all — EMERGENCY KILLSWITCH
adminRouter.post('/fleet/stop-all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stopped = await botManager.stopAllClients();
    recordAuditLog('EMERGENCY_KILLSWITCH', (req as any).user?.username || 'Admin', `Stopped ${stopped} active bots via emergency killswitch`);

    // Broadcast emergency notification to all dashboard clients
    io?.emit('admin:announcement', {
      type: 'emergency',
      message: `EMERGENCY STOP executed by ${(req as any).user?.username || 'Admin'}. All ${stopped} bots stopped.`,
    });

    res.json({ success: true, botsStopped: stopped });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to stop bots' });
  }
});

// POST /api/admin/fleet/start-all — Start all offline bots
adminRouter.post('/fleet/start-all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const starting = await botManager.startAllClients();
    recordAuditLog('FLEET_START_ALL', (req as any).user?.username || 'Admin', `Initiated launch of ${starting} bots`);

    res.json({ success: true, botsStarting: starting });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to start fleet' });
  }
});

// POST /api/admin/fleet/restart-all — Restart all bots
adminRouter.post('/fleet/restart-all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const restarting = await botManager.restartAllClients();
    recordAuditLog('FLEET_RESTART_ALL', (req as any).user?.username || 'Admin', `Restarting ${restarting} active bots`);

    res.json({ success: true, botsRestarting: restarting });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to restart fleet' });
  }
});

// GET /api/admin/system/stats — Deep diagnostic telemetry
adminRouter.get('/system/stats', requireAdmin, (_req: Request, res: Response) => {
  try {
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
      : (fs.existsSync(path.resolve(process.cwd(), 'data/hugoafk.sqlite'))
          ? path.resolve(process.cwd(), 'data/hugoafk.sqlite')
          : path.resolve(process.cwd(), '../data/hugoafk.sqlite'));
    let dbSizeKb = 0;
    try {
      if (fs.existsSync(dbPath)) {
        dbSizeKb = Math.round(fs.statSync(dbPath).size / 1024);
      }
    } catch {}

    const totalClients = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as any)?.c || 0;
    const onlineClients = (db.prepare("SELECT COUNT(*) as c FROM clients WHERE status = 'online'").get() as any)?.c || 0;
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    const totalLogs = (db.prepare('SELECT COUNT(*) as c FROM client_logs').get() as any)?.c || 0;
    const totalChats = (db.prepare('SELECT COUNT(*) as c FROM client_chat').get() as any)?.c || 0;

    const memoryUsage = process.memoryUsage();

    res.json({
      database: {
        path: dbPath,
        sizeKb: dbSizeKb,
        sizeFormatted: dbSizeKb > 1024 ? `${(dbSizeKb / 1024).toFixed(2)} MB` : `${dbSizeKb} KB`,
        totalClients,
        onlineClients,
        totalUsers,
        totalLogs,
        totalChats,
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
        freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
        uptimeSeconds: Math.round(os.uptime()),
      },
      process: {
        nodeVersion: process.version,
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      },
      socketClients: io ? io.engine?.clientsCount || 0 : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch system stats' });
  }
});

// POST /api/admin/system/vacuum — Optimize SQLite database
adminRouter.post('/system/vacuum', requireAdmin, (req: Request, res: Response) => {
  try {
    db.exec('VACUUM;');
    recordAuditLog('DATABASE_VACUUM', (req as any).user?.username || 'Admin', 'Optimized SQLite database');
    res.json({ success: true, message: 'Database optimized successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to vacuum database' });
  }
});

// POST /api/admin/system/clear-logs — Purge old logs
adminRouter.post('/system/clear-logs', requireAdmin, (req: Request, res: Response) => {
  try {
    const { all } = req.body;
    if (all) {
      db.prepare('DELETE FROM client_logs').run();
      db.prepare('DELETE FROM client_chat').run();
      recordAuditLog('PURGE_ALL_LOGS', (req as any).user?.username || 'Admin', 'Cleared all logs and chat histories');
    } else {
      // Clear logs over 1000 items
      db.prepare('DELETE FROM client_logs WHERE rowid NOT IN (SELECT rowid FROM client_logs ORDER BY rowid DESC LIMIT 500)').run();
      recordAuditLog('PURGE_OLD_LOGS', (req as any).user?.username || 'Admin', 'Trimmed old client logs (kept recent 500)');
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to purge logs' });
  }
});

// GET /api/admin/audit-logs — Security & action log
adminRouter.get('/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 100').all() as any[];
    res.json({ auditLogs: logs });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch audit logs' });
  }
});

// POST /api/admin/announcement — Broadcast live alert to all connected dashboard users
adminRouter.post('/announcement', requireAdmin, (req: Request, res: Response) => {
  try {
    const { message, level } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    io?.emit('admin:announcement', {
      message,
      level: level || 'info',
      author: (req as any).user?.username || 'Admin',
      time: new Date().toLocaleTimeString(),
    });

    recordAuditLog('ANNOUNCEMENT', (req as any).user?.username || 'Admin', `Broadcast: "${message}"`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send announcement' });
  }
});
