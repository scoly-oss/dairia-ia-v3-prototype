import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Link,
  useTheme,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const ResetPassword: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Supabase envoie un hash fragment avec access_token après le clic sur le lien
    // Format: #access_token=...&refresh_token=...&type=recovery
    const verifySession = async () => {
      try {
        // Supabase gère automatiquement le hash et établit la session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setError('Le lien de récupération est invalide ou a expiré.');
          setTokenValid(false);
        } else if (session) {
          setTokenValid(true);
        } else {
          // Vérifier si on a un hash dans l'URL (recovery link)
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            // Supabase devrait récupérer automatiquement le token
            // Attendre un moment pour que Supabase traite le hash
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setTokenValid(true);
            } else {
              setError('Le lien de récupération est invalide ou a expiré.');
              setTokenValid(false);
            }
          } else {
            setError('Aucun lien de récupération valide détecté. Veuillez demander un nouveau lien.');
            setTokenValid(false);
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Une erreur est survenue lors de la vérification du lien.');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, []);

  const validatePassword = (): string | null => {
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[a-z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une minuscule';
    }
    if (!/[0-9]/.test(password)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    if (password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      // Déconnecter après le changement de mot de passe
      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la réinitialisation du mot de passe.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Afficher un loader pendant la vérification
  if (isVerifying) {
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
        <CircularProgress />
      </Box>
    );
  }

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
          {success ? (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography component="h2" variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                Mot de passe modifié
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Votre mot de passe a été réinitialisé avec succès.
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleGoToLogin}
                sx={{ height: 48 }}
              >
                Se connecter
              </Button>
            </Box>
          ) : !tokenValid ? (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography component="h2" variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                Lien invalide
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ce lien de récupération n'est plus valide ou a expiré.
                Veuillez demander un nouveau lien de récupération.
              </Typography>
              <Button
                component={RouterLink}
                to="/forgot-password"
                variant="contained"
                fullWidth
                sx={{ height: 48 }}
              >
                Demander un nouveau lien
              </Button>
            </Box>
          ) : (
            <>
              <Typography component="h2" variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Nouveau mot de passe
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Choisissez un nouveau mot de passe pour votre compte.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Nouveau mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  helperText="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
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
                  {isLoading ? 'Modification...' : 'Réinitialiser le mot de passe'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      color: 'text.secondary',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Retour à la connexion
                  </Link>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
