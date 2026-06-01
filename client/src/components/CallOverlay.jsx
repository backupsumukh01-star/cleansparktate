import { formatCallDuration } from '../utils/format';

export default function CallOverlay({
  callState,
  callType,
  localStream,
  remoteStream,
  callDuration,
  isMuted,
  isCameraOff,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
}) {
  const localVideoRef = (el) => {
    if (el && localStream) el.srcObject = localStream;
  };
  const remoteVideoRef = (el) => {
    if (el && remoteStream) el.srcObject = remoteStream;
  };

  if (callState === 'idle' || callState === 'incoming' || callState === 'busy') return null;

  const isVideo = callType === 'video';
  const isConnected = callState === 'connected';

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col safe-top safe-bottom">
      <div className="flex-1 relative">
        {isVideo ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-wa-accent/30 flex items-center justify-center">
                  <span className="text-3xl text-wa-accent">?</span>
                </div>
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute top-4 right-4 w-28 h-40 rounded-xl object-cover border-2 border-wa-border shadow-lg ${isCameraOff ? 'hidden' : ''}`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-28 h-28 rounded-full bg-wa-accent/20 flex items-center justify-center mb-6 animate-pulse-soft">
              <svg className="w-14 h-14 text-wa-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-wa-text text-lg font-medium">
              {callState === 'calling' ? 'Calling…' : 'Voice Call'}
            </p>
          </div>
        )}

        <div className="absolute top-4 left-0 right-0 text-center">
          {isConnected && (
            <span className="text-wa-text/80 text-sm font-mono bg-black/40 px-3 py-1 rounded-full">
              {formatCallDuration(callDuration)}
            </span>
          )}
          {callState === 'calling' && (
            <span className="text-wa-muted text-sm">Ringing…</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-8 px-4">
        {isVideo && (
          <>
            <button onClick={onSwitchCamera} className="w-14 h-14 rounded-full bg-wa-input flex items-center justify-center" aria-label="Switch camera">
              <svg className="w-6 h-6 text-wa-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={onToggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center ${isCameraOff ? 'bg-red-500/80' : 'bg-wa-input'}`} aria-label="Toggle camera">
              <svg className="w-6 h-6 text-wa-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCameraOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
          </>
        )}

        <button onClick={onToggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/80' : 'bg-wa-input'}`} aria-label="Toggle mute">
          <svg className="w-6 h-6 text-wa-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        <button onClick={onEndCall} className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center active:scale-95 transition-transform" aria-label="End call">
          <svg className="w-7 h-7 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
