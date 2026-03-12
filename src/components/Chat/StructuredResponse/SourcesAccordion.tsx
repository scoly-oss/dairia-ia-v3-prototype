import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';

interface SourcesAccordionProps {
  sources: string[];
}

export const SourcesAccordion: React.FC<SourcesAccordionProps> = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.custom.border}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (theme) => theme.custom.surfaceHighlight,
          },
        }}
      >
        <MenuBookIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, color: 'text.secondary' }}>
          Sources juridiques ({sources.length})
        </Typography>
        <IconButton size="small" sx={{ p: 0 }}>
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              color: 'text.secondary',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 1.5 }}>
          {sources.map((source, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                py: 0.5,
                borderTop: index > 0 ? (theme) => `1px solid ${theme.custom.border}` : 'none',
                lineHeight: 1.6,
              }}
            >
              {source}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
