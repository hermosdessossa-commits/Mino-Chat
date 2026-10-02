import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      api.getMessages(
        conversationId,
        (pageParam as { cursor?: string; direction?: 'before' | 'after' })?.cursor,
        50,
        (pageParam as { direction?: 'before' | 'after' })?.direction
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ? { cursor: lastPage.nextCursor, direction: 'before' as const } : undefined,
    initialPageParam: { direction: 'before' as const },
    enabled: !!conversationId,
    select: (data) => ({
      pages: data.pages.map(page => ({
        data: page.data,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
      })),
      pageParams: data.pageParams,
    }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, attachmentIds }: { conversationId: string; content: string; attachmentIds?: string[] }) =>
      api.sendMessage({ conversationId, content, attachmentIds }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.editMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkRead() {
  return useMutation({
    mutationFn: ({ messageIds }: { messageIds: string[] }) => api.markRead(messageIds),
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.addReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.removeReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}