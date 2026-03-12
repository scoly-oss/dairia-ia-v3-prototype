import React from 'react';
import { TextField, Button, Box } from '@mui/material';
import { OnboardingStepProps } from '../../../types/onboarding';

export const Step2Effectif: React.FC<OnboardingStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
}) => {
  return (
    <Box>
      <TextField
        label="Effectif de la société"
        type="number"
        fullWidth
        value={data.effectif}
        onChange={(e) => onUpdate({ effectif: parseInt(e.target.value, 10) || '' })}
        inputProps={{ min: 1 }}
        helperText="Nombre de salariés"
        sx={{ mb: 3 }}
      />

      <Box display="flex" justifyContent="space-between">
        <Button variant="text" onClick={onBack}>
          Précédent
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!data.effectif || data.effectif < 1}
        >
          Suivant
        </Button>
      </Box>
    </Box>
  );
};
