import { HugoAddon, AddonContext } from '../types.js';

export const AutoSellAddon: HugoAddon = {
  id: 'autosell',
  name: 'AutoSell',
  version: '1.2.0',
  author: 'HugoAFK Core Team',
  description: 'Monitors bot inventory and automatically executes sell commands & GUI confirmations.',
  category: 'Automation',
  tags: ['Economy', 'Selling', 'Farming', 'Inventory'],
  isBuiltIn: true,
  configSchema: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      defaultValue: true,
      description: 'Activate or deactivate automatic selling routine.',
    },
    {
      key: 'itemThreshold',
      label: 'Item Count Threshold',
      type: 'number',
      defaultValue: 128,
      unit: 'items',
      description: 'Trigger sell routine once bot carries this many items.',
    },
    {
      key: 'sellCommand',
      label: 'Sell Command',
      type: 'text',
      defaultValue: '/sell all',
      description: 'Chat command to initiate selling on server.',
    },
    {
      key: 'cooldown',
      label: 'Cooldown',
      type: 'number',
      defaultValue: 30,
      unit: 'seconds',
      description: 'Minimum seconds to wait between selling runs.',
    },
    {
      key: 'clickDelay',
      label: 'GUI Click Delay',
      type: 'number',
      defaultValue: 250,
      unit: 'ms',
      description: 'Delay between GUI slot clicks to avoid anticheat flags.',
    },
  ],

  init(context: AddonContext) {
    const { bot, logger, config, sendChat } = context;
    if (!bot) return;

    let lastSellTime = 0;
    let isSelling = false;

    const checkAndSell = () => {
      if (!config.enabled || isSelling) return;
      const now = Date.now();
      const cooldownMs = (config.cooldown || 30) * 1000;
      if (now - lastSellTime < cooldownMs) return;

      const items = bot.inventory?.items() || [];
      const totalCount = items.reduce((sum: number, item: any) => sum + (item.count || 0), 0);

      const threshold = Number(config.itemThreshold) || 128;
      if (totalCount >= threshold) {
        isSelling = true;
        lastSellTime = now;
        logger.info(`Inventory threshold reached (${totalCount} >= ${threshold}). Executing ${config.sellCommand}...`);
        sendChat(config.sellCommand || '/sell all');

        setTimeout(() => {
          isSelling = false;
        }, 5000);
      }
    };

    const interval = setInterval(checkAndSell, 10000);
    (context as any)._interval = interval;

    const onWindowOpen = (window: any) => {
      if (!isSelling) return;
      logger.info(`Detected open window "${window.title || 'GUI'}". Confirming sell...`);
      setTimeout(() => {
        try {
          if (bot.currentWindow) {
            bot.closeWindow(bot.currentWindow);
          }
        } catch {
          // ignore
        }
      }, config.clickDelay || 300);
    };

    bot.on('windowOpen', onWindowOpen);
    (context as any)._onWindowOpen = onWindowOpen;

    logger.info('AutoSell routine initialized.');
  },

  stop(context: AddonContext) {
    if ((context as any)._interval) {
      clearInterval((context as any)._interval);
    }
    if (context.bot && (context as any)._onWindowOpen) {
      context.bot.removeListener('windowOpen', (context as any)._onWindowOpen);
    }
    context.logger.info('AutoSell routine stopped.');
  },
};
