const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

export default function ReactionPicker({ onSelect, onClose }) {
  return (
    <div
      className="flex items-center gap-0.5 bg-wa-panel border border-wa-border rounded-full px-2 py-1.5 shadow-xl animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="w-9 h-9 flex items-center justify-center text-xl rounded-full active:scale-110 hover:bg-wa-input transition-transform"
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 ml-1 flex items-center justify-center text-wa-muted rounded-full hover:bg-wa-input text-sm"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
