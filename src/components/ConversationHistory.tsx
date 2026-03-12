import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { conversationService, Conversation } from '../services/conversationService';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Box,
  ListItemButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { format } from 'date-fns';
import { ChatInterface } from './Chat/ChatInterface';

interface ConversationHistoryProps {
  userId?: string;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ userId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { user } = useAuth();

  const loadConversations = async () => {
    try {
      const data = await conversationService.getConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleHideConversation = async (conversationId: string) => {
    try {
      await conversationService.hideConversation(conversationId);
      loadConversations();
    } catch (error) {
      console.error('Error hiding conversation:', error);
    }
  };

  const handleRestoreConversation = async (conversationId: string) => {
    try {
      await conversationService.restoreConversation(conversationId);
      loadConversations();
    } catch (error) {
      console.error('Error restoring conversation:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      <Paper elevation={3} sx={{ width: 300, overflow: 'auto' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          Historique des conversations
        </Typography>

        {conversations.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Aucune conversation trouvée
          </Typography>
        ) : (
          <List>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation.id}
                disablePadding
                secondaryAction={
                  <Box sx={{ pr: 1 }}>
                    {user?.role === 'admin' && !conversation.is_visible && (
                      <IconButton
                        edge="end"
                        aria-label="restore"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreConversation(conversation.id);
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    )}
                    {(user?.role === 'admin' || user?.role === 'client') && conversation.is_visible && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHideConversation(conversation.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemButton
                  selected={selectedConversation === conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  sx={{ pr: 7 }}
                >
                  <ListItemText
                    primary={conversation.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(new Date(conversation.created_at), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                        {!conversation.is_visible && (
                          <Typography component="span" variant="body2" color="error" sx={{ ml: 2 }}>
                            (Masquée)
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <ChatInterface
            conversationId={selectedConversation}
            onConversationCreated={loadConversations}
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
  );
};
