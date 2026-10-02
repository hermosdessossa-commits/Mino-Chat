import { create } from 'zustand';

interface ConversationUIState {
  selectedConversationId: string | null;
  setSelectedConversation: (id: string | null) => void;
  draftMessages: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  getDraft: (conversationId: string) => string;
  clearDraft: (conversationId: string) => void;
}

export const useConversationStore = create<ConversationUIState>((set, get) => ({
  selectedConversationId: null,
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  draftMessages: {},
  setDraft: (conversationId, text) => 
    set((state) => ({ 
      draftMessages: { ...state.draftMessages, [conversationId]: text } 
    })),
  getDraft: (conversationId) => get().draftMessages[conversationId] || '',
  clearDraft: (conversationId) => 
    set((state) => {
      const { [conversationId]: _, ...rest } = state.draftMessages;
      return { draftMessages: rest };
    }),
}));