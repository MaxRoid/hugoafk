import { Router, Request, Response } from 'express';
import { botManager } from '../../clients/BotManager.js';
import { verifyToken } from '../../auth/authService.js';
import { requireAdmin } from './auth.js';

export const clientsRouter = Router();

function getOptionalUser(req: Request) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/clients
clientsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = getOptionalUser(req);
    const clients = await botManager.getClients(user);
    res.json({ clients });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch clients' });
  }
});

// POST /api/clients
clientsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, server, port, version, authMethod, autoStart, autoReconnect, afkEnabled, ownerId } = req.body;
    if (!name || !server) {
      res.status(400).json({ error: 'Client Name and Server Address are required' });
      return;
    }

    const user = getOptionalUser(req);
    const assignedOwnerId = (user?.role === 'admin' && ownerId) ? ownerId : (user?.id || ownerId);

    const client = await botManager.createClient({
      name,
      server,
      port: Number(port) || 25565,
      version: version || 'Minecraft 1.21.4',
      authMethod: authMethod || 'Microsoft',
      autoStart: Boolean(autoStart),
      autoReconnect: autoReconnect !== false,
      afkEnabled: afkEnabled !== false,
      ownerId: assignedOwnerId,
    });

    res.status(201).json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create client' });
  }
});

// POST /api/clients/:id/assign (Pterodactyl-style user assignment)
clientsRouter.post('/:id/assign', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const client = await botManager.assignClientOwner(req.params.id, userId);
    res.json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to assign client to user' });
  }
});

// GET /api/clients/:id
clientsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const client = await botManager.getClient(req.params.id);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch client' });
  }
});

// DELETE /api/clients/:id
clientsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await botManager.deleteClient(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete client' });
  }
});

// POST /api/clients/:id/start
clientsRouter.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const client = await botManager.startClient(req.params.id);
    res.json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to start client' });
  }
});

// POST /api/clients/:id/stop
clientsRouter.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const client = await botManager.stopClient(req.params.id);
    res.json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to stop client' });
  }
});

// POST /api/clients/:id/restart
clientsRouter.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const client = await botManager.restartClient(req.params.id);
    res.json({ client });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to restart client' });
  }
});

// POST /api/clients/:id/chat
clientsRouter.post('/:id/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    await botManager.sendChat(req.params.id, message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to send chat' });
  }
});

// GET /api/clients/:id/logs
clientsRouter.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const client = await botManager.getClient(req.params.id);
    res.json({ logs: client?.logs || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch logs' });
  }
});

// POST /api/clients/:id/logs/clear
clientsRouter.post('/:id/logs/clear', async (req: Request, res: Response) => {
  try {
    await botManager.clearLogs(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear logs' });
  }
});

// GET /api/clients/:id/inventory
clientsRouter.get('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const bot = botManager.getBot(req.params.id);
    const inventory = bot ? bot.getInventory() : [];
    res.json({ inventory });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch inventory' });
  }
});
