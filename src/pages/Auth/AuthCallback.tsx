import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, error: authError, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [codeExchanged, setCodeExchanged] = useState(false);
  const hasRedirected = useRef(false);

  // Étape 1: Gérer le callback OAuth (code PKCE ou hash implicite)
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const query = window.location.search;
        const hash = window.location.hash;

        console.log('[AuthCallback] Starting callback handling');
        console.log('[AuthCallback] Query:', query);
        console.log('[AuthCallback] Hash:', hash ? 'present (tokens)' : 'empty');
        console.log('[AuthCallback] oauth_context:', sessionStorage.getItem('oauth_context'));

        // Cas 1: Flow PKCE avec code dans les query params
        if (query.includes('code=')) {
          console.log('[AuthCallback] PKCE flow detected');
          const urlParams = new URLSearchParams(query);
          const code = urlParams.get('code');

          if (code) {
            console.log('[AuthCallback] Exchanging code for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[AuthCallback] Code exchange error:', error);
              throw error;
            }
            console.log('[AuthCallback] Code exchange successful');
            setCodeExchanged(true);
            return;
          }
        }

        // Cas 2: Flow implicite avec tokens dans le hash
        // Supabase gère automatiquement les tokens dans le hash via onAuthStateChange
        // On marque juste comme échangé pour permettre la redirection
        if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
          console.log('[AuthCallback] Implicit flow detected, tokens in hash');
          // Wait a moment for Supabase to process the hash
          await new Promise(resolve => setTimeout(resolve, 100));
          setCodeExchanged(true);
          return;
        }

        // Cas 3: Ni code ni tokens - vérifier si déjà authentifié
        // (peut arriver si on refresh la page callback après auth)
        console.log('[AuthCallback] No code or tokens, checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[AuthCallback] Existing session found');
          setCodeExchanged(true);
          return;
        }

        // Vraiment aucune auth trouvée
        console.log('[AuthCallback] No authentication found');
        setError('Aucun code d\'authentification trouvé dans l\'URL');
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Une erreur est survenue lors de l\'authentification');
        }
      }
    };

    handleCallback();
  }, []);

  // Étape 2: Rediriger une fois que l'auth est stabilisée
  useEffect(() => {
    const pendingOAuthSignup = sessionStorage.getItem('oauth_pending_signup');

    console.log('[AuthCallback] Redirect check:', {
      hasRedirected: hasRedirected.current,
      error,
      authError,
      loading,
      codeExchanged,
      pendingOAuthSignup: !!pendingOAuthSignup,
      user: user ? { id: user.id, company_onboarded: user.company?.is_onboarded } : null
    });

    // Éviter les redirections multiples
    if (hasRedirected.current) return;

    // Si erreur locale (pas de code, etc.), rediriger vers login
    if (error) {
      console.log('[AuthCallback] Local error, redirecting to login');
      hasRedirected.current = true;
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Si le code a été échangé et qu'on n'est plus en loading
    if (codeExchanged && !loading) {
      // Si erreur d'auth (ex: pas de compte trouvé lors d'un login)
      if (authError) {
        console.log('[AuthCallback] Auth error:', authError);
        hasRedirected.current = true;
        if (authError.includes('Aucun compte trouvé')) {
          console.log('[AuthCallback] No account found, redirecting to signup');
          setTimeout(() => navigate('/signup'), 3000);
        } else {
          console.log('[AuthCallback] Other auth error, redirecting to login');
          setTimeout(() => navigate('/login'), 3000);
        }
        return;
      }

      // Si OAuth signup en attente (nouvel utilisateur Google), rediriger vers le formulaire
      if (pendingOAuthSignup) {
        console.log('[AuthCallback] Pending OAuth signup detected, redirecting to signup form');
        hasRedirected.current = true;
        navigate('/signup?oauth_pending=true');
        return;
      }

      // Si utilisateur connecté, rediriger vers la bonne page
      if (user) {
        console.log('[AuthCallback] User found, redirecting based on onboarding status');
        hasRedirected.current = true;
        if (user.company?.is_onboarded === false) {
          console.log('[AuthCallback] Company not onboarded, going to setup-payment');
          navigate('/setup-payment');
        } else {
          console.log('[AuthCallback] Company onboarded, going to chat');
          navigate('/chat');
        }
        return;
      }

      console.log('[AuthCallback] Code exchanged but no user yet, waiting...');
    }
  }, [user, authError, loading, codeExchanged, error, navigate]);

  // Déterminer ce qu'on affiche
  const showLoading = !error && (!codeExchanged || loading || (!user && !authError));
  const showError = error || (codeExchanged && !loading && authError && !user);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}
    >
      {showLoading ? (
        <>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6">
            Authentification en cours...
          </Typography>
        </>
      ) : showError ? (
        <>
          <Typography variant="h6" color="error" gutterBottom>
            Erreur d'authentification
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error || authError}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Redirection...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6">
            Redirection en cours...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;
