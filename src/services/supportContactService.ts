import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

export interface SupportContactStatus {
  requested: boolean;
  requestedAt?: string;
}

export interface SupportContactResult {
  success: boolean;
  alreadyRequested?: boolean;
  requestedAt?: string;
}

/**
 * Service pour gérer les demandes de contact support
 * depuis la page de configuration du paiement
 */
class SupportContactService extends BaseService {
  protected baseUrl = buildUrl('supportContact');

  /**
   * Vérifie si l'utilisateur a déjà fait une demande de contact support
   */
  async checkStatus(): Promise<SupportContactStatus> {
    const result = await this.fetchWithAuth<SupportContactStatus>('/status');
    return result || { requested: false };
  }

  /**
   * Enregistre une demande de contact support
   * Envoie une notification Slack avec les infos du client
   */
  async requestSupportContact(): Promise<SupportContactResult> {
    const result = await this.fetchWithAuth<SupportContactResult>('/request', {
      method: 'POST',
    });
    return result || { success: false };
  }
}

export const supportContactService = new SupportContactService();
