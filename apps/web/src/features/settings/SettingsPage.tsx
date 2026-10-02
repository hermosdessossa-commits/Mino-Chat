import { useAuth } from '../../features/auth/hooks/useAuth';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Avatar } from '../../shared/components/Avatar';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ username, avatarUrl: avatarUrl || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Paramètres</h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile */}
        <section className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Profil</h2>
          <div className="flex items-center gap-6">
            <Avatar src={avatarUrl} name={username} size="xl" />
            <div className="flex-1 space-y-4">
              <Input
                label="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
              />
              <Input
                label="URL de l'avatar (optionnel)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Notifications</h2>
          <div className="space-y-3">
            <NotificationToggle label="Messages directs" defaultChecked />
            <NotificationToggle label="Mentions" defaultChecked />
            <NotificationToggle label="Réactions" defaultChecked />
            <NotificationToggle label="Nouveaux participants" defaultChecked />
          </div>
        </section>

        {/* Appearance */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Apparence</h2>
          <div className="space-y-3">
            <ThemeSelector />
          </div>
        </section>

        {/* Danger zone */}
        <section className="card p-6 space-y-4 border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Zone de danger</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Ces actions sont irréversibles.
          </p>
          <div className="flex gap-3">
            <Button variant="danger">Supprimer mon compte</Button>
            <Button variant="ghost">Exporter mes données</Button>
          </div>
        </section>

        {/* Save button */}
        {saved && (
          <div className="fixed bottom-4 right-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 animate-slide-up">
            Enregistré !
          </div>
        )}
      </form>
    </div>
  );
}

function NotificationToggle({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-surface-700 dark:text-surface-300">{label}</span>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white shadow" />
        </span>
      </button>
    </label>
  );
}

function ThemeSelector() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  return (
    <div className="grid grid-cols-3 gap-3">
      {['light', 'dark', 'system'].map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t as "light" | "dark" | "system")}
          className={`p-4 rounded-xl border-2 text-center text-sm font-medium transition-all ${
            theme === t
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
          }`}
        >
          {t === 'light' && '☀️ Clair'}
          {t === 'dark' && '🌙 Sombre'}
          {t === 'system' && '💻 Système'}
        </button>
      ))}
    </div>
  );
}

import { useState } from 'react';