import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthState, LoginCredentials, SignupData, UserRole } from '../types/auth';
import { supabase } from '../services/supabase';
import { AuthError } from '@supabase/supabase-js';
import { API_CONFIG } from '../services/apiConfig';
import * as Sentry from '@sentry/react';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ requiresRelogin: boolean }>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'sophie.martin@techvision.fr',
  role: 'client' as UserRole,
  firstName: 'Sophie',
  lastName: 'Martin',
  isActive: true,
  company_id: 'demo-company-001',
  companyName: 'TechVision SAS',
  company: {
    id: 'demo-company-001',
    name: 'TechVision SAS',
    is_onboarded: true,
    subscription_status: 'active',
    default_idcc: '1486',
    default_idcc_label: 'Convention collective nationale des bureaux d\'études techniques (Syntec)',
    convention_collective: 'Syntec - IDCC 1486',
    effectif: 47,
    activite: 'Édition de logiciels et conseil en technologies',
    monthly_token_limit: 1000000,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: DEMO_MODE ? DEMO_USER : null,
    loading: DEMO_MODE ? false : true,
    error: null,
  });

  // Ref pour tracker l'état du flow OAuth (partagé entre restoreSession et onAuthStateChange)
  const oauthFlowRef = useRef<{ inProgress: boolean; processed: boolean }>({
    inProgress: false,
    processed: false,
  });

  // Identifier l'utilisateur dans Sentry quand il se connecte/déconnecte
  useEffect(() => {
    if (state.user) {
      Sentry.setUser({
        id: state.user.id,
        email: state.user.email,
        username: `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() || undefined,
      });
      Sentry.setTag('user_role', state.user.role);
      if (state.user.company_id) {
        Sentry.setTag('company_id', state.user.company_id);
      }
    } else {
      // Effacer l'utilisateur de Sentry lors de la déconnexion
      Sentry.setUser(null);
    }
  }, [state.user]);

  // Fonction pour récupérer et restaurer la session utilisateur
  const restoreSession = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Vérifier si une session Supabase existe
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Vérifier si l'utilisateur est actif en faisant une requête API
          const response = await fetch(`${API_CONFIG.endpoints.auth}/me`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (!response.ok) {
            // Si la réponse n'est pas OK (par exemple, 403 pour utilisateur inactif)
            if (response.status === 403) {
              // Déconnecter l'utilisateur
              await supabase.auth.signOut();
              setState(prev => ({
                ...prev,
                loading: false,
                user: null,
                error: 'Votre compte a été désactivé. Veuillez contacter un administrateur.'
              }));
              return;
            }

            // Si 401 et OAuth en cours ou oauth_context/oauth_pending_signup présent, ne pas interférer
            if (response.status === 401) {
              const oauthContext = sessionStorage.getItem('oauth_context');
              const oauthPendingSignup = sessionStorage.getItem('oauth_pending_signup');
              if (oauthContext || oauthPendingSignup || oauthFlowRef.current.inProgress) {
                // OAuth flow en cours ou utilisateur doit compléter le formulaire signup
                console.log('[AuthContext] restoreSession: OAuth context/pending detected, not interfering');
                setState(prev => ({ ...prev, loading: false, error: null }));
                return;
              }
            }

            throw new Error('Erreur lors de la vérification du statut utilisateur');
          }

          // Récupérer les données complètes de l'utilisateur depuis l'API
          const apiData = await response.json();
          const backendUser = apiData.data.user;

          // Créer l'objet utilisateur avec toutes les données du backend
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            role: backendUser.role as UserRole,
            firstName: session.user.user_metadata?.firstName,
            lastName: session.user.user_metadata?.lastName,
            isActive: true, // Si on arrive ici, l'utilisateur est actif
            company_id: backendUser.company_id,
            companyName: backendUser.companyName,
            company: backendUser.company,
          };

          // Mettre à jour l'état avec l'utilisateur connecté
          setState(prev => ({
            ...prev,
            user,
            loading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Erreur lors de la vérification du statut utilisateur:', error);
          // Ne pas déconnecter si OAuth en cours ou pending signup
          const oauthContext = sessionStorage.getItem('oauth_context');
          const oauthPendingSignup = sessionStorage.getItem('oauth_pending_signup');
          if (!oauthFlowRef.current.inProgress && !oauthContext && !oauthPendingSignup) {
            await supabase.auth.signOut();
            setState(prev => ({ ...prev, loading: false, user: null, error: 'Erreur d\'authentification' }));
          } else {
            setState(prev => ({ ...prev, loading: false, error: null }));
          }
        }
      } else {
        setState(prev => ({ ...prev, loading: false, user: null }));
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de la session:', error);
      setState(prev => ({ ...prev, loading: false, user: null }));
    }
  };

  useEffect(() => {
    // En mode démo, pas besoin d'auth
    if (DEMO_MODE) return;

    // Restaurer la session au chargement initial
    restoreSession();

    // S'abonner aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorer les événements de récupération de mot de passe
      // Ces événements sont gérés par la page ResetPassword directement
      // Évite une boucle infinie sur iOS lors du traitement du token de récupération
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AuthContext] PASSWORD_RECOVERY event detected, skipping to let ResetPassword handle it');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (session?.user) {
        try {
          // Récupérer les données complètes de l'utilisateur depuis l'API
          const response = await fetch(`${API_CONFIG.endpoints.auth}/me`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          // Si l'utilisateur n'existe pas dans la DB (401), c'est probablement un nouvel utilisateur OAuth
          if (response.status === 401) {
            // Vérifier le contexte OAuth stocké dans localStorage
            const oauthContext = sessionStorage.getItem('oauth_context');

            // Si OAuth déjà en cours ou déjà traité, ignorer cet appel
            if (oauthFlowRef.current.inProgress || oauthFlowRef.current.processed) {
              return;
            }

            // Si pas de contexte mais oauth_pending_signup, l'utilisateur doit compléter le formulaire
            const oauthPendingSignup = sessionStorage.getItem('oauth_pending_signup');
            if (oauthPendingSignup) {
              console.log('[AuthContext] onAuthStateChange: oauth_pending_signup detected, waiting for form completion');
              return;
            }

            // Si pas de contexte du tout, c'est un cas d'erreur - ignorer silencieusement
            // (peut arriver lors de refreshs de page avec session invalide)
            if (!oauthContext) {
              return;
            }

            // Marquer comme en cours
            oauthFlowRef.current.inProgress = true;

            // Si contexte = login et utilisateur non trouvé, bloquer
            if (oauthContext === 'login') {
              console.log('[AuthContext] OAuth login but no account found, blocking');
              sessionStorage.removeItem('oauth_context');
              oauthFlowRef.current.inProgress = false;
              oauthFlowRef.current.processed = true;
              await supabase.auth.signOut();
              setState(prev => ({
                ...prev,
                user: null,
                loading: false,
                error: 'Aucun compte trouvé avec cette adresse Google. Veuillez d\'abord créer un compte.',
              }));
              return;
            }

            // Sinon, c'est un signup OAuth - rediriger vers le formulaire pour saisir le nom d'entreprise
            if (oauthContext === 'signup') {
              sessionStorage.removeItem('oauth_context');
              console.log('[AuthContext] OAuth signup: new user needs to complete signup form');

              // Stocker les infos OAuth pour pré-remplir le formulaire
              const oauthUserInfo = {
                id: session.user.id,
                email: session.user.email,
                firstName: session.user.user_metadata?.full_name?.split(' ')[0] || session.user.user_metadata?.given_name || '',
                lastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || session.user.user_metadata?.family_name || '',
                avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
              };
              console.log('[AuthContext] Storing OAuth user info for signup form:', oauthUserInfo);
              sessionStorage.setItem('oauth_pending_signup', JSON.stringify(oauthUserInfo));

              // Marquer le flow comme traité
              oauthFlowRef.current.inProgress = false;
              oauthFlowRef.current.processed = true;

              // Ne pas définir d'utilisateur - laisser AuthCallback gérer la redirection
              setState(prev => ({
                ...prev,
                loading: false,
                error: null,
              }));
              return;
            }
          }

          if (response.ok) {
            const apiData = await response.json();
            const backendUser = apiData.data.user;

            const user: User = {
              id: backendUser.id,
              email: backendUser.email,
              role: backendUser.role as UserRole,
              firstName: session.user.user_metadata?.firstName,
              lastName: session.user.user_metadata?.lastName,
              isActive: true,
              company_id: backendUser.company_id,
              companyName: backendUser.companyName,
              company: backendUser.company,
            };

            console.log('[AuthContext] onAuthStateChange: Setting user and loading: false');
            setState(prev => ({
              ...prev,
              user,
              loading: false,
              error: null,
            }));
          } else if (!oauthFlowRef.current.inProgress) {
            // Si l'API échoue et pas d'oauth en cours, ne pas déconnecter automatiquement
            // Cela peut arriver pendant le flow OAuth avant que oauth-complete ne soit appelé
            console.warn('[AuthContext] Failed to fetch user data, status:', response.status);
            setState(prev => ({ ...prev, loading: false }));
          }
        } catch (error) {
          console.error('[AuthContext] Error in onAuthStateChange:', error);
          if (!oauthFlowRef.current.inProgress) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Erreur lors de l\'authentification',
            }));
          }
        }
      } else {
        // Reset OAuth flow state when session is lost
        console.log('[AuthContext] onAuthStateChange: No session, resetting state');
        oauthFlowRef.current = { inProgress: false, processed: false };
        setState(prev => ({ ...prev, user: null, loading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // Utiliser directement le SDK Supabase pour la connexion
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.session || !authData.user) {
        throw new Error('Erreur de connexion');
      }

      // Récupérer les données complètes de l'utilisateur depuis l'API backend
      const response = await fetch(`${API_CONFIG.endpoints.auth}/me`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          await supabase.auth.signOut();
          throw new Error('Votre compte a été désactivé. Veuillez contacter un administrateur.');
        }
        throw new Error('Erreur lors de la récupération des données utilisateur');
      }

      const apiData = await response.json();
      const backendUser = apiData.data.user;

      // Créer l'objet utilisateur avec les données du backend
      const user: User = {
        id: backendUser.id,
        email: backendUser.email,
        role: backendUser.role as UserRole,
        firstName: authData.user.user_metadata?.firstName,
        lastName: authData.user.user_metadata?.lastName,
        isActive: true,
        company_id: backendUser.company_id,
        companyName: backendUser.companyName,
        company: backendUser.company,
      };

      setState(prev => ({ ...prev, user, error: null }));
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      if (error instanceof AuthError) {
        setState(prev => ({ ...prev, error: error.message, user: null }));
        throw error;
      } else if (error instanceof Error) {
        setState(prev => ({ ...prev, error: error.message, user: null }));
        throw error;
      } else {
        const errorMessage = 'Une erreur est survenue lors de la connexion';
        setState(prev => ({ ...prev, error: errorMessage, user: null }));
        throw new Error(errorMessage);
      }
    }
  };

  const signup = async (data: SignupData) => {
    try {
      // Call backend signup endpoint instead of Supabase SDK directly
      // This ensures company is created and user entry is added to DB
      const response = await fetch(`${API_CONFIG.endpoints.auth}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: data.role || 'client',
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName,
          phone: data.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed');
      }

      // Check if email confirmation is required (Supabase didn't create a session)
      if (result.data?.session?.access_token === 'pending_email_confirmation') {
        // Email confirmation is required - don't try to login
        // Throw a special error that Signup.tsx can catch
        throw new Error('EMAIL_CONFIRMATION_REQUIRED');
      }

      // Now login to get a session
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (loginError) throw loginError;

      if (authData.user && authData.session) {
        // Fetch complete user data from backend (includes company_id)
        const meResponse = await fetch(`${API_CONFIG.endpoints.auth}/me`, {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`
          }
        });

        if (meResponse.ok) {
          const apiData = await meResponse.json();
          const backendUser = apiData.data.user;

          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            role: backendUser.role as UserRole,
            firstName: data.firstName,
            lastName: data.lastName,
            isActive: true,
            company_id: backendUser.company_id,
            companyName: backendUser.companyName,
            company: backendUser.company,
          };

          setState(prev => ({ ...prev, user, error: null }));
        } else {
          throw new Error('Failed to fetch user data after signup');
        }
      }
    } catch (error) {
      // Don't set error state for EMAIL_CONFIRMATION_REQUIRED - it's handled by Signup.tsx
      if (error instanceof Error && error.message === 'EMAIL_CONFIRMATION_REQUIRED') {
        throw error;
      }
      if (error instanceof AuthError) {
        setState(prev => ({ ...prev, error: error.message }));
      } else if (error instanceof Error) {
        setState(prev => ({ ...prev, error: error.message }));
      } else {
        setState(prev => ({ ...prev, error: 'An unexpected error occurred' }));
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState(prev => ({ ...prev, user: null, error: null }));
    } catch (error) {
      if (error instanceof AuthError) {
        setState(prev => ({ ...prev, error: error.message }));
      } else if (error instanceof Error) {
        setState(prev => ({ ...prev, error: error.message }));
      } else {
        setState(prev => ({ ...prev, error: 'An unexpected error occurred' }));
      }
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // Utiliser directement Supabase pour changer le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Après un changement de mot de passe réussi, déconnecter l'utilisateur
      setState(prev => ({ ...prev, error: null }));
      
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      setState(prev => ({ ...prev, user: null }));
      
      // Retourner un indicateur que la reconnexion est nécessaire
      return { requiresRelogin: true };
    } catch (error) {
      if (error instanceof AuthError) {
        setState(prev => ({ ...prev, error: error.message }));
      } else if (error instanceof Error) {
        setState(prev => ({ ...prev, error: error.message }));
      } else {
        setState(prev => ({ ...prev, error: 'An unexpected error occurred' }));
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, changePassword, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
