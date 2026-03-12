import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { OnboardingData } from '../../types/onboarding';
import { Step1ConventionCollective } from './steps/Step1ConventionCollective';
import { Step2Effectif } from './steps/Step2Effectif';
import { Step3Activite } from './steps/Step3Activite';
import onboardingService from '../../services/onboardingService';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    idcc: '',
    idccLabel: '',
    effectif: '',
    activite: '',
  });

  // Vérifier le statut d'onboarding à l'ouverture du modal
  React.useEffect(() => {
    const checkStatus = async () => {
      if (!open) return;

      try {
        const needsOnboarding = await onboardingService.checkOnboardingStatus();
        if (!needsOnboarding) {
          // L'entreprise est déjà onboardée, fermer silencieusement
          sessionStorage.removeItem('onboarding_draft');
          await onComplete();
          return;
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [open, onComplete]);

  // Sauvegarde brouillon dans sessionStorage
  React.useEffect(() => {
    const saved = sessionStorage.getItem('onboarding_draft');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  React.useEffect(() => {
    sessionStorage.setItem('onboarding_draft', JSON.stringify(data));
  }, [data]);

  const handleUpdate = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!data.activite.trim() || !data.effectif) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onboardingService.completeOnboarding({
        activite: data.activite,
        effectif: Number(data.effectif),
        default_idcc: data.idcc || undefined,
        default_idcc_label: data.idccLabel || undefined,
      });

      // Nettoyer le brouillon
      sessionStorage.removeItem('onboarding_draft');

      // Rafraîchir les données utilisateur
      await onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';

      // Si l'entreprise est déjà onboardée, fermer silencieusement et rafraîchir
      if (errorMessage.includes('déjà onboardée') || errorMessage.includes('already onboarded')) {
        sessionStorage.removeItem('onboarding_draft');
        await onComplete();
        return;
      }

      setError(errorMessage || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const getActiveStepIndex = (): number => {
    return currentStep - 1;
  };

  const stepProps = {
    data,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
    loading,
    error,
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 4,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h4" gutterBottom>
          Bienvenue chez Dairia
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pour commencer, nous avons besoin de quelques informations sur votre entreprise
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={getActiveStepIndex()} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Convention collective</StepLabel>
          </Step>
          <Step>
            <StepLabel>Effectif</StepLabel>
          </Step>
          <Step>
            <StepLabel>Activité</StepLabel>
          </Step>
        </Stepper>

        {/* Erreur globale */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading spinner */}
        {(loading || checkingStatus) && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        {/* Étapes */}
        {!loading && !checkingStatus && (
          <>
            {currentStep === 1 && <Step1ConventionCollective {...stepProps} />}
            {currentStep === 2 && <Step2Effectif {...stepProps} />}
            {currentStep === 3 && (
              <Step3Activite {...stepProps} onComplete={handleComplete} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
