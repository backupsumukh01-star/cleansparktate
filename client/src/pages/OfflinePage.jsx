export default function OfflinePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-wa-dark px-6 safe-top safe-bottom text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-wa-input flex items-center justify-center">
        <svg className="w-8 h-8 text-wa-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01M8.464 8.464a5 5 0 017.072 0M15.536 15.536a5 5 0 01-7.072 0" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-wa-text mb-2">You are offline</h1>
      <p className="text-wa-muted text-sm max-w-xs">
        Connect to the internet to sign in and send messages. Cached pages may still load.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2.5 bg-wa-accent text-white rounded-xl text-sm font-medium"
      >
        Retry
      </button>
    </div>
  );
}
