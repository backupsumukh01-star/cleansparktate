import { useRef } from 'react';
import { formatTime } from '../utils/format';
import { getMediaUrl } from '../utils/api';
import { MESSAGE_TYPES } from '../../../shared/constants.js';
import { useLongPress } from '../hooks/useLongPress';
import VoicePlayer from './VoicePlayer';
import LinkifiedText from './LinkifiedText';

function ReplyQuote({ replyMessage, isOwn }) {
  if (!replyMessage) return null;
  return (
    <div className={`border-l-2 pl-2 mb-1 text-xs opacity-80 ${isOwn ? 'border-white/50' : 'border-wa-accent'}`}>
      <p className="font-medium truncate">{replyMessage.senderId === 'user1' ? 'Partner 1' : 'Partner 2'}</p>
      <p className="truncate opacity-75">
        {replyMessage.type === MESSAGE_TYPES.TEXT
          ? replyMessage.text
          : `[${replyMessage.type}]`}
      </p>
    </div>
  );
}

function SeenIcon({ seen }) {
  if (!seen) {
    return (
      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ReactionBadge({ reactions, isOwn }) {
  if (!reactions) return null;
  const entries = Object.entries(reactions).filter(([, e]) => e);
  if (entries.length === 0) return null;

  const emojis = [...new Set(entries.map(([, e]) => e))];

  return (
    <div
      className={`absolute -bottom-2 ${isOwn ? 'right-2' : 'left-2'} z-10`}
    >
      <span className="inline-flex items-center gap-0.5 bg-wa-panel border border-wa-border rounded-full px-1.5 py-0.5 text-base shadow-md min-h-[26px]">
        {emojis.map((e) => (
          <span key={e} className="leading-none">
            {e}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  userId,
  replyMessage,
  onOpenActions,
  onReact,
}) {
  const lastTapRef = useRef(0);

  const longPressHandlers = useLongPress(() => onOpenActions(message), { delay: 450 });

  const handleTap = (e) => {
    if (e.target.closest('a')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      onReact(message.id, '👍');
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  const renderContent = () => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <img
            src={getMediaUrl(message.mediaId)}
            alt="Shared"
            className="rounded-lg max-w-full max-h-64 object-cover"
            loading="lazy"
            onClick={(e) => {
              e.stopPropagation();
              window.open(getMediaUrl(message.mediaId), '_blank');
            }}
          />
        );
      case MESSAGE_TYPES.VIDEO:
        return (
          <video
            src={getMediaUrl(message.mediaId)}
            controls
            playsInline
            className="rounded-lg max-w-full max-h-64"
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case MESSAGE_TYPES.VOICE:
        return <VoicePlayer mediaId={message.mediaId} duration={message.mediaMeta?.duration} />;
      default:
        return <LinkifiedText text={message.text} isOwn={isOwn} />;
    }
  };

  return (
    <div
      className={`flex flex-col mb-2 animate-slide-up relative ${isOwn ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`relative max-w-[85%] select-none touch-manipulation ${isOwn ? 'ml-auto' : 'mr-auto'}`}
        {...longPressHandlers}
        onClick={handleTap}
      >
        <div className={`message-bubble ${isOwn ? 'message-bubble-out' : 'message-bubble-in'}`}>
          <ReplyQuote replyMessage={replyMessage} isOwn={isOwn} />
          {renderContent()}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[11px] opacity-60">{formatTime(message.createdAt)}</span>
            {isOwn && <SeenIcon seen={message.seen} />}
          </div>
        </div>
        <ReactionBadge reactions={message.reactions} isOwn={isOwn} />
      </div>
    </div>
  );
}
