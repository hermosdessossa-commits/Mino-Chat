import { useParams } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Video, Phone, Search, Info } from 'lucide-react';
import { Avatar } from '@/shared/components/Avatar';
import { Dropdown } from '@/shared/components/Dropdown';
import { Button } from '@/shared/components/Button';

interface ConversationHeaderProps {
  conversationId: string;
  onBack: () => void;
}

export function ConversationHeader({ conversationId, onBack }: ConversationHeaderProps) {
  const isGroup = false;
  const name = isGroup ? 'Team Mino-Chat' : 'Alice';
  const avatarUrl = null;
  const participantCount = isGroup ? 3 : 2;

  return (
    <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-700 sticky top-0 z-30 flex-shrink-0">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="icon" size="sm" onClick={onBack} className="lg:hidden" aria-label="Retour">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar src={avatarUrl} name={name} size="lg" status="online" />
          <div className="min-w-0">
            <h2 className="font-semibold text-surface-900 dark:text-surface-50 truncate">{name}</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {isGroup ? `${participantCount} participants` : 'En ligne'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="icon" size="sm" aria-label="Appel vidéo">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="icon" size="sm" aria-label="Appel audio">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="icon" size="sm" aria-label="Rechercher dans la conversation">
            <Search className="h-5 w-5" />
          </Button>
          <Dropdown
            trigger={
              <Button variant="icon" size="sm" aria-label="Plus d'options">
                <MoreVertical className="h-5 w-5" />
              </Button>
            }
            items={[
              { label: 'Informations', icon: <Info className="h-4 w-4" />, onClick: () => {} },
              { label: 'Rechercher', icon: <Search className="h-4 w-4" />, onClick: () => {} },
              { label: 'Média, liens et docs', icon: <div className="h-4 w-4 bg-surface-200 rounded" />, onClick: () => {} },
              { divider: true },
              { label: 'Notifications', icon: <Info className="h-4 w-4" />, onClick: () => {} },
              { label: 'Bloquer', icon: <Info className="h-4 w-4" />, onClick: () => {}, danger: true },
            ]}
            align="right"
          />
        </div>
      </div>
    </header>
  );
}