import { cn } from '@mino-chat/shared/utils';

interface AvatarProps {
  src?: string | null | undefined;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'offline';
  className?: string;
}

const sizeClasses = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
};

const statusClasses = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-surface-400',
};

export function Avatar({ src, alt, name, size = 'md', status, className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('relative inline-flex', sizeClasses[size], className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="h-full w-full rounded-full flex items-center justify-center" aria-label={name || 'User avatar'}>
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-surface-950',
            size === 'xs' && 'h-1.5 w-1.5',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-4 w-4',
            statusClasses[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}