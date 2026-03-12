import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { chatService, ChatMessage } from '../services/chatService';

interface Props {
  conversationId: string;
}

export const ChatMessages: React.FC<Props> = ({ conversationId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await chatService.getMessages(conversationId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    // Vous pourriez ajouter ici une logique de rafraîchissement périodique ou de websocket
  }, [conversationId]);

  return (
    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
      <List>
        {messages.map((message) => (
          <ListItem key={message.id}>
            <ListItemText
              primary={
                <Typography variant="body1" component="div">
                  {message.content}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {new Date(message.created_at).toLocaleString()}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
