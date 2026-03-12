import React from 'react';
import { Box, Typography } from '@mui/material';

interface SynthesisCardProps {
  content: string;
}

export const SynthesisCard: React.FC<SynthesisCardProps> = ({ content }) => {
  return (
    <Box
      sx={{
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
        pl: 2,
        py: 1,
        backgroundColor: (theme) => theme.custom.surfaceHighlight,
        borderRadius: '0 8px 8px 0',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'primary.main',
          letterSpacing: '0.05em',
          mb: 0.5,
          display: 'block',
        }}
      >
        Rappel des faits
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7 }}>
        {content}
      </Typography>
    </Box>
  );
};
