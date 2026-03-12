import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useChat } from '../hooks/useChat';

interface Props {
  conversationId: string;
}

export const ChatInput: React.FC<Props> = ({ conversationId }) => {
  const [message, setMessage] = useState('');

  const { sendMessage } = useChat(conversationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <TextField
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tapez votre message..."
        variant="outlined"
        size="small"
      />
      <IconButton type="submit" color="primary">
        <SendIcon />
      </IconButton>
    </Box>
  );
};
