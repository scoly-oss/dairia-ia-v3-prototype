import { supabase } from './supabase';
import * as Sentry from '@sentry/react';

/**
 * Service de base fournissant des fonctionnalités communes à tous les services
 * Centralise la gestion des tokens d'authentification et les requêtes HTTP authentifiées
 */
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export abstract class BaseService {
  /**
   * URL de base pour les requêtes API
   * À surcharger dans les services enfants
   */
  protected abstract baseUrl: string;

  /**
   * Récupère le token d'authentification depuis Supabase
   * @returns Token d'authentification
   */
  protected async getAuthToken(): Promise<string> {
    if (DEMO_MODE) return 'demo-token';
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[BaseService.getAuthToken] Authentication error:', error);
        throw new Error('Not authenticated');
      }
      
      if (!session) {
        console.error('[BaseService.getAuthToken] No session found');
        throw new Error('Not authenticated');
      }
      
      return session.access_token;
    } catch (error) {
      console.error('[BaseService.getAuthToken] Error:', error);
      throw error;
    }
  }

  /**
   * Effectue une requête HTTP authentifiée
   * @param endpoint Endpoint API relatif
   * @param options Options de la requête fetch
   * @returns Réponse de l'API typée
   */
  protected async fetchWithAuth<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T | null | undefined> {
    try {
      console.log('[BaseService] fetchWithAuth called', { endpoint, method: options.method });
      // Obtenir le token d'authentification
      const token = await this.getAuthToken();
      console.log('[BaseService] Token retrieved:', token ? 'Token present' : 'No token');

      // Construire l'URL complète
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      console.log('[BaseService] Full URL:', url);

      // Préparer les headers avec le token d'authentification
      const headers = new Headers(options.headers || {});

      // Ne pas définir Content-Type pour FormData (pour permettre au navigateur de définir la boundary)
      if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      } else {
        console.log('[BaseService] FormData detected, not setting Content-Type');
      }

      headers.set('Authorization', `Bearer ${token}`);

      console.log('[BaseService] Sending fetch request...');
      // Effectuer la requête
      const response = await fetch(url, {
        ...options,
        headers
      });
      console.log('[BaseService] Response received:', response.status, response.statusText);
      
      // Si la réponse est 204 No Content, retourner undefined
      if (response.status === 204) {
        return undefined;
      }
      
      // Récupérer le texte de la réponse
      const responseText = await response.text();
      
      // Parser le JSON si possible
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error(`Error parsing JSON:`, e);
        throw new Error(`Invalid JSON response`);
      }
      
      // Si la réponse n'est pas OK
      if (!response.ok) {
        // Gestion spécifique des erreurs 401 (session expirée/invalide)
        if (response.status === 401) {
          console.warn('[BaseService] 401 Unauthorized - Session expired, logging out');
          await supabase.auth.signOut();
          window.location.href = '/login';
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        // responseData.error peut être un objet en mode développement, on préfère message
        const errorMessage = responseData?.message ||
          (typeof responseData?.error === 'string' ? responseData.error : null) ||
          response.statusText ||
          'Request failed';

        // Capturer l'erreur dans Sentry avec contexte
        Sentry.captureException(new Error(errorMessage), {
          tags: {
            type: 'api_error',
            status_code: response.status.toString(),
            endpoint: endpoint,
          },
          extra: {
            url: url,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
          },
        });

        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      console.error(`Error in fetchWithAuth:`, error);
      throw error;
    }
  }
}
