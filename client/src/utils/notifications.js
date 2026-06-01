const NOTIFICATION_TITLE = 'Private Chat';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export const BROWSER_NOTIFICATION_TEXT = {
  message: 'Message',
  voice_call: 'Voice Call',
  video_call: 'Incoming Video Call',
};

export function showBrowserNotification(body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(NOTIFICATION_TITLE, {
      body: body || BROWSER_NOTIFICATION_TEXT.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'private-chat-message',
      renotify: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore
  }
}
