import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ResponseModeConfig, ResponseModeType } from '../../../types/responseMode';

interface ModeOptionButtonProps {
  mode: ResponseModeConfig;
  onClick: () => void;
  selected?: boolean;
}

// Icônes par type de mode
const getModeIcon = (type: ResponseModeType) => {
  switch (type) {
    case 'recherche':
      return <SearchIcon fontSize="small" />;
    case 'conseil':
      return <LightbulbIcon fontSize="small" />;
    case 'redaction':
      return <EditNoteIcon fontSize="small" />;
    default:
      return null;
  }
};

export const ModeOptionButton: React.FC<ModeOptionButtonProps> = ({
  mode,
  onClick,
  selected = false
}) => {
  return (
    <Button
      variant={selected ? 'contained' : 'outlined'}
      size="small"
      onClick={onClick}
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        px: 2,
        py: 0.75,
        minWidth: 'auto',
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: selected ? 'primary.main' : 'action.hover'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {getModeIcon(mode.type)}
        <Typography variant="body2" sx={{ fontWeight: selected ? 600 : 400 }}>
          {mode.label}
        </Typography>
        {mode.hasSubCategories && (
          <ArrowDropDownIcon fontSize="small" sx={{ ml: -0.5 }} />
        )}
      </Box>
    </Button>
  );
};

export default ModeOptionButton;
