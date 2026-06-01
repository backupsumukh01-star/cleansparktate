import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import OfflinePage from './pages/OfflinePage';

function AppContent() {
  const { user, loading } = useAuth();

  if (!navigator.onLine && !user) {
    return <OfflinePage />;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-wa-dark">
        <div className="w-10 h-10 border-2 border-wa-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <ChatPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
