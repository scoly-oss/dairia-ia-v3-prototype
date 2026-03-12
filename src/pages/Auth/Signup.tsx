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
  useTheme,
  Avatar,
  CircularProgress,
  Tooltip,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { API_CONFIG } from '../../services/apiConfig';
import GoogleIcon from '@mui/icons-material/Google';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface OAuthPendingInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { signup, error, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // OAuth pending signup state
  const [isOAuthPending, setIsOAuthPending] = useState(false);
  const [oauthUserInfo, setOAuthUserInfo] = useState<OAuthPendingInfo | null>(null);

  // Email confirmation pending state
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Détecter si c'est un signup OAuth en attente
  useEffect(() => {
    const oauthPending = searchParams.get('oauth_pending');
    const storedOAuthInfo = sessionStorage.getItem('oauth_pending_signup');

    if (oauthPending === 'true' && storedOAuthInfo) {
      try {
        const oauthInfo: OAuthPendingInfo = JSON.parse(storedOAuthInfo);
        console.log('[Signup] OAuth pending signup detected:', oauthInfo);
        setIsOAuthPending(true);
        setOAuthUserInfo(oauthInfo);
        // Pré-remplir les champs avec les infos Google
        setEmail(oauthInfo.email);
        setFirstName(oauthInfo.firstName);
        setLastName(oauthInfo.lastName);
      } catch (e) {
        console.error('[Signup] Error parsing OAuth info:', e);
        sessionStorage.removeItem('oauth_pending_signup');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !error) {
      // After signup, redirect to setup payment
      navigate('/setup-payment');
    }
    if (error) {
      setSignupError(error);
    }
  }, [user, error, navigate]);

  const validateForm = (): string | null => {
    if (!companyName.trim()) {
      return 'Le nom de l\'entreprise est requis';
    }

    if (!email) {
      return 'Email est requis';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email invalide';
    }

    if (!phone.trim()) {
      return 'Le numéro de téléphone est requis';
    }

    // Validation basique du téléphone (format français ou international)
    const phoneRegex = /^(\+?[0-9]{1,4})?[0-9\s\-.]{8,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Numéro de téléphone invalide';
    }

    // Pour OAuth, on ne vérifie pas le mot de passe
    if (!isOAuthPending) {
      if (!password) {
        return 'Mot de passe est requis';
      }

      if (password.length < 8) {
        return 'Le mot de passe doit contenir au moins 8 caractères';
      }

      // Vérifier la complexité du mot de passe
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      }

      if (password !== confirmPassword) {
        return 'Les mots de passe ne correspondent pas';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const validationError = validateForm();
    if (validationError) {
      setSignupError(validationError);
      return;
    }

    setIsSigningUp(true);

    try {
      if (isOAuthPending) {
        // Pour OAuth, appeler oauth-complete avec le nom de l'entreprise
        console.log('[Signup] Completing OAuth signup with company name:', companyName.trim());

        // Récupérer la session Supabase active
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session OAuth expirée. Veuillez réessayer.');
        }

        const response = await fetch(`${API_CONFIG.endpoints.auth}/oauth-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
            companyName: companyName.trim(),
            phone: phone.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la création du compte');
        }

        // Nettoyer le localStorage
        sessionStorage.removeItem('oauth_pending_signup');

        // Forcer le refresh de la session pour mettre à jour l'état utilisateur
        // On recharge la page pour que AuthContext récupère les nouvelles données
        window.location.href = '/setup-payment';
      } else {
        // Signup classique avec email/password
        await signup({
          email,
          password,
          role: 'client',
          firstName,
          lastName,
          companyName: companyName.trim(),
          phone: phone.trim(),
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error) {
        // Handle email confirmation required
        if (error.message === 'EMAIL_CONFIRMATION_REQUIRED') {
          setPendingEmail(email);
          setPendingConfirmation(true);
          return;
        }
        setSignupError(error.message);
      } else {
        setSignupError('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setSignupError(null);
    try {
      // Stocker le contexte dans localStorage (Supabase ne préserve pas les query params)
      sessionStorage.setItem('oauth_context', 'signup');
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
      console.error('Google signup error:', error);
      if (error instanceof Error) {
        setSignupError(error.message);
      } else {
        setSignupError('Une erreur est survenue lors de l\'inscription avec Google');
      }
      setGoogleLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (error) throw error;
      setResendSuccess(true);
    } catch (error) {
      console.error('Resend email error:', error);
      setSignupError('Erreur lors du renvoi de l\'email');
    } finally {
      setIsResending(false);
    }
  };

  // Show email confirmation pending screen
  if (pendingConfirmation) {
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

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: (theme) => theme.custom.glass.background,
              backdropFilter: (theme) => theme.custom.glass.backdropFilter,
              border: (theme) => theme.custom.glass.border,
              borderRadius: 4,
              boxShadow: (theme) => theme.custom.shadows.md,
            }}
          >
            <MarkEmailReadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />

            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
              Vérifiez votre email
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Un email de confirmation a été envoyé à <strong>{pendingEmail}</strong>.
              Cliquez sur le lien dans l'email pour activer votre compte.
            </Typography>

            {signupError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
                {signupError}
              </Alert>
            )}

            {resendSuccess && (
              <Alert severity="success" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
                Email renvoyé avec succès !
              </Alert>
            )}

            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={isResending}
              startIcon={isResending ? <CircularProgress size={16} /> : null}
              sx={{ mb: 2 }}
            >
              {isResending ? 'Envoi...' : 'Renvoyer l\'email'}
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ mb: 2 }}
            >
              Retour à la connexion
            </Button>

            <Typography variant="caption" color="text.secondary">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams.
            </Typography>
          </Paper>
        </Container>
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

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
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
          {isOAuthPending && oauthUserInfo?.avatarUrl && (
            <Avatar
              src={oauthUserInfo.avatarUrl}
              alt={oauthUserInfo.firstName}
              sx={{ width: 64, height: 64, mb: 2 }}
            />
          )}

          <Typography component="h2" variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            {isOAuthPending ? 'Finaliser votre inscription' : 'Créer un compte'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {isOAuthPending
              ? `Bienvenue ${oauthUserInfo?.firstName || ''} ! Saisissez le nom de votre entreprise pour continuer.`
              : '🎁 Essai gratuit de 7 jours - Sans engagement'}
          </Typography>

          {(error || signupError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {error || signupError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="companyName"
              label="Nom de l'entreprise"
              name="companyName"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                id="firstName"
                label="Prénom (optionnel)"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ mt: 0 }}
              />
              <TextField
                margin="normal"
                fullWidth
                id="lastName"
                label="Nom (optionnel)"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                sx={{ mt: 0 }}
              />
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email professionnel"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isOAuthPending}
              InputProps={{
                readOnly: isOAuthPending,
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Numéro de téléphone"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title="Le numéro de téléphone est demandé pour faciliter les échanges avec l'équipe Dairia IA. Il ne sera jamais utilisé à d'autres fins."
                      arrow
                      placement="top"
                    >
                      <IconButton size="small" tabIndex={-1} sx={{ cursor: 'default' }}>
                        <InfoOutlinedIcon fontSize="small" color="action" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {!isOAuthPending && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Mot de passe"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Min. 8 caractères avec majuscule, minuscule et chiffre"
                  sx={{ mb: 2 }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSigningUp || googleLoading}
              sx={{ mb: 2, height: 48 }}
            >
              {isSigningUp
                ? 'Création...'
                : isOAuthPending
                  ? 'Finaliser mon inscription'
                  : 'Créer mon compte'}
            </Button>

            {!isOAuthPending && (
              <>
                <Divider sx={{ my: 3, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                    OU
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignup}
                  disabled={isSigningUp || googleLoading}
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
              </>
            )}

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Déjà un compte ?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Se connecter
                </Link>
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              display="block"
              sx={{ lineHeight: 1.5 }}
            >
              En créant un compte, vous acceptez nos{' '}
              <Link
                component={RouterLink}
                to="/terms-of-service"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                conditions d'utilisation
              </Link>
              {' '}et notre{' '}
              <Link
                component={RouterLink}
                to="/privacy-policy"
                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                politique de confidentialité
              </Link>
              .
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
