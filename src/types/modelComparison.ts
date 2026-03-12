/**
 * Types pour la comparaison de modèles IA
 */

export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelResponse {
  message: ChatMessage;
  model: string;
  context: Array<{ text: string; score: number }>;
}

export interface ComparisonResponse {
  model1Response: ModelResponse;
  model2Response: ModelResponse;
  conversationId: string;
}

export interface ComparisonState {
  isEnabled: boolean;
  isLoading: boolean;
  model1: string | null;
  model2: string | null;
  lastComparison: ComparisonResponse | null;
}
