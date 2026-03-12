/**
 * Types pour la gestion des conventions collectives
 */

/**
 * Convention collective de base
 */
export interface ConventionCollective {
  /** Code IDCC (3-4 chiffres) ex: "1486" pour Syntec, "016" pour Transports */
  idcc: string;
  /** Titre/nom de la convention */
  titre: string;
  /** Date de publication */
  date_publi?: string;
  /** Identifiant technique KALICONT */
  id_kali?: string;
}

/**
 * Extrait d'une convention collective
 */
export interface CCExtract {
  /** Titre de la section/article */
  titre: string;
  /** Contenu textuel de l'extrait */
  contenu: string;
  /** Référence de l'article (ex: "Article 36") */
  article_ref: string;
  /** Score de pertinence (0-1) */
  score?: number;
}

/**
 * Requête de recherche de conventions collectives
 */
export interface SearchConventionsRequest {
  query: string;
  limit?: number;
}

/**
 * Réponse de la recherche de conventions collectives
 */
export interface SearchConventionsResponse {
  conventions: ConventionCollective[];
  total: number;
}

/**
 * Réponse pour obtenir une convention par IDCC
 */
export interface GetConventionResponse {
  convention: ConventionCollective;
  success: boolean;
  error?: string;
}

/**
 * Données pour mettre à jour la CC par défaut d'une company
 */
export interface UpdateDefaultCCData {
  idcc: string;
  idcc_label: string;
}

/**
 * Réponse de la récupération de la CC par défaut
 */
export interface GetDefaultCCResponse {
  defaultCC: {
    idcc: string;
    idcc_label: string;
  } | null;
}

/**
 * Réponse de la résolution d'une convention collective
 * (endpoint POST /api/cc/resolve)
 */
export interface ResolveCCResponse {
  success: boolean;
  convention?: ConventionCollective;
  error?: string;
}
