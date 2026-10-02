import { formatRelativeTime } from '@mino-chat/shared/utils';
import { Avatar } from '@/shared/components/Avatar';
import { cn } from '@mino-chat/shared/utils';
import { Image, FileText, MessageSquare, Edit2, Trash2, Copy, Reply, Heart, ThumbsUp, Download } from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
  size: number;
}

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    createdAt: string;
    sender: { id: string; username: string; avatarUrl: string | null };
    attachments?: Attachment[];
    reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
    replyTo?: { content: string; sender: { username: string } };
    editedAt?: string;
  };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isImage = message.attachments?.some(a => a.mimeType.startsWith('image/'));
  const isFile = message.attachments?.some(a => !a.mimeType.startsWith('image/'));

  return (
    <div className={cn('flex gap-2 max-w-[70%]', isOwn ? 'ml-auto' : 'mr-auto')}>
      {!isOwn && (
        <Avatar src={message.sender.avatarUrl} name={message.sender.username} size="sm" />
      )}
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <span className="text-xs text-surface-500 dark:text-surface-400 px-1">
            {message.sender.username}
          </span>
        )}
        <div className={cn(
          'relative max-w-xs lg:max-w-md rounded-2xl px-4 py-2',
          isOwn 
            ? 'bg-primary-600 text-white rounded-tr-none' 
            : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-tl-none'
        )}>
          {/* Reply preview */}
          {message.replyTo && (
            <div className="mb-1.5 px-3 py-1.5 bg-white/10 dark:bg-surface-900/50 rounded-lg border border-white/10 dark:border-surface-700/50">
              <div className="flex items-center gap-2 text-xs">
                <Reply className="h-3 w-3 opacity-70" />
                <span className="font-medium opacity-80">{message.replyTo.sender.username}</span>
              </div>
              <div className="text-sm truncate opacity-80">{message.replyTo.content}</div>
            </div>
          )}

          {/* Content */}
          {message.type === 'IMAGE' && message.attachments?.[0] && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={message.attachments[0].url}
                alt={message.attachments[0].filename}
                className="max-w-full h-auto"
                loading="lazy"
              />
              {message.content && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {message.type === 'FILE' && message.attachments?.[0] && (
            <div className="flex items-center gap-3 p-2 bg-white/10 dark:bg-surface-900/50 rounded-lg">
              <FileText className="h-8 w-8 opacity-80" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{message.attachments[0].filename}</p>
                <p className="text-xs opacity-70">{formatFileSize(message.attachments[0].size)}</p>
              </div>
              <a href={message.attachments[0].url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 dark:hover:bg-surface-700/50 rounded">
                <Download className="h-4 w-4" />
              </a>
            </div>
          )}

          {message.type === 'TEXT' && message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Attachments gallery */}
          {message.attachments && message.attachments.length > 1 && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {message.attachments.slice(0, 4).map((att) => (
                att.mimeType.startsWith('image/') && (
                  <img
                    key={att.id}
                    src={att.thumbnail || att.url}
                    alt={att.filename}
                    className="w-full h-20 object-cover rounded-lg"
                    loading="lazy"
                  />
                )
              ))}
              {message.attachments.length > 4 && (
                <div className="relative rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                    +{message.attachments.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
                    r.userReacted
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-white/20 dark:bg-surface-700/50 hover:bg-white/30 dark:hover:bg-surface-600/50'
                  )}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span>{r.count}</span>}
                </button>
              ))}
              <button className="px-2 py-0.5 rounded-full text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                <Heart className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] opacity-60">
            <time>{formatRelativeTime(message.createdAt)}</time>
            {message.editedAt && <span>• modifié</span>}
            {message.type === 'SYSTEM' && <span>• système</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}