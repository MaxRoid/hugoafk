import { HugoAddon, AddonContext } from '../types.js';

export const AutoEatAddon: HugoAddon = {
  id: 'auto-eat',
  name: 'AutoEat',
  version: '1.0.0',
  author: 'HugoAFK Core Team',
  description: 'Monitors bot hunger and automatically consumes food from inventory.',
  category: 'Automation',
  tags: ['Hunger', 'Food', 'Survival', 'Health'],
  isBuiltIn: true,
  configSchema: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
      defaultValue: true,
      description: 'Automatically eat when food level drops.',
    },
    {
      key: 'foodThreshold',
      label: 'Food Threshold',
      type: 'number',
      defaultValue: 14,
      unit: 'points',
      description: 'Eat when food level drops to or below this value (max 20).',
    },
  ],

  init(context: AddonContext) {
    const { bot, logger, config } = context;
    if (!bot) return;

    let isEating = false;

    const foods = [
      'cooked_beef',
      'steak',
      'cooked_porkchop',
      'golden_carrot',
      'cooked_mutton',
      'cooked_chicken',
      'bread',
      'baked_potato',
      'apple',
      'carrot',
    ];

    const checkHunger = async () => {
      if (!config.enabled || isEating) return;
      const threshold = Number(config.foodThreshold) || 14;

      if (bot.food !== undefined && bot.food <= threshold) {
        const item = bot.inventory
          .items()
          .find((i: any) => foods.includes(i.name) || i.name.includes('cooked') || i.name.includes('bread'));

        if (!item) {
          logger.warn(`Food level low (${bot.food}/20), but no edible food found in inventory.`);
          return;
        }

        isEating = true;
        logger.info(`Eating ${item.displayName || item.name} (Food: ${bot.food}/20)...`);

        try {
          await bot.equip(item, 'hand');
          await bot.consume();
          logger.info(`Finished eating ${item.displayName || item.name}. Food now at: ${bot.food}/20.`);
        } catch (err: any) {
          logger.warn(`Failed to consume food: ${err?.message}`);
        } finally {
          isEating = false;
        }
      }
    };

    bot.on('health', checkHunger);
    (context as any)._checkHunger = checkHunger;

    logger.info('AutoEat addon initialized.');
  },

  stop(context: AddonContext) {
    const checkHunger = (context as any)._checkHunger;
    if (context.bot && checkHunger) {
      context.bot.removeListener('health', checkHunger);
    }
    context.logger.info('AutoEat addon stopped.');
  },
};
