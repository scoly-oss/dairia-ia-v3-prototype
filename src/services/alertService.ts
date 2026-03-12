import { BaseService } from './baseService';
import { API_CONFIG } from './apiConfig';
import { Alert, AlertType, AlertSeverity } from '../types/alert';
import { MOCK_ALERTS } from '../data/mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface AlertsResponse {
  data: { alerts: Alert[] };
}

interface UnreadCountResponse {
  data: { count: number };
}

interface AlertResponse {
  data: { alert: Alert };
}

class AlertService extends BaseService {
  protected baseUrl = API_CONFIG.endpoints.alerts;

  async getAlerts(options?: { unreadOnly?: boolean; type?: AlertType; limit?: number }): Promise<Alert[]> {
    if (DEMO_MODE) {
      let alerts = [...MOCK_ALERTS];
      if (options?.unreadOnly) alerts = alerts.filter(a => !a.is_read);
      if (options?.type) alerts = alerts.filter(a => a.type === options.type);
      if (options?.limit) alerts = alerts.slice(0, options.limit);
      return alerts;
    }
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.set('unreadOnly', 'true');
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', String(options.limit));

    const qs = params.toString();
    const response = await this.fetchWithAuth<AlertsResponse>(`/${qs ? `?${qs}` : ''}`);
    return response!.data.alerts;
  }

  async getUnreadCount(): Promise<number> {
    if (DEMO_MODE) return MOCK_ALERTS.filter(a => !a.is_read).length;
    const response = await this.fetchWithAuth<UnreadCountResponse>('/unread-count');
    return response!.data.count;
  }

  async createAlert(data: {
    type: AlertType;
    severity?: AlertSeverity;
    title: string;
    description?: string;
    due_date?: string;
    source?: string;
    source_url?: string;
  }): Promise<Alert> {
    const response = await this.fetchWithAuth<AlertResponse>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response!.data.alert;
  }

  async markAsRead(alertId: string): Promise<void> {
    await this.fetchWithAuth(`/${alertId}/read`, { method: 'PATCH' });
  }

  async markAllAsRead(): Promise<void> {
    await this.fetchWithAuth('/mark-all-read', { method: 'POST' });
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.fetchWithAuth(`/${alertId}`, { method: 'DELETE' });
  }
}

export const alertService = new AlertService();
export default alertService;
