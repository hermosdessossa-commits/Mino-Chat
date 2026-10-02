import { useAuth as useAuthContext } from '../AuthProvider';

export function useAuth() {
  return useAuthContext();
}