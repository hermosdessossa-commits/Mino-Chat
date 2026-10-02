import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useAuth } from './hooks/useAuth';

export function LoginForm({ onSwitchToRegister, onSwitchToMagicLink }: { onSwitchToRegister: () => void; onSwitchToMagicLink: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, status } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      navigate('/conversations');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Identifiants invalides');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        required
        autoComplete="email"
        leftIcon={<Mail className="h-5 w-5" />}
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          leftIcon={<Lock className="h-5 w-5" />}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-surface-600 dark:text-surface-400">Se souvenir de moi</span>
        </label>
        <button
          type="button"
          onClick={onSwitchToMagicLink}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Lien magique à la place
        </button>
      </div>

      <Button type="submit" className="w-full" loading={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Connexion'}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="text-center text-sm text-surface-600 dark:text-surface-400">
        Pas de compte ?{' '}
        <button onClick={onSwitchToRegister} className="text-primary-600 hover:text-primary-700 font-medium">
          S'inscrire
        </button>
      </p>
    </form>
  );
}

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, status } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ email, username, password: password || undefined });
      navigate('/conversations');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Nom d'utilisateur"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="mon_username"
        required
        autoComplete="username"
        minLength={3}
        maxLength={30}
        pattern="[a-zA-Z0-9_-]+"
        leftIcon={<User className="h-5 w-5" />}
        hint="3-30 caractères, lettres, chiffres, _ et - uniquement"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        required
        autoComplete="email"
        leftIcon={<Mail className="h-5 w-5" />}
      />

      <div className="relative">
        <Input
          label="Mot de passe (optionnel avec lien magique)"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          leftIcon={<Lock className="h-5 w-5" />}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <Button type="submit" className="w-full" loading={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Créer mon compte'}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="text-center text-sm text-surface-600 dark:text-surface-400">
        Déjà un compte ?{' '}
        <button onClick={onSwitchToLogin} className="text-primary-600 hover:text-primary-700 font-medium">
          Se connecter
        </button>
      </p>
    </form>
  );
}

export function EntryPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic-link'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Mino-Chat</h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            {mode === 'login' ? 'Bienvenue ! Connectez-vous pour continuer' : 
             mode === 'register' ? 'Créez votre compte pour commencer' : 
             'Vérifiez votre email pour le lien magique'}
          </p>
        </div>

        <div className="card p-8">
          {mode === 'login' && (
            <LoginForm 
              onSwitchToRegister={() => setMode('register')} 
              onSwitchToMagicLink={() => setMode('magic-link')} 
            />
          )}
          {mode === 'register' && (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
          {mode === 'magic-link' && (
            <MagicLinkForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

function MagicLinkForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');
  const { requestMagicLink, status } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await requestMagicLink(email);
      setSent(true);
      startCountdown();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Erreur lors de l\'envoi');
    }
  };

  const startCountdown = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  if (sent) {
    return (
      <div className="text-center space-y-6">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          <p className="font-medium">Lien envoyé !</p>
          <p className="text-sm mt-1">Vérifiez votre boîte mail {email}</p>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Le lien expire dans 15 minutes. 
          {resendCountdown > 0 ? (
            <span>Renvoi possible dans {resendCountdown}s</span>
          ) : (
            <button onClick={handleSubmit} className="text-primary-600 hover:text-primary-700 ml-2">
              Renvoyer
            </button>
          )}
        </p>
        <Button variant="ghost" onClick={() => { setSent(false); setEmail(''); onSwitchToLogin(); }}>
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        required
        autoComplete="email"
        leftIcon={<Mail className="h-5 w-5" />}
      />

      <Button type="submit" className="w-full" loading={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Envoyer le lien magique'}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="text-center text-sm text-surface-600 dark:text-surface-400">
        Retour à la connexion ?{' '}
        <button onClick={onSwitchToLogin} className="text-primary-600 hover:text-primary-700 font-medium">
          Se connecter
        </button>
      </p>
    </form>
  );
}