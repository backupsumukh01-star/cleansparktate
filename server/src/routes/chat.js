import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { messageStore, mediaStore } from '../services/storage.js';
import { sanitizeFilename } from '../utils/sanitize.js';
import { validateFileType, validateFileSize, getMediaCategory } from '../utils/validation.js';
import { MESSAGE_TYPES } from '../../../shared/constants.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/messages', requireAuth, (req, res) => {
  res.json({ messages: messageStore.getAll() });
});

router.post('/upload', requireAuth, uploadLimiter, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const category = req.body.category || getMediaCategory(req.file.mimetype);
    if (!category || !validateFileType(req.file.mimetype, category)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!validateFileSize(req.file.size)) {
      return res.status(400).json({ error: 'File too large' });
    }

    const mediaId = uuidv4();
    mediaStore.store(
      mediaId,
      req.file.buffer,
      req.file.mimetype,
      sanitizeFilename(req.file.originalname)
    );

    const typeMap = { image: MESSAGE_TYPES.IMAGE, video: MESSAGE_TYPES.VIDEO, voice: MESSAGE_TYPES.VOICE };

    res.json({
      mediaId,
      mimeType: req.file.mimetype,
      filename: sanitizeFilename(req.file.originalname),
      size: req.file.size,
      type: typeMap[category],
    });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/media/:id', requireAuth, (req, res) => {
  const file = mediaStore.get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Media not found or expired' });
  }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(file.buffer);
});

router.get('/media/:id/download', requireAuth, (req, res) => {
  const file = mediaStore.get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Media not found or expired' });
  }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.buffer);
});

export default router;
