import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { reviewRequestService, ReviewMessage, ReviewRequestUpdate } from '../services/reviewRequestService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TypingIndicator } from './Chat/TypingIndicator';
import { ChatInterface } from './Chat/ChatInterface';

interface Props {
  reviewRequestId: string;
  conversationTitle: string;
  onClose?: () => void;
  readOnly?: boolean;
  showAIChat?: boolean; // Nouveau prop pour contrôler l'affichage du chat IA
}

export const ReviewRequestChat: React.FC<Props> = ({ reviewRequestId, conversationTitle, onClose, readOnly = false, showAIChat = false }) => {
  // Utiliser le titre de la conversation dans le header
  const cardTitle = `Demande de relecture - ${conversationTitle}`;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Effet pour scroller quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effet pour scroller quand le composant est monté
  useEffect(() => {
    scrollToBottom();
  }, []);

  const loadMessages = React.useCallback(async () => {
    try {
      setError(null);

      const reviewMessages = await reviewRequestService.getReviewRequestMessages(reviewRequestId);

      // Valider les données reçues
      if (!Array.isArray(reviewMessages)) {
        throw new Error('Review messages is not an array');
      }

      // S'assurer que les messages sont triés par date
      const sortedReviewMessages = [...reviewMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Mettre à jour l'état
      setMessages(sortedReviewMessages);
      scrollToBottom();
    } catch (error) {
      console.error('[ReviewRequestChat] Error loading messages:', error);
      setError("Impossible de charger les messages");
      setMessages([]);
    }
  }, [reviewRequestId]);

  const messagesRef = useRef<ReviewMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const messageHandler = React.useCallback((update: ReviewRequestUpdate) => {
    if (update.type === 'typing') {
      // Gérer l'état de saisie
      const otherUser = update.data.userId !== user?.id;
      if (otherUser) {
        // Mettre à jour l'état de saisie dans l'interface
        const typingIndicator = document.getElementById(`typing-${update.data.userId}`);
        if (typingIndicator) {
          typingIndicator.style.display = update.data.isTyping ? 'block' : 'none';
        }
      }
    } else if (update.type === 'message') {
      // Masquer l'indicateur de saisie quand un message est reçu
      const typingIndicators = document.querySelectorAll('.typing-indicator');
      typingIndicators.forEach(indicator => {
        (indicator as HTMLElement).style.display = 'none';
      });

      // Vérifier si le message existe déjà
      const messageExists = messagesRef.current.some(msg => msg.id === update.data.id);

      if (!messageExists) {
        // S'assurer que le message a les informations de l'expéditeur
        if (update.data.sender?.first_name && update.data.sender?.last_name) {
          setMessages(prevMessages => [...prevMessages, update.data]);
        } else {
          // Si les informations de l'expéditeur sont manquantes, charger à nouveau les messages
          loadMessages();
        }
      }
    }
  }, [user?.id, loadMessages]);

  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const timeouts: NodeJS.Timeout[] = [];

    const initializeChat = async () => {
      const initId = `init-${Date.now()}`;      
      try {
        // Nettoyer l'ancienne souscription
        if (subscriptionRef.current) {
          subscriptionRef.current();
        }

        // Afficher le chargement après un court délai
        const loadingTimeout = setTimeout(() => {
          if (mounted) {
            setLoading(true);
          }
        }, 150);
        timeouts.push(loadingTimeout);

        // Charger les messages
        if (mounted) {
          await loadMessages();
        }

        // Configurer la nouvelle souscription
        if (mounted) {
          const unsubscribe = await reviewRequestService.subscribeToMessages(reviewRequestId, messageHandler);
          subscriptionRef.current = unsubscribe;
        }
      } catch (error) {
        console.error(`[${initId}][ReviewRequestChat.initializeChat] Error initializing chat:`, error);
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
    };
  }, [reviewRequestId, loadMessages, messageHandler]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    setError(null);
    
    // Désactiver l'indicateur de saisie
    await reviewRequestService.updateTypingStatus(reviewRequestId, false);

    try {
      await reviewRequestService.sendMessage(reviewRequestId, newMessage.trim());
      // Ne pas ajouter le message localement, il sera reçu via la souscription SSE
      setNewMessage('');
    } catch (error) {
      setError("Impossible d'envoyer le message");
      console.error('[ReviewRequestChat] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  // Récupérer l'ID de conversation d'origine
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const loadConversationId = async () => {
      try {
        const request = await reviewRequestService.getReviewRequest(reviewRequestId);
        if (request) {
          setConversationId(request.conversation_id);
        } else {
          console.error('Review request not found');
          setError('Impossible de charger la conversation');
        }
      } catch (error) {
        console.error('Error loading conversation ID:', error);
        setError('Erreur lors du chargement de la conversation');
      }
    };
    loadConversationId();
  }, [reviewRequestId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', gap: 2 }}>
      {showAIChat && conversationId && (
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Conversation avec l'IA"
          />
          <Divider />
          <CardContent sx={{ flex: 1, p: 0, overflow: 'hidden' }}>
            <ChatInterface conversationId={conversationId} isAdminView hideReviewButton />
          </CardContent>
        </Card>
      )}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              {cardTitle}
            </Typography>
            {readOnly && (
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: 'action.disabledBackground',
                  color: 'text.secondary',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              >
                Terminée
              </Typography>
            )}
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
        pt: 3, // Plus de padding en haut
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
          {/* Discussion avec l'avocat */}
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
                      <Typography variant="body1" sx={{ color: 'inherit' }}>
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

                    {message.sender_id !== user?.id && (
                      <div
                        id={`typing-${message.sender_id}`}
                        className="typing-indicator"
                        style={{ display: 'none', marginTop: '4px' }}
                      >
                        <TypingIndicator isTyping={true} />
                      </div>
                    )}
                  </Box>
                </ListItem>
              ))}
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
              if (!readOnly) {
                setNewMessage(e.target.value);
                // Notifier les autres utilisateurs que nous sommes en train d'écrire
                reviewRequestService.updateTypingStatus(reviewRequestId, true);
                // Arrêter l'indicateur de saisie après 3 secondes d'inactivité
                const timeoutId = setTimeout(() => {
                  reviewRequestService.updateTypingStatus(reviewRequestId, false);
                }, 3000);
                return () => clearTimeout(timeoutId);
              }
            }}
            onKeyPress={(e) => {
              if (!readOnly && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={readOnly ? "Cette conversation est terminée" : "Écrivez votre message..."}
            disabled={sending || readOnly}
            sx={{
              backgroundColor: readOnly ? 'action.disabledBackground' : 'inherit',
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
    </Box>
  );
};
