import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { SplitChatLayout } from '../../components/Chat/SplitChatLayout';
import { LAYOUT } from '../../theme/constants';
import { useAuth } from '../../contexts/AuthContext';
import { conversationService } from '../../services/conversationService';
import { useLocation, useSearchParams } from 'react-router-dom';
import { reviewRequestService, ReviewRequest } from '../../services/reviewRequestService';

export const ClientChatPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [activeReviewRequestId, setActiveReviewRequestId] = useState<string | undefined>(undefined);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Détecter si on vient de configurer le paiement (trial activé)
  useEffect(() => {
    if (searchParams.get('trial_started') === 'true') {
      setShowTrialSuccess(true);
      // Nettoyer le query param après l'avoir détecté
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('trial_started');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');
    const reviewRequestId = params.get('reviewRequest');

    const loadConversationAndReviewRequest = async () => {
      if (conversationId) {
        try {
          // Vérifier si la conversation existe
          const conversations = await conversationService.getConversations(user?.id);
          const conversation = conversations.find(conv => conv.id === conversationId);

          if (conversation) {
            setSelectedConversationId(conversationId);
            setConversationTitle(conversation.title || '');

            // Si pas de reviewRequestId dans l'URL, chercher les demandes de relecture
            if (!reviewRequestId) {
              const reviewRequests = await reviewRequestService.getReviewRequests();
              const conversationRequests = reviewRequests.filter((req: ReviewRequest) => req.conversation_id === conversationId);

              // D'abord chercher une demande active (pending ou in_progress)
              const activeRequest = conversationRequests.find((req: ReviewRequest) =>
                ['pending', 'in_progress'].includes(req.status)
              );

              // Si pas de demande active, prendre la dernière demande complétée
              const lastCompletedRequest = conversationRequests
                .filter((req: ReviewRequest) => req.status === 'completed')
                .sort((a: ReviewRequest, b: ReviewRequest) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

              const requestToShow = activeRequest || lastCompletedRequest;

              if (requestToShow) {
                setActiveReviewRequestId(requestToShow.id);
                // Mettre à jour l'URL avec l'ID de la demande de relecture
                const newUrl = `/chat?conversation=${conversationId}&reviewRequest=${requestToShow.id}`;
                window.history.replaceState({}, '', newUrl);
              }
            }
          } else {
            console.warn('Conversation not found, redirecting to chat page');
            window.history.replaceState({}, '', '/chat');
            setSelectedConversationId(undefined);
          }
        } catch (error) {
          console.error('Error loading conversation and review request:', error);
          window.history.replaceState({}, '', '/chat');
          setSelectedConversationId(undefined);
        }
      }

      // Si un reviewRequestId est spécifié dans l'URL
      if (reviewRequestId) {
        try {
          const reviewRequest = await reviewRequestService.getReviewRequest(reviewRequestId);
          if (reviewRequest) {
            setActiveReviewRequestId(reviewRequestId);
          }
        } catch (error) {
          console.error('Error loading review request:', error);
        }
      }
    };

    loadConversationAndReviewRequest();
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
            reviewRequestId={activeReviewRequestId}
            conversationTitle={conversationTitle}
            onConversationCreated={handleConversationCreated}
          />
        </Box>

      </Box>

      {/* Snackbar pour la confirmation du trial */}
      <Snackbar
        open={showTrialSuccess}
        autoHideDuration={6000}
        onClose={() => setShowTrialSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowTrialSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontSize: '1.1rem' }}
        >
          🎉 Paiement configuré avec succès ! Votre essai gratuit de 7 jours commence maintenant.
        </Alert>
      </Snackbar>

    </Box>
  );
};
