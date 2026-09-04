import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hugoafk_super_secret_jwt_key_2026';

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  bot_quota: number;
  auth_provider: 'local' | 'discord' | 'google';
  provider_id: string | null;
  created_at: string;
  last_active: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verify === hash;
}

export function signToken(user: { id: string; username: string; email: string; role: string }): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function mapUserToAccount(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    botQuota: row.bot_quota,
    createdDate: row.created_at,
    lastActive: row.last_active,
    authProvider: row.auth_provider,
  };
}

export const authService = {
  getUserById(id: string): UserRow | null {
    const user = (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow) || null;
    if (user) {
      const discordOwnerId = process.env.DISCORD_OWNER_ID?.trim();
      const ownerEmail = (process.env.OWNER_EMAIL || process.env.GOOGLE_OWNER_EMAIL)?.trim()?.toLowerCase();

      const isOwner =
        Boolean(user.auth_provider === 'discord' && discordOwnerId && user.provider_id === discordOwnerId) ||
        Boolean(ownerEmail && user.email && user.email.toLowerCase() === ownerEmail) ||
        Boolean(discordOwnerId && user.provider_id === discordOwnerId);

      if (isOwner && user.role !== 'admin') {
        db.prepare("UPDATE users SET role = 'admin', bot_quota = 100 WHERE id = ?").run(user.id);
        user.role = 'admin';
        user.bot_quota = 100;
      }
    }
    return user;
  },

  getUserByEmail(email: string): UserRow | null {
    return (db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow) || null;
  },

  getUserByUsername(username: string): UserRow | null {
    return (db.prepare('SELECT * FROM users WHERE username = ?').get(username) as unknown as UserRow) || null;
  },

  getUserByProvider(provider: 'discord' | 'google', providerId: string): UserRow | null {
    return (
      (db
        .prepare('SELECT * FROM users WHERE auth_provider = ? AND provider_id = ?')
        .get(provider, providerId) as unknown as UserRow) || null
    );
  },

  getAllUsers(): UserRow[] {
    return db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() as unknown as UserRow[];
  },

  registerUser(username: string, email: string, password?: string): UserRow {
    const existingEmail = this.getUserByEmail(email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }
    const existingUser = this.getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }

    const id = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = password ? hashPassword(password) : null;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, status, bot_quota, auth_provider, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, email, passwordHash, 'user', 'active', 5, 'local', now, now);

    return this.getUserById(id)!;
  },

  findOrCreateOAuthUser(
    provider: 'discord' | 'google',
    providerId: string,
    email: string,
    suggestedUsername: string
  ): UserRow {
    const discordOwnerId = process.env.DISCORD_OWNER_ID?.trim();
    const ownerEmail = (process.env.OWNER_EMAIL || process.env.GOOGLE_OWNER_EMAIL)?.trim()?.toLowerCase();

    const isOwner =
      Boolean(provider === 'discord' && discordOwnerId && providerId === discordOwnerId) ||
      Boolean(ownerEmail && email && email.toLowerCase() === ownerEmail);

    let user = this.getUserByProvider(provider, providerId);
    if (user) {
      const now = new Date().toISOString();
      if (isOwner && user.role !== 'admin') {
        db.prepare('UPDATE users SET role = ?, bot_quota = 100, last_active = ? WHERE id = ?').run('admin', now, user.id);
      } else {
        db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(now, user.id);
      }
      return this.getUserById(user.id)!;
    }

    // Check if email matches existing local user
    user = this.getUserByEmail(email);
    if (user) {
      const now = new Date().toISOString();
      const roleToSet = isOwner ? 'admin' : user.role;
      db.prepare('UPDATE users SET auth_provider = ?, provider_id = ?, role = ?, last_active = ? WHERE id = ?').run(
        provider,
        providerId,
        roleToSet,
        now,
        user.id
      );
      return this.getUserById(user.id)!;
    }

    // Ensure unique username
    let username = suggestedUsername;
    let counter = 1;
    while (this.getUserByUsername(username)) {
      username = `${suggestedUsername}${counter++}`;
    }

    const id = `user-${provider}-${Date.now()}`;
    const now = new Date().toISOString();
    const assignedRole = isOwner ? 'admin' : 'user';
    const quota = isOwner ? 100 : 5;

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, status, bot_quota, auth_provider, provider_id, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, email, null, assignedRole, 'active', quota, provider, providerId, now, now);

    return this.getUserById(id)!;
  },

  updateUserRole(id: string, role: 'admin' | 'user'): UserRow {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    return this.getUserById(id)!;
  },

  updateUserStatus(id: string, status: 'active' | 'suspended'): UserRow {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
    return this.getUserById(id)!;
  },

  updateUserQuota(id: string, quota: number): UserRow {
    db.prepare('UPDATE users SET bot_quota = ? WHERE id = ?').run(quota, id);
    return this.getUserById(id)!;
  },
};
