import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { useAuth } from './hooks/useAuth';

export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink, status } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const handleVerify = async () => {
      try {
        await verifyMagicLink(token);
        navigate('/conversations', { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    };

    handleVerify();
  }, [token, verifyMagicLink, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Connexion en cours...
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Veuillez patienter pendant que nous vérifions votre lien magique.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MagicLinkSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Connexion réussie !
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Redirection vers vos conversations...
          </p>
          <Button onClick={() => navigate('/conversations')} className="w-full">
            Continuer <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MagicLinkErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Lien invalide ou expiré
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Ce lien magique a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Retour à la connexion <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}