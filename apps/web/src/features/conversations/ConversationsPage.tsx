import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Header, ChatArea } from '@/shared/components/Layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLocation } from 'react-router-dom';

export function ConversationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden">
          <ChatArea>
            <Outlet />
          </ChatArea>
        </main>
      </div>
    </div>
  );
}