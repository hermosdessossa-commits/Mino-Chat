import { useAuth } from '@/features/auth/hooks/useAuth';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Array<{
    id: string;
    type: 'DIRECT' | 'GROUP';
    name: string | null;
    avatarUrl: string | null;
    participants: Array<{ user?: { id: string; username: string; avatarUrl: string | null } }>;
    lastMessage?: {
      id: string;
      content: string;
      senderId: string;
      createdAt: string;
    };
    unreadCount?: number;
  }>;
  onClose?: () => void;
}

export function ConversationList({ conversations, onClose }: ConversationListProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useAuth();

  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={{
            ...conversation,
            participants: conversation.participants.map((p) => ({
              user: p.user ? { id: p.user.id, username: p.user.username, avatarUrl: p.user.avatarUrl } : undefined
            }))
          }}
          isSelected={false}
          onClick={() => {
            window.location.href = `/conversations/${conversation.id}`;
            onClose?.();
          }}
        />
      ))}
    </div>
  );
}