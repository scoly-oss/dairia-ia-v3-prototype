import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { SplitChatLayout } from '../../components/Chat/SplitChatLayout';
import { LAYOUT } from '../../theme/constants';
import { useAuth } from '../../contexts/AuthContext';
import { conversationService } from '../../services/conversationService';
import { useLocation } from 'react-router-dom';

export const AdminChatPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');

    const loadConversation = async () => {
      if (conversationId) {
        try {
          // Vérifier si la conversation existe
          const conversations = await conversationService.getConversations(user?.id);
          const conversation = conversations.find(conv => conv.id === conversationId);

          if (conversation) {
            setSelectedConversationId(conversationId);
            setConversationTitle(conversation.title || '');
          } else {
            console.warn('Conversation not found, redirecting to chat page');
            window.history.replaceState({}, '', '/chat');
            setSelectedConversationId(undefined);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          window.history.replaceState({}, '', '/chat');
          setSelectedConversationId(undefined);
        }
      }
    };

    loadConversation();
  }, [location, user?.id]);

  const handleConversationCreated = (newConversationId: string) => {
    // Mettre à jour l'état avec le nouvel ID de conversation
    setSelectedConversationId(newConversationId);

    // Mettre à jour l'URL avec le nouvel ID
    window.history.pushState({}, '', `/chat?conversation=${newConversationId}`);

    // Nettoyer le localStorage de la conversation temporaire
    localStorage.removeItem('draft_message_new');
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* AppBar */}


      {/* Layout Container */}
      <Box
        sx={{
          position: 'fixed',
          top: LAYOUT.APPBAR_HEIGHT,
          right: 0,
          bottom: 0,
          left: 0,
          display: 'flex',
        }}
      >
        {/* Navigation Drawer - Desktop */}
        <Box
          sx={{
            width: LAYOUT.NAV_WIDTH,
            display: { xs: 'none', sm: 'block' },
            flexShrink: 0,
          }}
        />


        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <SplitChatLayout
            conversationId={selectedConversationId}
            conversationTitle={conversationTitle}
            onConversationCreated={handleConversationCreated}
            isAdminView={true}
          />
        </Box>

      </Box>

    </Box>
  );
};