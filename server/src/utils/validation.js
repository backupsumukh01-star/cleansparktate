import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  MAX_FILE_SIZE,
} from '../../../shared/constants.js';

export function validateFileType(mimeType, category) {
  const allowed = {
    image: ALLOWED_IMAGE_TYPES,
    video: ALLOWED_VIDEO_TYPES,
    voice: ALLOWED_AUDIO_TYPES,
  };
  return allowed[category]?.includes(mimeType) ?? false;
}

export function validateFileSize(size) {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function getMediaCategory(mimeType) {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'voice';
  return null;
}
