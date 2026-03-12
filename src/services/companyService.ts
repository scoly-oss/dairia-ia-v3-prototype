import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';
import { Company, User } from '../types/auth';

export interface CreateCompanyRequest {
  name: string;
  subscriptionStartDate?: string;
  monthlyTokenLimit?: number;
  subscriptionType?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  subscriptionStartDate?: string;
  monthlyTokenLimit?: number;
  subscriptionType?: string;
  isActive?: boolean;
}

export interface CreateCompanyUserRequest {
  email: string;
  password: string;
  role: 'client' | 'company_user';
  firstName?: string;
  lastName?: string;
}

export interface UpdateCompanyUserRequest {
  email?: string;
  role?: 'client' | 'company_user';
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionRequest {
  monthlyTokenLimit?: number;
  subscriptionStartDate?: string;
  subscriptionType?: string;
}

interface MonthlyHistoryEntry {
  month_year: string;
  tokens_used: number;
  message_count: number;
}

// Backend user type with snake_case properties
interface BackendUser {
  id: string;
  email: string;
  role: 'client' | 'company_user' | 'lawyer' | 'admin';
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  company_id?: string;
}

// API Response types
interface CompaniesResponse {
  data: { companies: Company[] };
}

interface CompanyResponse {
  data: { company: Company };
}

interface UsersResponse {
  data: { users: BackendUser[] };
}

interface UserResponse {
  data: { user: BackendUser };
}

interface CreateUserResponse {
  data: { user: BackendUser; billingUpdated: boolean };
}

export interface AddUserResult {
  user: User;
  billingUpdated: boolean;
}

interface TokenStatsResponse {
  data: CompanyTokenStats;
}

export interface CompanyTokenStats {
  currentMonthTokens: number;
  currentMonthCost: number;  // Coût réel calculé depuis estimated_cost (GPT + Claude)
  tokenLimit: number;
  remainingTokens: number;
  subscriptionType?: string;
  subscriptionStartDate?: string | null;
  renewalDate: string | null;
  userCount: number;
  monthlyHistory?: MonthlyHistoryEntry[];
  // Stripe subscription fields
  subscriptionStatus: string;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  companyCreatedAt: string | null;
}

// Per-seat billing types
export interface SeatBillingPreview {
  prorationAmount?: number;
  creditAmount?: number;
  currency: string;
  periodEnd: string;
}

export interface SubscriptionSeats {
  currentSeats: number;
  pricePerSeat: number;
  monthlyTotal: number;
  currency: string;
}

// Extended company with token stats for batch response
export interface CompanyWithStats extends Company {
  tokenStats: CompanyTokenStats;
}

interface CompaniesWithStatsResponse {
  data: { companies: CompanyWithStats[] };
}

class CompanyService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.companies;

  /**
   * Transforme les données utilisateur du backend (snake_case) vers le frontend (camelCase)
   */
  private transformUserData(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      email: backendUser.email,
      role: backendUser.role,
      firstName: backendUser.first_name,
      lastName: backendUser.last_name,
      isActive: backendUser.is_active ?? true,
      company_id: backendUser.company_id,
    };
  }

  /**
   * Récupère toutes les companies (admin uniquement)
   */
  async getAllCompanies(): Promise<Company[]> {
    const response = await this.fetchWithAuth<CompaniesResponse>('/');
    return response!.data.companies;
  }

  /**
   * Récupère toutes les companies avec leurs statistiques de tokens en batch (admin uniquement)
   * OPTIMIZED: Une seule requête au lieu de N+1 requêtes
   */
  async getAllCompaniesWithStats(): Promise<CompanyWithStats[]> {
    const response = await this.fetchWithAuth<CompaniesWithStatsResponse>('/with-stats');
    return response!.data.companies;
  }

  /**
   * Récupère une company par son ID
   */
  async getCompany(id: string): Promise<Company> {
    const response = await this.fetchWithAuth<CompanyResponse>(`/${id}`);
    return response!.data.company;
  }

  /**
   * Récupère la company de l'utilisateur connecté
   */
  async getMyCompany(): Promise<Company> {
    const response = await this.fetchWithAuth<CompanyResponse>('/my-company');
    return response!.data.company;
  }

  /**
   * Crée une nouvelle company (admin uniquement)
   */
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await this.fetchWithAuth<CompanyResponse>('/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response!.data.company;
  }

  /**
   * Met à jour une company
   */
  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
    const response = await this.fetchWithAuth<CompanyResponse>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response!.data.company;
  }

  /**
   * Supprime une company (admin uniquement)
   */
  async deleteCompany(id: string): Promise<void> {
    await this.fetchWithAuth(`/${id}`, { method: 'DELETE' });
  }

  /**
   * Récupère tous les utilisateurs d'une company
   */
  async getCompanyUsers(id: string): Promise<User[]> {
    const response = await this.fetchWithAuth<UsersResponse>(`/${id}/users`);
    const backendUsers = response!.data.users;
    return backendUsers.map((user: BackendUser) => this.transformUserData(user));
  }

  /**
   * Ajoute un utilisateur à une company
   */
  async addUserToCompany(id: string, data: CreateCompanyUserRequest): Promise<AddUserResult> {
    const response = await this.fetchWithAuth<CreateUserResponse>(`/${id}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return {
      user: this.transformUserData(response!.data.user),
      billingUpdated: response!.data.billingUpdated
    };
  }

  /**
   * Met à jour un utilisateur d'une company
   */
  async updateCompanyUser(companyId: string, userId: string, data: UpdateCompanyUserRequest): Promise<User> {
    const response = await this.fetchWithAuth<UserResponse>(`/${companyId}/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return this.transformUserData(response!.data.user);
  }

  /**
   * Retire un utilisateur d'une company
   */
  async removeUserFromCompany(companyId: string, userId: string): Promise<void> {
    await this.fetchWithAuth(`/${companyId}/users/${userId}`, { method: 'DELETE' });
  }

  /**
   * Récupère les statistiques de tokens d'une company
   */
  async getCompanyTokenStats(id: string): Promise<CompanyTokenStats> {
    const response = await this.fetchWithAuth<TokenStatsResponse>(`/${id}/token-stats`);
    return response!.data;
  }

  /**
   * Récupère les statistiques de tokens de la company de l'utilisateur connecté
   */
  async getMyCompanyTokenStats(): Promise<CompanyTokenStats> {
    const response = await this.fetchWithAuth<TokenStatsResponse>('/my-company/token-stats');
    return response!.data;
  }

  /**
   * Met à jour l'abonnement d'une company (admin uniquement)
   */
  async updateCompanySubscription(id: string, data: UpdateSubscriptionRequest): Promise<void> {
    await this.fetchWithAuth(`/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Met à jour les informations de l'entreprise (effectif, activité)
   */
  async updateCompanyInfo(id: string, data: { effectif?: number; activite?: string }): Promise<Company> {
    const response = await this.fetchWithAuth<CompanyResponse>(`/${id}/info`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response!.data.company;
  }

  // ==========================================
  // Per-Seat Billing Methods
  // ==========================================

  /**
   * Preview billing impact for adding a user (proration amount)
   */
  async previewAddUserBilling(companyId: string): Promise<SeatBillingPreview> {
    const response = await this.fetchWithAuth<{ data: SeatBillingPreview }>(`/${companyId}/billing/preview-add`);
    return response!.data;
  }

  /**
   * Preview billing credit for removing a user
   */
  async previewRemoveUserBilling(companyId: string): Promise<SeatBillingPreview> {
    const response = await this.fetchWithAuth<{ data: SeatBillingPreview }>(`/${companyId}/billing/preview-remove`);
    return response!.data;
  }

  /**
   * Get subscription seat information
   */
  async getSubscriptionSeats(companyId: string): Promise<SubscriptionSeats> {
    const response = await this.fetchWithAuth<{ data: SubscriptionSeats }>(`/${companyId}/subscription-seats`);
    return response!.data;
  }

  /**
   * Reactivate a deactivated user
   */
  async reactivateUser(companyId: string, userId: string): Promise<void> {
    await this.fetchWithAuth(`/${companyId}/users/${userId}/reactivate`, {
      method: 'POST'
    });
  }
}

export const companyService = new CompanyService();
export default companyService;
