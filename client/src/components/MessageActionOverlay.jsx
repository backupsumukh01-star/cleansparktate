import { MESSAGE_TYPES } from '../../../shared/constants.js';
import LinkifiedText from './LinkifiedText';
import VoicePlayer from './VoicePlayer';
import { getMediaUrl } from '../utils/api';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

export default function MessageActionOverlay({
  message,
  isOwn,
  userId,
  onClose,
  onReact,
  onReply,
  onCopy,
  onDelete,
}) {
  const handleReact = (emoji) => {
    onReact(message.id, emoji);
    onClose();
  };

  const renderPreview = () => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <img src={getMediaUrl(message.mediaId)} alt="" className="rounded-lg max-h-48 max-w-[85vw] object-cover" />
        );
      case MESSAGE_TYPES.VIDEO:
        return <p className="text-wa-muted text-sm">[Video]</p>;
      case MESSAGE_TYPES.VOICE:
        return <VoicePlayer mediaId={message.mediaId} duration={message.mediaMeta?.duration} />;
      default:
        return <LinkifiedText text={message.text} isOwn={isOwn} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-center items-center safe-top safe-bottom animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md px-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex flex-col mb-3 w-full ${isOwn ? 'items-end' : 'items-start'}`}
        >
          <div className="bg-wa-panel/95 border border-wa-border rounded-full px-2 py-2 shadow-2xl flex gap-0.5 flex-wrap justify-center max-w-[95vw]">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="w-11 h-11 flex items-center justify-center text-2xl rounded-full hover:bg-wa-input active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`message-bubble scale-105 shadow-2xl ${
              isOwn ? 'message-bubble-out' : 'message-bubble-in'
            }`}
          >
            {renderPreview()}
          </div>
        </div>

        <div className="mt-6 w-full max-w-xs bg-wa-panel rounded-2xl overflow-hidden shadow-2xl border border-wa-border">
          <button
            type="button"
            onClick={() => {
              onReply(message);
              onClose();
            }}
            className="w-full px-5 py-3.5 text-left text-wa-text border-b border-wa-border active:bg-wa-input"
          >
            Reply
          </button>
          {message.type === MESSAGE_TYPES.TEXT && (
            <button
              type="button"
              onClick={() => {
                onCopy(message.text);
                onClose();
              }}
              className="w-full px-5 py-3.5 text-left text-wa-text border-b border-wa-border active:bg-wa-input"
            >
              Copy
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => {
                onDelete(message.id);
                onClose();
              }}
              className="w-full px-5 py-3.5 text-left text-red-400 active:bg-wa-input"
            >
              Delete for everyone
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
