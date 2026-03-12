import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { claudeStatusService, ClaudeErrorType } from '../../services/claudeStatusService';

interface ClaudeStatusAlertProps {
  errorType: ClaudeErrorType;
  canSubscribe: boolean;
}

/**
 * Composant d'alerte affichant un problème avec le service Claude
 * Propose à l'utilisateur de s'inscrire pour être notifié du retour du service
 */
export const ClaudeStatusAlert: React.FC<ClaudeStatusAlertProps> = ({
  errorType,
  canSubscribe,
}) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Messages selon le type d'erreur
  const getErrorMessage = () => {
    switch (errorType) {
      case 'prompt_too_long':
        return {
          title: 'Conversation trop longue',
          description: 'Votre conversation dépasse la limite de contexte. Veuillez commencer une nouvelle conversation pour continuer.',
          icon: <ErrorOutlineIcon sx={{ fontSize: 24, color: 'warning.main' }} />
        };
      case 'overloaded':
        return {
          title: "L'assistant IA est temporairement surchargé",
          description: 'Un moteur IA utilisé pour vous répondre rencontre des difficultés techniques. Veuillez réessayer dans quelques minutes.',
          icon: <ErrorOutlineIcon sx={{ fontSize: 24, color: 'error.main' }} />
        };
      case 'service_unavailable':
      default:
        return {
          title: "L'assistant IA est temporairement indisponible",
          description: 'Un moteur IA utilisé pour vous répondre rencontre des difficultés techniques. Veuillez réessayer dans quelques minutes.',
          icon: <ErrorOutlineIcon sx={{ fontSize: 24, color: 'error.main' }} />
        };
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError(null);

    try {
      const response = await claudeStatusService.subscribe(errorType);
      setSubscribed(true);

      if (response.alreadySubscribed) {
        // Already subscribed, show different message handled by state
      }
    } catch (err: unknown) {
      console.error('Erreur lors de l\'inscription:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const { title, description, icon } = getErrorMessage();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        maxWidth: '100%',
        mt: 2,
      }}
    >
      <Box sx={{
        maxWidth: { xs: '90%', sm: '85%', md: '75%' },
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(244, 67, 54, 0.15)'
              : 'rgba(244, 67, 54, 0.1)',
            border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)'}`,
          }}
        >
          {icon}
        </Avatar>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            borderTopLeftRadius: 4,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(30, 32, 38, 0.8)'
              : '#ffffff',
            backdropFilter: 'blur(12px)',
            border: (theme) => `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(244, 67, 54, 0.3)'
              : 'rgba(244, 67, 54, 0.2)'}`,
            boxShadow: (theme) => theme.custom?.shadows?.sm || '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: 300,
            maxWidth: 500,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: errorType === 'prompt_too_long' ? 'warning.main' : 'error.main',
              mb: 1
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: canSubscribe ? 2 : 0, lineHeight: 1.6 }}
          >
            {description}
          </Typography>

          {/* Section d'inscription aux notifications */}
          {canSubscribe && !subscribed && (
            <Box sx={{ mt: 2 }}>
              <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Collapse>

              <Button
                variant="outlined"
                size="small"
                startIcon={isSubscribing ? <CircularProgress size={16} /> : <NotificationsActiveIcon />}
                onClick={handleSubscribe}
                disabled={isSubscribing}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  }
                }}
              >
                {isSubscribing ? 'Inscription...' : 'Me prévenir quand c\'est rétabli'}
              </Button>
            </Box>
          )}

          {/* Confirmation d'inscription */}
          {subscribed && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.15)'
                  : 'rgba(76, 175, 80, 0.1)',
                border: (theme) => `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.3)'
                  : 'rgba(76, 175, 80, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                Vous recevrez un email dès que le service sera rétabli.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ClaudeStatusAlert;
