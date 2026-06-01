import { formatTime } from '../utils/format';
import { getMediaUrl } from '../utils/api';
import { MESSAGE_TYPES } from '../../../shared/constants.js';
import VoicePlayer from './VoicePlayer';

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

export default function MessageBubble({
  message,
  isOwn,
  replyMessage,
  onReply,
  onDelete,
  onCopy,
  showMenu,
  onToggleMenu,
}) {
  const handleLongPress = (e) => {
    e.preventDefault();
    onToggleMenu(message.id);
  };

  const renderContent = () => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <img
            src={getMediaUrl(message.mediaId)}
            alt="Shared image"
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
            loading="lazy"
            onClick={() => window.open(getMediaUrl(message.mediaId), '_blank')}
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
          />
        );
      case MESSAGE_TYPES.VOICE:
        return <VoicePlayer mediaId={message.mediaId} duration={message.mediaMeta?.duration} />;
      default:
        return <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>;
    }
  };

  return (
    <div
      className={`flex flex-col mb-1 animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}
      onContextMenu={handleLongPress}
    >
      <div
        className={`message-bubble ${isOwn ? 'message-bubble-out' : 'message-bubble-in'} relative`}
        onClick={() => onToggleMenu(message.id)}
      >
        <ReplyQuote replyMessage={replyMessage} isOwn={isOwn} />
        {renderContent()}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] opacity-60">{formatTime(message.createdAt)}</span>
          {isOwn && <SeenIcon seen={message.seen} />}
        </div>
      </div>

      {showMenu === message.id && (
        <div className="flex gap-1 mt-1 bg-wa-panel rounded-lg p-1 shadow-lg border border-wa-border animate-fade-in z-10">
          <button onClick={() => onReply(message)} className="px-3 py-1.5 text-xs text-wa-text rounded hover:bg-wa-input">
            Reply
          </button>
          {message.type === MESSAGE_TYPES.TEXT && (
            <button onClick={() => onCopy(message.text)} className="px-3 py-1.5 text-xs text-wa-text rounded hover:bg-wa-input">
              Copy
            </button>
          )}
          {isOwn && (
            <button onClick={() => onDelete(message.id)} className="px-3 py-1.5 text-xs text-red-400 rounded hover:bg-wa-input">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
