// API Configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Vérifie si l'URL de base contient déjà /api
const API_PREFIX = BASE_URL.endsWith('/api') ? '' : '/api';

// Export de l'URL API complète pour les appels SSE
export const API_URL = `${BASE_URL}${API_PREFIX}`;

export const API_CONFIG = {
  base: BASE_URL,
  endpoints: {
    admin: `${BASE_URL}${API_PREFIX}/admin`,
    companies: `${BASE_URL}${API_PREFIX}/companies`,
    documents: `${BASE_URL}${API_PREFIX}/documents`,
    folders: `${BASE_URL}${API_PREFIX}/folders`,
    conversations: `${BASE_URL}${API_PREFIX}/conversations`,
    conversationDocuments: `${BASE_URL}${API_PREFIX}/conversation-documents`,
    messages: `${BASE_URL}${API_PREFIX}/messages`,
    notifications: `${BASE_URL}${API_PREFIX}/notifications`,
    reviewRequests: `${BASE_URL}${API_PREFIX}/review-requests`,
    supportRequests: `${BASE_URL}${API_PREFIX}/support-requests`,
    auth: `${BASE_URL}${API_PREFIX}/auth`,
    accessRequest: `${BASE_URL}${API_PREFIX}/access-request`,
    tokens: `${BASE_URL}${API_PREFIX}/tokens`,
    subscription: `${BASE_URL}${API_PREFIX}/subscription`,
    onboarding: `${BASE_URL}${API_PREFIX}/onboarding`,
    collectiveAgreements: `${BASE_URL}${API_PREFIX}/cc`,
    claudeStatus: `${BASE_URL}${API_PREFIX}/claude-status`,
    supportContact: `${BASE_URL}${API_PREFIX}/support-contact`,
    alerts: `${BASE_URL}${API_PREFIX}/alerts`,
    dossiers: `${BASE_URL}${API_PREFIX}/dossiers`
  }
};

// Helper function to build URLs
export const buildUrl = (endpoint: keyof typeof API_CONFIG.endpoints, path: string = '') => {
  const baseEndpoint = API_CONFIG.endpoints[endpoint];
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${baseEndpoint}${normalizedPath}`;
};
