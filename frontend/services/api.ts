import {
  MinecraftClient,
  Addon,
  ServerNode,
  UserAccount,
  AppSettings,
  ClientLogEntry,
  InventoryItem,
} from '@/types';

const API_BASE = '/api';

function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hugoafk_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.error || data.message) {
        errorMsg = data.error || data.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth API
  auth: {
    me: () => request<{ user: UserAccount; token?: string }>('/auth/me'),
    login: (credentials: { usernameOrEmail: string; password?: string }) =>
      request<{ user: UserAccount; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { username: string; email: string; password?: string }) =>
      request<{ user: UserAccount; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST' }).catch(() => ({
        success: true,
      })),
    getUsers: () => request<{ users: UserAccount[] }>('/auth/users'),
    toggleRole: (userId: string) =>
      request<{ user: UserAccount }>(`/auth/users/${userId}/role`, { method: 'POST' }),
    toggleStatus: (userId: string) =>
      request<{ user: UserAccount }>(`/auth/users/${userId}/status`, { method: 'POST' }),
    updateQuota: (userId: string, quota: number) =>
      request<{ user: UserAccount }>(`/auth/users/${userId}/quota`, {
        method: 'POST',
        body: JSON.stringify({ quota }),
      }),
  },

  // Clients API
  clients: {
    getAll: () => request<{ clients: MinecraftClient[] }>('/clients'),
    getOne: (id: string) => request<{ client: MinecraftClient }>(`/clients/${id}`),
    create: (data: Partial<MinecraftClient>) =>
      request<{ client: MinecraftClient }>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' }),
    start: (id: string) =>
      request<{ client: MinecraftClient }>(`/clients/${id}/start`, { method: 'POST' }),
    stop: (id: string) =>
      request<{ client: MinecraftClient }>(`/clients/${id}/stop`, { method: 'POST' }),
    restart: (id: string) =>
      request<{ client: MinecraftClient }>(`/clients/${id}/restart`, { method: 'POST' }),
    sendChat: (id: string, message: string) =>
      request<{ success: boolean }>(`/clients/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    getLogs: (id: string) =>
      request<{ logs: ClientLogEntry[] }>(`/clients/${id}/logs`),
    clearLogs: (id: string) =>
      request<{ success: boolean }>(`/clients/${id}/logs/clear`, { method: 'POST' }),
    getInventory: (id: string) =>
      request<{ inventory: InventoryItem[] }>(`/clients/${id}/inventory`),
    assignOwner: (id: string, userId: string) =>
      request<{ client: MinecraftClient }>(`/clients/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
  },

  // Addons API
  addons: {
    getAll: () => request<{ addons: Addon[] }>('/addons'),
    install: (addonId: string, clientIds: string[]) =>
      request<{ success: boolean }>(`/addons/${addonId}/install`, {
        method: 'POST',
        body: JSON.stringify({ clientIds }),
      }),
    uninstall: (addonId: string, clientId: string) =>
      request<{ success: boolean }>(`/addons/${addonId}/uninstall`, {
        method: 'POST',
        body: JSON.stringify({ clientId }),
      }),
    toggle: (addonId: string, clientId: string, enabled: boolean) =>
      request<{ success: boolean }>(`/addons/${addonId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ clientId, enabled }),
      }),
    saveConfig: (addonId: string, config: Record<string, any>, clientId?: string) =>
      request<{ success: boolean }>(`/addons/${addonId}/config`, {
        method: 'POST',
        body: JSON.stringify({ config, clientId }),
      }),
  },

  // Nodes API
  nodes: {
    getAll: () => request<{ nodes: ServerNode[] }>('/nodes'),
    add: (nodeData: Partial<ServerNode>) =>
      request<{ node: ServerNode }>('/nodes', {
        method: 'POST',
        body: JSON.stringify(nodeData),
      }),
    restart: (id: string) =>
      request<{ success: boolean }>(`/nodes/${id}/restart`, { method: 'POST' }),
    toggleMaintenance: (id: string) =>
      request<{ node: ServerNode }>(`/nodes/${id}/maintenance`, { method: 'POST' }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/nodes/${id}`, { method: 'DELETE' }),
  },

  // Settings API
  settings: {
    get: () => request<{ settings: AppSettings }>('/settings'),
    save: (settings: AppSettings) =>
      request<{ settings: AppSettings }>('/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      }),
  },

  // Admin & Fleet Control API
  admin: {
    sendFleetCommand: (command: string) =>
      request<{ success: boolean; botsReached: number; command: string }>('/admin/fleet/command', {
        method: 'POST',
        body: JSON.stringify({ command }),
      }),
    emergencyStopAll: () =>
      request<{ success: boolean; botsStopped: number }>('/admin/fleet/stop-all', {
        method: 'POST',
      }),
    startAllBots: () =>
      request<{ success: boolean; botsStarting: number }>('/admin/fleet/start-all', {
        method: 'POST',
      }),
    restartAllBots: () =>
      request<{ success: boolean; botsRestarting: number }>('/admin/fleet/restart-all', {
        method: 'POST',
      }),
    getSystemStats: () =>
      request<{
        database: {
          path: string;
          sizeKb: number;
          sizeFormatted: string;
          totalClients: number;
          onlineClients: number;
          totalUsers: number;
          totalLogs: number;
          totalChats: number;
        };
        system: {
          platform: string;
          release: string;
          arch: string;
          cpuCores: number;
          totalMemMb: number;
          freeMemMb: number;
          uptimeSeconds: number;
        };
        process: {
          nodeVersion: string;
          pid: number;
          uptimeSeconds: number;
          heapUsedMb: number;
          heapTotalMb: number;
          rssMb: number;
        };
        socketClients: number;
      }>('/admin/system/stats'),
    vacuumDatabase: () =>
      request<{ success: boolean; message: string }>('/admin/system/vacuum', {
        method: 'POST',
      }),
    clearSystemLogs: (all?: boolean) =>
      request<{ success: boolean }>('/admin/system/clear-logs', {
        method: 'POST',
        body: JSON.stringify({ all }),
      }),
    getAuditLogs: () =>
      request<{
        auditLogs: Array<{
          id: string;
          timestamp: string;
          action: string;
          user: string;
          details: string;
          ip?: string;
        }>;
      }>('/admin/audit-logs'),
    broadcastAnnouncement: (message: string, level?: string) =>
      request<{ success: boolean }>('/admin/announcement', {
        method: 'POST',
        body: JSON.stringify({ message, level }),
      }),
  },
};
