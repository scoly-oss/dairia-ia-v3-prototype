import React, { useState, useEffect } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { OnboardingStepProps } from '../../../types/onboarding';
import { IdccSelector } from '../../IdccSelector';
import { ConventionCollective } from '../../../types/collectiveAgreement';

export const Step1ConventionCollective: React.FC<OnboardingStepProps> = ({
  data,
  onUpdate,
  onNext,
}) => {
  // Convert stored idcc/idccLabel to ConventionCollective object
  const [selectedCC, setSelectedCC] = useState<ConventionCollective | null>(() => {
    if (data.idcc && data.idccLabel) {
      return { idcc: data.idcc, titre: data.idccLabel };
    }
    return null;
  });

  // Sync selectedCC with data when it changes externally (e.g., from session storage)
  useEffect(() => {
    if (data.idcc && data.idccLabel) {
      setSelectedCC({ idcc: data.idcc, titre: data.idccLabel });
    }
  }, [data.idcc, data.idccLabel]);

  const handleChange = (cc: ConventionCollective | null) => {
    setSelectedCC(cc);
    if (cc) {
      onUpdate({ idcc: cc.idcc, idccLabel: cc.titre });
    } else {
      onUpdate({ idcc: '', idccLabel: '' });
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <strong>(Optionnel)</strong> Saisissez le nom ou le code IDCC de la convention collective
        applicable à votre entreprise. Cette information permettra à l'assistant juridique
        de vous fournir des réponses adaptées à votre secteur d'activité.
      </Typography>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Exemples : Syntec, HCR, métallurgie, transport routier, IDCC 1486...
      </Typography>

      <IdccSelector
        value={selectedCC}
        onChange={handleChange}
        label="Convention collective"
        placeholder="Ex: Syntec, métallurgie, IDCC 1486..."
        helperText="Saisissez le nom ou le code IDCC de votre convention collective"
      />

      <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={onNext}
        >
          Suivant
        </Button>
      </Box>
    </Box>
  );
};
