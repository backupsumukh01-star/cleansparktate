import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { loginLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitizeText } from '../utils/sanitize.js';
import {
  assignUserId,
  releaseUserId,
  cancelRelease,
  getOnlineUserIdsFromPresence,
} from '../services/userSlots.js';
import { presenceStore } from '../services/storage.js';

const router = Router();
let passwordHash = null;

export async function initPasswordHash() {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    throw new Error('SITE_PASSWORD environment variable is required');
  }
  passwordHash = await bcrypt.hash(password, 12);
}

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const password = sanitizeText(req.body?.password);
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (req.session?.authenticated && req.session?.userId) {
      cancelRelease(req.sessionID);
      return res.json({ success: true, userId: req.session.userId });
    }

    const onlineUserIds = getOnlineUserIdsFromPresence(presenceStore.getPresence());
    const userId = assignUserId(req.sessionID, onlineUserIds);

    req.session.authenticated = true;
    req.session.userId = userId;
    req.session.loginAt = Date.now();

    return req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session error' });
      }
      return res.json({ success: true, userId });
    });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  releaseUserId(req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    userId: req.session.userId,
    loginAt: req.session.loginAt,
  });
});

router.get('/status', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

export default router;
