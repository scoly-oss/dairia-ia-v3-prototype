/**
 * Types pour la progression du chat en temps réel via SSE
 */

/**
 * Étapes de progression du traitement d'une requête chat
 */
export type ChatProgressStep =
  | 'init'              // Initialisation
  | 'embedding'         // Génération de l'embedding de la question
  | 'search'            // Recherche dans la base documentaire (Pinecone)
  | 'legal_analysis'    // Analyse du type de recherche juridique (GPT-4o-mini)
  | 'mcp_jurisprudence' // Consultation de la jurisprudence (nouveau)
  | 'mcp_code'          // Consultation des codes français (nouveau)
  | 'mcp_loda'          // Consultation des textes législatifs (nouveau)
  | 'mcp_cc_article'    // Consultation d'un article de convention collective (KALI)
  | 'idcc_check'        // Vérification de la convention collective applicable
  | 'mcp_analysis'      // Analyse si la CC doit être consultée
  | 'mcp_fetch'         // Récupération des articles CC via Claude MCP
  | 'ai_processing'     // Traitement par l'IA principale
  | 'formatting'        // Formatage et finalisation de la réponse
  | 'complete';         // Terminé

/**
 * Événement SSE reçu du backend
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ChatProgressEvent {
  type: 'progress' | 'response' | 'error';
  step?: ChatProgressStep;
  // Les données SSE peuvent contenir différentes structures selon le type d'événement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  message?: string;
  modelId?: string; // Pour le mode comparaison
}

/**
 * Configuration des étapes de progression pour l'affichage
 */
export const PROGRESS_STEPS_CONFIG: Record<ChatProgressStep, { message: string; progress: number }> = {
  init: { message: "Initialisation...", progress: 5 },
  embedding: { message: "Analyse de votre question...", progress: 20 },
  search: { message: "Consultation de la base documentaire...", progress: 40 },
  legal_analysis: { message: "Analyse du type de recherche juridique...", progress: 42 },
  mcp_jurisprudence: { message: "Consultation de la jurisprudence...", progress: 45 },
  mcp_code: { message: "Consultation des codes français...", progress: 50 },
  mcp_loda: { message: "Consultation des textes législatifs...", progress: 55 },
  mcp_cc_article: { message: "Consultation de la convention collective...", progress: 58 },
  idcc_check: { message: "Vérification convention collective...", progress: 60 },
  mcp_analysis: { message: "Analyse des besoins juridiques...", progress: 65 },
  mcp_fetch: { message: "Recherche dans la convention collective...", progress: 80 },
  ai_processing: { message: "Réflexion en cours...", progress: 90 },
  formatting: { message: "Finalisation de la réponse...", progress: 98 },
  complete: { message: "Terminé", progress: 100 }
};

/**
 * État de progression pour le mode comparaison
 */
export interface ComparisonProgressState {
  model1Step: ChatProgressStep | null;
  model2Step: ChatProgressStep | null;
}
