import { buildUrl } from './apiConfig';
import { supabase } from './supabase';
import { LoginCredentials, SignupData, User } from '../types/auth';
import { BaseService } from './baseService';

interface AuthResponse {
  status: string;
  data: {
    user: User;
    session: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  };
}

class AuthService extends BaseService {
  protected baseUrl = buildUrl('auth');



  private async fetchWithAuthService<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      // Utiliser un type générique pour l'objet de réponse qui peut contenir une propriété data
      interface ResponseWithData {
        data: T;
        [key: string]: unknown;
      }
      
      const result = await super.fetchWithAuth<ResponseWithData | T>(path, options);
      
      // Si la réponse est enveloppée dans un objet avec une propriété data
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data;
      }
      
      return result as T;
    } catch (error) {
      console.error('Fetch with auth error:', error);
      throw error;
    }
  }

  private async fetchWithoutAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}${path}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
      }

      const result = await response.json();
      
      // Si la réponse est enveloppée dans un objet avec une propriété data
      if (result.data) {
        return result.data as T;
      }
      
      return result as T;
    } catch (error) {
      console.error('Fetch without auth error:', error);
      throw error;
    }
  }

  async signup(data: SignupData): Promise<AuthResponse['data']> {
    const response = await this.fetchWithoutAuth<AuthResponse['data']>('/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName
      }),
    });
    
    // Après l'inscription réussie via l'API, mettre à jour la session Supabase
    // Utilisez setSession avec l'option options.session_expires_at pour une meilleure gestion
    if (response.session && response.session.access_token) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token
      });
    }
    
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse['data']> {
    const response = await this.fetchWithoutAuth<AuthResponse['data']>('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    });
    
    // Après la connexion réussie via l'API, mettre à jour la session Supabase
    // Utilisez setSession pour configurer correctement la session dans ce client isolé
    if (response.session && response.session.access_token) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token
      });
    }
    
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.fetchWithAuthService<{ message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.fetchWithoutAuth<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout(): Promise<{ message: string }> {
    try {
      // Utiliser l'API backend pour la déconnexion via fetchWithAuth
      const data = await this.fetchWithAuthService<{ message: string }>('/logout', {
        method: 'POST',
      });

      // Vérifier si une session Supabase existe avant d'essayer de la déconnecter
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Déconnecter également de Supabase côté client seulement si une session existe
        await supabase.auth.signOut();
      }

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, on essaie de déconnecter Supabase côté client si une session existe
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error('Supabase session check or signOut error:', e);
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
