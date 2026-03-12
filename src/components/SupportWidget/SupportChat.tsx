import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Alert,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supportRequestService, SupportRequest, SupportMessage, SupportRequestUpdate } from '../../services/supportRequestService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TypingIndicator } from '../Chat/TypingIndicator';

interface Props {
  supportRequest: SupportRequest;
  onClose: () => void;
  onRequestCompleted?: () => void;
}

export const SupportChat: React.FC<Props> = ({ supportRequest, onClose, onRequestCompleted }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRequest, setCurrentRequest] = useState<SupportRequest>(supportRequest);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<SupportMessage[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCompleted = currentRequest.status === 'completed';

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-focus sur le champ de saisie quand le chat est prêt
  useEffect(() => {
    if (!loading && !isCompleted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, isCompleted]);

  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const supportMessages = await supportRequestService.getSupportRequestMessages(supportRequest.id);

      if (!Array.isArray(supportMessages)) {
        throw new Error('Support messages is not an array');
      }

      const sortedMessages = [...supportMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('[SupportChat] Error loading messages:', error);
      setError("Impossible de charger les messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [supportRequest.id, scrollToBottom]);

  const handleUpdate = useCallback((update: SupportRequestUpdate) => {
    if (update.type === 'typing') {
      const typingData = update.data as { isTyping: boolean; userId: string };
      if (typingData.userId !== user?.id) {
        setIsOtherTyping(typingData.isTyping);
      }
    } else if (update.type === 'message') {
      setIsOtherTyping(false);
      const messageData = update.data as SupportMessage;
      const messageExists = messagesRef.current.some(msg => msg.id === messageData.id);

      if (!messageExists) {
        if (messageData.sender?.first_name && messageData.sender?.last_name) {
          setMessages(prevMessages => [...prevMessages, messageData]);
        } else {
          loadMessages();
        }
      }
    } else if (update.type === 'UPDATE' || update.type === 'support_request') {
      const requestData = update.data as SupportRequest;
      setCurrentRequest(requestData);
      if (requestData.status === 'completed' && onRequestCompleted) {
        onRequestCompleted();
      }
    }
  }, [user?.id, loadMessages, onRequestCompleted]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeChat = async () => {
      try {
        await loadMessages();

        unsubscribe = await supportRequestService.subscribeToMessages(
          supportRequest.id,
          handleUpdate
        );
      } catch (error) {
        console.error('[SupportChat] Error initializing chat:', error);
        setError("Erreur lors de l'initialisation du chat");
      }
    };

    initializeChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [supportRequest.id, loadMessages, handleUpdate]);

  const handleSend = async () => {
    if (!newMessage.trim() || isCompleted) return;

    setSending(true);
    setError(null);

    await supportRequestService.updateTypingStatus(supportRequest.id, false);

    try {
      const sentMessage = await supportRequestService.sendMessage(supportRequest.id, newMessage.trim());
      // Ajouter le message localement immédiatement
      setMessages(prevMessages => {
        // Vérifier si le message existe déjà (éviter les doublons si SSE arrive en même temps)
        const exists = prevMessages.some(msg => msg.id === sentMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, sentMessage];
      });
      setNewMessage('');
    } catch (error) {
      setError("Impossible d'envoyer le message");
      console.error('[SupportChat] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supportRequestService.updateTypingStatus(supportRequest.id, true);

    typingTimeoutRef.current = setTimeout(() => {
      supportRequestService.updateTypingStatus(supportRequest.id, false);
    }, 3000);
  }, [supportRequest.id]);

  const formatMessageDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  const getStatusChip = () => {
    switch (currentRequest.status) {
      case 'pending':
        return <Chip label="En attente" color="warning" size="small" />;
      case 'in_progress':
        return <Chip label="En cours" color="info" size="small" />;
      case 'completed':
        return <Chip label="Terminée" color="success" size="small" icon={<CheckCircleIcon />} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#1E345A',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Support Dairia
          </Typography>
          {getStatusChip()}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        {loading ? (
          <Typography color="text.secondary" textAlign="center">
            Chargement...
          </Typography>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ color: '#1E345A' }}
              gutterBottom
            >
              Bienvenue sur le support Dairia !
            </Typography>
            <Typography variant="body2" sx={{ color: '#374151' }}>
              Posez-nous votre question, un membre de notre équipe vous répondra dans quelques minutes. Restez en ligne !
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                  p: 0.5,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      bgcolor: message.sender_id === user?.id ? '#1E345A' : 'white',
                      color: message.sender_id === user?.id ? 'white' : '#1E345A',
                      p: 1.5,
                      borderRadius: message.sender_id === user?.id
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                  <Box
                    sx={{
                      mt: 0.5,
                      display: 'flex',
                      flexDirection: message.sender_id === user?.id ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {message.sender?.first_name || 'Support'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {formatMessageDate(message.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            ))}
            {isOtherTyping && (
              <ListItem sx={{ justifyContent: 'flex-start', p: 0.5 }}>
                <TypingIndicator isTyping={true} />
              </ListItem>
            )}
          </List>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'white',
        }}
      >
        {isCompleted ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Cette conversation est terminée.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              size="small"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Écrivez votre message..."
              disabled={sending}
              inputRef={inputRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#fff',
                  '& input, & textarea': {
                    color: '#1E345A',
                  },
                  '& input::placeholder, & textarea::placeholder': {
                    color: '#6B7280',
                    opacity: 1,
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              sx={{
                backgroundColor: '#1E345A',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#2a4470',
                },
                '&:disabled': {
                  backgroundColor: 'action.disabledBackground',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};
