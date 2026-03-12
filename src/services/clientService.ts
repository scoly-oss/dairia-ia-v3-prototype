import { supabase } from './supabase';
import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

export interface ClientOption {
  id: string;
  email: string;
  full_name?: string;
}

class ClientService extends BaseService {
  protected baseUrl = buildUrl('reviewRequests');
  /**
   * Récupère la liste des clients
   * @returns Liste des clients
   */
  async getClients(): Promise<ClientOption[]> {
    try {
      console.log('ClientService: Fetching clients from API...');
      
      // Récupérer le rôle de l'utilisateur
      const { data: userData } = await supabase.auth.getUser();
      const userRole = userData?.user?.user_metadata?.role;
      
      // Utiliser l'endpoint approprié selon le rôle
      if (userRole === 'admin') {
        // Définir temporairement la baseUrl pour admin
        this.baseUrl = buildUrl('admin');
        try {
          const data = await this.fetchWithAuth<ClientOption[]>('/clients');
          console.log('ClientService: Clients data received from admin API:', data);
          return data || [];
        } catch (adminError) {
          console.error('Error fetching clients from admin endpoint:', adminError);
          // Si l'endpoint admin échoue, on essaie l'endpoint lawyer
        }
      }
      
      // Si on est lawyer ou si l'endpoint admin a échoué
      this.baseUrl = buildUrl('reviewRequests');
      const data = await this.fetchWithAuth<ClientOption[]>('/clients');
      console.log('ClientService: Clients data received from reviewRequests API:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching clients from all endpoints:', error);
      throw error;
    }
  }


}

export const clientService = new ClientService();
