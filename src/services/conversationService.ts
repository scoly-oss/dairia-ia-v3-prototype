import { Conversation } from '../types/conversation';
import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

export type { Conversation };

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedConversationsResponse {
  data: Conversation[];
  pagination: PaginationInfo;
}

export interface GetConversationsParams {
  userId?: string;
  companyId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

class ConversationService extends BaseService {
  // URL de base pour les requêtes API
  protected baseUrl = buildUrl('conversations');

  // Utilise la méthode fetchWithAuth de BaseService avec un traitement spécifique pour les réponses
  private async fetchWithConversationService<T>(path: string, options: RequestInit = {}): Promise<T> {
    // Définir un type pour la réponse qui peut contenir une propriété data
    interface ResponseWithData {
      data: T;
      [key: string]: unknown;
    }

    const result = await super.fetchWithAuth<ResponseWithData | T>(path, options);

    // Si le résultat est un objet avec une propriété data, retourner cette propriété
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data;
    }

    return result as T;
  }

  async getConversations(userId?: string): Promise<Conversation[]> {
    const endpoint = userId ? `?userId=${userId}` : '';
    const response = await this.fetchWithConversationService<Conversation[]>(endpoint);
    return response || [];
  }

  /**
   * Récupère les conversations avec pagination, tri et recherche
   * Retourne les données + métadonnées de pagination
   */
  async getConversationsPaginated(params: GetConversationsParams = {}): Promise<PaginatedConversationsResponse> {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.companyId) queryParams.append('companyId', params.companyId);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    // Utiliser fetchWithAuth directement pour accéder à la réponse complète (data + pagination)
    const result = await super.fetchWithAuth<{
      status: string;
      data: Conversation[];
      pagination: PaginationInfo;
    }>(endpoint);

    return {
      data: result?.data || [],
      pagination: result?.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 },
    };
  }

  async hideConversation(conversationId: string): Promise<void> {
    await this.fetchWithConversationService<void>(`${conversationId}/hide`, {
      method: 'PUT'
    });
  }

  async restoreConversation(conversationId: string): Promise<void> {
    await this.fetchWithConversationService<void>(`${conversationId}/hide`, {
      method: 'PUT'
    });
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    if ('title' in updates) {
      await this.fetchWithConversationService<void>(`${conversationId}/title`, {
        method: 'PUT',
        body: JSON.stringify({ title: updates.title })
      });
    } else if ('is_visible' in updates) {
      await this.fetchWithConversationService<void>(`${conversationId}/hide`, {
        method: 'PUT'
      });
    }
  }

  async createConversation(data: { title: string; userId?: string }): Promise<Conversation> {
    console.log('Creating conversation with data:', data);
    const response = await this.fetchWithConversationService<Conversation>('', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('Parsed API response:', response);

    // Vérifier si la réponse est un objet direct
    if (!response?.id) {
      throw new Error('Invalid response from server: missing conversation ID');
    }
    return response;
  }
}

export const conversationService = new ConversationService();