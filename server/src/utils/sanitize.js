import sanitizeHtml from 'sanitize-html';

export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function sanitizeFilename(name) {
  if (typeof name !== 'string') return 'file';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

export function isValidUserId(userId) {
  return typeof userId === 'string' && /^user[12]$/.test(userId);
}

export function generateUserId(existingIds) {
  if (!existingIds.includes('user1')) return 'user1';
  if (!existingIds.includes('user2')) return 'user2';
  return existingIds[0] === 'user1' ? 'user2' : 'user1';
}
