import { useRef, useEffect, useCallback, Fragment } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { cn } from '@mino-chat/shared/utils';
import { formatRelativeTime } from '@mino-chat/shared/utils';

interface MessageListProps {
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    createdAt: string;
    sender: { id: string; username: string; avatarUrl: string | null };
    attachments?: Array<{
      id: string;
      filename: string;
      mimeType: string;
      url: string;
      thumbnail: string | null;
      width: number | null;
      height: number | null;
    }>;
    reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
    replyTo?: { content: string; sender: { username: string } };
    editedAt?: string;
  }>;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  scrollToBottom: () => void;
}

export function MessageList({ 
  messages, 
  isLoading, 
  hasNextPage, 
  isFetchingNextPage, 
  fetchNextPage,
  scrollToBottom 
}: MessageListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore();
      },
      { rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleLoadMore]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const allMessages = messages?.pages.flatMap((p: any) => p.data) || [];
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
      <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />}
      </div>
      
      {allMessages.map((message, index) => {
        const showDate = index === 0 || 
          new Date(allMessages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
        
        return (
          <Fragment key={message.id}>
            {showDate && (
              <div className="flex items-center justify-center gap-2 my-4">
                <div className="flex-1 border-t border-surface-200 dark:border-surface-700" />
                <span className="px-3 py-0.5 text-xs text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 rounded-full">
                  {formatRelativeTime(message.createdAt)}
                </span>
                <div className="flex-1 border-t border-surface-200 dark:border-surface-700" />
              </div>
            )}
            <MessageBubble 
              message={message}
              isOwn={message.senderId === 'current-user-id'}
            />
          </Fragment>
        );
      })}
      
      <div ref={messagesEndRef} />
    </div>
  );
}