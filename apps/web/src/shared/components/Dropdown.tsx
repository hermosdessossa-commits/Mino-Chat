import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@mino-chat/shared/utils';

interface DropdownItem {
  label?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const portalContent = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-50 mt-1.5 min-w-[160px] max-w-[280px] rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-lg animate-in',
        align === 'right' && 'right-0',
        align === 'left' && 'left-0',
        className
      )}
      role="menu"
      onKeyDown={handleKeyDown}
    >
      <div className="py-1">
        {items.map((item, index) => {
          if (item.divider) {
            return <div key={`divider-${index}`} className="h-px bg-surface-200 dark:bg-surface-700 my-1" role="separator" />;
          }
          const menuItem = item as { label: string; onClick: () => void; icon?: React.ReactNode; disabled?: boolean; danger?: boolean };
          return (
            <button
              key={index}
              onClick={() => { if (!menuItem.disabled) { menuItem.onClick(); setIsOpen(false); } }}
              disabled={menuItem.disabled}
              className={cn(
                'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                menuItem.danger 
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                menuItem.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="menuitem"
              tabIndex={-1}
            >
              {menuItem.icon && <span className="h-4 w-4 flex-shrink-0">{menuItem.icon}</span>}
              {menuItem.label}
            </button>
          );
        })}
      </div>
    </div>
    ,
    document.body
  ) : null;

  return (
    <div ref={triggerRef} className="relative inline-block" onClick={() => setIsOpen(!isOpen)}>
      {trigger}
      {portalContent}
    </div>
  );
}

export type { DropdownItem };

interface UserMenuProps {
  user: {
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

import { User, Settings, LogOut } from 'lucide-react';

export function UserMenu({ user, onProfile, onSettings, onLogout }: UserMenuProps) {
  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <span className="hidden sm:block font-medium text-sm text-surface-700 dark:text-surface-300">
            {user.username}
          </span>
        </button>
      }
      items={[
        { label: 'Profil', icon: <User className="h-4 w-4" />, onClick: onProfile },
        { label: 'Paramètres', icon: <Settings className="h-4 w-4" />, onClick: onSettings },
        { divider: true },
        { label: 'Déconnexion', icon: <LogOut className="h-4 w-4" />, onClick: onLogout, danger: true },
      ]}
      align="right"
    />
  );
}