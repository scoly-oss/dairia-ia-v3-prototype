import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Typography,
  ListItemButton,
  Button
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { conversationService } from '../../services/conversationService';
import { ChatInterface } from '../../components/Chat/ChatInterface';

interface Conversation {
  id: string;
  created_at: string;
  title: string;
  is_visible: boolean;
}

export const UserConversationHistory: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserConversations();
    }
  }, [user]);

  const loadUserConversations = async () => {
    try {
      if (!user) throw new Error('No user found');

      // Utiliser le service de conversation avec l'ID de l'utilisateur connecté
      const conversations = await conversationService.getConversations(user.id);
      setConversations(conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const hideConversation = async (conversationId: string) => {
    try {
      await conversationService.hideConversation(conversationId);
      // Recharger les conversations après la mise à jour
      loadUserConversations();
    } catch (error) {
      console.error('Error hiding conversation:', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, height: 'calc(100vh - 140px)' }}>
        <Typography variant="h4" gutterBottom>
          Mes conversations
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          height: 'calc(100% - 48px)'
        }}>
          <Paper sx={{ width: 300, overflow: 'auto' }}>
            <List>
              {conversations.map((conversation) => (
                <ListItem 
                  key={conversation.id} 
                  disablePadding 
                  secondaryAction={
                    <Button 
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        hideConversation(conversation.id);
                      }}
                      size="small"
                    >
                      Masquer
                    </Button>
                  }
                >
                  <ListItemButton 
                    selected={selectedConversation === conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    sx={{ pr: 7 }}
                  >
                    <ListItemText 
                      primary={conversation.title || 'Sans titre'}
                      secondary={new Date(conversation.created_at).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <ChatInterface
                conversationId={selectedConversation}
                onConversationCreated={loadUserConversations}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez une conversation pour afficher son contenu
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};
