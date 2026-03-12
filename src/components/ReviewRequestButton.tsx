import React from 'react';
import { DSButton } from './design-system/DSButton';
import { RateReview as RateReviewIcon } from '@mui/icons-material';
import { reviewRequestService } from '../services/reviewRequestService';
import { useNavigate } from 'react-router-dom';

interface Props {
  conversationId: string;
  onRequestCreated: (requestId: string) => void;
}

export const ReviewRequestButton: React.FC<Props> = ({ conversationId, onRequestCreated }) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const reviewRequest = await reviewRequestService.createReviewRequest(conversationId);
      onRequestCreated(reviewRequest.id);

      // Rediriger vers la vue split avec le reviewRequestId
      navigate(`/chat?conversation=${conversationId}&reviewRequest=${reviewRequest.id}`);
    } catch (error) {
      console.error('ReviewRequestButton: Error creating review request:', error);
    }
  };

  return (
    <DSButton
      variant="secondary"
      onClick={handleClick}
      startIcon={<RateReviewIcon />}
      size="small"
    >
      Demander une relecture
    </DSButton>
  );
};
