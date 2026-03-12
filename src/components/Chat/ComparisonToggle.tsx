import React from 'react';
import {
  Box,
  Switch,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

interface ComparisonToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  model1?: string;
  model2?: string;
  disabled?: boolean;
}

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  enabled,
  onToggle,
  model1 = 'GPT-5.1',
  model2 = 'GPT-5.2',
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  return (
    <Tooltip
      title={enabled
        ? `Mode comparaison actif: ${model1} vs ${model2}`
        : 'Activer la comparaison de modèles IA'
      }
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: enabled ? 'primary.50' : 'transparent',
          border: '1px solid',
          borderColor: enabled ? 'primary.200' : 'divider',
          transition: 'all 0.2s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            bgcolor: disabled ? 'transparent' : enabled ? 'primary.100' : 'action.hover',
          },
        }}
        onClick={(e) => {
          if (!disabled) {
            e.stopPropagation();
            onToggle(!enabled);
          }
        }}
      >
        <CompareArrowsIcon
          sx={{
            fontSize: 18,
            color: enabled ? 'primary.main' : 'text.secondary',
          }}
        />

        <Typography
          variant="body2"
          sx={{
            fontWeight: enabled ? 600 : 400,
            color: enabled ? 'primary.main' : 'text.secondary',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          Comparer
        </Typography>

        <Switch
          size="small"
          checked={enabled}
          onChange={handleChange}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: 'primary.main',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'primary.main',
            },
          }}
        />

        {enabled && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
            <Chip
              label={model1}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'primary.100',
                color: 'primary.800',
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
              vs
            </Typography>
            <Chip
              label={model2}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'secondary.100',
                color: 'secondary.800',
              }}
            />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default ComparisonToggle;
