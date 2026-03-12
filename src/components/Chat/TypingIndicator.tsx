import React from 'react';
import { Box, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
`;

interface TypingIndicatorProps {
  isTyping: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping }) => {
  if (!isTyping) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        opacity: 0.7,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: '6px',
            height: '6px',
            backgroundColor: 'grey.500',
            borderRadius: '50%',
            animation: `${bounce} 1s infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </Box>
  );
};
