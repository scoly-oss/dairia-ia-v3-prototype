import { buildUrl, API_URL } from './apiConfig';
import { BaseService } from './baseService';
import { ChatProgressStep, ChatProgressEvent } from '../types/chatProgress';
import { supabase } from './supabase';
import { ClaudeErrorType } from './claudeStatusService';

/**
 * Erreur personnalisée pour les erreurs de l'API Claude
 * Permet de transporter errorType et canSubscribe
 */
export class ChatApiError extends Error {
  errorType?: ClaudeErrorType;
  canSubscribe?: boolean;

  constructor(message: string, errorType?: ClaudeErrorType, canSubscribe?: boolean) {
    super(message);
    this.name = 'ChatApiError';
    this.errorType = errorType;
    this.canSubscribe = canSubscribe;
  }
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'lawyer';
  content: string;
  created_at: string;
}

export interface StructuredAIResponse {
  faits?: string;
  sources?: string[];
  analyse?: string;
  conseils?: string[];
  demandes?: string[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  context: Array<{
    text: string;
    score: number;
  }>;
  model?: string;
  errorType?: ClaudeErrorType;
  canSubscribe?: boolean;
  structuredResponse?: StructuredAIResponse;
}

export interface ModelResponse {
  message: ChatMessage;
  model: string;
  context: Array<{ text: string; score: number }>;
}

export interface ComparisonResponse {
  model1Response: ModelResponse;
  model2Response: ModelResponse;
  conversationId: string;
}

interface ApiResponse<T> {
  status?: 'success' | 'error';
  data?: T;
  results?: T;
  message?: string;
}

class ChatService extends BaseService {
  protected baseUrl = buildUrl('messages');

  async fetchWithChatService<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const data = await super.fetchWithAuth<ApiResponse<T>>(path, options);
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('Error in fetchWithChatService:', error);
      throw error;
    }
  }

  async chatWithContext(
    messages: ChatMessage[],
    conversationId?: string,
    company_id?: string | null,
    folder_id?: string,
    response_mode_key?: string
  ): Promise<ChatResponse> {
    try {
      interface ChatApiResponse {
        assistantMessage: ChatMessage;
        conversationId: string;
        context: Array<{ text: string; score: number; }>;
        structuredResponse?: StructuredAIResponse;
      }

      // Préparer le payload avec TOUS les messages pour maintenir le contexte conversationnel
      const payload: {
        messages: Array<{ role: string; content: string }>;
        conversationId?: string;
        company_id?: string | null;
        folder_id?: string;
        response_mode_key?: string;
      } = {
        // Envoyer l'historique complet de la conversation
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        conversationId
      };

      // Toujours inclure company_id dans le payload, même s'il est null
      // Cela permet au backend de savoir explicitement qu'aucune company n'est sélectionnée
      payload.company_id = company_id;

      // Inclure folder_id si fourni
      if (folder_id) {
        payload.folder_id = folder_id;
      }

      // Inclure response_mode_key si fourni (pour les modes de réponse ciblés)
      if (response_mode_key) {
        payload.response_mode_key = response_mode_key;
      }

      const response = await this.fetchWithChatService<ChatApiResponse>('/chat-with-context', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        message: response.data!.assistantMessage,
        conversationId: response.data!.conversationId,
        context: response.data!.context,
        structuredResponse: response.data!.structuredResponse,
      };
    } catch (error) {
      console.error('Error in chatWithContext:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await this.fetchWithChatService<ChatMessage[]>(`/${conversationId}`, {
        method: 'GET'
      });

      if (response?.status === 'success' && Array.isArray(response.data)) {
        return response.data;
      }

      console.warn('Unexpected response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Envoie un message et compare les réponses de deux modèles IA (admin seulement)
   */
  async chatWithComparison(
    messages: ChatMessage[],
    conversationId?: string,
    company_id?: string | null,
    folder_id?: string,
    response_mode_key?: string
  ): Promise<ComparisonResponse> {
    try {
      const payload: {
        messages: Array<{ role: string; content: string }>;
        conversationId?: string;
        company_id?: string | null;
        folder_id?: string;
        response_mode_key?: string;
      } = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        conversationId
      };

      payload.company_id = company_id;

      if (folder_id) {
        payload.folder_id = folder_id;
      }

      if (response_mode_key) {
        payload.response_mode_key = response_mode_key;
      }

      const response = await this.fetchWithChatService<ComparisonResponse>('/chat-compare', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        model1Response: response.data!.model1Response,
        model2Response: response.data!.model2Response,
        conversationId: response.data!.conversationId
      };
    } catch (error) {
      console.error('Error in chatWithComparison:', error);
      throw error;
    }
  }

  /**
   * Envoie un message avec progression en temps réel via SSE
   * @param messages Historique des messages
   * @param onProgress Callback appelé à chaque étape de progression
   * @param conversationId ID de la conversation (optionnel)
   * @param company_id ID de la company (optionnel)
   * @param folder_id ID du dossier (optionnel)
   * @param response_mode_key Clé du mode de réponse (optionnel)
   * @returns Promise avec la réponse du chat
   */
  async chatWithProgress(
    messages: ChatMessage[],
    onProgress: (step: ChatProgressStep) => void,
    conversationId?: string,
    company_id?: string | null,
    folder_id?: string,
    response_mode_key?: string
  ): Promise<ChatResponse> {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      conversationId,
      company_id,
      folder_id,
      response_mode_key
    };

    // Récupérer le token d'authentification
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Non authentifié');
    }

    return new Promise((resolve, reject) => {
      // Utiliser fetch avec ReadableStream pour SSE via POST
      fetch(`${API_URL}/messages/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then(async response => {
          if (!response.ok) {
            // Lire le corps de la réponse pour extraire le message d'erreur
            const errorBody = await response.json().catch(() => null);
            const errorMessage = errorBody?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
          }
          if (!response.body) {
            throw new Error('ReadableStream not supported');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              buffer += decoder.decode(value, { stream: true });

              // Traiter les lignes complètes
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Garder la dernière ligne incomplète

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const eventData: ChatProgressEvent = JSON.parse(line.slice(6));

                    if (eventData.type === 'progress' && eventData.step) {
                      onProgress(eventData.step);
                    } else if (eventData.type === 'response') {
                      resolve({
                        message: eventData.data.assistantMessage,
                        conversationId: eventData.data.conversationId,
                        context: eventData.data.context,
                        model: eventData.data.model,
                        errorType: eventData.data.errorType,
                        canSubscribe: eventData.data.canSubscribe,
                        structuredResponse: eventData.data.structuredResponse,
                      });
                      return;
                    } else if (eventData.type === 'error') {
                      // Extraire errorType et canSubscribe si présents dans data
                      const errorType = eventData.data?.errorType as ClaudeErrorType | undefined;
                      const canSubscribe = eventData.data?.canSubscribe as boolean | undefined;
                      reject(new ChatApiError(
                        eventData.message || 'Erreur lors du traitement',
                        errorType,
                        canSubscribe
                      ));
                      return;
                    }
                  } catch {
                    // Ignorer les lignes qui ne sont pas du JSON valide (comme les heartbeats)
                  }
                }
              }
            }
          };

          processStream().catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Envoie un message en mode comparaison avec progression en temps réel via SSE
   * @param messages Historique des messages
   * @param onProgress Callback appelé à chaque étape de progression (avec modelId)
   * @param conversationId ID de la conversation (optionnel)
   * @param company_id ID de la company (optionnel)
   * @param folder_id ID du dossier (optionnel)
   * @param response_mode_key Clé du mode de réponse (optionnel)
   * @returns Promise avec les réponses de comparaison
   */
  async chatWithComparisonProgress(
    messages: ChatMessage[],
    onProgress: (step: ChatProgressStep, modelId: 'model1' | 'model2') => void,
    conversationId?: string,
    company_id?: string | null,
    folder_id?: string,
    response_mode_key?: string
  ): Promise<ComparisonResponse> {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      conversationId,
      company_id,
      folder_id,
      response_mode_key
    };

    // Récupérer le token d'authentification
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Non authentifié');
    }

    return new Promise((resolve, reject) => {
      fetch(`${API_URL}/messages/chat-compare-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then(async response => {
          if (!response.ok) {
            // Lire le corps de la réponse pour extraire le message d'erreur
            const errorBody = await response.json().catch(() => null);
            const errorMessage = errorBody?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
          }
          if (!response.body) {
            throw new Error('ReadableStream not supported');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const eventData: ChatProgressEvent = JSON.parse(line.slice(6));

                    if (eventData.type === 'progress' && eventData.step && eventData.modelId) {
                      onProgress(eventData.step, eventData.modelId as 'model1' | 'model2');
                    } else if (eventData.type === 'response') {
                      resolve({
                        model1Response: eventData.data.model1Response,
                        model2Response: eventData.data.model2Response,
                        conversationId: eventData.data.conversationId
                      });
                      return;
                    } else if (eventData.type === 'error') {
                      // Extraire errorType et canSubscribe si présents dans data
                      const errorType = eventData.data?.errorType as ClaudeErrorType | undefined;
                      const canSubscribe = eventData.data?.canSubscribe as boolean | undefined;
                      reject(new ChatApiError(
                        eventData.message || 'Erreur lors du traitement',
                        errorType,
                        canSubscribe
                      ));
                      return;
                    }
                  } catch {
                    // Ignorer les lignes non-JSON
                  }
                }
              }
            }
          };

          processStream().catch(reject);
        })
        .catch(reject);
    });
  }
}

export const chatService = new ChatService();