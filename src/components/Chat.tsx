import React, { useState } from 'react';
import { Grid, Box } from '@mui/material';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { ReviewRequestButton } from './ReviewRequestButton';
import { ReviewRequestChat } from './ReviewRequestChat';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  conversationId: string;
  conversationTitle: string;
}

export const Chat: React.FC<Props> = ({ conversationId, conversationTitle }) => {
  const { user } = useAuth();
  const [showReviewChat, setShowReviewChat] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);

  const handleReviewRequestCreated = (requestId: string) => {
    setReviewRequestId(requestId);
    setShowReviewChat(true);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={showReviewChat ? 8 : 12}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ChatMessages conversationId={conversationId} />
          <ChatInput conversationId={conversationId} />
        </Box>
      </Grid>

      {user?.role === 'client' && (
        <Grid item xs={12} md={showReviewChat ? 4 : 12}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ReviewRequestButton
              conversationId={conversationId}
              onRequestCreated={handleReviewRequestCreated}
            />
            {showReviewChat && reviewRequestId && (
              <ReviewRequestChat
                reviewRequestId={reviewRequestId}
                conversationTitle={conversationTitle}
              />
            )}
          </Box>
        </Grid>
      )}
    </Grid>
  );
};
