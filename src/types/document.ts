export interface PineconeIndexStats {
  dimension: number;
  indexFullness: number;
  totalVectorCount: number;
  namespaces: Record<string, {
    vectorCount: number;
  }>;
}

export interface Document {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
  vector_count: number;
  error_message?: string;
  active: boolean;
  client_id?: string;
  vectorInfo?: {
    status: string;
    expectedVectors: number;
    actualVectors: number;
    indexStats: PineconeIndexStats;
    isFullyVectorized: boolean;
    error?: string;
  };
}
