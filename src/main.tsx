// StrictMode is temporarily disabled to fix double re-renders during development
// import { StrictMode } from 'react'
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Initialiser Sentry avant le rendu React
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // Capturer 100% des erreurs
  sampleRate: 1.0,
  // Intégrations par défaut
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Ne pas capturer les replays par défaut (coûteux)
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Pas de performance tracing (comme demandé)
  tracesSampleRate: 0,
  // Pas de session replay par défaut
  replaysSessionSampleRate: 0,
  // Capturer les replays uniquement en cas d'erreur
  replaysOnErrorSampleRate: 1.0,
  // Ignorer les erreurs provenant d'extensions de navigateur (password managers, etc.)
  ignoreErrors: [
    // Erreurs des extensions de mots de passe (Bitwarden, LastPass, etc.)
    /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
    // Erreur DOM causée par des extensions qui modifient le DOM (gestionnaires de mots de passe, traducteurs, etc.)
    /Failed to execute 'insertBefore' on 'Node'/,
    /Failed to execute 'removeChild' on 'Node'/,
    /Failed to execute 'appendChild' on 'Node'/,
  ],
});

createRoot(document.getElementById('root')!).render(
  // Temporarily removed StrictMode to fix double re-renders during development
  // <StrictMode>
    <App />
  // </StrictMode>,
)
