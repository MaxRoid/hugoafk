import { Router, Request, Response } from 'express';
import { addonManager } from '../../addons/AddonManager.js';
import { authenticateToken, requireAdmin } from './auth.js';

export const addonsRouter = Router();

// GET /api/addons
addonsRouter.get('/', authenticateToken, (_req: Request, res: Response) => {
  try {
    const addons = addonManager.getAvailableAddons();
    res.json({ addons });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch addons' });
  }
});

// POST /api/addons/:id/install
addonsRouter.post('/:id/install', requireAdmin, (req: Request, res: Response) => {
  try {
    const { clientIds, config } = req.body;
    if (!clientIds || !Array.isArray(clientIds)) {
      res.status(400).json({ error: 'clientIds must be an array of client IDs' });
      return;
    }

    for (const clientId of clientIds) {
      addonManager.installAddon(req.params.id, clientId, config);
    }

    res.json({ success: true, count: clientIds.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to install addon' });
  }
});

// POST /api/addons/:id/uninstall
addonsRouter.post('/:id/uninstall', requireAdmin, (req: Request, res: Response) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      res.status(400).json({ error: 'clientId is required' });
      return;
    }

    addonManager.uninstallAddon(req.params.id, clientId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to uninstall addon' });
  }
});

// POST /api/addons/:id/toggle
addonsRouter.post('/:id/toggle', requireAdmin, (req: Request, res: Response) => {
  try {
    const { clientId, enabled } = req.body;
    if (!clientId || enabled === undefined) {
      res.status(400).json({ error: 'clientId and enabled status are required' });
      return;
    }

    addonManager.toggleAddon(req.params.id, clientId, Boolean(enabled));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle addon' });
  }
});

// POST /api/addons/:id/config
addonsRouter.post('/:id/config', requireAdmin, (req: Request, res: Response) => {
  try {
    const { config, clientId } = req.body;
    if (!config) {
      res.status(400).json({ error: 'config is required' });
      return;
    }

    if (clientId) {
      addonManager.saveAddonConfig(req.params.id, clientId, config);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save config' });
  }
});

// POST /api/addons/reload
addonsRouter.post('/reload', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const count = await addonManager.reloadAddons();
    res.json({ success: true, count, message: `Successfully reloaded ${count} addons.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to reload addons' });
  }
});

// DELETE /api/addons/custom/:id
addonsRouter.delete('/custom/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = addonManager.deleteCustomAddon(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Addon not found or is a built-in addon' });
      return;
    }
    res.json({ success: true, message: `Addon ${req.params.id} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete custom addon' });
  }
});

// POST /api/addons/upload - Install custom plug-and-play addon
addonsRouter.post('/upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { folderName, manifest, code } = req.body;

    if (!folderName || !manifest || !code) {
      res.status(400).json({ error: 'folderName, manifest (JSON), and code (JavaScript) are required' });
      return;
    }

    // Sanitize folder name
    const sanitizedName = folderName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!sanitizedName) {
      res.status(400).json({ error: 'Invalid folder name' });
      return;
    }

    const fs = await import('node:fs');
    const path = await import('node:path');
    const { addonLoader } = await import('../../addons/AddonLoader.js');

    const addonsDir = addonLoader.getAddonsDirectory();
    const targetFolder = path.join(addonsDir, sanitizedName);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Write addon.json
    fs.writeFileSync(
      path.join(targetFolder, 'addon.json'),
      typeof manifest === 'string' ? manifest : JSON.stringify(manifest, null, 2),
      'utf8'
    );

    // Write index.js
    fs.writeFileSync(path.join(targetFolder, 'index.js'), code, 'utf8');

    // Reload addons to register the new one
    await addonManager.reloadAddons();

    const loaded = addonManager.getAddon(manifest.id || sanitizedName);

    res.json({
      success: true,
      addon: loaded,
      message: `Plugin "${manifest.name || sanitizedName}" installed successfully!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to install addon' });
  }
});

// GET /api/addons/ai-guide - Return AI prompt and development documentation
addonsRouter.get('/ai-guide', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const possiblePaths = [
      path.resolve(process.cwd(), 'ADDON_DEVELOPMENT_GUIDE.md'),
      path.resolve(process.cwd(), '../ADDON_DEVELOPMENT_GUIDE.md'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        res.json({ markdown: content });
        return;
      }
    }

    res.status(404).json({ error: 'ADDON_DEVELOPMENT_GUIDE.md not found' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load AI guide' });
  }
});
