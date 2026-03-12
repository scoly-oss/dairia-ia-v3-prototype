import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';

export interface SyncResult {
  totalFiles: number;
  uploaded: number;
  replaced: number;
  skipped: number;
  errors: { filename: string; error: string }[];
}

export interface SyncStatus {
  inProgress: boolean;
  current: number;
  total: number;
  currentFile: string;
  status: 'listing' | 'processing' | 'completed' | 'error';
}

export interface DriveConfigStatus {
  configured: boolean;
}

/**
 * Service pour la synchronisation Google Drive
 * Permet de synchroniser les documents depuis un dossier Google Drive
 */
class GoogleDriveSyncService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.admin;

  /**
   * Lance la synchronisation des documents depuis Google Drive
   * @returns Résultat de la synchronisation
   */
  async startSync(): Promise<SyncResult> {
    const result = await this.fetchWithAuth<SyncResult>('/google-drive/sync', {
      method: 'POST',
    });

    if (!result) {
      throw new Error('Réponse vide du serveur');
    }

    return result;
  }

  /**
   * Récupère le statut actuel de la synchronisation
   * @returns Statut de la synchronisation
   */
  async getStatus(): Promise<SyncStatus> {
    const result = await this.fetchWithAuth<SyncStatus>('/google-drive/status', {
      method: 'GET',
    });

    if (!result) {
      return {
        inProgress: false,
        current: 0,
        total: 0,
        currentFile: '',
        status: 'completed',
      };
    }

    return result;
  }

  /**
   * Vérifie si Google Drive est configuré
   * @returns Statut de configuration
   */
  async checkConfiguration(): Promise<DriveConfigStatus> {
    const result = await this.fetchWithAuth<DriveConfigStatus>('/google-drive/config', {
      method: 'GET',
    });

    if (!result) {
      return { configured: false };
    }

    return result;
  }
}

export const googleDriveSyncService = new GoogleDriveSyncService();
