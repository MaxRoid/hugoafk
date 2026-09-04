import { Router, Request, Response } from 'express';
import { db } from '../../database/db.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
    const settings: Record<string, any> = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch settings' });
  }
});

// POST /api/settings
settingsRouter.post('/', (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    for (const [k, v] of Object.entries(incoming)) {
      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value)
        VALUES (?, ?)
      `).run(k, JSON.stringify(v));
    }
    res.json({ settings: incoming });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save settings' });
  }
});
