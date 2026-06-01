import { Server } from 'socket.io';
import { messageStore, presenceStore, callStore } from './services/storage.js';
import { sendTelegramToAll } from './services/telegram.js';
import { sanitizeText, isValidUserId } from './utils/sanitize.js';
import { SOCKET_EVENTS, MESSAGE_TYPES } from '../../shared/constants.js';
import { v4 as uuidv4 } from 'uuid';

export function setupSocketIO(httpServer, sessionMiddleware) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    },
    maxHttpBufferSize: 50 * 1024 * 1024,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Session must run on the Engine.IO HTTP request (with real req/res), not on socket with empty res
  io.engine.use((req, res, next) => {
    sessionMiddleware(req, res, next);
  });

  io.use((socket, next) => {
    const sessionData = socket.request.session;
    if (!sessionData?.authenticated || !sessionData?.userId) {
      return next(new Error('Unauthorized'));
    }
    if (!isValidUserId(sessionData.userId)) {
      return next(new Error('Invalid user'));
    }
    socket.userId = sessionData.userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    presenceStore.setOnline(socket.id, userId);
    broadcastPresence(io);

    socket.emit(SOCKET_EVENTS.PRESENCE_SYNC, {
      presence: presenceStore.getPresence(),
      messages: messageStore.getAll(),
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
      try {
        const text = sanitizeText(payload?.text || '');
        const type = payload?.type || MESSAGE_TYPES.TEXT;
        const replyTo = payload?.replyTo || null;
        const mediaId = payload?.mediaId || null;
        const mediaMeta = payload?.mediaMeta || null;

        if (type === MESSAGE_TYPES.TEXT && !text) {
          return callback?.({ error: 'Empty message' });
        }

        if ([MESSAGE_TYPES.IMAGE, MESSAGE_TYPES.VIDEO, MESSAGE_TYPES.VOICE].includes(type) && !mediaId) {
          return callback?.({ error: 'Media required' });
        }

        const message = {
          id: uuidv4(),
          senderId: userId,
          type,
          text: type === MESSAGE_TYPES.TEXT ? text : '',
          mediaId,
          mediaMeta,
          replyTo,
          seen: false,
          seenAt: null,
          createdAt: Date.now(),
          deleted: false,
        };

        messageStore.add(message);
        io.emit(SOCKET_EVENTS.MESSAGE_NEW, message);

        sendTelegramToAll('message');

        callback?.({ success: true, message });
      } catch {
        callback?.({ error: 'Failed to send message' });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (payload, callback) => {
      const messageId = payload?.messageId;
      const msg = messageStore.getById(messageId);
      if (!msg) {
        return callback?.({ error: 'Message not found' });
      }
      if (msg.senderId !== userId) {
        return callback?.({ error: 'Not allowed' });
      }

      messageStore.delete(messageId);
      io.emit(SOCKET_EVENTS.MESSAGE_DELETED, { messageId });
      callback?.({ success: true });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, (payload) => {
      const messageId = payload?.messageId;
      if (messageId) {
        messageStore.markSeen(messageId);
      } else {
        messageStore.markAllSeen();
      }
      io.emit(SOCKET_EVENTS.MESSAGES_SEEN, {
        seenBy: userId,
        messageId,
        messages: messageStore.getAll().filter((m) => m.seen),
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_START, () => {
      presenceStore.setTyping(userId, true);
      socket.broadcast.emit(SOCKET_EVENTS.USER_TYPING, { userId, typing: true });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, () => {
      presenceStore.setTyping(userId, false);
      socket.broadcast.emit(SOCKET_EVENTS.USER_TYPING, { userId, typing: false });
    });

    socket.on(SOCKET_EVENTS.CALL_OFFER, (payload) => {
      const callType = payload?.type === 'video' ? 'video' : 'voice';
      if (!callStore.start(userId, callType)) {
        socket.emit(SOCKET_EVENTS.CALL_BUSY, {});
        return;
      }
      sendTelegramToAll(callType === 'video' ? 'video_call' : 'voice_call');
      socket.broadcast.emit(SOCKET_EVENTS.CALL_INCOMING, {
        callerId: userId,
        type: callType,
        offer: payload?.offer,
      });
    });

    socket.on(SOCKET_EVENTS.CALL_ANSWER, (payload) => {
      socket.broadcast.emit(SOCKET_EVENTS.CALL_ACCEPTED, {
        answererId: userId,
        answer: payload?.answer,
      });
    });

    socket.on(SOCKET_EVENTS.CALL_ICE, (payload) => {
      socket.broadcast.emit(SOCKET_EVENTS.CALL_ICE, {
        from: userId,
        candidate: payload?.candidate,
      });
    });

    socket.on(SOCKET_EVENTS.CALL_REJECT, () => {
      callStore.end();
      socket.broadcast.emit(SOCKET_EVENTS.CALL_REJECT, { rejectedBy: userId });
    });

    socket.on(SOCKET_EVENTS.CALL_END, () => {
      callStore.end();
      socket.broadcast.emit(SOCKET_EVENTS.CALL_END, { endedBy: userId });
    });

    socket.on('disconnect', () => {
      if (callStore.involvesUser(userId)) {
        callStore.end();
        socket.broadcast.emit(SOCKET_EVENTS.CALL_END, { endedBy: userId });
      }
      presenceStore.setOffline(userId);
      broadcastPresence(io);
    });

    socket.on('activity', () => {
      presenceStore.touch(userId);
    });
  });

  return io;
}

function broadcastPresence(io) {
  io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, presenceStore.getPresence());
}
