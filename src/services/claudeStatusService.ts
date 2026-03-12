import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

export type ClaudeErrorType = 'service_unavailable' | 'overloaded' | 'prompt_too_long';

interface SubscribeResponse {
  message: string;
  subscribed?: boolean;
  alreadySubscribed?: boolean;
}

interface StatusResponse {
  subscribed: boolean;
}

class ClaudeStatusService extends BaseService {
  protected baseUrl = buildUrl('claudeStatus');

  /**
   * Subscribe to be notified when Claude is back online
   * @param errorType The type of error that triggered the subscription
   */
  async subscribe(errorType?: ClaudeErrorType): Promise<SubscribeResponse> {
    const response = await this.fetchWithAuth<SubscribeResponse>('subscribe', {
      method: 'POST',
      body: JSON.stringify({ errorType })
    });
    if (!response) {
      throw new Error('Empty response from server');
    }
    return response;
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(): Promise<{ message: string; removed: boolean }> {
    const response = await this.fetchWithAuth<{ message: string; removed: boolean }>('unsubscribe', {
      method: 'POST'
    });
    if (!response) {
      throw new Error('Empty response from server');
    }
    return response;
  }

  /**
   * Check if the current user is subscribed
   */
  async checkStatus(): Promise<StatusResponse> {
    const response = await this.fetchWithAuth<StatusResponse>('status', {
      method: 'GET'
    });
    if (!response) {
      throw new Error('Empty response from server');
    }
    return response;
  }
}

export const claudeStatusService = new ClaudeStatusService();
