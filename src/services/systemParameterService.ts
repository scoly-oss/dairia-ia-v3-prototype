import { BaseService } from './baseService';
import { buildUrl } from './apiConfig';

export interface SystemPrompt {
  prompt: string;
}

export interface SystemParameter {
  name: string;
  value: string;
  display_name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface PromptsWithModelVersions {
  basePrompts: SystemParameter[];
  modelVersions: Record<string, Record<string, SystemParameter>>;
  availableModels: string[];
}

/**
 * Service pour gérer les paramètres système
 */
class SystemParameterService extends BaseService {
  protected baseUrl = buildUrl('admin', '/system');

  /**
   * Récupère le prompt système
   * @returns Le prompt système
   */
  public async getSystemPrompt(): Promise<SystemPrompt> {
    try {
      const response = await this.fetchWithAuth<SystemPrompt>('/prompt', {
        method: 'GET',
      });
      if (!response) {
        throw new Error('Prompt système non trouvé');
      }
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du prompt système:', error);
      throw error;
    }
  }

  /**
   * Met à jour le prompt système
   * @param prompt Le nouveau prompt système
   * @returns Le prompt système mis à jour
   */
  public async updateSystemPrompt(prompt: string): Promise<SystemPrompt> {
    try {
      const response = await this.fetchWithAuth<SystemPrompt>('/prompt', {
        method: 'PUT',
        body: JSON.stringify({ prompt }),
      });
      if (!response) {
        throw new Error('Échec de la mise à jour du prompt système');
      }
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prompt système:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les prompts de mode de réponse
   * @returns Liste des prompts
   */
  public async getAllPrompts(): Promise<SystemParameter[]> {
    try {
      const response = await this.fetchWithAuth<{ prompts: SystemParameter[] }>('/prompts', {
        method: 'GET',
      });
      return response?.prompts || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des prompts:', error);
      throw error;
    }
  }

  /**
   * Met à jour un prompt par sa clé
   * @param key La clé du prompt
   * @param value Le nouveau contenu du prompt
   * @returns Le prompt mis à jour
   */
  public async updatePromptByKey(key: string, value: string): Promise<SystemParameter> {
    try {
      const response = await this.fetchWithAuth<SystemParameter>(`/prompts/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      if (!response) {
        throw new Error('Échec de la mise à jour du prompt');
      }
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du prompt ${key}:`, error);
      throw error;
    }
  }

  /**
   * Récupère la liste des modèles IA disponibles
   * @returns Liste des identifiants de modèles
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithAuth<{ models: string[] }>('/models', {
        method: 'GET',
      });
      return response?.models || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error);
      throw error;
    }
  }

  /**
   * Récupère le modèle IA par défaut
   * @returns Identifiant du modèle par défaut
   */
  public async getDefaultModel(): Promise<string> {
    try {
      const response = await this.fetchWithAuth<{ model: string }>('/default-model', {
        method: 'GET',
      });
      return response?.model || 'gpt-5.1';
    } catch (error) {
      console.error('Erreur lors de la récupération du modèle par défaut:', error);
      throw error;
    }
  }

  /**
   * Met à jour le modèle IA par défaut
   * @param model Identifiant du nouveau modèle par défaut
   * @returns Succès ou erreur
   */
  public async setDefaultModel(model: string): Promise<{ success: boolean; model: string }> {
    try {
      const response = await this.fetchWithAuth<{ success: boolean; model: string }>('/default-model', {
        method: 'PUT',
        body: JSON.stringify({ model }),
      });
      if (!response?.success) {
        throw new Error('Échec de la mise à jour du modèle');
      }
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du modèle par défaut:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les prompts avec leurs versions par modèle
   * @returns Les prompts de base et leurs versions par modèle
   */
  public async getAllPromptsWithModelVersions(): Promise<PromptsWithModelVersions> {
    try {
      const response = await this.fetchWithAuth<PromptsWithModelVersions>('/prompts-with-models', {
        method: 'GET',
      });
      return response || { basePrompts: [], modelVersions: {}, availableModels: [] };
    } catch (error) {
      console.error('Erreur lors de la récupération des prompts avec versions:', error);
      throw error;
    }
  }

  /**
   * Met à jour un prompt pour un modèle spécifique
   * @param key La clé du prompt
   * @param model Le modèle cible
   * @param value Le nouveau contenu du prompt
   * @returns Le prompt mis à jour
   */
  public async updatePromptByKeyAndModel(key: string, model: string, value: string): Promise<SystemParameter> {
    try {
      const response = await this.fetchWithAuth<SystemParameter>(
        `/prompts/${encodeURIComponent(key)}/model/${encodeURIComponent(model)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ value }),
        }
      );
      if (!response) {
        throw new Error('Échec de la mise à jour du prompt');
      }
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du prompt ${key} pour ${model}:`, error);
      throw error;
    }
  }
}

export const systemParameterService = new SystemParameterService();
