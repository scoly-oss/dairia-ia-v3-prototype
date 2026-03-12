import { Document } from '../types/document';
import { API_CONFIG } from './apiConfig';
import { ChatMessage, ChatResponse } from './chatService';
import { BaseService } from './baseService';

export interface SemanticSearchResult {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  score: number;
  tags: string[];
}

class DocumentService extends BaseService {
  // URL de base pour les requêtes API
  protected baseUrl = API_CONFIG.endpoints.documents;

  // Utilise la méthode fetchWithAuth de BaseService avec un traitement spécifique pour les réponses
  private async fetchWithDocumentService<T>(path: string, options: RequestInit = {}): Promise<T> {
    // Gérer spécialement les requêtes avec FormData
    if (options.body instanceof FormData) {
      // Ne pas ajouter Content-Type pour FormData, le navigateur s'en charge
      const customOptions = { ...options };
      if (!customOptions.headers) {
        customOptions.headers = {};
      }
      
      const result = await super.fetchWithAuth<T | null | undefined>(path, customOptions);
      if (result === null || result === undefined) {
        throw new Error('No response received');
      }
      return result;
    }
    
    const result = await super.fetchWithAuth<T | null | undefined>(path, options);
    
    // For DELETE requests, undefined is a valid response (204 No Content)
    if (options.method === 'DELETE' && result === undefined) {
      return result as T;
    }
    
    if (result === null || result === undefined) {
      throw new Error('No response received');
    }
    return result;
  }

  async getAllDocuments(page: number = 1, pageSize: number = 10): Promise<{ documents: Document[], total: number }> {
    return this.fetchWithDocumentService<{ documents: Document[], total: number }>(`?page=${page}&pageSize=${pageSize}`);
  }

  async searchDocumentsByFilename(filename: string, page: number = 1, pageSize: number = 10): Promise<{ documents: Document[], total: number }> {
    try {
      const response = await this.fetchWithDocumentService<{ documents: Document[], total: number }>(
        `search?filename=${encodeURIComponent(filename)}&page=${page}&pageSize=${pageSize}`
      );
      
      // Ensure we always return the expected format
      return {
        documents: response?.documents || [],
        total: response?.total || 0
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      return { documents: [], total: 0 };
    }
  }

  async getDocumentVectorInfo(documentId: string): Promise<Document> {
    return this.fetchWithDocumentService<Document>(`${documentId}/vector-info`);
  }

  async uploadDocument(file: File, company_id?: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    // Ajouter le company_id si présent
    if (company_id) {
      formData.append('company_id', company_id);
    }

    return this.fetchWithDocumentService<void>('upload', {
      method: 'POST',
      body: formData,
      // Ne pas définir Content-Type ici, il sera automatiquement défini avec la boundary
    });
  }

  async uploadClientDocument(file: File, tags?: string[], folderId?: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    if (folderId) {
      formData.append('folder_id', folderId);
    }

    return this.fetchWithDocumentService<void>('client/upload', {
      method: 'POST',
      body: formData,
      // Ne pas définir Content-Type ici, il sera automatiquement défini avec la boundary
    });
  }

  async getDocumentsByCompanyId(companyId: string, page: number = 1, pageSize: number = 10, folderId?: string): Promise<{ documents: Document[], total: number }> {
    let url = `company/${companyId}?page=${page}&pageSize=${pageSize}`;
    if (folderId) {
      url += `&folderId=${encodeURIComponent(folderId)}`;
    }
    return this.fetchWithDocumentService<{ documents: Document[], total: number }>(url);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.fetchWithDocumentService<void>(`${id}`, {
      method: 'DELETE',
    });
  }
  
  async deleteClientDocument(id: string): Promise<void> {
    await this.fetchWithDocumentService<void>(`client/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleDocumentActive(documentId: string, isActive: boolean): Promise<Document> {
    return this.fetchWithDocumentService<Document>(`${documentId}/toggle-active`, {
      method: 'PATCH',
      body: JSON.stringify({ active: isActive })
    });
  }

  async chatWithContext(messages: ChatMessage[], documentIds?: string[], company_id?: string): Promise<ChatResponse> {
    return this.fetchWithDocumentService<ChatResponse>('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, documentIds, company_id })
    });
  }

  /**
   * Recherche sémantique parmi les documents publics (admin uniquement)
   * @param query La requête de recherche sémantique
   * @param tags Tags optionnels pour filtrer les résultats
   * @returns Tableau de résultats de recherche
   */
  async semanticSearchPublicDocuments(query: string, tags?: string[]): Promise<SemanticSearchResult[]> {
    return this.fetchWithDocumentService<SemanticSearchResult[]>('admin/semantic-search', {
      method: 'POST',
      body: JSON.stringify({ query, tags })
    });
  }
}

export const documentService = new DocumentService();