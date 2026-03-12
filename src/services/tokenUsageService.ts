import { BaseService } from './baseService';
import { buildUrl } from './apiConfig';

export interface TokenUsageStats {
  currentMonthTokens: number;
  tokenLimit: number;
  remainingTokens: number;
  subscriptionType: string;
  subscriptionStartDate: string | null;
  renewalDate: string | null;
  monthlyHistory: MonthlyTokenUsage[];
}

export interface MonthlyTokenUsage {
  user_id: string;
  month_year: string;
  tokens_used: number;
  total_cost: number;
  message_count: number;
}

export interface TokenLimitCheck {
  canUse: boolean;
  tokensUsed: number;
  tokenLimit: number;
  renewalDate: string | null;
}

export interface TokenUsage {
  id: string;
  user_id: string;
  conversation_id?: string;
  message_id?: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  usage_date: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSubscriptionRequest {
  monthlyTokenLimit?: number;
  subscriptionStartDate?: string;
  subscriptionType?: string;
}

export interface UserWithTokenStats {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  monthly_token_limit?: number;
  subscription_start_date?: string;
  subscription_type?: string;
  is_active?: boolean;
  currentMonthTokens: number;
  remainingTokens: number;
  renewalDate: string | null;
  usagePercentage: number;
}

/**
 * Statistiques Claude par company
 */
export interface ClaudeCompanyStats {
  companyId: string;
  companyName: string;
  isInternal: boolean;  // true = clé ANTHROPIC_DAIRIA_API_KEY, false = clé ANTHROPIC_API_KEY
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  byModel: Record<string, {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
}

/**
 * Statistiques Claude totales
 */
export interface ClaudeTotalStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Réponse des stats Claude
 */
export interface ClaudeTokenStatsResponse {
  companies: ClaudeCompanyStats[];
  totalStats: ClaudeTotalStats;
  internalStats: ClaudeTotalStats;  // Companies internes (clé ANTHROPIC_DAIRIA_API_KEY)
  externalStats: ClaudeTotalStats;  // Clients externes (clé ANTHROPIC_API_KEY)
}

class TokenUsageService extends BaseService {
  protected baseUrl = buildUrl('tokens');
  /**
   * Récupère les statistiques d'usage des tokens pour l'utilisateur connecté
   */
  async getUserTokenStats(): Promise<TokenUsageStats> {
    const response = await this.fetchWithAuth<{data: TokenUsageStats}>('/stats');
    return response!.data;
  }

  /**
   * Vérifie si l'utilisateur peut encore utiliser des tokens
   */
  async checkTokenLimit(): Promise<TokenLimitCheck> {
    const response = await this.fetchWithAuth<{data: TokenLimitCheck}>('/check-limit');
    return response!.data;
  }

  /**
   * Récupère l'historique détaillé d'usage des tokens
   */
  async getUserTokenUsage(startDate?: string, endDate?: string): Promise<TokenUsage[]> {
    let url = '/usage';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await this.fetchWithAuth<{data: TokenUsage[]}>(url);
    return response!.data;
  }

  /**
   * Met à jour la souscription d'un utilisateur (admin uniquement)
   */
  async updateUserSubscription(userId: string, updates: UpdateSubscriptionRequest): Promise<void> {
    await this.fetchWithAuth(`/admin/subscription/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Récupère les statistiques de tous les utilisateurs (admin uniquement)
   */
  async getAllUsersTokenStats(): Promise<UserWithTokenStats[]> {
    const response = await this.fetchWithAuth<{data: UserWithTokenStats[]}>('/admin/all-stats');
    return response!.data;
  }

  /**
   * Récupère les statistiques d'usage des tokens Claude par company (admin uniquement)
   * @param startDate Date de début (YYYY-MM-DD), défaut: 1er du mois en cours
   * @param endDate Date de fin (YYYY-MM-DD), défaut: aujourd'hui
   */
  async getClaudeTokenStats(startDate?: string, endDate?: string): Promise<ClaudeTokenStatsResponse> {
    let url = '/admin/claude-stats';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await this.fetchWithAuth<{data: ClaudeTokenStatsResponse}>(url);
    return response!.data;
  }


  /**
   * Calcule le coût estimé basé sur le nombre de tokens
   * Utilise les tarifs approximatifs d'OpenAI GPT-5
   */
  calculateEstimatedCost(tokens: number): number {
    // Tarifs approximatifs en € pour 1000 tokens (conversion USD -> EUR ~0.95)  
    // GPT-5 - Input: ~0.0012€, Output: ~0.0095€ - moyenne: ~0.0053€
    const costPer1000Tokens = 0.0053;
    return (tokens / 1000) * costPer1000Tokens;
  }

  /**
   * Estime le coût cumulé depuis le début de l'abonnement
   * Basé sur l'usage actuel et la date de début d'abonnement
   */
  calculateCumulativeCost(currentMonthTokens: number, subscriptionStartDate?: string): number {
    if (!subscriptionStartDate) return this.calculateEstimatedCost(currentMonthTokens);
    
    const startDate = new Date(subscriptionStartDate);
    const now = new Date();
    const monthsActive = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Estimation basée sur l'usage moyen par mois
    const averageMonthlyTokens = currentMonthTokens; // Approximation
    const totalEstimatedTokens = averageMonthlyTokens * monthsActive;
    
    return this.calculateEstimatedCost(totalEstimatedTokens);
  }

  /**
   * Formate les tokens en format lisible
   */
  formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  }

  /**
   * Calcule le pourcentage d'utilisation
   */
  calculateUsagePercentage(used: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  }

  /**
   * Détermine la couleur selon le pourcentage d'utilisation
   */
  getUsageColor(percentage: number): 'success' | 'warning' | 'error' {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  }

  /**
   * Formate la date de renouvellement
   */
  formatRenewalDate(dateString: string | null): string {
    if (!dateString) return 'Non défini';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Calcule les jours restants jusqu'au renouvellement
   */
  getDaysUntilRenewal(dateString: string | null): number {
    if (!dateString) return 0;
    
    const renewalDate = new Date(dateString);
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Estime le coût mensuel basé sur l'usage actuel
   */
  estimateMonthlyCost(currentTokens: number, daysIntoMonth: number): number {
    if (daysIntoMonth === 0) return 0;
    
    const avgTokensPerDay = currentTokens / daysIntoMonth;
    const daysInMonth = 30; // Approximation
    const estimatedMonthlyTokens = avgTokensPerDay * daysInMonth;
    
    // Coût approximatif basé sur GPT-5 (à ajuster selon les tarifs réels)
    const costPer1KTokens = 0.005; // Estimation moyenne
    return (estimatedMonthlyTokens / 1000) * costPer1KTokens;
  }
}

export const tokenUsageService = new TokenUsageService();