import { User, UserRole } from '../types/auth';
import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyId?: string;
}

export interface UpdateUserData {
  id: string;
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedUsersResponse {
  data: User[];
  pagination: PaginationInfo;
}

export interface GetUsersParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  subscriptionStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ExportColumn {
  key: string;
  label: string;
}

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'email', label: 'Email' },
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'role', label: 'Rôle' },
  { key: 'companyName', label: 'Entreprise' },
  { key: 'isActive', label: 'Statut' },
  { key: 'subscriptionStatus', label: 'Statut abonnement' },
];

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'trialing', label: 'Essai' },
  { value: 'past_due', label: 'Retard paiement' },
  { value: 'pending_payment', label: 'En attente' },
  { value: 'canceled', label: 'Annulé' },
  { value: 'incomplete', label: 'Incomplet' },
];

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  trialing: 'Essai',
  past_due: 'Retard paiement',
  pending_payment: 'En attente',
  canceled: 'Annulé',
  incomplete: 'Incomplet',
};

class UserService extends BaseService {
  protected baseUrl = buildUrl('admin');

  private async fetchWithUserService<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log('Fetching user service:', path);
      const token = await this.getAuthToken();
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        ...options.headers,
      });
      
      const result = await super.fetchWithAuth<T>(path, options);
      return result as T;
    } catch (error) {
      console.error('User service fetch error:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    return this.fetchWithUserService<User>('users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userData: UpdateUserData): Promise<User> {
    return this.fetchWithUserService<User>(`users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void | null> {
    return this.fetchWithUserService<void>(`users/${userId}`, {
      method: 'DELETE',
    });
  }

  async deactivateUser(userId: string): Promise<User> {
    return this.fetchWithUserService<User>(`users/${userId}/deactivate`, {
      method: 'PUT',
    });
  }

  async activateUser(userId: string): Promise<User> {
    return this.fetchWithUserService<User>(`users/${userId}/activate`, {
      method: 'PUT',
    });
  }

  async getAllUsers(params?: GetUsersParams): Promise<PaginatedUsersResponse> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.subscriptionStatus) queryParams.append('subscriptionStatus', params.subscriptionStatus);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));

    const queryString = queryParams.toString();
    const url = queryString ? `users?${queryString}` : 'users';

    return this.fetchWithUserService<PaginatedUsersResponse>(url);
  }

  async getAvailableRoles(): Promise<string[]> {
    return this.fetchWithUserService<string[]>('available-roles');
  }

  /**
   * Génère et télécharge un CSV côté client (pour la page courante)
   */
  generateCSVFromUsers(users: User[], columns: string[]): void {
    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      lawyer: 'Avocat',
      client: 'Admin Entreprise',
      company_user: 'Utilisateur Entreprise'
    };

    // En-têtes
    const headers = columns.map(col => {
      const column = EXPORT_COLUMNS.find(c => c.key === col);
      return column ? column.label : col;
    });

    // Lignes de données
    const rows = users.map(user => {
      return columns.map(col => {
        let value: string;
        switch (col) {
          case 'isActive':
            value = user.isActive ? 'Actif' : 'Inactif';
            break;
          case 'role':
            value = roleLabels[user.role] || user.role;
            break;
          case 'email':
            value = user.email || '';
            break;
          case 'firstName':
            value = user.firstName || '';
            break;
          case 'lastName':
            value = user.lastName || '';
            break;
          case 'phone':
            value = user.phone || '';
            break;
          case 'companyName':
            value = user.companyName || '';
            break;
          case 'subscriptionStatus':
            value = user.subscriptionStatus
              ? (SUBSCRIPTION_STATUS_LABELS[user.subscriptionStatus] || user.subscriptionStatus)
              : 'Sans entreprise';
            break;
          default:
            value = '';
        }
        // Échapper les guillemets et entourer de guillemets
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',');
    });

    // Contenu CSV avec BOM UTF-8
    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `users_export_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exporte les utilisateurs via le backend (pour tous ou filtrés)
   */
  async exportUsersToCSV(params: {
    columns: string[];
    search?: string;
    role?: string;
    isActive?: boolean;
    subscriptionStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<void> {
    const queryParams = new URLSearchParams();

    queryParams.append('columns', params.columns.join(','));
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params.subscriptionStatus) queryParams.append('subscriptionStatus', params.subscriptionStatus);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/users/export?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }

    // Télécharger le fichier
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Extraire le nom du fichier du header Content-Disposition si disponible
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'users_export.csv';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1];
    }

    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const userService = new UserService();