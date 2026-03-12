import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  SupportAgent as SupportAgentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import { supportContactService } from '../services/supportContactService';

/**
 * SetupPayment page
 * This page is shown to new users after signup to collect payment information
 * Users will be redirected to Stripe Checkout with a 7-day trial
 */
export const SetupPayment: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canceled = searchParams.get('canceled') === 'true';

  // State for support contact
  const [supportContactDialogOpen, setSupportContactDialogOpen] = useState(false);
  const [supportContactRequested, setSupportContactRequested] = useState(false);
  const [supportContactLoading, setSupportContactLoading] = useState(false);

  useEffect(() => {
    // Check if user already has access
    checkSubscriptionStatus();
    // Check if user already requested support contact
    checkSupportContactStatus();
  }, []);

  const checkSupportContactStatus = async () => {
    try {
      const status = await supportContactService.checkStatus();
      setSupportContactRequested(status.requested);
    } catch (err) {
      console.error('Error checking support contact status:', err);
    }
  };

  const handleSupportContactClick = async () => {
    if (supportContactRequested) {
      // If already requested, just open the dialog
      setSupportContactDialogOpen(true);
      return;
    }

    try {
      setSupportContactLoading(true);
      const result = await supportContactService.requestSupportContact();
      if (result.success || result.alreadyRequested) {
        setSupportContactRequested(true);
      }
      setSupportContactDialogOpen(true);
    } catch (err) {
      console.error('Error requesting support contact:', err);
      // Still open the dialog even if notification fails
      setSupportContactDialogOpen(true);
    } finally {
      setSupportContactLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();

      // If user already has access, redirect to chat
      if (status.canAccess && !status.needsPaymentSetup) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
    }
  };

  const handleSetupPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      await subscriptionService.redirectToTrialCheckout();
    } catch (err) {
      console.error('Error setting up payment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la configuration du paiement'
      );
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            p: 4,
            background: (theme) => theme.custom?.glass?.background || 'rgba(255, 255, 255, 0.8)',
            backdropFilter: (theme) => theme.custom?.glass?.backdropFilter || 'blur(10px)',
            border: (theme) => theme.custom?.glass?.border || '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            boxShadow: (theme) => theme.custom?.shadows?.md || theme.shadows[3],
          }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 3,
                }}
              >
                <CreditCardIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h4" gutterBottom fontWeight={600}>
                Bienvenue sur Dairia AI
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Pour commencer à utiliser Dairia AI, veuillez configurer votre mode de paiement.
              </Typography>
            </Box>

            {/* Banner for support contact */}
            <Alert
              severity="info"
              icon={<SupportAgentIcon />}
              sx={{ mb: 3 }}
              action={
                supportContactRequested ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setSupportContactDialogOpen(true)}
                    sx={{
                      bgcolor: 'info.dark',
                      color: 'white',
                      '&:hover': { bgcolor: 'info.main' },
                    }}
                  >
                    Voir les contacts
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSupportContactClick}
                    disabled={supportContactLoading}
                    startIcon={supportContactLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
                    sx={{
                      bgcolor: 'info.dark',
                      color: 'white',
                      '&:hover': { bgcolor: 'info.main' },
                    }}
                  >
                    Contacter le support
                  </Button>
                )
              }
            >
              <Typography variant="body2">
                Vous ne pouvez pas configurer de CB ? Contactez notre support pour obtenir un accès gratuit de 7 jours.
              </Typography>
            </Alert>

            {canceled && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Le paiement a été annulé. Vous devez configurer un mode de paiement pour utiliser Dairia AI.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  <strong>7 jours d'essai gratuit</strong> - Profitez de toutes les fonctionnalités
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  <strong>Sans engagement</strong> - Annulez à tout moment
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  <strong>Paiement sécurisé</strong> - Vos informations sont protégées par Stripe
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Vous ne serez <strong>pas facturé</strong> pendant les 7 premiers jours.
                La facturation commencera uniquement à l'issue de la période d'essai.
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSetupPayment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
              sx={{
                height: 56,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {loading ? 'Redirection...' : 'Configurer le paiement'}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              display="block"
              sx={{ mt: 2 }}
            >
              En continuant, vous acceptez nos{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
                conditions d'utilisation
              </a>
              {' '}et notre{' '}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
                politique de confidentialité
              </a>
              .
            </Typography>
          </CardContent>
        </Card>
      </Container>

      {/* Support Contact Dialog */}
      <Dialog
        open={supportContactDialogOpen}
        onClose={() => setSupportContactDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <SupportAgentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6">Contacter le support</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Notre équipe est disponible pour vous aider à obtenir un accès gratuit de 7 jours.
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EmailIcon />}
              href="mailto:s.coly@dairia-avocats.com?subject=Demande%20d'accès%20gratuit%207%20jours"
              sx={{
                justifyContent: 'flex-start',
                py: 1.5,
                px: 2,
                textTransform: 'none',
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>
                  Email
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  s.coly@dairia-avocats.com
                </Typography>
              </Box>
            </Button>

            <Divider>ou</Divider>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<PhoneIcon />}
              href="tel:+33672422486"
              sx={{
                justifyContent: 'flex-start',
                py: 1.5,
                px: 2,
                textTransform: 'none',
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>
                  Téléphone
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  06 72 42 24 86
                </Typography>
              </Box>
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setSupportContactDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
