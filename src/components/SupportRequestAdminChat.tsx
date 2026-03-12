import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton as MuiIconButton,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { supportRequestService, SupportMessage, SupportRequestUpdate, SupportRequest } from '../services/supportRequestService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TypingIndicator } from './Chat/TypingIndicator';

interface Props {
  supportRequestId: string;
  clientName: string;
  onClose?: () => void;
  readOnly?: boolean;
}

export const SupportRequestAdminChat: React.FC<Props> = ({ supportRequestId, clientName, onClose, readOnly = false }) => {
  const cardTitle = `Support - ${clientName}`;
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [supportRequest, setSupportRequest] = useState<SupportRequest | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<SupportMessage[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const supportMessages = await supportRequestService.getSupportRequestMessages(supportRequestId);

      if (!Array.isArray(supportMessages)) {
        throw new Error('Support messages is not an array');
      }

      const sortedMessages = [...supportMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('[SupportRequestAdminChat] Error loading messages:', error);
      setError("Impossible de charger les messages");
      setMessages([]);
    }
  }, [supportRequestId, scrollToBottom]);

  const messageHandler = useCallback((update: SupportRequestUpdate) => {
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
    } else if (update.type === 'support_request' || update.type === 'UPDATE') {
      setSupportRequest(update.data as SupportRequest);
    }
  }, [user?.id, loadMessages]);

  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const timeouts: NodeJS.Timeout[] = [];

    const initializeChat = async () => {
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current();
        }

        const loadingTimeout = setTimeout(() => {
          if (mounted) {
            setLoading(true);
          }
        }, 150);
        timeouts.push(loadingTimeout);

        if (mounted) {
          await loadMessages();
          const request = await supportRequestService.getSupportRequest(supportRequestId);
          if (request) {
            setSupportRequest(request);
          }
        }

        if (mounted) {
          const unsubscribe = await supportRequestService.subscribeToMessages(supportRequestId, messageHandler);
          subscriptionRef.current = unsubscribe;
        }
      } catch (error) {
        console.error('[SupportRequestAdminChat] Error initializing chat:', error);
        if (mounted) {
          setError("Erreur lors de l'initialisation du chat");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      timeouts.forEach(clearTimeout);
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [supportRequestId, loadMessages, messageHandler]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);

    await supportRequestService.updateTypingStatus(supportRequestId, false);

    try {
      const sentMessage = await supportRequestService.sendMessage(supportRequestId, newMessage.trim());
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
      console.error('[SupportRequestAdminChat] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supportRequestService.updateTypingStatus(supportRequestId, true);

    typingTimeoutRef.current = setTimeout(() => {
      supportRequestService.updateTypingStatus(supportRequestId, false);
    }, 3000);
  }, [supportRequestId]);

  const formatMessageDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  const getStatusChip = () => {
    if (!supportRequest) return null;

    switch (supportRequest.status) {
      case 'pending':
        return <Chip label="En attente" color="warning" size="small" />;
      case 'in_progress':
        return <Chip label="En cours" color="info" size="small" />;
      case 'completed':
        return <Chip label="Terminée" color="success" size="small" />;
      default:
        return null;
    }
  };

  const isCompleted = supportRequest?.status === 'completed' || readOnly;

  return (
    <Box sx={{ height: '100%', display: 'flex', gap: 2 }}>
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="span">
                {cardTitle}
              </Typography>
              {getStatusChip()}
            </Box>
          }
          action={onClose ? (
            <MuiIconButton onClick={onClose}>
              <CloseIcon />
            </MuiIconButton>
          ) : undefined}
        />
        <Divider />
        <CardContent sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
          pt: 3,
          px: 2
        }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Typography>Chargement des messages...</Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <Box
              ref={messagesContainerRef}
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                p: 2,
              }}
            >
              <Box sx={{ marginTop: 'auto' }}>
                <List>
                  {messages.map((message) => (
                    <ListItem
                      key={message.id}
                      sx={{
                        justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box sx={{
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.sender_id === user?.id ? 'flex-end' : 'flex-start'
                      }}>
                        <Paper
                          elevation={1}
                          sx={{
                            bgcolor: message.sender_id === user?.id ? '#1E345A' : '#f5f5f5',
                            color: message.sender_id === user?.id ? '#ffffff' : '#1e293b',
                            p: 2,
                            borderRadius: message.sender_id === user?.id
                              ? '20px 20px 5px 20px'
                              : '20px 20px 20px 5px',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              [message.sender_id === user?.id ? 'right' : 'left']: -8,
                              width: 0,
                              height: 0,
                              borderStyle: 'solid',
                              borderWidth: message.sender_id === user?.id
                                ? '0 0 8px 8px'
                                : '0 8px 8px 0',
                              borderColor: message.sender_id === user?.id
                                ? 'transparent transparent transparent #1E345A'
                                : 'transparent #f5f5f5 transparent transparent'
                            }
                          }}
                        >
                          <Typography variant="body1" sx={{ color: 'inherit', whiteSpace: 'pre-wrap' }}>
                            {message.content}
                          </Typography>
                        </Paper>

                        <Box
                          sx={{
                            mt: 0.5,
                            display: 'flex',
                            flexDirection: message.sender_id === user?.id ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            {message.sender?.first_name && message.sender?.last_name
                              ? `${message.sender.first_name} ${message.sender.last_name}`
                              : (message.sender?.email || 'Utilisateur')}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {formatMessageDate(message.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                  {isOtherTyping && (
                    <ListItem sx={{ justifyContent: 'flex-start' }}>
                      <TypingIndicator isTyping={true} />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => {
                if (!isCompleted) {
                  handleTyping(e.target.value);
                }
              }}
              onKeyPress={(e) => {
                if (!isCompleted && e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isCompleted ? "Cette conversation est terminée" : "Écrivez votre message..."}
              disabled={sending || isCompleted}
              sx={{
                backgroundColor: isCompleted ? 'action.disabledBackground' : 'inherit',
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={sending || !newMessage.trim() || isCompleted}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
