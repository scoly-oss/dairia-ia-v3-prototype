import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  Avatar
} from '@mui/material';
import { ChatProgressStep, PROGRESS_STEPS_CONFIG, ComparisonProgressState } from '../../types/chatProgress';

interface ChatProgressIndicatorProps {
  step: ChatProgressStep | null;
}

/**
 * Composant affichant la progression du traitement d'une requête chat
 * Utilise une barre de progression linéaire avec le message de l'étape en cours
 */
export const ChatProgressIndicator: React.FC<ChatProgressIndicatorProps> = ({ step }) => {
  if (!step) return null;

  const stepConfig = PROGRESS_STEPS_CONFIG[step] || { message: "Traitement en cours...", progress: 50 };

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
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <img src="/assets/logo.svg" alt="AI" style={{ width: '20px', height: '20px' }} />
        </Avatar>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            borderTopLeftRadius: 4,
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 32, 38, 0.6)' : '#ffffff',
            backdropFilter: 'blur(12px)',
            border: (theme) => `1px solid ${theme.custom.border}`,
            boxShadow: (theme) => theme.custom.shadows.sm,
            minWidth: 280,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <CircularProgress size={16} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {stepConfig.message}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stepConfig.progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: (theme) => theme.custom.gradients.primary,
              }
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

interface ComparisonProgressIndicatorProps {
  progress: ComparisonProgressState;
  model1Name?: string;
  model2Name?: string;
}

/**
 * Composant affichant la progression côte-à-côte pour le mode comparaison
 */
export const ComparisonProgressIndicator: React.FC<ComparisonProgressIndicatorProps> = ({
  progress,
  model1Name = 'Modèle 1',
  model2Name = 'Modèle 2'
}) => {
  const { model1Step, model2Step } = progress;

  // Ne rien afficher si aucune progression
  if (!model1Step && !model2Step) return null;

  const renderModelProgress = (step: ChatProgressStep | null, modelName: string) => {
    if (!step) return null;
    const stepConfig = PROGRESS_STEPS_CONFIG[step] || { message: "Traitement en cours...", progress: 50 };

    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            display: 'block',
            mb: 0.5
          }}
        >
          {modelName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={14} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            {stepConfig.message}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stepConfig.progress}
          sx={{
            height: 5,
            borderRadius: 2.5,
            backgroundColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2.5,
              background: (theme) => theme.custom.gradients.primary,
            }
          }}
        />
      </Box>
    );
  };

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
        maxWidth: { xs: '95%', sm: '90%', md: '85%' },
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <img src="/assets/logo.svg" alt="AI" style={{ width: '20px', height: '20px' }} />
        </Avatar>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            borderTopLeftRadius: 4,
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 32, 38, 0.6)' : '#ffffff',
            backdropFilter: 'blur(12px)',
            border: (theme) => `1px solid ${theme.custom.border}`,
            boxShadow: (theme) => theme.custom.shadows.sm,
            flex: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            Comparaison des modèles en cours...
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {renderModelProgress(model1Step, model1Name)}
            {renderModelProgress(model2Step, model2Name)}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatProgressIndicator;
