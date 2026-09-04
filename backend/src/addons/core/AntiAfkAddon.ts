import { HugoAddon, AddonContext } from '../types.js';

export const AntiAfkAddon: HugoAddon = {
  id: 'anti-afk',
  name: 'AntiAFK',
  version: '1.1.0',
  author: 'HugoAFK Core Team',
  description: 'Prevents AFK kicks by simulating subtle player movement, rotation, and jumping.',
  category: 'Movement',
  tags: ['AFK', 'Movement', 'Keepalive', 'Bypass'],
  isBuiltIn: true,
  configSchema: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      defaultValue: true,
      description: 'Activate or deactivate AntiAFK routines.',
    },
    {
      key: 'movementInterval',
      label: 'Movement Interval',
      type: 'number',
      defaultValue: 20,
      unit: 'seconds',
      description: 'How often the bot performs an action.',
    },
    {
      key: 'movementDuration',
      label: 'Movement Duration',
      type: 'number',
      defaultValue: 500,
      unit: 'ms',
      description: 'Duration of each movement cycle.',
    },
    {
      key: 'randomMovement',
      label: 'Random Movement',
      type: 'boolean',
      defaultValue: true,
      description: 'Vary movements (jump, turn, step forward/backward).',
    },
  ],

  init(context: AddonContext) {
    const { bot, logger, config } = context;
    if (!bot) return;

    const performRoutine = () => {
      if (!config.enabled) return;

      const actions = ['jump', 'turn', 'step', 'swing'];
      const action = config.randomMovement
        ? actions[Math.floor(Math.random() * actions.length)]
        : 'turn';

      try {
        if (action === 'jump') {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 250);
        } else if (action === 'turn') {
          const randomYaw = (Math.random() - 0.5) * Math.PI;
          const randomPitch = (Math.random() - 0.5) * (Math.PI / 4);
          bot.look(bot.entity.yaw + randomYaw, randomPitch, true).catch(() => {});
        } else if (action === 'step') {
          const direction = Math.random() > 0.5 ? 'forward' : 'back';
          bot.setControlState(direction, true);
          setTimeout(() => bot.setControlState(direction, false), config.movementDuration || 300);
        } else if (action === 'swing') {
          bot.swingArm('right');
        }
        logger.debug(`AntiAFK performed action: ${action}`);
      } catch (err: any) {
        logger.warn(`AntiAFK error: ${err?.message}`);
      }
    };

    const intervalSec = Math.max(5, Number(config.movementInterval) || 20);
    const interval = setInterval(performRoutine, intervalSec * 1000);
    (context as any)._interval = interval;

    logger.info(`AntiAFK active (Interval: ${intervalSec}s).`);
  },

  stop(context: AddonContext) {
    if ((context as any)._interval) {
      clearInterval((context as any)._interval);
    }
    if (context.bot) {
      context.bot.clearControlStates();
    }
    context.logger.info('AntiAFK stopped.');
  },
};
