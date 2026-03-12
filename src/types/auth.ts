export type UserRole = 'client' | 'company_user' | 'lawyer' | 'admin';

export interface Company {
  id: string;
  name: string;
  subscription_start_date?: string;
  monthly_token_limit?: number;
  subscription_type?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Champs onboarding
  is_onboarded?: boolean;
  convention_collective?: string;
  effectif?: number;
  activite?: string;
  /** Code IDCC de la convention collective par défaut */
  default_idcc?: string;
  /** Libellé de la convention collective par défaut */
  default_idcc_label?: string;
  // Champs profil entreprise V3
  siret?: string;
  naf_code?: string;
  company_address?: string;
  company_city?: string;
  company_zipcode?: string;
  contract_types?: string[];
  key_deadlines?: Array<{ label: string; date: string; recurring?: boolean }>;
  // Champs abonnement/Stripe
  subscription_status?: string;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  company_id?: string;
  companyId?: string;
  companyName?: string;
  subscriptionStatus?: string;
  company?: Company;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
}
