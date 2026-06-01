/** Short privacy labels: 1 word (msg), 2 words (call), 3 words (video call) */
export const NOTIFICATION_TEXT = {
  message: 'Message',
  voice_call: 'Voice Call',
  video_call: 'Incoming Video Call',
};

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

async function sendToUser(userId, text) {
  const cfg = getConfigForUser(userId);
  if (!cfg) return;

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
      console.error(`Telegram failed for ${userId}:`, err);
    }
  } catch (error) {
    console.error(`Telegram error for ${userId}:`, error.message);
  }
}

/**
 * Send the same short notification to BOTH bots at the same time.
 * @param {'message'|'voice_call'|'video_call'} type
 */
export async function sendTelegramToAll(type = 'message') {
  const text = NOTIFICATION_TEXT[type] || NOTIFICATION_TEXT.message;
  await Promise.all([sendToUser('user1', text), sendToUser('user2', text)]);
}

export function getTelegramConfigStatus() {
  return {
    user1: !!getConfigForUser('user1'),
    user2: !!getConfigForUser('user2'),
  };
}
