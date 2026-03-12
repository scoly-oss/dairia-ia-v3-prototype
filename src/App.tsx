import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box, CircularProgress, Button, Typography } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useMemo, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeContextProvider, useThemeMode } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { Login } from './pages/Auth/Login';
import { Signup } from './pages/Auth/Signup';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { Home } from './pages/Home/Home';
import { UnauthorizedAccess } from './pages/Auth/UnauthorizedAccess';
import { AuthCallback } from './pages/Auth/AuthCallback';
import { UserManagement } from './pages/Admin/UserManagement';
import { DocumentManagement } from './pages/Admin/DocumentManagement';
import { AdminRoute } from './components/AdminRoute';
import { LawyerRoute } from './components/LawyerRoute';
import { RoleBasedChatRoute } from './components/RoleBasedChatRoute';
import { AppNavigation } from './components/Navigation/AppNavigation';
import { ConversationHistoryPage } from './pages/Chat/ConversationHistoryPage';
import { AdminConversationHistory } from './pages/Admin/AdminConversationHistory';
import { UserProfile } from './pages/User/UserProfile';
import { NotificationPermission } from './components/NotificationPermission';
import { ReviewRequests } from './pages/ReviewRequests';
import ClientDocuments from './pages/ClientDocuments';
import { SystemSettings } from './pages/Admin/SystemSettings';
import { CompanyUserManagement } from './pages/CompanyUserManagement';
import { SubscriptionPage } from './pages/Subscription/SubscriptionPage';
import { OnboardingModal } from './components/Onboarding';
import { PrivacyPolicy } from './pages/Legal/PrivacyPolicy';
import { TermsOfService } from './pages/Legal/TermsOfService';
import { SetupPayment } from './pages/SetupPayment';
import { SupportRequests } from './pages/Admin/SupportRequests';
import { SupportWidget } from './components/SupportWidget';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CompanyProfilePage } from './pages/CompanyProfile/CompanyProfilePage';
import { DossiersListPage } from './pages/Dossiers/DossiersListPage';
import { DossierDetailPage } from './pages/Dossiers/DossierDetailPage';

import { getDesignTokens, tokens } from './theme/tokens';

const getTheme = (mode: PaletteMode) => {
  const designTokens = getDesignTokens(mode);

  return createTheme({
    ...designTokens,
    typography: {
      fontFamily: '"Inter", "system-ui", "sans-serif"',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
          },
          containedPrimary: {
            background: tokens.gradients.primary,
            boxShadow: tokens.shadows.light.primary,
            '&:hover': {
              background: tokens.gradients.primaryHover,
              boxShadow: '0 6px 20px rgba(232, 132, 44, 0.3)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: tokens.shadows.light.sm,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            background: '#ffffff',
            border: `1px solid ${tokens.colors.light.border}`,
            boxShadow: tokens.shadows.light.md,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              '& fieldset': {
                borderColor: tokens.colors.light.border,
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.15)',
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.colors.primary.main,
              },
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'none',
            border: `1px solid ${tokens.colors.light.border}`,
            boxShadow: tokens.shadows.light.lg,
          },
        },
      },
    },
  });
};


const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const PrivateRoute: React.FC<{ children: React.ReactNode; skipPaymentCheck?: boolean }> = ({ children, skipPaymentCheck }) => {
  const { user, loading, restoreSession } = useAuth();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(DEMO_MODE ? false : true);
  const [needsPaymentSetup, setNeedsPaymentSetup] = useState(false);
  const [canAccess, setCanAccess] = useState(DEMO_MODE ? true : false);
  const [paymentAlert, setPaymentAlert] = useState<{
    isPastDue: boolean;
    graceRemainingDays: number | null;
  } | null>(null);

  // Vérifier si onboarding nécessaire
  useEffect(() => {
    if (DEMO_MODE) return;
    if (user && user.company && user.company.is_onboarded === false) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Vérifier si le paiement doit être configuré
  useEffect(() => {
    if (DEMO_MODE) return;

    const checkPaymentSetup = async () => {
      if (!user || skipPaymentCheck || location.pathname === '/setup-payment') {
        setCheckingPayment(false);
        return;
      }

      try {
        const { subscriptionService } = await import('./services/subscriptionService');
        const status = await subscriptionService.getSubscriptionStatus();

        // Backend now checks Stripe directly if DB is not updated yet
        if (status.needsPaymentSetup) {
          setNeedsPaymentSetup(true);
        }
        // Stocker canAccess pour permettre l'accès pendant un trial sans CB
        if (status.canAccess) {
          setCanAccess(true);
        }
        // Check for past_due status to show payment alert banner
        // Only show for clients and company users (not admins or lawyers)
        if (status.status === 'past_due' && (user.role === 'client' || user.role === 'company_user')) {
          setPaymentAlert({
            isPastDue: true,
            graceRemainingDays: status.graceRemainingDays ?? null,
          });
        }
      } catch (error) {
        console.error('Error checking payment setup:', error);
      } finally {
        setCheckingPayment(false);
      }
    };

    checkPaymentSetup();
  }, [user, skipPaymentCheck, location.pathname]);

  if (loading || checkingPayment) {
    return <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}><CircularProgress /></Box>;
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // Si le paiement doit être configuré ET pas d'accès, rediriger vers la page de configuration
  if (needsPaymentSetup && !canAccess && location.pathname !== '/setup-payment') {
    return <Navigate to="/setup-payment" />;
  }

  // Si l'accès est refusé (période de grâce expirée), rediriger vers la page abonnement
  // Sauf pour admins/lawyers et pages autorisées
  const isAllowedPath = ['/subscription', '/setup-payment', '/profile'].includes(location.pathname);
  const isExemptRole = user.role === 'admin' || user.role === 'lawyer';
  if (!canAccess && !isExemptRole && !isAllowedPath) {
    return <Navigate to="/subscription" />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return (
    <>
      <AppNavigation paymentAlert={paymentAlert} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', sm: `calc(100% - 260px)` },
          marginLeft: { sm: '260px' },
          marginTop: 0,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>

      {/* Widget de support pour les clients */}
      {(user?.role === 'client' || user?.role === 'company_user') && <SupportWidget />}

      {/* Modal d'onboarding */}
      {showOnboarding && (
        <OnboardingModal
          open={showOnboarding}
          onComplete={async () => {
            await restoreSession();
            setShowOnboarding(false);
          }}
        />
      )}
    </>
  );
};

const ThemedApp = () => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <LayoutProvider>
          <Router>
            <NotificationPermission />
            <ChatProvider>
              <Routes>
                <Route path="/" element={DEMO_MODE ? <Navigate to="/dashboard" /> : <Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<UnauthorizedAccess />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/setup-payment" element={<PrivateRoute skipPaymentCheck={true}><SetupPayment /></PrivateRoute>} />

                {/* User routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><RoleBasedChatRoute /></PrivateRoute>} />
                <Route path="/chat/history" element={<PrivateRoute><ConversationHistoryPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
                <Route path="/documents" element={<PrivateRoute><ClientDocuments /></PrivateRoute>} />
                <Route path="/company/users" element={<PrivateRoute><CompanyUserManagement /></PrivateRoute>} />
                <Route path="/company/profile" element={<PrivateRoute><CompanyProfilePage /></PrivateRoute>} />
                <Route path="/dossiers" element={<PrivateRoute><DossiersListPage /></PrivateRoute>} />
                <Route path="/dossiers/:id" element={<PrivateRoute><DossierDetailPage /></PrivateRoute>} />
                <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />

                {/* Lawyer and Admin routes */}
                <Route
                  path="/review-requests"
                  element={
                    <PrivateRoute>
                      <LawyerRoute>
                        <ReviewRequests />
                      </LawyerRoute>
                    </PrivateRoute>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin/users"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <UserManagement />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/documents"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <DocumentManagement />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/conversations"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <AdminConversationHistory />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <SystemSettings />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/support"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <SupportRequests />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </ChatProvider>
          </Router>
        </LayoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Composant de fallback en cas d'erreur critique
const ErrorFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 3,
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
    }}
  >
    <Typography variant="h4" gutterBottom>
      Une erreur est survenue
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
      Nous avons été notifiés et travaillons à résoudre le problème.
    </Typography>
    <Button
      variant="contained"
      onClick={() => window.location.reload()}
    >
      Recharger la page
    </Button>
  </Box>
);

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
