/**
 * Types pour les modes de réponse de l'IA
 */

// Types de modes de haut niveau
export type ResponseModeType = 'recherche' | 'conseil' | 'redaction';

// Catégories de rédaction
export type RedactionCategory = 'licenciement' | 'paye' | 'accident_travail' | 'arret_maladie';

// Sous-catégories de licenciement
export type LicenciementSubCategory = 'courrier' | 'reponse' | 'document_juridique';

// Configuration d'un mode de réponse
export interface ResponseModeConfig {
  id: string;
  type: ResponseModeType;
  label: string;
  description: string;
  promptKey: string;
  hasSubCategories: boolean;
}

// Configuration d'une catégorie (niveau 2)
export interface CategoryConfig {
  id: string;
  category: RedactionCategory;
  label: string;
  description: string;
  promptKey: string;
  subCategories?: SubCategoryConfig[];
}

// Configuration d'une sous-catégorie (niveau 3)
export interface SubCategoryConfig {
  id: string;
  subCategory: string;
  label: string;
  promptKey: string;
  actions?: ActionConfig[];
}

// Configuration d'une action (niveau 4 - boutons)
export interface ActionConfig {
  id: string;
  label: string;
  promptKey: string;
  prefillMessage?: string;
}

// Mode sélectionné par l'utilisateur
export interface SelectedMode {
  mode: ResponseModeType;
  category?: RedactionCategory;
  subCategory?: string;
  action?: string;
  promptKey: string;
  displayLabel: string;
}
