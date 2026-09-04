export type ClientStatus = 'online' | 'starting' | 'stopped' | 'offline' | 'error' | 'reconnecting';

export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'CHAT' | 'DEBUG';

export type ViewType =
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'addons'
  | 'logs'
  | 'admin-nodes'
  | 'settings';

export type ClientDetailTab =
  | 'overview'
  | 'addons'
  | 'chat'
  | 'inventory'
  | 'live-view'
  | 'logs';

export interface ClientPosition {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  dimension: string;
  facing?: string;
}

export interface ClientLogEntry {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CHAT' | 'DEBUG';
  message: string;
}

export interface ClientChatMessage {
  id: string;
  clientId: string;
  timestamp: string;
  sender: string;
  message: string;
  isSystem?: boolean;
  isBot?: boolean;
}

export interface InventoryItem {
  slot: number;
  id: string;
  name: string;
  count: number;
  maxStackSize?: number;
  maxCount?: number;
  displayName?: string;
  durability?: number;
  maxDurability?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic';
  lore?: string[];
}

export interface InstalledAddon {
  addonId: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface MinecraftClient {
  id: string;
  name: string;
  server: string;
  port: number;
  version: string;
  authMethod: 'Microsoft' | 'Offline';
  status: ClientStatus;
  ping: number;
  runtimeSeconds: number;
  health: number;
  maxHealth: number;
  food: number;
  maxFood: number;
  position: ClientPosition;
  activeAddons: InstalledAddon[];
  chatHistory: ClientChatMessage[];
  inventory: InventoryItem[];
  logs: ClientLogEntry[];
  createdAt: string;
  afkEnabled?: boolean;
  autoStart?: boolean;
  autoReconnect?: boolean;
  ownerId?: string;
  ownerUsername?: string;
  deviceCode?: {
    url: string;
    code: string;
    directUrl?: string;
  } | null;
}

export type AddonCategory = 'All' | 'Automation' | 'Movement' | 'Utility' | 'Management';

export interface AddonConfigField {
  key: string;
  label: string;
  type: 'boolean' | 'number' | 'text' | 'select' | 'slider';
  defaultValue: any;
  unit?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

export interface Addon {
  id: string;
  name: string;
  version: string;
  author?: string;
  description: string;
  category: 'Automation' | 'Movement' | 'Utility' | 'Management';
  tags?: string[];
  icon?: string;
  configSchema: AddonConfigField[];
  isBuiltIn?: boolean;
}

export interface ServerNode {
  id: string;
  name: string;
  ip: string;
  host?: string;
  port?: number;
  region: string;
  flag?: string;
  status: 'online' | 'offline' | 'maintenance';
  cpuUsage: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  maxBots: number;
  botCount: number;
  ping: number;
  pingMs?: number;
  uptimeSeconds: number;
  uptime?: string;
  os: string;
  version: string;
  daemonVersion?: string;
  assignedClientIds: string[];
  networkThroughput?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  botQuota: number;
  maxBots: number;
  allocatedBots: number;
  createdDate: string;
  lastActive: string;
  authProvider?: 'local' | 'discord' | 'google';
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  language: 'de' | 'en';
  refreshInterval: number;
  autoScrollLogs: boolean;
  desktopAlerts: boolean;
  desktopNotifications?: boolean;
  discordWebhookUrl?: string;
  webhookUrl?: string;
  compactMode: boolean;
  showCoordinates: boolean;
  showCoordinatesInHeader?: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export interface ConfigModalState {
  addon: Addon;
  clientId?: string;
  currentConfig: Record<string, any>;
}
