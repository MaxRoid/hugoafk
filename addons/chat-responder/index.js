/**
 * Smart Chat Responder - Plug-and-Play Addon for HugoAFK
 * Listens to Minecraft chat messages and automatically replies with formatted tags.
 */

let lastReplyTimestamp = 0;
let chatListener = null;

export async function init(context) {
  const { bot, clientName, logger, config, sendChat } = context;
  logger.info('Smart Chat Responder aktiv.');

  chatListener = (username, message) => {
    // Ignore self messages
    if (!username || username.toLowerCase() === clientName.toLowerCase()) return;

    const trigger = (config.triggerWord || '!hugo').trim().toLowerCase();
    if (!trigger) return;

    if (message.toLowerCase().includes(trigger)) {
      const now = Date.now();
      const cooldown = (Number(config.cooldownSeconds) || 5) * 1000;

      if (now - lastReplyTimestamp < cooldown) {
        return; // In cooldown
      }
      lastReplyTimestamp = now;

      // Replace variables
      const rawTemplate = config.replyMessage || 'Hallo {player}! Ich bin {bot}.';
      const reply = rawTemplate
        .replace(/{player}/g, username)
        .replace(/{bot}/g, clientName)
        .replace(/{ping}/g, String(bot.player?.ping || 25))
        .replace(/{health}/g, String(Math.round(bot.health || 20)))
        .replace(/{time}/g, new Date().toLocaleTimeString());

      logger.info(`Trigger "${trigger}" von ${username} erkannt. Sende Antwort: "${reply}"`);
      sendChat(reply);
    }
  };

  bot.on('chat', chatListener);
}

export async function stop(context) {
  const { bot, logger } = context;
  if (chatListener && bot) {
    bot.removeListener('chat', chatListener);
    chatListener = null;
  }
  logger.info('Smart Chat Responder deaktiviert.');
}

export default { init, stop };
