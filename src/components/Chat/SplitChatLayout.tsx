import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import { ChatInterfaceWrapper } from './ChatInterfaceWrapper';
import { ReviewRequestChat } from '../ReviewRequestChat';
import { reviewRequestService } from '../../services/reviewRequestService';
import { LAYOUT } from '../../theme/constants';

interface SplitChatLayoutProps {
  conversationId?: string;
  reviewRequestId?: string;
  conversationTitle: string;
  onConversationCreated?: (conversationId: string) => void;
  isAdminView?: boolean;
}

export const SplitChatLayout: React.FC<SplitChatLayoutProps> = ({
  conversationId,
  reviewRequestId,
  conversationTitle,
  onConversationCreated,
  isAdminView = false,
}) => {
  const [isReviewCompleted, setIsReviewCompleted] = useState(false);

  // State pour gérer le "session key" qui ne change que quand on change
  // explicitement de conversation (pas quand on crée une nouvelle)
  // Cela évite de réinitialiser le ChatContext et perdre lastComparisonResponse
  const [sessionKey, setSessionKey] = useState<string>(conversationId || 'new');
  const prevConversationIdRef = useRef<string | undefined>(conversationId);

  useEffect(() => {
    const prevId = prevConversationIdRef.current;

    // Si on passe de undefined à un ID (création de conversation), on garde le même key
    // pour ne pas perdre l'état du ChatContext (lastComparisonResponse, etc.)
    if (prevId === undefined && conversationId !== undefined) {
      // Ne pas changer le sessionKey lors de la création d'une conversation
      // Le composant garde son état
    } else if (conversationId !== prevId) {
      // Changement de conversation (ID → autre ID ou ID → undefined)
      // On change le key pour remonter le composant
      setSessionKey(conversationId || 'new');
    }

    prevConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (reviewRequestId) {
      reviewRequestService.getReviewRequest(reviewRequestId)
        .then(request => {
          setIsReviewCompleted(request?.status === 'completed');
        })
        .catch(error => {
          console.error('Error fetching review request status:', error);
        });
    }
  }, [reviewRequestId]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: `calc(100vh - ${LAYOUT.APPBAR_HEIGHT}px)`,
        width: '100%',
        gap: 2,
        p: { xs: 1, md: 2 },
        pt: { xs: 2, md: 3 },
        bgcolor: 'background.default',
      }}
    >
      {/* AI Chat Section */}
      <Paper
        elevation={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        <ChatInterfaceWrapper
          key={sessionKey}
          conversationId={conversationId}
          hideReviewButton={!!reviewRequestId}
          onConversationCreated={onConversationCreated}
          isAdminView={isAdminView}
        />
      </Paper>

      {/* Lawyer Chat Section - Shown for both active and completed review requests */}
      {reviewRequestId && (
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            opacity: isReviewCompleted ? 0.9 : 1,
          }}
        >
          <ReviewRequestChat
            reviewRequestId={reviewRequestId}
            conversationTitle={conversationTitle}
            readOnly={isReviewCompleted}
          />
        </Paper>
      )}
    </Box>
  );
};
