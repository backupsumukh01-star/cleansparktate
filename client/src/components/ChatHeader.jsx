import { formatLastSeen, getPartnerId, getPartnerLabel } from '../utils/format';

export default function ChatHeader({ userId, presence, onVoiceCall, onVideoCall, onLogout }) {
  const partnerId = getPartnerId(userId);
  const partner = presence[partnerId] || { online: false, lastActive: null, typing: false };

  let statusText = 'Offline';
  if (partner.typing) {
    statusText = 'typing…';
  } else if (partner.online) {
    statusText = 'Online';
  } else if (partner.lastActive) {
    statusText = formatLastSeen(partner.lastActive);
  }

  return (
    <header className="flex items-center gap-3 px-3 py-2.5 bg-wa-panel border-b border-wa-border safe-top shrink-0">
      <div className="w-10 h-10 rounded-full bg-wa-accent/30 flex items-center justify-center shrink-0">
        <span className="text-wa-accent font-semibold text-sm">
          {getPartnerLabel(partnerId).charAt(0)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-wa-text truncate">{getPartnerLabel(partnerId)}</h1>
        <p className={`text-xs truncate ${partner.typing ? 'text-wa-accent animate-pulse-soft' : 'text-wa-muted'}`}>
          {statusText}
        </p>
      </div>

      <button onClick={onVoiceCall} className="btn-icon" aria-label="Voice call">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>

      <button onClick={onVideoCall} className="btn-icon" aria-label="Video call">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <button onClick={onLogout} className="btn-icon" aria-label="Logout">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </header>
  );
}
