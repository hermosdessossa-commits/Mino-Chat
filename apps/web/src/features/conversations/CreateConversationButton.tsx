import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/Button';

interface CreateConversationButtonProps {
  onClick: () => void;
}

export function CreateConversationButton({ onClick }: CreateConversationButtonProps) {
  return (
    <Button variant="secondary" className="w-full" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Nouveau message
    </Button>
  );
}