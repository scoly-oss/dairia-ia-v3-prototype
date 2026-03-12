import { supabase } from './supabase';
import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

// Types et interfaces
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface MessageConnectionType {
  eventSource?: EventSource;
  callback: (update: SupportRequestUpdate) => void;
  connectionPromise?: Promise<void>;
}

interface SSEConnection {
  eventSource: EventSource | null;
  status: ConnectionStatus;
  callback: ((data: { type: string; data: SupportRequest; old_status: string }) => void) | null;
  token: string | null;
}

export interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface SupportRequest {
  id: string;
  client_id: string;
  admin_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  client?: { email: string; first_name: string; last_name: string };
  admin?: Admin;
}

export interface SupportMessage {
  id: string;
  support_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { email: string; first_name?: string; last_name?: string };
}

export interface SupportRequestUpdateBase {
  type: 'INSERT' | 'UPDATE' | 'message' | 'typing' | 'admin_assigned' | 'support_request';
  data: SupportRequest | SupportMessage | { isTyping: boolean; userId: string } | Admin;
  old_status: string;
}

export interface MessageUpdate extends SupportRequestUpdateBase {
  type: 'message';
  data: SupportMessage;
}

export interface TypingUpdate extends SupportRequestUpdateBase {
  type: 'typing';
  data: {
    isTyping: boolean;
    userId: string;
  };
}

export interface AdminAssignedUpdate extends SupportRequestUpdateBase {
  type: 'admin_assigned';
  data: Admin;
}

export interface SupportRequestInsertUpdate extends SupportRequestUpdateBase {
  type: 'INSERT';
  data: SupportRequest;
}

export interface SupportRequestUpdateUpdate extends SupportRequestUpdateBase {
  type: 'UPDATE';
  data: SupportRequest;
}

export interface SupportRequestDataUpdate extends SupportRequestUpdateBase {
  type: 'support_request';
  data: SupportRequest;
}

export type SupportRequestUpdate = MessageUpdate | TypingUpdate | AdminAssignedUpdate | SupportRequestInsertUpdate | SupportRequestUpdateUpdate | SupportRequestDataUpdate;



class SupportRequestService extends BaseService {
  private static instance: SupportRequestService;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private messageConnections: Map<string, MessageConnectionType> = new Map();
  private sseConnection: SSEConnection = {
    eventSource: null,
    status: 'disconnected',
    callback: null,
    token: null
  };

  // URL de base pour les requêtes API
  protected baseUrl = buildUrl('supportRequests');

  constructor() {
    super();
    if (SupportRequestService.instance) {
      return SupportRequestService.instance;
    }
    SupportRequestService.instance = this;
  }



  // Utilise la méthode fetchWithAuth de BaseService avec un traitement spécifique pour les réponses
  private async fetchWithSupportService<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T | null | undefined> {
    return super.fetchWithAuth<T>(endpoint, options);
  }

  async createOrGetSupportRequest(): Promise<SupportRequest> {
    const result = await this.fetchWithSupportService<SupportRequest>('/', {
      method: 'POST',
    });
    if (!result) throw new Error('No response received');
    return result;
  }

  async getActiveSupportRequest(): Promise<SupportRequest | null> {
    try {
      const result = await this.fetchWithSupportService<SupportRequest | null>('/active');
      return result === undefined ? null : result;
    } catch (error) {
      console.error('[SupportRequestService.getActiveSupportRequest] Error:', error);
      return null;
    }
  }

  async getSupportRequests(): Promise<SupportRequest[]> {
    try {
      const data = await this.fetchWithSupportService<SupportRequest[]>('/');

      // Vérifier si data est null ou undefined
      if (data === null || data === undefined) {
        console.warn('[SupportRequestService] Received null or undefined data');
        return [];
      }

      // Vérifier si data n'est pas un tableau
      if (!Array.isArray(data)) {
        console.warn('[SupportRequestService] Received non-array data:', data);
        return [];
      }

      if (data.length > 0) {
        // Vérifier et corriger les données si nécessaire
        const processedData = data.map(req => {
          // S'assurer que l'objet client existe
          const client = req.client || { email: 'Client inconnu', first_name: '', last_name: '' };

          return {
            ...req,
            client
          };
        });

        return processedData;
      } else {
        console.warn('[SupportRequestService] Received empty array');
        return [];
      }
    } catch (error) {
      console.error('[SupportRequestService] Error fetching support requests:', error);
      throw error;
    }
  }

  async assignAdmin(id: string): Promise<SupportRequest> {
    const requestId = `assign-${Date.now()}`;
    try {
      const response = await this.fetchWithSupportService<SupportRequest>(`/${id}/assign`, {
        method: 'PUT'
      });
      if (!response) throw new Error('No response received');
      return response;
    } catch (error) {
      console.error(`[${requestId}][SupportRequestService.assignAdmin] Error assigning admin to request ${id}:`, error);
      throw error;
    }
  }

  async sendMessage(support_request_id: string, content: string): Promise<SupportMessage> {
    const result = await this.fetchWithSupportService<SupportMessage>(`/${support_request_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!result) throw new Error('No response received');
    return result;
  }


  private async setupMessageConnection(support_request_id: string, callback: (update: SupportRequestUpdate) => void): Promise<void> {
    const connectionId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const existingConnection = this.messageConnections.get(support_request_id);

    if (existingConnection?.connectionPromise) {
      // Mettre à jour le callback même si la connexion est en cours
      existingConnection.callback = callback;
      return existingConnection.connectionPromise;
    }

    if (existingConnection?.eventSource?.readyState === EventSource.OPEN) {
      // IMPORTANT: Mettre à jour le callback pour la connexion existante
      existingConnection.callback = callback;
      return Promise.resolve();
    }

    const connection: MessageConnectionType = { callback };
    const maxRetries = 3;
    let retryCount = 0;
    const retryDelay = 2000; // 2 secondes

    const connectionPromise = new Promise<void>((resolve, reject) => {
      const setupConnection = async () => {
        try {
          const token = await this.getAuthToken();
          const eventSourceUrl = `${buildUrl('supportRequests', `/${support_request_id}/messages/subscribe`)}?token=${encodeURIComponent(token)}`;
          const eventSource = new EventSource(
            eventSourceUrl,
            { withCredentials: true }
          );

          let resolved = false;
          const connectionTimeout: NodeJS.Timeout = setTimeout(() => {
            if (!resolved) {
              console.error(`[SupportRequestService] Connection timeout for request ${support_request_id}`);
              eventSource.close();
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(setupConnection, retryDelay);
              } else {
                reject(new Error('Connection timeout after retries'));
              }
            }
          }, 10000);

          eventSource.onopen = () => {
            clearTimeout(connectionTimeout);
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          eventSource.onmessage = (event) => {
            try {
              const update = JSON.parse(event.data) as SupportRequestUpdate;
              // Utiliser le callback actuel de la connexion (pas celui capturé dans la closure)
              const currentConnection = this.messageConnections.get(support_request_id);
              if (currentConnection?.callback) {
                currentConnection.callback(update);
              }
            } catch (error) {
              console.error(`[SupportRequestService] Error parsing SSE update:`, error);
            }
          };

          eventSource.onerror = (error) => {
            console.error(`[${connectionId}][SupportRequestService.setupMessageConnection] Message connection ERROR for request ${support_request_id}:`, error);
            clearTimeout(connectionTimeout);

            if (eventSource.readyState === EventSource.CLOSED) {
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(setupConnection, retryDelay);
              } else if (!resolved) {
                resolved = true;
                reject(new Error('Max retries reached'));
              }
            }
          };

          connection.eventSource = eventSource;
        } catch (error) {
          console.error(`[SupportRequestService] Failed to setup message subscription for request ${support_request_id}:`, error);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(setupConnection, retryDelay);
          } else {
            reject(error);
          }
        }
      };

      void setupConnection();
    });

    connection.connectionPromise = connectionPromise;
    this.messageConnections.set(support_request_id, connection);

    return connectionPromise;
  }

  async subscribeToMessages(support_request_id: string, callback: (update: SupportRequestUpdate) => void): Promise<() => void> {
    const subscriptionId = `sub-${Date.now()}`;

    try {
      await this.setupMessageConnection(support_request_id, callback);

      return () => {
        this.unsubscribeFromMessages(support_request_id);
      };
    } catch (error) {
      console.error(`[${subscriptionId}][SupportRequestService.subscribeToMessages] Failed to setup message subscription:`, error);
      throw error;
    }
  }

  unsubscribeFromMessages(support_request_id: string): void {
    const connection = this.messageConnections.get(support_request_id);
    if (connection?.eventSource) {
      connection.eventSource.close();
      this.messageConnections.delete(support_request_id);
    }
  }

  async completeSupportRequest(id: string): Promise<SupportRequest> {
    try {
      const result = await this.fetchWithSupportService<SupportRequest>(`/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!result) throw new Error('No response received');
      return result;
    } catch (error) {
      console.error('[SupportRequestService] Error completing request:', error);
      throw error;
    }
  }


  async subscribeToSupportRequests(
    callback: (data: { type: string; data: SupportRequest; old_status: string }) => void,
    onConnectionStatusChange?: (status: 'disconnected' | 'connecting' | 'connected', error?: string) => void
  ) {
    try {
      const token = await this.getAuthToken();

      // Vérifier si une connexion existe déjà avec le même token
      if (this.sseConnection.status === 'connected' &&
          this.sseConnection.token === token) {
        this.sseConnection.callback = callback;
        return () => {
          if (this.sseConnection.callback === callback) {
            this.disconnect(undefined, onConnectionStatusChange);
          }
        };
      }

      // Si une connexion existe avec un token différent ou un autre état, la fermer
      if (this.sseConnection.status !== 'disconnected') {
        this.disconnect(undefined, onConnectionStatusChange);
      }

      await this.connect(token, callback, onConnectionStatusChange);
      return () => this.disconnect(undefined, onConnectionStatusChange);
    } catch (error) {
      console.error('[SupportRequestService] Subscription failed:', error);
      this.disconnect(error instanceof Error ? error.message : String(error), onConnectionStatusChange);
      throw error;
    }
  }



  private connect(
    token: string,
    callback: (data: { type: string; data: SupportRequest; old_status: string }) => void,
    onConnectionStatusChange?: (status: 'disconnected' | 'connecting' | 'connected', error?: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier l'état actuel de la connexion
      if (this.sseConnection.status !== 'disconnected') {
        reject(new Error('Connection attempt while not disconnected'));
        return;
      }

      // Nettoyer tout timeout existant
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Initialiser la nouvelle connexion
      this.sseConnection.status = 'connecting';
    onConnectionStatusChange?.('connecting');
      this.sseConnection.callback = callback;
      this.sseConnection.token = token;

      // Utiliser le token dans l'URL pour EventSource car les headers ne sont pas supportés
      const eventSourceUrl = `${buildUrl('supportRequests', '/subscribe')}?token=${token}`;
      const eventSource = new EventSource(eventSourceUrl, {
        withCredentials: true
      });

      // Définir le timeout de connexion
      this.connectionTimeout = setTimeout(() => {
        if (this.sseConnection.status === 'connecting') {
          this.disconnect('Connection timeout', onConnectionStatusChange);
          reject(new Error('Connection timeout'));
        }
      }, 15000);

      // Gestionnaires d'événements
      eventSource.onopen = () => {
        this.sseConnection.status = 'connected';
        onConnectionStatusChange?.('connected');
        this.sseConnection.eventSource = eventSource;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        resolve();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            return;
          }

          if (this.sseConnection.status === 'connected') {

            if (this.sseConnection.callback && data.type !== 'heartbeat') {
              this.sseConnection.callback(data);
            }
          }
        } catch (error) {
          console.error('[SupportRequestService] Error parsing message:', error);
        }
      };

      eventSource.onerror = async (error) => {
        console.error('[SupportRequestService] SSE Error:', error);

        // Si nous sommes en train de nous connecter
        if (this.sseConnection.status === 'connecting') {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          // Vérifier si l'erreur est liée à l'authentification
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.error('[SupportRequestService] Authentication session expired');
              this.disconnect('Authentication session expired', onConnectionStatusChange);
              reject(new Error('Authentication session expired'));
              return;
            }
          } catch (authError) {
            console.error('[SupportRequestService] Auth check failed:', authError);
            this.disconnect('Authentication failed', onConnectionStatusChange);
            reject(authError);
            return;
          }

          // Si ce n'est pas une erreur d'authentification, déconnecter normalement
          this.disconnect(error instanceof Error ? error.message : String(error), onConnectionStatusChange);
          reject(error);
          return;
        }

        // Si nous étions déjà connectés, essayer de se reconnecter
        if (this.sseConnection.status === 'connected') {
          this.handleReconnection(token, callback);
        }
      };
    });
  }

  private disconnect(error?: string, onConnectionStatusChange?: (status: ConnectionStatus, error?: string) => void) {

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.sseConnection.eventSource) {
      this.sseConnection.eventSource.close();
    }

    const callback = this.sseConnection.callback;
    this.sseConnection = {
      eventSource: null,
      status: 'disconnected',
      callback: null,
      token: null
    };
    if (callback && onConnectionStatusChange) {
      onConnectionStatusChange('disconnected', error);
    }
  }

  private async handleReconnection(token: string, callback: (data: { type: string; data: SupportRequest; old_status: string }) => void) {
    this.disconnect();

    const initialRetryDelay = 1000; // Délai initial de 1 seconde
    const maxRetryDelay = 30000;    // Délai maximum de 30 secondes
    const maxRetries = 5;           // Nombre maximum de tentatives
    let retryCount = 0;
    let currentDelay = initialRetryDelay;

    const attemptReconnection = async () => {
      try {
        // Vérifier d'abord la session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[SupportRequestService] No valid session for reconnection');
          throw new Error('Authentication session expired');
        }

        const newToken = session.access_token;
        await this.connect(newToken, callback);

        // Réinitialiser le délai en cas de succès
        currentDelay = initialRetryDelay;
      } catch (error) {
        console.error('[SupportRequestService] Reconnection failed:', error);
        retryCount++;

        if (retryCount < maxRetries) {
          setTimeout(attemptReconnection, currentDelay);

          // Augmenter le délai de manière exponentielle (backoff)
          currentDelay = Math.min(currentDelay * 2, maxRetryDelay);
        } else {
          console.error('[SupportRequestService] Max reconnection attempts reached');
          // Notifier l'utilisateur qu'il doit rafraîchir la page
          window.dispatchEvent(new CustomEvent('sse-connection-failed', {
            detail: { message: 'Connection lost. Please refresh the page.' }
          }));
        }
      }
    };

    attemptReconnection();
  }

  async updateTypingStatus(support_request_id: string, isTyping: boolean): Promise<void> {
    try {
      await this.fetchWithSupportService(`/${support_request_id}/typing`, {
        method: 'POST',
        body: JSON.stringify({ isTyping }),
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }

  async getSupportRequest(id: string): Promise<SupportRequest | null> {
    try {
      const result = await this.fetchWithSupportService<SupportRequest | null>(`/${id}`);
      // Convertir undefined en null explicitement
      return result === undefined ? null : result;
    } catch (error) {
      console.error('[SupportRequestService.getSupportRequest] Error:', error);
      throw error;
    }
  }

  async getSupportRequestMessages(id: string): Promise<SupportMessage[]> {
    const result = await this.fetchWithSupportService<SupportMessage[]>(`/${id}/messages`);
    return result || [];
  }
}

export const supportRequestService = new SupportRequestService();
