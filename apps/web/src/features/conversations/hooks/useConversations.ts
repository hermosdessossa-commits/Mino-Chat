import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    select: (response) => response.data || [],
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.getConversation(id),
    enabled: !!id,
    select: (data) => data,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: 'DIRECT' | 'GROUP'; name?: string; participantIds: string[] }) => 
      api.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; avatarUrl?: string | null } }) =>
      api.updateConversation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAddParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      api.addParticipants(id, userIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.removeParticipant(id, userId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateParticipantRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, role }: { id: string; userId: string; role: 'ADMIN' | 'MEMBER' }) =>
      api.updateParticipantRole(id, userId, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });
}