import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { ModelResponse } from '../../services/chatService';

interface ComparisonMessageDisplayProps {
  model1Response?: ModelResponse;
  model2Response?: ModelResponse;
  isLoading?: boolean;
  model1Loading?: boolean;
  model2Loading?: boolean;
}

const ModelResponseCard: React.FC<{
  response?: ModelResponse;
  isLoading?: boolean;
  modelName: string;
  color: 'primary' | 'secondary';
}> = ({ response, isLoading, modelName, color }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 0,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${color}.200`,
        bgcolor: `${color}.50`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: `${color}.100`,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 18, color: `${color}.main` }} />
        <Chip
          label={modelName}
          size="small"
          color={color}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
              gap: 1,
            }}
          >
            <CircularProgress size={20} color={color} />
            <Typography variant="body2" color="text.secondary">
              {modelName} en cours de réponse...
            </Typography>
          </Box>
        ) : response ? (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              color: 'text.primary',
            }}
          >
            {response.message.content}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            En attente de réponse...
          </Typography>
        )}
      </Box>

      {/* Context count */}
      {response && response.context && response.context.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: `${color}.100` }}>
          <Typography variant="caption" color="text.secondary">
            {response.context.length} document(s) consulté(s)
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export const ComparisonMessageDisplay: React.FC<ComparisonMessageDisplayProps> = ({
  model1Response,
  model2Response,
  isLoading = false,
  model1Loading = false,
  model2Loading = false,
}) => {
  const model1Name = model1Response?.model || 'GPT-5.1';
  const model2Name = model2Response?.model || 'GPT-5.2';

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* User message indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Divider sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          Comparaison des réponses
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Box>

      {/* Side by side responses */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <ModelResponseCard
          response={model1Response}
          isLoading={isLoading || model1Loading}
          modelName={model1Name}
          color="primary"
        />
        <ModelResponseCard
          response={model2Response}
          isLoading={isLoading || model2Loading}
          modelName={model2Name}
          color="secondary"
        />
      </Box>
    </Box>
  );
};

export default ComparisonMessageDisplay;
