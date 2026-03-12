import React from 'react';
import { Box, Chip } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';

interface FollowUpPillsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export const FollowUpPills: React.FC<FollowUpPillsProps> = ({ questions, onSelect }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
      {questions.map((question, index) => (
        <Chip
          key={index}
          label={question}
          icon={<HelpIcon sx={{ fontSize: 16 }} />}
          onClick={() => onSelect(question)}
          size="small"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: '8px',
            border: (theme) => `1px solid ${theme.custom.border}`,
            backgroundColor: '#ffffff',
            color: 'text.secondary',
            '& .MuiChip-icon': {
              color: 'primary.main',
            },
            '&:hover': {
              backgroundColor: (theme) => theme.custom.surfaceHighlight,
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        />
      ))}
    </Box>
  );
};
