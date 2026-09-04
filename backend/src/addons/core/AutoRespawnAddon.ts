import { HugoAddon, AddonContext } from '../types.js';

export const AutoRespawnAddon: HugoAddon = {
  id: 'auto-respawn',
  name: 'AutoRespawn',
  version: '1.0.0',
  author: 'HugoAFK Core Team',
  description: 'Instantly respawns bot when player dies, updating state and logs.',
  category: 'Utility',
  tags: ['Respawn', 'Safety', 'Combat'],
  isBuiltIn: true,
  configSchema: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      defaultValue: true,
      description: 'Automatically trigger respawn upon death.',
    },
    {
      key: 'respawnDelay',
      label: 'Respawn Delay',
      type: 'number',
      defaultValue: 1500,
      unit: 'ms',
      description: 'Milliseconds to wait after death before sending respawn packet.',
    },
  ],

  init(context: AddonContext) {
    const { bot, logger, config } = context;
    if (!bot) return;

    const onDeath = () => {
      if (!config.enabled) return;
      logger.warn('Bot died! Triggering auto-respawn...');

      const delay = Math.max(500, Number(config.respawnDelay) || 1500);
      setTimeout(() => {
        try {
          if (bot && typeof bot.respawn === 'function') {
            bot.respawn();
            logger.info('Bot respawn packet dispatched.');
          }
        } catch (err: any) {
          logger.error(`Failed to respawn: ${err?.message}`);
        }
      }, delay);
    };

    bot.on('death', onDeath);
    (context as any)._onDeath = onDeath;

    logger.info('AutoRespawn addon initialized.');
  },

  stop(context: AddonContext) {
    const onDeath = (context as any)._onDeath;
    if (context.bot && onDeath) {
      context.bot.removeListener('death', onDeath);
    }
    context.logger.info('AutoRespawn addon stopped.');
  },
};
