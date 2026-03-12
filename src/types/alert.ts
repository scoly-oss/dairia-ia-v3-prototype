export type AlertType = 'deadline' | 'compliance' | 'legal_watch' | 'token_limit' | 'ccn_update';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  company_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  due_date?: string;
  source?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}
