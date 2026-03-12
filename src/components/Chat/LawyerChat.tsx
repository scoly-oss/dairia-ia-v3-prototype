import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { reviewRequestService, ReviewMessage, Lawyer } from '../../services/reviewRequestService';

interface LawyerChatProps {
  reviewRequestId: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'lawyer' | 'client';
  timestamp: string;
}

interface LawyerInfo {
  id: string;
  name: string;
  email: string;
}

const convertReviewMessageToMessage = (reviewMessage: ReviewMessage): Message => {
  return {
    id: reviewMessage.id,
    content: reviewMessage.content,
    sender: reviewMessage.sender?.email?.includes('avocat') || reviewMessage.sender_id?.includes('lawyer') ? 'lawyer' : 'client',
    timestamp: reviewMessage.created_at
  };
};

const convertLawyerToLawyerInfo = (lawyer: Lawyer): LawyerInfo => {
  return {
    id: lawyer.id,
    name: `${lawyer.first_name} ${lawyer.last_name}`,
    email: lawyer.email
  };
};

export const LawyerChat: React.FC<LawyerChatProps> = ({ reviewRequestId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
      try {
        // Charger les messages existants
        const existingMessages = await reviewRequestService.getReviewRequestMessages(reviewRequestId);
        const convertedMessages = existingMessages.map(convertReviewMessageToMessage);
        setMessages(convertedMessages);

        // Charger les informations de l'avocat si déjà assigné
        const request = await reviewRequestService.getReviewRequest(reviewRequestId);
        if (request?.lawyer) {
          setLawyer(request.lawyer ? convertLawyerToLawyerInfo(request.lawyer) : null);
        }

        // S'abonner aux mises à jour
        const unsubscribeFunc = await reviewRequestService.subscribeToMessages(
          reviewRequestId,
          (update) => {
            if (update.type === 'message') {
              const convertedMessage = convertReviewMessageToMessage(update.data);
              setMessages(prev => [...prev, convertedMessage]);
            } else if (update.type === 'typing') {
              setIsTyping(update.data.isTyping);
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            } else if (update.type === 'lawyer_assigned') {
              setLawyer(convertLawyerToLawyerInfo(update.data));
            }
          }
        );

        // Stocker la fonction de nettoyage
        unsubscribe = unsubscribeFunc;

        setLoading(false);
      } catch (error) {
        console.error('Error setting up lawyer chat:', error);
        setLoading(false);
      }
    };

    setupChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
    };
  }, [reviewRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    try {
      await reviewRequestService.sendMessage(reviewRequestId, inputValue);
      // Ne pas ajouter le message localement, il sera reçu via la souscription SSE
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async () => {
    try {
      await reviewRequestService.updateTypingStatus(reviewRequestId, true);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="primary">
          {lawyer 
            ? `Discussion avec Maître ${lawyer.name}`
            : 'Votre demande de relecture a été prise en compte. Un avocat va vous répondre dans quelques instants. Merci de patienter...'}
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1,
        p: 2,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              alignSelf: message.sender === 'lawyer' ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: message.sender === 'lawyer' ? 'primary.main' : 'grey.100',
                color: message.sender === 'lawyer' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
              <Typography variant="caption" color={message.sender === 'lawyer' ? 'primary.light' : 'text.secondary'}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}

        {isTyping && (
          <Box sx={{ alignSelf: 'flex-start', pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              En train d'écrire...
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ 
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}>
        <Box sx={{ 
          display: 'flex',
          gap: 1,
        }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tapez votre message..."
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            Envoyer
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

