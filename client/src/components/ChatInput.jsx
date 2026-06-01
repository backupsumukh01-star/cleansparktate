import { useState, useRef, useEffect } from 'react';
import EmojiPickerWrapper from './EmojiPickerWrapper';

export default function ChatInput({
  onSend,
  onTypingStart,
  onTypingStop,
  onImageUpload,
  onVideoUpload,
  onVoiceSend,
  replyTo,
  onCancelReply,
  uploadProgress,
}) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleTextChange = (value) => {
    setText(value);
    onTypingStart?.();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingStop?.(), 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ text: trimmed, replyTo: replyTo?.id || null });
    setText('');
    setShowEmoji(false);
    onTypingStop?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = Math.round((Date.now() - recordStartRef.current) / 1000);
        await onVoiceSend(blob, duration);
        setRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  return (
    <div className="bg-wa-panel border-t border-wa-border safe-bottom shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-wa-input/50 border-b border-wa-border">
          <div className="flex-1 min-w-0 border-l-2 border-wa-accent pl-2">
            <p className="text-xs text-wa-accent font-medium">Replying</p>
            <p className="text-xs text-wa-muted truncate">{replyTo.text || `[${replyTo.type}]`}</p>
          </div>
          <button onClick={onCancelReply} className="text-wa-muted p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="px-3 py-2">
          <div className="h-1 bg-wa-input rounded-full overflow-hidden">
            <div className="h-full bg-wa-accent transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-wa-muted mt-1">Uploading… {uploadProgress}%</p>
        </div>
      )}

      {showEmoji && (
        <div className="border-b border-wa-border">
          <EmojiPickerWrapper
            onSelect={(emoji) => setText((t) => t + emoji)}
            onClose={() => setShowEmoji(false)}
          />
        </div>
      )}

      <div className="flex items-end gap-1 px-2 py-2">
        <button onClick={() => setShowEmoji(!showEmoji)} className="btn-icon shrink-0" aria-label="Emoji">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onImageUpload(e.target.files[0]); e.target.value = ''; }} />
        <button onClick={() => imageInputRef.current?.click()} className="btn-icon shrink-0" aria-label="Image">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onVideoUpload(e.target.files[0]); e.target.value = ''; }} />
        <button onClick={() => videoInputRef.current?.click()} className="btn-icon shrink-0" aria-label="Video">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          rows={1}
          className="input-field resize-none max-h-24 min-h-[42px]"
        />

        {text.trim() ? (
          <button onClick={handleSend} className="p-2.5 rounded-full bg-wa-accent text-white shrink-0 active:scale-95 transition-transform" aria-label="Send">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            className={`p-2.5 rounded-full shrink-0 active:scale-95 transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'btn-icon'}`}
            aria-label="Voice note"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
