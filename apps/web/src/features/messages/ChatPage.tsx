import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Smile, MoreVertical, ArrowLeft, Loader2 } from 'lucide-react';
import { useMessages, useSendMessage, useMarkRead } from './hooks/useMessages';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationHeader } from '../conversations/ConversationHeader';
import { Button } from '@/shared/components/Button';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = React.useState(false);

  const { data: messages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId!);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages?.pages) {
      const lastPage = messages.pages[messages.pages.length - 1];
      if (lastPage?.data) {
        const unreadMessages = lastPage.data.filter((m: any) => !m.readByCurrentUser);
        if (unreadMessages.length > 0) {
          markRead.mutate({ messageIds: unreadMessages.map((m: any) => m.id) });
        }
      }
    }
  }, [messages, markRead]);

  useEffect(() => {
    scrollToBottom();
  }, [sendMessage.isSuccess]);

  const handleSend = (content: string, attachmentIds: string[] = []) => {
    if (!content.trim() && attachmentIds.length === 0) return;
    sendMessage.mutate({ conversationId: conversationId!, content, attachmentIds });
  };

  if (!conversationId) return null;

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader conversationId={conversationId} onBack={() => navigate('/conversations')} />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <MessageList
          messages={messages?.pages.flatMap((p: any) => p.data) || []}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          scrollToBottom={scrollToBottom}
        />
        
        <div ref={messagesEndRef} />
        
        <MessageInput onSend={handleSend} disabled={sendMessage.isPending} />
      </div>
    </div>
  );
}