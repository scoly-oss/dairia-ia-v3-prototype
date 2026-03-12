import React from 'react';
import { TextField, Button, Box } from '@mui/material';
import { OnboardingStepProps } from '../../../types/onboarding';

interface Step3Props extends OnboardingStepProps {
  onComplete: () => Promise<void>;
}

export const Step3Activite: React.FC<Step3Props> = ({
  data,
  onUpdate,
  onBack,
  onComplete,
  loading,
}) => {
  return (
    <Box>
      <TextField
        label="Activité réelle de la société"
        multiline
        rows={4}
        fullWidth
        value={data.activite}
        onChange={(e) => onUpdate({ activite: e.target.value })}
        placeholder="Décrivez l'activité principale de votre entreprise..."
        helperText="Cette description nous aidera à mieux vous accompagner"
        sx={{ mb: 3 }}
      />

      <Box display="flex" justifyContent="space-between">
        <Button variant="text" onClick={onBack} disabled={loading}>
          Précédent
        </Button>
        <Button
          variant="contained"
          onClick={onComplete}
          disabled={!data.activite.trim() || loading}
        >
          {loading ? 'Enregistrement...' : 'Terminer'}
        </Button>
      </Box>
    </Box>
  );
};
