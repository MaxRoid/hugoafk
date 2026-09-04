import { Router, Request, Response } from 'express';
import { db } from '../../database/db.js';
import { requireAdmin } from './auth.js';

export const nodesRouter = Router();

// GET /api/nodes
nodesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM nodes').all() as any[];
    const nodes = rows.map((r) => ({
      id: r.id,
      name: r.name,
      ip: r.ip,
      host: r.ip,
      port: 25565,
      region: r.region,
      flag: r.region.includes('EU') ? '🇪🇺' : '🌐',
      status: r.status,
      cpuUsage: r.cpu_usage,
      memoryUsedMb: r.memory_used_mb,
      memoryTotalMb: r.memory_total_mb,
      maxBots: r.max_bots,
      botCount: r.bot_count,
      ping: r.ping,
      pingMs: r.ping,
      uptimeSeconds: r.uptime_seconds,
      uptime: `${Math.floor(r.uptime_seconds / 3600)}h ${Math.floor((r.uptime_seconds % 3600) / 60)}m`,
      os: r.os,
      version: r.version,
      daemonVersion: r.version,
      assignedClientIds: [],
      networkThroughput: '14.2 MB/s',
    }));
    res.json({ nodes });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch nodes' });
  }
});

// POST /api/nodes
nodesRouter.post('/', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, ip, region, maxBots } = req.body;
    if (!name || !ip) {
      res.status(400).json({ error: 'Name and IP are required' });
      return;
    }

    const id = `node-${Date.now()}`;
    db.prepare(`
      INSERT INTO nodes (id, name, ip, region, status, cpu_usage, memory_used_mb, memory_total_mb, max_bots, bot_count, ping, uptime_seconds, os, version)
      VALUES (?, ?, ?, ?, 'online', 8, 512, 8192, ?, 0, 12, 10, 'Linux / Headless Node', 'v1.5.0')
    `).run(id, name, ip, region || 'EU-Central', Number(maxBots) || 20);

    const r = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as any;
    res.json({
      node: {
        id: r.id,
        name: r.name,
        ip: r.ip,
        host: r.ip,
        port: 25565,
        region: r.region,
        flag: '🇪🇺',
        status: r.status,
        cpuUsage: r.cpu_usage,
        memoryUsedMb: r.memory_used_mb,
        memoryTotalMb: r.memory_total_mb,
        maxBots: r.max_bots,
        botCount: 0,
        ping: r.ping,
        uptimeSeconds: r.uptime_seconds,
        os: r.os,
        version: r.version,
        assignedClientIds: [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add node' });
  }
});

// POST /api/nodes/:id/restart
nodesRouter.post('/:id/restart', requireAdmin, (req: Request, res: Response) => {
  try {
    db.prepare('UPDATE nodes SET uptime_seconds = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to restart node' });
  }
});

// POST /api/nodes/:id/maintenance
nodesRouter.post('/:id/maintenance', requireAdmin, (req: Request, res: Response) => {
  try {
    const node = db.prepare('SELECT status FROM nodes WHERE id = ?').get(req.params.id) as any;
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const nextStatus = node.status === 'maintenance' ? 'online' : 'maintenance';
    db.prepare('UPDATE nodes SET status = ? WHERE id = ?').run(nextStatus, req.params.id);
    const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id) as any;

    res.json({
      node: {
        ...updated,
        host: updated.ip,
        pingMs: updated.ping,
        assignedClientIds: [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update maintenance status' });
  }
});

// DELETE /api/nodes/:id
nodesRouter.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete node' });
  }
});
