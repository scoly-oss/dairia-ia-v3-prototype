import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  WorkOff as WorkOffIcon,
  Security as SecurityIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface WelcomeScreenProps {
  onQuickAction: (text: string) => void;
}

const quickActions = [
  { label: 'Calcul indemnités licenciement', icon: <GavelIcon sx={{ fontSize: 18 }} /> },
  { label: 'Clause de non-concurrence', icon: <SecurityIcon sx={{ fontSize: 18 }} /> },
  { label: 'Rupture conventionnelle', icon: <DescriptionIcon sx={{ fontSize: 18 }} /> },
  { label: 'Procédure disciplinaire', icon: <AccountBalanceIcon sx={{ fontSize: 18 }} /> },
  { label: 'Congés payés et RTT', icon: <WorkOffIcon sx={{ fontSize: 18 }} /> },
  { label: 'Délais de préavis', icon: <EventNoteIcon sx={{ fontSize: 18 }} /> },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onQuickAction }) => {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.email?.split('@')[0] || '';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        px: 3,
        py: 6,
        textAlign: 'center',
        maxWidth: 640,
        mx: 'auto',
      }}
    >
      {/* Greeting */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: 'text.primary',
        }}
      >
        Bonjour{firstName ? ` ${firstName}` : ''}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 400,
          color: 'text.secondary',
          mb: 5,
        }}
      >
        Comment puis-je vous aider ?
      </Typography>

      {/* Quick Action Chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'center',
        }}
      >
        {quickActions.map((action) => (
          <Chip
            key={action.label}
            label={action.label}
            icon={action.icon}
            onClick={() => onQuickAction(action.label)}
            sx={{
              py: 2.5,
              px: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '12px',
              border: (theme) => `1px solid ${theme.custom.border}`,
              backgroundColor: '#ffffff',
              color: 'text.primary',
              transition: 'all 0.2s ease-in-out',
              '& .MuiChip-icon': {
                color: 'primary.main',
              },
              '&:hover': {
                backgroundColor: (theme) => theme.custom.surfaceHighlight,
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(232, 132, 44, 0.15)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
