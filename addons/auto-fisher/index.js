/**
 * Auto Fisher Pro - Plug-and-Play Addon for HugoAFK
 * Automatically equips fishing rod, casts, detects bites, reels in and tracks statistics.
 */

let fishingInterval = null;
let isFishing = false;
let catchCount = 0;

export async function init(context) {
  const { bot, logger, config } = context;
  logger.info('Auto Fisher Pro initialisiert.');

  catchCount = 0;
  isFishing = false;

  // Equip fishing rod helper
  async function equipRod() {
    try {
      const rod = bot.inventory.items().find((item) => item.name.includes('fishing_rod'));
      if (rod) {
        await bot.equip(rod, 'hand');
        return true;
      }
    } catch (e) {
      // Hand equip might fail if busy
    }
    return false;
  }

  // Cast fishing rod
  async function castRod() {
    if (!bot || !bot.entity) return;
    try {
      const hasRod = await equipRod();
      if (!hasRod) {
        logger.warn('Keine Angelrute im Inventar gefunden! Bitte Angel bereitstellen.');
        return;
      }

      bot.activateItem();
      isFishing = true;
    } catch (err) {
      logger.error(`Fehler beim Auswerfen der Angel: ${err.message}`);
    }
  }

  // Hook into entity or sound events to detect fish bites
  const onHardSound = (soundName) => {
    if (soundName && soundName.includes('fish') && isFishing) {
      const delay = Number(config.autoReelDelayMs) || 250;
      setTimeout(async () => {
        try {
          if (!bot) return;
          bot.activateItem(); // Reel in
          isFishing = false;
          catchCount++;

          if (config.logCatches) {
            logger.info(`Biss erkannt! Fang eingeholt. Gesamt gefangen: ${catchCount}`);
          }

          // Recast after delay
          const recast = Number(config.recastDelayMs) || 1500;
          setTimeout(() => {
            castRod();
          }, recast);
        } catch (e) {
          logger.error(`Fehler beim Einholen: ${e.message}`);
        }
      }, delay);
    }
  };

  bot.on('hardcodedSound', onHardSound);

  // Initial cast after 2 seconds
  setTimeout(() => {
    castRod();
  }, 2000);

  // Periodic check to ensure bot is fishing if idle
  fishingInterval = setInterval(() => {
    if (!isFishing && bot && bot.entity) {
      castRod();
    }
  }, 15000);
}

export async function stop(context) {
  const { logger } = context;
  if (fishingInterval) {
    clearInterval(fishingInterval);
    fishingInterval = null;
  }
  isFishing = false;
  logger.info(`Auto Fisher Pro gestoppt. Gesamt-Fänge: ${catchCount}`);
}

export default { init, stop };
