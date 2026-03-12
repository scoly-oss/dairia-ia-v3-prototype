import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';
import { Dossier, DossierDetail, DossierEvent, DossierStatus, DossierType, DossierPriority } from '../types/dossier';
import { MOCK_DOSSIERS, MOCK_DOSSIER_DETAILS } from '../data/mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface DossiersResponse {
  data: { dossiers: Dossier[] };
}

interface DossierDetailResponse {
  data: { dossier: Dossier; conversations: any[]; documents: any[]; events: DossierEvent[] };
}

interface DossierResponse {
  data: { dossier: Dossier };
}

interface EventResponse {
  data: { event: DossierEvent };
}

class DossierService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.dossiers;

  async getDossiers(options?: { status?: DossierStatus; type?: DossierType; limit?: number }): Promise<Dossier[]> {
    if (DEMO_MODE) {
      let dossiers = [...MOCK_DOSSIERS];
      if (options?.status) dossiers = dossiers.filter(d => d.status === options.status);
      if (options?.type) dossiers = dossiers.filter(d => d.type === options.type);
      if (options?.limit) dossiers = dossiers.slice(0, options.limit);
      return dossiers;
    }
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', String(options.limit));

    const qs = params.toString();
    const response = await this.fetchWithAuth<DossiersResponse>(`/${qs ? `?${qs}` : ''}`);
    return response!.data.dossiers;
  }

  async getDossier(id: string): Promise<DossierDetail> {
    if (DEMO_MODE) {
      const detail = MOCK_DOSSIER_DETAILS[id];
      if (!detail) throw new Error('Dossier not found');
      return detail;
    }
    const response = await this.fetchWithAuth<DossierDetailResponse>(`/${id}`);
    const { dossier, conversations, documents, events } = response!.data;
    return { ...dossier, conversations, documents, events };
  }

  async createDossier(data: {
    title: string;
    description?: string;
    type?: DossierType;
    priority?: DossierPriority;
  }): Promise<Dossier> {
    const response = await this.fetchWithAuth<DossierResponse>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response!.data.dossier;
  }

  async updateDossier(id: string, data: Partial<Pick<Dossier, 'title' | 'description' | 'status' | 'priority' | 'type'>>): Promise<Dossier> {
    const response = await this.fetchWithAuth<DossierResponse>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response!.data.dossier;
  }

  async deleteDossier(id: string): Promise<void> {
    await this.fetchWithAuth(`/${id}`, { method: 'DELETE' });
  }

  async linkConversation(dossierId: string, conversationId: string): Promise<void> {
    await this.fetchWithAuth(`/${dossierId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  }

  async unlinkConversation(dossierId: string, conversationId: string): Promise<void> {
    await this.fetchWithAuth(`/${dossierId}/conversations/${conversationId}`, { method: 'DELETE' });
  }

  async linkDocument(dossierId: string, documentId: string): Promise<void> {
    await this.fetchWithAuth(`/${dossierId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId }),
    });
  }

  async unlinkDocument(dossierId: string, documentId: string): Promise<void> {
    await this.fetchWithAuth(`/${dossierId}/documents/${documentId}`, { method: 'DELETE' });
  }

  async addNote(dossierId: string, title: string, description?: string): Promise<DossierEvent> {
    const response = await this.fetchWithAuth<EventResponse>(`/${dossierId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
    return response!.data.event;
  }
}

export const dossierService = new DossierService();
export default dossierService;
