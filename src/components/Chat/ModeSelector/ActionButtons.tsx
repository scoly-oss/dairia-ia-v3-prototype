import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { ActionConfig } from '../../../types/responseMode';

interface ActionButtonsProps {
  actions: ActionConfig[];
  onSelect: (actionId: string, promptKey: string, label: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actions,
  onSelect
}) => {
  if (actions.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Aucune action disponible
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 1.5,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outlined"
          size="small"
          onClick={() => onSelect(action.id, action.promptKey, action.label)}
          startIcon={<DescriptionIcon fontSize="small" />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2,
            py: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: 1,
            maxWidth: '100%',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
              boxShadow: 2
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.3,
              textAlign: 'left'
            }}
          >
            {action.label}
          </Typography>
        </Button>
      ))}
    </Box>
  );
};

export default ActionButtons;
