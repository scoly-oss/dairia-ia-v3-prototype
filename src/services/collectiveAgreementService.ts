import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';
import {
  ConventionCollective,
  SearchConventionsResponse,
  GetConventionResponse,
  UpdateDefaultCCData,
  GetDefaultCCResponse,
  ResolveCCResponse
} from '../types/collectiveAgreement';

/**
 * Service pour gérer les conventions collectives
 */
class CollectiveAgreementService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.collectiveAgreements;

  /**
   * Recherche des conventions collectives par texte
   * @param query Texte de recherche
   * @param limit Nombre max de résultats (défaut: 10)
   */
  async searchConventions(query: string, limit: number = 10): Promise<SearchConventionsResponse> {
    const result = await this.fetchWithAuth<SearchConventionsResponse>(
      `/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { method: 'GET' }
    );
    return result || { conventions: [], total: 0 };
  }

  /**
   * Liste les conventions collectives
   * @param page Numéro de page (défaut: 1)
   * @param limit Nombre par page (défaut: 20)
   */
  async listConventions(page: number = 1, limit: number = 20): Promise<SearchConventionsResponse> {
    const result = await this.fetchWithAuth<SearchConventionsResponse>(
      `/list?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
    return result || { conventions: [], total: 0 };
  }

  /**
   * Récupère les détails d'une convention collective par IDCC
   * @param idcc Code IDCC
   * @throws Error si l'IDCC n'existe pas ou en cas d'erreur serveur
   */
  async getConventionByIdcc(idcc: string): Promise<GetConventionResponse> {
    // fetchWithAuth lance une exception avec le message d'erreur du backend
    // si la réponse n'est pas OK (404, 500, etc.)
    const result = await this.fetchWithAuth<GetConventionResponse>(
      `/${idcc}`,
      { method: 'GET' }
    );
    return result || { convention: {} as ConventionCollective, success: false, error: 'Convention non trouvée' };
  }

  /**
   * Vérifie la santé du service MCP KALI
   */
  async checkHealth(): Promise<{ status: string; mcpConnected: boolean }> {
    const result = await this.fetchWithAuth<{ status: string; mcpConnected: boolean }>(
      '/health',
      { method: 'GET' }
    );
    return result || { status: 'error', mcpConnected: false };
  }

  // --- Méthodes pour la CC par défaut de l'entreprise ---

  /**
   * Récupère la convention collective par défaut d'une entreprise
   * @param companyId ID de l'entreprise
   */
  async getCompanyDefaultCC(companyId: string): Promise<GetDefaultCCResponse> {
    const result = await this.fetchWithAuth<{ data: GetDefaultCCResponse }>(
      `${API_CONFIG.endpoints.companies}/${companyId}/default-cc`,
      { method: 'GET' }
    );
    return result?.data || { defaultCC: null };
  }

  /**
   * Met à jour la convention collective par défaut d'une entreprise
   * @param companyId ID de l'entreprise
   * @param data Données de la CC (idcc, idcc_label)
   */
  async updateCompanyDefaultCC(companyId: string, data: UpdateDefaultCCData): Promise<{ success: boolean; error?: string }> {
    try {
      await this.fetchWithAuth(
        `${API_CONFIG.endpoints.companies}/${companyId}/default-cc`,
        {
          method: 'PATCH',
          body: JSON.stringify(data)
        }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Supprime la convention collective par défaut d'une entreprise
   * @param companyId ID de l'entreprise
   */
  async removeCompanyDefaultCC(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.fetchWithAuth(
        `${API_CONFIG.endpoints.companies}/${companyId}/default-cc`,
        { method: 'DELETE' }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // --- Méthodes pour l'IDCC des dossiers ---

  /**
   * Met à jour l'IDCC d'un dossier
   * @param folderId ID du dossier
   * @param data Données IDCC (idcc, idcc_label)
   */
  async updateFolderIdcc(folderId: string, data: UpdateDefaultCCData): Promise<{ success: boolean; error?: string }> {
    try {
      await this.fetchWithAuth(
        `${API_CONFIG.endpoints.folders}/${folderId}/idcc`,
        {
          method: 'PATCH',
          body: JSON.stringify(data)
        }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Résout un nom de convention collective en IDCC officiel
   * Utilise gpt-4o-mini côté backend pour normaliser le nom
   * @param input Texte saisi (nom de CC, abréviation, ou code IDCC)
   */
  async resolveConvention(input: string): Promise<ResolveCCResponse> {
    const result = await this.fetchWithAuth<ResolveCCResponse>(
      '/resolve',
      {
        method: 'POST',
        body: JSON.stringify({ input })
      }
    );
    return result || { success: false, error: 'Erreur de connexion' };
  }
}

export const collectiveAgreementService = new CollectiveAgreementService();
