import { formatRelativeTime } from '@mino-chat/shared/utils';
import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@mino-chat/shared/utils';

interface ConversationItemProps {
  conversation: {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name: string | null;
    avatarUrl: string | null;
    participants: { user: { id: string; username: string; avatarUrl: string | null } }[];
    lastMessage?: {
      id: string;
      content: string;
      senderId: string;
      createdAt: string;
    };
    unreadCount: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const isGroup = conversation.type === 'GROUP';
  const otherParticipant = conversation.participants.find(
    (p) => p.user.id !== 'current-user-id'
  );
  const displayName = isGroup ? conversation.name : otherParticipant?.user.username || 'Unknown';
  const displayAvatar = isGroup ? conversation.avatarUrl : otherParticipant?.user.avatarUrl;

  const lastMessageContent = conversation.lastMessage
    ? conversation.lastMessage.content.length > 50
      ? conversation.lastMessage.content.slice(0, 50) + '…'
      : conversation.lastMessage.content
    : 'Aucun message';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150',
        'hover:bg-surface-100 dark:hover:bg-surface-800',
        isSelected && 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500'
      )}
      aria-current={isSelected ? 'true' : 'false'}
    >
<Avatar
        src={(displayAvatar === null ? undefined : displayAvatar) as string | undefined}
        name={displayName}
        size="lg"
        status="online"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-surface-900 dark:text-surface-50 truncate">
            {displayName}
          </h4>
          {conversation.lastMessage && (
            <time className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
              {formatRelativeTime(conversation.lastMessage.createdAt)}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-surface-600 dark:text-surface-400 truncate flex-1">
            {conversation.lastMessage?.senderId === 'current-user-id' ? 'Vous: ' : ''}
            {lastMessageContent}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 h-5 min-w-5 rounded-full bg-primary-600 text-white text-xs font-medium flex items-center justify-center px-1.5">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}