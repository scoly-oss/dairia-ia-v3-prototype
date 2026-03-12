import { useContext, useEffect, useRef } from 'react';
import { ChatContext, ChatContextValue } from '../contexts/ChatContext';

export const useChat = (conversationId?: string): ChatContextValue => {
  const context = useContext(ChatContext);
  const previousConversationId = useRef<string | undefined>();

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  useEffect(() => {
    if (conversationId && conversationId !== previousConversationId.current) {
      context.loadMessages(conversationId);
      previousConversationId.current = conversationId;
    }
  }, [conversationId, context]);

  return context;
};
