import { Router, Request, Response } from 'express';
import {
  authService,
  verifyPassword,
  signToken,
  verifyToken,
  mapUserToAccount,
} from '../../auth/authService.js';
import {
  isDiscordConfigured,
  getDiscordAuthUrl,
  handleDiscordCallback,
} from '../../auth/discordOAuth.js';
import {
  isGoogleConfigured,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../../auth/googleOAuth.js';

export const authRouter = Router();

// Middleware to extract authenticated user
export function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    return;
  }

  const freshUser = authService.getUserById(payload.id);
  if (!freshUser) {
    res.status(403).json({ error: 'Forbidden: User not found' });
    return;
  }

  (req as any).user = freshUser;
  next();
}

// Middleware to restrict routes to Admins/Owners
export function requireAdmin(req: Request, res: Response, next: () => void) {
  authenticateToken(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Access Denied: Only administrators have access to this resource.' });
      return;
    }
    next();
  });
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail) {
      res.status(400).json({ error: 'Username or Email is required' });
      return;
    }

    let user = authService.getUserByEmail(usernameOrEmail);
    if (!user) {
      user = authService.getUserByUsername(usernameOrEmail);
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended by an administrator' });
      return;
    }

    if (user.password_hash && password) {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
    } else if (user.password_hash && !password) {
      res.status(401).json({ error: 'Password required' });
      return;
    }

    const token = signToken(user);
    res.json({ user: mapUserToAccount(user), token });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email) {
      res.status(400).json({ error: 'Username and Email are required' });
      return;
    }

    const user = authService.registerUser(username, email, password);
    const token = signToken(user);
    res.json({ user: mapUserToAccount(user), token });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Registration failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const user = authService.getUserById(payload.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: mapUserToAccount(user) });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// Real Discord OAuth: GET /api/auth/discord
authRouter.get('/discord', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = frontendUrl;

  if (!isDiscordConfigured()) {
    res.redirect(`${frontendUrl}/?error=discord_oauth_not_configured`);
    return;
  }

  const authUrl = getDiscordAuthUrl(origin);
  res.redirect(authUrl);
});

// Real Discord OAuth Callback: GET /api/auth/discord/callback
authRouter.get('/discord/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = frontendUrl;

  if (!code) {
    res.redirect(`${frontendUrl}/?error=no_code_provided`);
    return;
  }

  try {
    const token = await handleDiscordCallback(code, origin);
    res.redirect(`${frontendUrl}/?token=${token}`);
  } catch (err: any) {
    console.error('Discord OAuth error:', err);
    res.redirect(`${frontendUrl}/?error=${encodeURIComponent(err.message || 'discord_oauth_failed')}`);
  }
});

// Real Google OAuth: GET /api/auth/google
authRouter.get('/google', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = frontendUrl;

  if (!isGoogleConfigured()) {
    res.redirect(`${frontendUrl}/?error=google_oauth_not_configured`);
    return;
  }

  const authUrl = getGoogleAuthUrl(origin);
  res.redirect(authUrl);
});

// Real Google OAuth Callback: GET /api/auth/google/callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = frontendUrl;

  if (!code) {
    res.redirect(`${frontendUrl}/?error=no_code_provided`);
    return;
  }

  try {
    const token = await handleGoogleCallback(code, origin);
    res.redirect(`${frontendUrl}/?token=${token}`);
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    res.redirect(`${frontendUrl}/?error=${encodeURIComponent(err.message || 'google_oauth_failed')}`);
  }
});

// User Management (Admin Only)
authRouter.get('/users', requireAdmin, (_req: Request, res: Response) => {
  const rows = authService.getAllUsers();
  res.json({ users: rows.map(mapUserToAccount) });
});

authRouter.post('/users/:id/role', requireAdmin, (req: Request, res: Response) => {
  const user = authService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const nextRole = user.role === 'admin' ? 'user' : 'admin';
  const updated = authService.updateUserRole(user.id, nextRole);
  res.json({ user: mapUserToAccount(updated) });
});

authRouter.post('/users/:id/status', requireAdmin, (req: Request, res: Response) => {
  const user = authService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const nextStatus = user.status === 'active' ? 'suspended' : 'active';
  const updated = authService.updateUserStatus(user.id, nextStatus);
  res.json({ user: mapUserToAccount(updated) });
});

authRouter.post('/users/:id/quota', requireAdmin, (req: Request, res: Response) => {
  const user = authService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const quota = Number(req.body.quota) || 5;
  const updated = authService.updateUserQuota(user.id, quota);
  res.json({ user: mapUserToAccount(updated) });
});
