import EmojiPicker from 'emoji-picker-react';

export default function EmojiPickerWrapper({ onSelect, onClose }) {
  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 p-1 text-wa-muted hover:text-wa-text"
        aria-label="Close emoji picker"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <EmojiPicker
        onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
        theme="dark"
        width="100%"
        height={320}
        searchPlaceholder="Search emoji"
        previewConfig={{ showPreview: false }}
      />
    </div>
  );
}
