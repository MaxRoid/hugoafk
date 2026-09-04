import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = fs.existsSync(path.resolve(process.cwd(), 'data'))
  ? path.resolve(process.cwd(), 'data')
  : path.resolve(process.cwd(), '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(DATA_DIR, 'hugoafk.sqlite');

export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      bot_quota INTEGER NOT NULL DEFAULT 5,
      auth_provider TEXT NOT NULL DEFAULT 'local',
      provider_id TEXT,
      created_at TEXT NOT NULL,
      last_active TEXT NOT NULL
    );
  `);

  // Clients Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      server TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 25565,
      version TEXT NOT NULL DEFAULT 'Minecraft 1.21.11',
      auth_method TEXT NOT NULL DEFAULT 'Microsoft',
      status TEXT NOT NULL DEFAULT 'offline',
      ping INTEGER NOT NULL DEFAULT 0,
      health REAL NOT NULL DEFAULT 20,
      max_health REAL NOT NULL DEFAULT 20,
      food REAL NOT NULL DEFAULT 20,
      max_food REAL NOT NULL DEFAULT 20,
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 64,
      position_z REAL NOT NULL DEFAULT 0,
      position_yaw REAL NOT NULL DEFAULT 0,
      position_pitch REAL NOT NULL DEFAULT 0,
      dimension TEXT NOT NULL DEFAULT 'overworld',
      runtime_seconds INTEGER NOT NULL DEFAULT 0,
      auto_start INTEGER NOT NULL DEFAULT 0,
      auto_reconnect INTEGER NOT NULL DEFAULT 1,
      owner_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migration for existing database
  try {
    db.exec('ALTER TABLE clients ADD COLUMN owner_id TEXT;');
  } catch {}

  // Client Addons Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_addons (
      client_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      config_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (client_id, addon_id),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Client Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_logs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Client Chat Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_chat (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      is_system INTEGER NOT NULL DEFAULT 0,
      is_bot INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Nodes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ip TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'online',
      cpu_usage INTEGER NOT NULL DEFAULT 12,
      memory_used_mb INTEGER NOT NULL DEFAULT 1024,
      memory_total_mb INTEGER NOT NULL DEFAULT 8192,
      max_bots INTEGER NOT NULL DEFAULT 25,
      bot_count INTEGER NOT NULL DEFAULT 0,
      ping INTEGER NOT NULL DEFAULT 8,
      uptime_seconds INTEGER NOT NULL DEFAULT 0,
      os TEXT NOT NULL DEFAULT 'Linux / Headless Node',
      version TEXT NOT NULL DEFAULT 'v1.5.0'
    );
  `);

  // Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      user TEXT NOT NULL,
      details TEXT NOT NULL,
      ip TEXT
    );
  `);

  // Ensure default master node exists
  const existingNode = db.prepare('SELECT id FROM nodes WHERE id = ?').get('node-local-1');
  if (!existingNode) {
    db.prepare(`
      INSERT INTO nodes (id, name, ip, region, status, cpu_usage, memory_used_mb, memory_total_mb, max_bots, bot_count, ping, uptime_seconds, os, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'node-local-1',
      'Local Cluster Master',
      '127.0.0.1',
      'EU-Central (Local)',
      'online',
      15,
      1280,
      16384,
      50,
      0,
      4,
      14200,
      'Windows / Node.js Runtime',
      'v1.5.0'
    );
  }

  // Create default admin user if none exists
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (!existingAdmin) {
    const defaultDate = new Date().toISOString();
    // Default password 'admin123' hashed with SHA-256 + salt
    // (User can also register or login via Discord/Google)
    const salt = 'hugoafk_salt_default';
    const crypto = require('node:crypto');
    const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, status, bot_quota, auth_provider, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'user-admin-1',
      'Admin',
      'admin@hugoafk.net',
      `${salt}:${hash}`,
      'admin',
      'active',
      25,
      'local',
      defaultDate,
      defaultDate
    );
  }

  console.log(`[Database] SQLite connected & schema initialized at ${DB_PATH}`);
}
