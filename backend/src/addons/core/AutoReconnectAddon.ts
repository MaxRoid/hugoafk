import { HugoAddon, AddonContext } from '../types.js';

export const AutoReconnectAddon: HugoAddon = {
  id: 'auto-reconnect',
  name: 'AutoReconnect',
  version: '1.0.0',
  author: 'HugoAFK Core Team',
  description: 'Automatically attempts reconnection if bot gets disconnected or kicked from server.',
  category: 'Management',
  tags: ['Connection', 'Resilience', 'Recovery'],
  isBuiltIn: true,
  configSchema: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      defaultValue: true,
      description: 'Enable automatic reconnection on unexpected disconnection.',
    },
    {
      key: 'reconnectDelay',
      label: 'Reconnect Delay',
      type: 'number',
      defaultValue: 10,
      unit: 'seconds',
      description: 'Seconds to wait before initiating reconnection.',
    },
    {
      key: 'maximumRetries',
      label: 'Maximum Retries',
      type: 'number',
      defaultValue: 10,
      description: 'Maximum consecutive retry attempts before giving up.',
    },
  ],

  init(context: AddonContext) {
    const { events, logger, config, clientId } = context;

    let retryCount = 0;

    const onDisconnect = ({ reason }: { reason: string }) => {
      if (!config.enabled) return;
      const maxRetries = Number(config.maximumRetries) || 10;
      if (retryCount >= maxRetries) {
        logger.error(`Max reconnect retries reached (${maxRetries}). Giving up.`);
        return;
      }

      retryCount++;
      const delay = Math.max(2, Number(config.reconnectDelay) || 10);
      logger.warn(
        `Bot disconnected (${reason}). Scheduling reconnect attempt ${retryCount}/${maxRetries} in ${delay}s...`
      );

      setTimeout(() => {
        events.emit('requestRestart', { clientId, attempt: retryCount });
      }, delay * 1000);
    };

    events.on('botKicked', onDisconnect);
    events.on('botEnd', onDisconnect);
    (context as any)._onDisconnect = onDisconnect;

    logger.info('AutoReconnect addon initialized.');
  },

  stop(context: AddonContext) {
    const onDisconnect = (context as any)._onDisconnect;
    if (onDisconnect) {
      context.events.removeListener('botKicked', onDisconnect);
      context.events.removeListener('botEnd', onDisconnect);
    }
    context.logger.info('AutoReconnect addon stopped.');
  },
};
