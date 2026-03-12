import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  Link,
  useTheme
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import GoogleIcon from '@mui/icons-material/Google';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login, error, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !error) {
      navigate('/chat');
    }
    if (error) {
      setLoginError(error);
    }
  }, [user, error, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login({ email, password });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('Une erreur est survenue lors de la connexion');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setLoginError(null);
    try {
      // Stocker le contexte dans localStorage (Supabase ne préserve pas les query params)
      sessionStorage.setItem('oauth_context', 'login');
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('Une erreur est survenue lors de la connexion avec Google');
      }
      setGoogleLoading(false);
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
          <Typography component="h2" variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
            Connexion
          </Typography>

          {(error || loginError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {error || loginError}
            </Alert>
          )}

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
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                }}
              >
                Mot de passe oublié ?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoggingIn || googleLoading}
              sx={{ mb: 2, height: 48 }}
            >
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Divider sx={{ my: 3, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                OU
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn || googleLoading}
              sx={{
                mb: 3,
                height: 48,
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  background: (theme) => theme.custom.surfaceHighlight
                }
              }}
            >
              Continuer avec Google
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Pas encore de compte ?{' '}
                <Link
                  component={RouterLink}
                  to="/signup"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Créer un compte
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
