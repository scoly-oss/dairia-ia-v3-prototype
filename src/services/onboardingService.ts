import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';
import { Company } from '../types/auth';

interface CompleteOnboardingResponse {
  status: string;
  message: string;
  company: Company;
}

interface OnboardingStatusResponse {
  status: string;
  data: {
    needsOnboarding: boolean;
    companyId: string;
    companyName: string;
    isOnboarded: boolean;
  };
}

class OnboardingService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.onboarding;

  /**
   * Vérifie si l'utilisateur a besoin d'onboarding
   */
  async checkOnboardingStatus(): Promise<boolean> {
    const response = await this.fetchWithAuth<OnboardingStatusResponse>('/status');
    return response?.data.needsOnboarding || false;
  }

  /**
   * Complète l'onboarding de l'entreprise
   */
  async completeOnboarding(data: {
    activite: string;
    effectif: number;
    default_idcc?: string;
    default_idcc_label?: string;
  }): Promise<Company> {
    const response = await this.fetchWithAuth<CompleteOnboardingResponse>(
      '/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          activite: data.activite,
          effectif: data.effectif,
          default_idcc: data.default_idcc,
          default_idcc_label: data.default_idcc_label,
        })
      }
    );

    if (!response?.company) {
      throw new Error('Échec de l\'onboarding');
    }

    return response.company;
  }

  /**
   * Met à jour les informations de l'entreprise
   */
  async updateCompanyInfo(data: {
    convention_collective?: string;
    effectif?: number;
    activite?: string;
  }): Promise<Company> {
    const response = await this.fetchWithAuth<CompleteOnboardingResponse>(
      '/company-info',
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );

    if (!response?.company) {
      throw new Error('Échec de la mise à jour');
    }

    return response.company;
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;
