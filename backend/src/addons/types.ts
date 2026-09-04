import { EventEmitter } from 'node:events';

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

export interface AddonLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  debug: (msg: string) => void;
}

export interface AddonContext {
  bot: any; // Mineflayer Bot instance
  clientId: string;
  clientName: string;
  logger: AddonLogger;
  events: EventEmitter;
  config: Record<string, any>;
  sendChat: (message: string) => void;
  saveConfig: (config: Record<string, any>) => void;
}

export interface HugoAddon {
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

  init: (context: AddonContext) => Promise<void> | void;
  stop: (context: AddonContext) => Promise<void> | void;
}
