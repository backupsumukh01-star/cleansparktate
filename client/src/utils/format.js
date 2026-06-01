export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatLastSeen(timestamp) {
  if (!timestamp) return 'Offline';

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Last seen just now';
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `Last seen ${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Last seen ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diff / 86400000);
  return `Last seen ${days} day${days === 1 ? '' : 's'} ago`;
}

export function formatCallDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getPartnerId(myId) {
  return myId === 'user1' ? 'user2' : 'user1';
}

export function getPartnerLabel(partnerId) {
  return partnerId === 'user1' ? 'Partner 1' : 'Partner 2';
}
