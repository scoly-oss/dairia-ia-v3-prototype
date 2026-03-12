/**
 * Configuration des modes de réponse
 * Cette configuration définit la structure hiérarchique des modes disponibles
 */

import {
  ResponseModeConfig,
  CategoryConfig,
  ResponseModeType,
  RedactionCategory
} from '../types/responseMode';

// Modes de réponse de haut niveau
export const RESPONSE_MODES: ResponseModeConfig[] = [
  {
    id: 'recherche',
    type: 'recherche',
    label: 'Recherche enrichie',
    description: 'Recherche dans la base documentaire avec analyse juridique approfondie',
    promptKey: 'prompt_recherche_enrichie',
    hasSubCategories: false
  },
  {
    id: 'conseil',
    type: 'conseil',
    label: 'Conseil',
    description: 'Conseil juridique personnalisé et pratique',
    promptKey: 'prompt_conseil',
    hasSubCategories: false
  },
  {
    id: 'redaction',
    type: 'redaction',
    label: 'Rédaction',
    description: 'Rédaction de documents et courriers juridiques',
    promptKey: 'prompt_redaction',
    hasSubCategories: true
  }
];

// Catégories de rédaction (niveau 2)
export const REDACTION_CATEGORIES: CategoryConfig[] = [
  {
    id: 'licenciement',
    category: 'licenciement',
    label: 'Licenciement',
    description: 'Documents liés au licenciement',
    promptKey: 'prompt_redaction_licenciement',
    subCategories: [
      {
        id: 'courrier',
        subCategory: 'courrier',
        label: 'Courrier de Licenciement',
        promptKey: 'prompt_redaction_licenciement_courrier',
        actions: [
          {
            id: 'disciplinaire',
            label: 'Rédiger un courrier de licenciement pour raison disciplinaire',
            promptKey: 'prompt_redaction_licenciement_disciplinaire'
          },
          {
            id: 'inaptitude',
            label: 'Rédiger un courrier de licenciement pour inaptitude',
            promptKey: 'prompt_redaction_licenciement_inaptitude'
          },
          {
            id: 'economique',
            label: 'Rédiger un courrier de licenciement économique',
            promptKey: 'prompt_redaction_licenciement_economique'
          }
        ]
      },
      {
        id: 'reponse',
        subCategory: 'reponse',
        label: 'Réponse à un courrier',
        promptKey: 'prompt_redaction_licenciement_reponse',
        actions: []
      },
      {
        id: 'document_juridique',
        subCategory: 'document_juridique',
        label: 'Document juridique',
        promptKey: 'prompt_redaction_licenciement_document',
        actions: []
      }
    ]
  },
  {
    id: 'paye',
    category: 'paye',
    label: 'Paye',
    description: 'Documents liés à la paie',
    promptKey: 'prompt_redaction_paye',
    subCategories: []
  },
  {
    id: 'accident_travail',
    category: 'accident_travail',
    label: 'Accident du travail',
    description: 'Documents liés aux accidents du travail',
    promptKey: 'prompt_redaction_accident',
    subCategories: []
  },
  {
    id: 'arret_maladie',
    category: 'arret_maladie',
    label: 'Arrêt maladie',
    description: 'Documents liés aux arrêts maladie',
    promptKey: 'prompt_redaction_maladie',
    subCategories: []
  }
];

// Helper pour obtenir un mode par son type
export const getModeByType = (type: ResponseModeType): ResponseModeConfig | undefined => {
  return RESPONSE_MODES.find(mode => mode.type === type);
};

// Helper pour obtenir une catégorie par son id
export const getCategoryById = (category: RedactionCategory): CategoryConfig | undefined => {
  return REDACTION_CATEGORIES.find(cat => cat.category === category);
};

// Helper pour vérifier si une catégorie a des sous-catégories définies
export const categoryHasSubCategories = (category: RedactionCategory): boolean => {
  const cat = getCategoryById(category);
  return !!(cat?.subCategories && cat.subCategories.length > 0);
};

// Helper pour vérifier si une sous-catégorie a des actions définies
export const subCategoryHasActions = (category: RedactionCategory, subCategoryId: string): boolean => {
  const cat = getCategoryById(category);
  if (!cat?.subCategories) return false;
  const subCat = cat.subCategories.find(sc => sc.id === subCategoryId);
  return !!(subCat?.actions && subCat.actions.length > 0);
};
