import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useMagicLink() {
  const requestMagicLink = useMutation({
    mutationFn: (data: { email: string; redirectTo?: string }) => api.requestMagicLink(data),
  });

  const verifyMagicLink = useMutation({
    mutationFn: (token: string) => api.verifyMagicLink(token),
  });

  return { requestMagicLink, verifyMagicLink };
}