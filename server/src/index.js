import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';

import authRoutes, { initPasswordHash } from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import { setupSocketIO } from './socket.js';
import { apiLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

async function start() {
  await initPasswordHash();

  const app = express();
  const server = http.createServer(app);

  // Secure cookies only when explicitly enabled (HTTPS). http://localhost breaks with secure: true
  const useSecureCookie = process.env.COOKIE_SECURE === 'true';

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-min-32-chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: useSecureCookie,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'blob:', 'data:'],
              mediaSrc: ["'self'", 'blob:'],
              connectSrc: ["'self'", 'wss:', 'ws:'],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || (isProduction ? false : 'http://localhost:5173'),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(sessionMiddleware);

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  setupSocketIO(server, sessionMiddleware);

  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (isProduction) {
    app.use(express.static(clientDist, { maxAge: '1d', index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
