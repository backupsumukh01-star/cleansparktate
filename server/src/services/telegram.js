import { getRandomNotificationMessage } from '../../../shared/notificationMessages.js';

const USER_CONFIG = {
  user1: {
    token: () => process.env.TELEGRAM_BOT_TOKEN_USER1 || process.env.TELEGRAM_BOT_TOKEN,
    chatId: () => process.env.TELEGRAM_CHAT_ID_USER1 || process.env.TELEGRAM_CHAT_ID,
  },
  user2: {
    token: () => process.env.TELEGRAM_BOT_TOKEN_USER2 || process.env.TELEGRAM_BOT_TOKEN,
    chatId: () => process.env.TELEGRAM_CHAT_ID_USER2 || process.env.TELEGRAM_CHAT_ID,
  },
};

function getConfigForUser(userId) {
  const config = USER_CONFIG[userId];
  if (!config) return null;

  const token = config.token()?.trim();
  const chatId = config.chatId()?.trim();

  if (!token || !chatId) return null;
  return { token, chatId };
}

/**
 * Notify the recipient when they are offline.
 * @param {string} recipientUserId - 'user1' or 'user2' (who receives the alert)
 */
export async function sendTelegramNotification(recipientUserId) {
  const cfg = getConfigForUser(recipientUserId);
  if (!cfg) {
    return;
  }

  const text = getRandomNotificationMessage();

  try {
    const response = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Telegram notification failed for ${recipientUserId}:`, err);
    }
  } catch (error) {
    console.error(`Telegram notification error for ${recipientUserId}:`, error.message);
  }
}

export function getTelegramConfigStatus() {
  return {
    user1: !!getConfigForUser('user1'),
    user2: !!getConfigForUser('user2'),
  };
}
