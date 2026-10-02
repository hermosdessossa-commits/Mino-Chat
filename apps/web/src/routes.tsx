import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { EntryPage } from './features/auth/EntryPage';
import { CallbackPage } from './features/auth/CallbackPage';
import { ChatPage } from './features/messages/ChatPage';
import { ConversationsPage } from './features/conversations/ConversationsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { useAuth } from './features/auth/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-pulse-soft text-primary-600">Mino-Chat</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/conversations/new" element={<ConversationsPage />} />
        <Route path="/conversations/:conversationId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/conversations" replace />} />
    </Routes>
  );
}