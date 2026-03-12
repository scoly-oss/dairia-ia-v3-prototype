import React from 'react';
import { Box, Typography } from '@mui/material';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface SectionCardProps {
  title: string;
  content?: string;
  items?: string[];
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, content, items }) => {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 1,
          fontSize: '0.875rem',
        }}
      >
        {title}
      </Typography>

      {content && (
        <Box sx={{ '& p:last-child': { mb: 0 }, '& p': { fontSize: '0.9rem', lineHeight: 1.7 } }}>
          <MarkdownRenderer content={content} isUser={false} />
        </Box>
      )}

      {items && items.length > 0 && (
        <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
          {items.map((item, index) => (
            <Typography
              key={index}
              component="li"
              variant="body2"
              sx={{ mb: 0.75, lineHeight: 1.7, color: 'text.primary' }}
            >
              {item}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};
