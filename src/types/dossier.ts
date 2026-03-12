export type DossierStatus = 'open' | 'in_progress' | 'pending_review' | 'closed';
export type DossierPriority = 'low' | 'normal' | 'high' | 'urgent';
export type DossierType = 'licenciement' | 'contentieux' | 'rupture_conv' | 'audit' | 'general';
export type DossierEventType = 'created' | 'status_change' | 'note' | 'document_linked' | 'document_unlinked' | 'conversation_linked' | 'conversation_unlinked' | 'updated';

export interface Dossier {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description?: string;
  type?: DossierType;
  status: DossierStatus;
  priority: DossierPriority;
  metadata?: Record<string, any>;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DossierEvent {
  id: string;
  dossier_id: string;
  user_id?: string;
  type: DossierEventType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DossierDetail extends Dossier {
  conversations: any[];
  documents: any[];
  events: DossierEvent[];
}
