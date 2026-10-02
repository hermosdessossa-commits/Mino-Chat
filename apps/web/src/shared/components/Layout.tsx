import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Search, MessageSquare, Settings, Plus, X, Menu, ArrowLeft, MoreVertical, Video, Phone, Info } from 'lucide-react';
import { ConversationList } from '@/features/conversations/ConversationList';
import { ConversationListSkeleton } from '@/features/conversations/ConversationListSkeleton';
import { useConversations } from '@/features/conversations/hooks/useConversations';
import { CreateConversationButton } from '@/features/conversations/CreateConversationButton';
import { UserMenu } from './Dropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Input } from './Input';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { Dropdown } from './Dropdown';
import { cn } from '@mino-chat/shared/utils';
import { formatRelativeTime } from '@mino-chat/shared/utils';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data: conversations, isLoading, refetch } = useConversations();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out',
        'bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700',
        'flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      aria-label="Conversations"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-700">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Mino-Chat</h1>
        <button className="lg:hidden btn-ghost btn-icon" onClick={onClose} aria-label="Fermer le menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
          <input type="search" placeholder="Rechercher conversations..." className="input pl-10" aria-label="Rechercher conversations" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {showCreate ? (
          <CreateConversationForm onClose={() => setShowCreate(false)} onSuccess={() => { refetch(); setShowCreate(false); }} />
        ) : (
          <>
            {isLoading ? (
              <ConversationListSkeleton />
            ) : !conversations || conversations.length === 0 ? (
              <EmptyState onCreate={() => setShowCreate(true)} />
            ) : (
              <ConversationList conversations={conversations} onClose={onClose} />
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t border-surface-200 dark:border-surface-700">
        <CreateConversationButton onClick={() => setShowCreate(true)} />
        <div className="mt-3 flex items-center gap-3 px-2">
          <UserMenu user={{ username: user?.username || '', email: user?.email || '', avatarUrl: user?.avatarUrl || null }} 
            onProfile={() => {}} onSettings={() => {}} onLogout={() => {}} />
        </div>
      </div>
    </aside>
  );
}

function CreateConversationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium">Nouvelle conversation</h3>
      <div>
        <label className="label">Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="DIRECT" checked={type === 'DIRECT'} onChange={() => setType('DIRECT')} className="h-4 w-4 text-primary-600" />
            <span>Message direct</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="GROUP" checked={type === 'GROUP'} onChange={() => setType('GROUP')} className="h-4 w-4 text-primary-600" />
            <span>Groupe</span>
          </label>
        </div>
      </div>
      {type === 'GROUP' && (
        <Input label="Nom du groupe" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du groupe" />
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => { onSuccess(); onClose(); }}>Créer</Button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-surface-500 dark:text-surface-400">
      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-1">Aucune conversation</h3>
      <p className="text-sm mb-6">Commencez une nouvelle discussion</p>
      <Button onClick={onCreate}><Plus className="h-4 w-4 mr-2" />Nouveau message</Button>
    </div>
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-700 sticky top-0 z-30">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden btn-ghost btn-icon" onClick={onMenuClick} aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden sm:block">Mino-Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu user={{ username: user?.username || '', email: user?.email || '', avatarUrl: user?.avatarUrl || null }} onProfile={() => {}} onSettings={() => {}} onLogout={() => {}} />
        </div>
      </div>
    </header>
  );
}

export function ChatArea({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col min-h-0">{children}</div>;
}

export function Layout() {
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