import { BaseService } from './baseService';
import { buildUrl } from './apiConfig';

export interface ConversationDocument {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: 'processing' | 'completed' | 'error';
  uploadedAt: string;
  conversationId: string;
  s3Key?: string;
  errorMessage?: string;
}

export interface UploadResponse {
  message: string;
  documentId: string;
  status: string;
  document?: ConversationDocument;
}

class ConversationDocumentService extends BaseService {
  protected baseUrl = buildUrl('conversationDocuments');

  /**
   * Récupère les documents liés à une conversation
   * @param conversationId ID de la conversation
   * @returns Liste des documents
   */
  async getConversationDocuments(conversationId: string): Promise<ConversationDocument[]> {
    try {
      const response = await this.fetchWithAuth<ConversationDocument[]>(`/${conversationId}/documents`);
      return response || [];
    } catch (error) {
      console.error('Error getting conversation documents:', error);
      throw error;
    }
  }

  /**
   * Upload un document et l'associe à une conversation
   * @param conversationId ID de la conversation
   * @param file Fichier à uploader
   * @returns Informations du document créé
   */
  async uploadConversationDocument(conversationId: string, file: File): Promise<UploadResponse> {
    try {
      console.log('[ConversationDocumentService] uploadConversationDocument called', { conversationId, fileName: file.name });
      const formData = new FormData();
      formData.append('file', file);
      console.log('[ConversationDocumentService] FormData created, calling fetchWithAuth...');

      const response = await this.fetchWithAuth<UploadResponse>(`/${conversationId}/documents`, {
        method: 'POST',
        body: formData
      });

      console.log('[ConversationDocumentService] fetchWithAuth response:', response);
      return response!;
    } catch (error) {
      console.error('[ConversationDocumentService] Error uploading conversation document:', error);
      throw error;
    }
  }

  /**
   * Supprime un document lié à une conversation
   * @param conversationId ID de la conversation
   * @param documentId ID du document
   */
  async deleteConversationDocument(conversationId: string, documentId: string): Promise<void> {
    try {
      await this.fetchWithAuth<void>(`/${conversationId}/documents/${documentId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting conversation document:', error);
      throw error;
    }
  }

  /**
   * Télécharge un document et retourne un Blob
   * @param conversationId ID de la conversation
   * @param documentId ID du document
   * @returns Blob du fichier téléchargé
   */
  async downloadConversationDocument(conversationId: string, documentId: string): Promise<Blob> {
    try {
      // Obtenir le token d'authentification
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/${conversationId}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading conversation document:', error);
      throw error;
    }
  }
}

export const conversationDocumentService = new ConversationDocumentService();
