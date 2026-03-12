export interface Folder {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  /** Indique si c'est un dossier client (avec CC obligatoire) */
  is_client_folder?: boolean;
  /** Code IDCC de la convention collective associée */
  idcc?: string;
  /** Libellé de la convention collective */
  idcc_label?: string;
}

export interface FolderWithDocumentCount extends Folder {
  document_count: number;
  active_document_count: number;
}

export interface CreateFolderData {
  name: string;
  company_id: string;
  created_by?: string;
  /** Indique si c'est un dossier client (avec CC obligatoire) */
  is_client_folder?: boolean;
  /** Code IDCC de la convention collective associée */
  idcc?: string;
  /** Libellé de la convention collective */
  idcc_label?: string;
}

export interface UpdateFolderIdccData {
  idcc: string;
  idcc_label: string;
}

export interface UpdateFolderData {
  name?: string;
  idcc?: string;
  idcc_label?: string;
}

export interface GetFoldersResponse {
  folders: FolderWithDocumentCount[];
  total: number;
  noFolderDocumentCount: number;
}

export interface CreateFolderResponse {
  success: boolean;
  folder?: Folder;
  error?: string;
}

export interface UpdateFolderResponse {
  success: boolean;
  folder?: Folder;
  error?: string;
}

export interface DeleteFolderResponse {
  success: boolean;
  error?: string;
}

export interface MoveDocumentResponse {
  message: string;
}
