import {
  Folder,
  CreateFolderData,
  UpdateFolderData,
  UpdateFolderIdccData,
  GetFoldersResponse,
  MoveDocumentResponse
} from '../types/folder';
import { API_CONFIG } from './apiConfig';
import { BaseService } from './baseService';

class FolderService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.folders;

  /**
   * Récupère tous les dossiers d'une company
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getFoldersByCompany(_companyId: string): Promise<GetFoldersResponse> {
    const response = await this.fetchWithAuth<GetFoldersResponse>('');
    if (!response) {
      throw new Error('Failed to fetch folders: No response from server');
    }
    return response;
  }

  /**
   * Crée un nouveau dossier
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   * @param folderData Données du dossier (nom, is_client_folder, idcc, idcc_label)
   */
  async createFolder(folderData: CreateFolderData): Promise<Folder> {
    // Ne pas envoyer company_id, il est récupéré depuis le JWT côté backend
    // La route retourne directement le folder (pas d'enveloppe {success, folder})
    const payload: {
      name: string;
      is_client_folder: boolean;
      idcc?: string;
      idcc_label?: string;
    } = {
      name: folderData.name,
      // Toujours envoyer le flag explicitement (true ou false)
      is_client_folder: folderData.is_client_folder === true
    };

    // Ajouter les champs CC seulement si c'est un dossier client
    if (payload.is_client_folder && folderData.idcc) {
      payload.idcc = folderData.idcc;
      payload.idcc_label = folderData.idcc_label;
    }

    console.log('[FolderService] Creating folder with payload:', payload);

    const folder = await this.fetchWithAuth<Folder>('', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!folder) {
      throw new Error('Failed to create folder: No response from server');
    }

    return folder;
  }

  /**
   * Renomme un dossier
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   */
  async updateFolder(folderId: string, _companyId: string, updateData: UpdateFolderData): Promise<Folder> {
    // La route retourne directement le folder (pas d'enveloppe {success, folder})
    const folder = await this.fetchWithAuth<Folder>(`/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (!folder) {
      throw new Error('Failed to update folder: No response from server');
    }

    return folder;
  }

  /**
   * Supprime un dossier (seulement s'il est vide)
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteFolder(folderId: string, _companyId: string): Promise<void> {
    // La route retourne 204 No Content (pas de body)
    await this.fetchWithAuth<void>(`/${folderId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Déplace un document vers un dossier
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async moveDocumentToFolder(folderId: string, documentId: string, _companyId: string): Promise<void> {
    // La route retourne {message: ...}
    await this.fetchWithAuth<MoveDocumentResponse>(`/${folderId}/documents/${documentId}`, {
      method: 'PATCH'
    });
  }

  /**
   * Retire un document de son dossier (le met "hors dossier")
   * Le company_id est récupéré automatiquement depuis le JWT côté backend
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeDocumentFromFolder(documentId: string, _companyId: string): Promise<void> {
    // La route retourne {message: ...}
    await this.fetchWithAuth<MoveDocumentResponse>(`/documents/${documentId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Met à jour l'IDCC d'un dossier (le transforme en dossier client)
   * @param folderId ID du dossier
   * @param idccData Données IDCC (idcc, idcc_label)
   */
  async updateFolderIdcc(folderId: string, idccData: UpdateFolderIdccData): Promise<Folder> {
    const folder = await this.fetchWithAuth<Folder>(`/${folderId}/idcc`, {
      method: 'PATCH',
      body: JSON.stringify(idccData)
    });

    if (!folder) {
      throw new Error('Failed to update folder IDCC: No response from server');
    }

    return folder;
  }
}

export const folderService = new FolderService();
