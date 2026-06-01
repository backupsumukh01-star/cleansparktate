import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { uploadFile } from '../utils/api';
import {
  requestNotificationPermission,
  showBrowserNotification,
  BROWSER_NOTIFICATION_TEXT,
} from '../utils/notifications';
import { SOCKET_EVENTS, MESSAGE_TYPES } from '../../../shared/constants.js';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import CallOverlay from '../components/CallOverlay';
import IncomingCall from '../components/IncomingCall';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const userId = user.userId;
  const { connected, on, emit } = useSocket(true);

  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const webrtc = useWebRTC({ emit, on, userId });
  const seenSentRef = useRef(new Set());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const unsubs = [
      on(SOCKET_EVENTS.PRESENCE_SYNC, (data) => {
        setMessages(data.messages || []);
        setPresence(data.presence || {});
      }),
      on(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        if (message.senderId !== userId) {
          showBrowserNotification('Message');
          emit(SOCKET_EVENTS.MESSAGE_SEEN, { messageId: message.id });
        }
      }),
      on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }),
      on(SOCKET_EVENTS.MESSAGES_SEEN, ({ messages: seenMessages }) => {
        if (!seenMessages?.length) return;
        const seenIds = new Set(seenMessages.map((m) => m.id));
        setMessages((prev) =>
          prev.map((m) => (seenIds.has(m.id) ? { ...m, seen: true, seenAt: m.seenAt || Date.now() } : m))
        );
      }),
      on(SOCKET_EVENTS.PRESENCE_UPDATE, (data) => {
        setPresence(data);
      }),
      on(SOCKET_EVENTS.USER_TYPING, ({ userId: typingUserId, typing }) => {
        setPresence((prev) => ({
          ...prev,
          [typingUserId]: { ...prev[typingUserId], typing, lastActive: Date.now() },
        }));
      }),
      on(SOCKET_EVENTS.CALL_INCOMING, ({ callerId, type }) => {
        if (callerId === userId) return;
        const label =
          type === 'video'
            ? BROWSER_NOTIFICATION_TEXT.video_call
            : BROWSER_NOTIFICATION_TEXT.voice_call;
        showBrowserNotification(label);
      }),
    ];

    return () => unsubs.forEach((fn) => fn?.());
  }, [on, emit, userId]);

  useEffect(() => {
    if (!connected) return;
    const partnerMessages = messages.filter((m) => m.senderId !== userId && !m.seen);
    partnerMessages.forEach((m) => {
      if (!seenSentRef.current.has(m.id)) {
        seenSentRef.current.add(m.id);
        emit(SOCKET_EVENTS.MESSAGE_SEEN, { messageId: m.id });
      }
    });
  }, [messages, connected, userId, emit]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected) emit('activity');
    }, 30000);
    return () => clearInterval(interval);
  }, [connected, emit]);

  const sendMessage = useCallback(
    (payload) => {
      emit(SOCKET_EVENTS.MESSAGE_SEND, {
        type: MESSAGE_TYPES.TEXT,
        text: payload.text,
        replyTo: payload.replyTo,
      });
      setReplyTo(null);
    },
    [emit]
  );

  const sendMediaMessage = useCallback(
    async (file, category, type) => {
      setUploadProgress(0);
      try {
        const result = await uploadFile(file, category, setUploadProgress);
        emit(SOCKET_EVENTS.MESSAGE_SEND, {
          type,
          mediaId: result.mediaId,
          mediaMeta: { filename: result.filename, size: result.size, mimeType: result.mimeType },
          replyTo: replyTo?.id || null,
        });
        setReplyTo(null);
      } catch (err) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadProgress(null);
      }
    },
    [emit, replyTo]
  );

  const handleVoiceSend = useCallback(
    async (blob, duration) => {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      setUploadProgress(0);
      try {
        const result = await uploadFile(file, 'voice', setUploadProgress);
        emit(SOCKET_EVENTS.MESSAGE_SEND, {
          type: MESSAGE_TYPES.VOICE,
          mediaId: result.mediaId,
          mediaMeta: { filename: result.filename, size: result.size, mimeType: result.mimeType, duration },
          replyTo: replyTo?.id || null,
        });
        setReplyTo(null);
      } catch (err) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadProgress(null);
      }
    },
    [emit, replyTo]
  );

  const handleDelete = useCallback(
    (messageId) => {
      emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId });
      setShowMenu(null);
    },
    [emit]
  );

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // fallback
    }
    setShowMenu(null);
  }, []);

  const handleTypingStart = useCallback(() => emit(SOCKET_EVENTS.TYPING_START), [emit]);
  const handleTypingStop = useCallback(() => emit(SOCKET_EVENTS.TYPING_STOP), [emit]);

  return (
    <div className="h-full flex flex-col bg-wa-dark relative">
      <ChatHeader
        userId={userId}
        presence={presence}
        onVoiceCall={() => webrtc.startCall('voice')}
        onVideoCall={() => webrtc.startCall('video')}
        onLogout={logout}
      />

      {!connected && (
        <div className="bg-yellow-900/50 text-yellow-200 text-xs text-center py-1">
          Reconnecting…
        </div>
      )}

      <MessageList
        messages={messages}
        userId={userId}
        showMenu={showMenu}
        onToggleMenu={(id) => setShowMenu(showMenu === id ? null : id)}
        onReply={(msg) => { setReplyTo(msg); setShowMenu(null); }}
        onDelete={handleDelete}
        onCopy={handleCopy}
      />

      <ChatInput
        onSend={sendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        onImageUpload={(file) => sendMediaMessage(file, 'image', MESSAGE_TYPES.IMAGE)}
        onVideoUpload={(file) => sendMediaMessage(file, 'video', MESSAGE_TYPES.VIDEO)}
        onVoiceSend={handleVoiceSend}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        uploadProgress={uploadProgress}
      />

      {webrtc.callState === 'incoming' && (
        <IncomingCall
          callType={webrtc.callType}
          onAccept={webrtc.acceptCall}
          onReject={webrtc.rejectCall}
        />
      )}

      <CallOverlay
        callState={webrtc.callState}
        callType={webrtc.callType}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        callDuration={webrtc.callDuration}
        isMuted={webrtc.isMuted}
        isCameraOff={webrtc.isCameraOff}
        onEndCall={webrtc.endCall}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onSwitchCamera={webrtc.switchCamera}
      />

      {copyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-wa-panel text-wa-text text-sm px-4 py-2 rounded-full shadow-lg border border-wa-border animate-fade-in z-50">
          Copied to clipboard
        </div>
      )}

      {webrtc.callState === 'busy' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-900/80 text-white text-sm px-4 py-2 rounded-full z-50">
          Partner is on another call
        </div>
      )}
    </div>
  );
}
