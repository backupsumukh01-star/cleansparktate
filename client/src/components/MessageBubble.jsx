import { formatTime } from '../utils/format';
import { getMediaUrl } from '../utils/api';
import { MESSAGE_TYPES } from '../../../shared/constants.js';
import { useLongPress } from '../hooks/useLongPress';
import VoicePlayer from './VoicePlayer';
import ReactionPicker from './ReactionPicker';

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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M9 13l4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" transform="translate(-4,0)" />
    </svg>
  );
}

function ReactionDisplay({ reactions, isOwn }) {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  const entries = Object.entries(reactions).filter(([, e]) => e);
  if (entries.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-0.5 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <span className="inline-flex items-center gap-0.5 bg-wa-panel border border-wa-border rounded-full px-2 py-0.5 text-sm shadow-sm">
        {[...new Set(entries.map(([, e]) => e))].map((emoji) => (
          <span key={emoji}>{emoji}</span>
        ))}
        {entries.length > 1 && (
          <span className="text-[10px] text-wa-muted ml-0.5">{entries.length}</span>
        )}
      </span>
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  userId,
  replyMessage,
  onReply,
  onDelete,
  onCopy,
  onReact,
  showMenu,
  onToggleMenu,
}) {
  const longPressHandlers = useLongPress(() => onToggleMenu(message.id));

  const handleReact = (emoji) => {
    onReact(message.id, emoji);
    onToggleMenu(null);
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
        return <p className="text-[15px] leading-[1.35] whitespace-pre-wrap">{message.text}</p>;
    }
  };

  const myReaction = message.reactions?.[userId];

  return (
    <div
      className={`flex flex-col mb-1 animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}
      {...longPressHandlers}
    >
      {showMenu === message.id && (
        <div className={`mb-1 ${isOwn ? 'self-end' : 'self-start'}`}>
          <ReactionPicker
            onSelect={handleReact}
            onClose={() => onToggleMenu(null)}
          />
        </div>
      )}

      <div className={`message-bubble ${isOwn ? 'message-bubble-out' : 'message-bubble-in'} relative`}>
        <ReplyQuote replyMessage={replyMessage} isOwn={isOwn} />
        {renderContent()}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {myReaction && <span className="text-sm leading-none">{myReaction}</span>}
          <span className="text-[11px] opacity-60">{formatTime(message.createdAt)}</span>
          {isOwn && <SeenIcon seen={message.seen} />}
        </div>
      </div>

      <ReactionDisplay reactions={message.reactions} isOwn={isOwn} />

      {showMenu === message.id && (
        <div className="flex gap-1 mt-1 bg-wa-panel rounded-lg p-1 shadow-lg border border-wa-border animate-fade-in z-10 flex-wrap">
          <button type="button" onClick={() => onReply(message)} className="px-3 py-1.5 text-xs text-wa-text rounded-lg hover:bg-wa-input">
            Reply
          </button>
          {message.type === MESSAGE_TYPES.TEXT && (
            <button type="button" onClick={() => onCopy(message.text)} className="px-3 py-1.5 text-xs text-wa-text rounded-lg hover:bg-wa-input">
              Copy
            </button>
          )}
          {isOwn && (
            <button type="button" onClick={() => onDelete(message.id)} className="px-3 py-1.5 text-xs text-red-400 rounded-lg hover:bg-wa-input">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
