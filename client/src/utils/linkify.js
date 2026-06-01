const URL_REGEX =
  /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]]|www\.[^\s<]+[^<.,:;"')\]\s]]|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|io|co|in|dev|app|me|info|biz|xyz|online|site|tech|store|shop|link|gov|edu|uk|us|ca|au|de|fr|jp|kr|tv|cc|ly|be|nl|br|mx|ru|cn|tw|hk|sg|ae|sa|pk|bd|id|vn|th|ph|my|za|ng|ke|eg|tr|pl|it|es|pt|se|no|dk|fi|ch|at|cz|ro|hu|gr|il|nz)(?:\/[^\s<]*)?)/gi;

function trimTrailingPunctuation(url) {
  let trimmed = url;
  let suffix = '';
  while (/[.,;:!?)\]}>]$/.test(trimmed)) {
    suffix = trimmed.slice(-1) + suffix;
    trimmed = trimmed.slice(0, -1);
  }
  return { url: trimmed, suffix };
}

export function toHref(url) {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return `https://${url}`;
}

/**
 * Split text into plain text and link segments for rendering.
 */
export function parseTextWithLinks(text) {
  if (!text || typeof text !== 'string') return [{ type: 'text', value: text || '' }];

  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, URL_REGEX.flags);

  for (const match of text.matchAll(regex)) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, start) });
    }

    const { url, suffix } = trimTrailingPunctuation(match[0]);
    if (url.length > 0) {
      parts.push({ type: 'link', value: url, href: toHref(url) });
      if (suffix) {
        parts.push({ type: 'text', value: suffix });
      }
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', value: text });
  }

  return parts;
}
