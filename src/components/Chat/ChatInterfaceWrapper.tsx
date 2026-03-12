import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import { ChatInterface } from './ChatInterface';

interface ChatInterfaceWrapperProps {
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  isAdminView?: boolean;
  hideReviewButton?: boolean;
}

export const ChatInterfaceWrapper: React.FC<ChatInterfaceWrapperProps> = ({
  conversationId,
  onConversationCreated,
  isAdminView,
  hideReviewButton,
}) => {
  return (
    <ChatProvider onConversationCreated={onConversationCreated}>
      <ChatInterface
        conversationId={conversationId}
        onConversationCreated={onConversationCreated}
        isAdminView={isAdminView}
        hideReviewButton={hideReviewButton}
      />
    </ChatProvider>
  );
};