import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Link,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const ForgotPassword: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
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
        position: 'relative',
        overflow: 'hidden',
        background: theme.palette.background.default,
      }}
    >
      {/* Background Blobs */}
      <Box
        className="blob"
        sx={{
          top: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,145,77,0.15) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
      <Box
        className="blob"
        sx={{
          bottom: '-10%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(44,62,80,0.3) 0%, rgba(0,0,0,0) 70%)',
          animationDelay: '-5s',
        }}
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/assets/logo.svg"
              alt="Dairia IA"
              style={{ maxWidth: '150px', height: 'auto' }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Votre expert juridique en droit social
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: (theme) => theme.custom.glass.background,
            backdropFilter: (theme) => theme.custom.glass.backdropFilter,
            border: (theme) => theme.custom.glass.border,
            borderRadius: 4,
            boxShadow: (theme) => theme.custom.shadows.md,
          }}
        >
          <Typography component="h2" variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Mot de passe oublié
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Si cet email existe dans notre système, un lien de récupération a été envoyé.
                Vérifiez votre boîte de réception (et vos spams).
              </Alert>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                fullWidth
                startIcon={<ArrowBackIcon />}
                sx={{ height: 48 }}
              >
                Retour à la connexion
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mb: 3, height: 48 }}
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
                  Retour à la connexion
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
