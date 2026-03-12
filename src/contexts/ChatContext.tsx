import React, { createContext, useState, useCallback, useRef } from 'react';
import { chatService, ChatMessage, ComparisonResponse, ChatApiError, StructuredAIResponse } from '../services/chatService';
import { conversationService } from '../services/conversationService';
import { supabase } from '../services/supabase';
import { ChatProgressStep, ComparisonProgressState } from '../types/chatProgress';
import { ClaudeErrorType } from '../services/claudeStatusService';

// État d'erreur Claude pour afficher l'alerte de statut
export interface ClaudeErrorState {
  errorType: ClaudeErrorType;
  canSubscribe: boolean;
}

export interface ChatContextValue {
  messages: ChatMessage[];
  loading: boolean;
  currentContext: Array<{ text: string; score: number }>;
  currentConversationId?: string;
  selectedFolderId?: string | null;
  setSelectedFolderId: (folderId: string | null) => void;
  sendMessage: (message: string, conversationIdOverride?: string, responseModeKey?: string) => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  // Progress tracking
  progressStep: ChatProgressStep | null;
  // Comparison mode
  comparisonMode: boolean;
  setComparisonMode: (enabled: boolean) => void;
  comparisonLoading: boolean;
  comparisonProgress: ComparisonProgressState;
  lastComparisonResponse: ComparisonResponse | null;
  sendComparisonMessage: (message: string, conversationIdOverride?: string, responseModeKey?: string) => Promise<void>;
  // Structured response
  lastStructuredResponse: StructuredAIResponse | null;
  // Claude error state
  claudeError: ClaudeErrorState | null;
  clearClaudeError: () => void;
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  onConversationCreated?: (conversationId: string) => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, onConversationCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<Array<{ text: string; score: number }>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  // Progress tracking state
  const [progressStep, setProgressStep] = useState<ChatProgressStep | null>(null);
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState<ComparisonProgressState>({
    model1Step: null,
    model2Step: null
  });
  const [lastComparisonResponse, setLastComparisonResponse] = useState<ComparisonResponse | null>(null);
  // Structured response from last AI message
  const [lastStructuredResponse, setLastStructuredResponse] = useState<StructuredAIResponse | null>(null);
  // Claude error state
  const [claudeError, setClaudeError] = useState<ClaudeErrorState | null>(null);

  const clearClaudeError = useCallback(() => {
    setClaudeError(null);
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) {
      setMessages([]);
      setCurrentConversationId(undefined);
      return;
    }

    try {
      setLoading(true);
      const loadedMessages = await chatService.getMessages(convId);
      setMessages(loadedMessages);
      setCurrentConversationId(convId);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Si la conversation n'existe pas, réinitialiser l'état
      if (error instanceof Error && error.message === 'Conversation not found') {
        setMessages([]);
        setCurrentConversationId(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Garde une trace de la dernière conversation créée pour éviter les doublons
  const lastCreatedConversationRef = useRef<{ id: string; timestamp: number } | null>(null);
  const DUPLICATE_PREVENTION_WINDOW = 10000; // 10 secondes

  const sendMessage = useCallback(async (content: string, conversationIdOverride?: string, responseModeKey?: string) => {
    if (!content.trim()) return;

    // Récupérer l'utilisateur connecté
    const authSession = await supabase.auth.getSession();
    const currentUser = authSession.data.session?.user;
    const userRole = currentUser?.user_metadata?.role;

    // Si pas de conversation, on la créera avec le service chat
    // Utiliser conversationIdOverride si fourni, sinon currentConversationId
    const actualConversationId = conversationIdOverride || currentConversationId;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // ID temporaire pour l'affichage
      conversation_id: actualConversationId || 'temp', // Utiliser 'temp' si pas d'ID valide
      role: 'user',
      content,
      created_at: new Date().toISOString(), // Timestamp actuel
    };

    try {
      setLoading(true);
      setProgressStep('init'); // Initialiser la progression
      setClaudeError(null); // Réinitialiser l'erreur Claude
      setMessages(prev => [...prev, userMessage]);

      // Déterminer le client_id à utiliser
      let actualClientId: string | null = null;

      if (userRole === 'client' && currentUser) {
        // Si l'utilisateur est un client, utiliser son propre ID
        actualClientId = currentUser.id;
      } else if ((userRole === 'admin' || userRole === 'lawyer') && currentUser) {
        // Pour les admins et lawyers, utiliser l'ID du client associé à la conversation
        if (actualConversationId) {  // ← UTILISER actualConversationId au lieu de currentConversationId
          // Si une conversation existe déjà, récupérer l'ID du client associé
          try {
            // Récupérer les détails de la conversation pour obtenir le user_id associé
            const { data: conversationData } = await supabase
              .from('conversations')
              .select('user_id')
              .eq('id', actualConversationId)  // ← UTILISER actualConversationId
              .single();

            if (conversationData?.user_id) {
              actualClientId = conversationData.user_id;
              console.log(`${userRole} using user_id from conversation:`, actualClientId);
            }
          } catch (error) {
            console.error(`Error fetching user_id for ${userRole}:`, error);
          }
        } else {
          // Si c'est une nouvelle conversation créée par l'admin/lawyer, utiliser son propre ID
          actualClientId = currentUser.id;
          console.log(`${userRole} creating new conversation with own ID:`, actualClientId);
        }
      }

      // Envoyer le message et obtenir la réponse avec progression en temps réel
      const response = await chatService.chatWithProgress(
        [...messages, userMessage],
        (step) => setProgressStep(step), // Callback de progression
        actualConversationId,
        actualClientId,
        selectedFolderId || undefined,
        responseModeKey
      );
      
      // Mettre à jour le titre de la conversation si c'est le premier message
      if (messages.length === 0 && response.conversationId) {
        try {
          // Vérifier si cette conversation a déjà été créée récemment
          const now = Date.now();
          const isDuplicate = lastCreatedConversationRef.current && 
                            lastCreatedConversationRef.current.id === response.conversationId &&
                            (now - lastCreatedConversationRef.current.timestamp) < DUPLICATE_PREVENTION_WINDOW;
          
          if (isDuplicate) {
            console.warn('Preventing duplicate conversation update:', response.conversationId);
          } else {
            // Enregistrer cette conversation comme la dernière créée
            lastCreatedConversationRef.current = {
              id: response.conversationId,
              timestamp: now
            };
            
            // Tronquer le contenu si nécessaire pour le titre
            const title = content.length > 100 ? content.substring(0, 97) + '...' : content;
            
            // Attendre un peu pour s'assurer que la conversation est bien créée
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await conversationService.updateConversation(response.conversationId, { 
              title: title.trim()
            }).catch(error => {
              // Log l'erreur mais ne pas interrompre le flux de chat
              console.warn('Failed to update conversation title:', error);
            });
          }
        } catch (error) {
          // Log l'erreur mais ne pas interrompre le flux de chat
          console.warn('Error updating conversation title:', error);
        }
      }

      // Vérifier si la réponse contient une erreur Claude (service indisponible/surchargé)
      if (response.errorType) {
        setClaudeError({
          errorType: response.errorType,
          canSubscribe: response.canSubscribe ?? false
        });
      }

      // Mettre à jour l'état avec la réponse
      setMessages(prev => [...prev, response.message]);
      setCurrentContext(response.context);
      setCurrentConversationId(response.conversationId);
      setLastStructuredResponse(response.structuredResponse || null);

      // Gérer le callback onConversationCreated
      const now = Date.now();

      // Vérifier si on doit appeler le callback
      // On l'appelle si :
      // 1. C'est une nouvelle conversation (pas dans lastCreatedConversationRef)
      // 2. OU si conversationIdOverride est fourni ET que c'est le premier message (messages.length === 0)
      //    car cela signifie que ChatInterface a créé la conversation mais n'a pas appelé le callback
      const shouldCallCallback = response.conversationId && onConversationCreated && (
        // Cas 1: Nouvelle conversation normale
        (!conversationIdOverride &&
         (!lastCreatedConversationRef.current ||
          lastCreatedConversationRef.current.id !== response.conversationId ||
          (now - lastCreatedConversationRef.current.timestamp) > DUPLICATE_PREVENTION_WINDOW)) ||
        // Cas 2: Conversation créée par ChatInterface avec fichiers en attente (premier message)
        (conversationIdOverride && messages.length === 0)
      );

      console.log('[ChatContext] Callback decision:', {
        conversationIdOverride,
        messagesLength: messages.length,
        hasCallback: !!onConversationCreated,
        shouldCallCallback
      });

      if (shouldCallCallback) {
        console.log('[ChatContext] ⚠️ CALLING onConversationCreated with ID:', response.conversationId);
        onConversationCreated(response.conversationId);
      }

      // Toujours mettre à jour la référence pour éviter les doublons
      lastCreatedConversationRef.current = {
        id: response.conversationId,
        timestamp: now
      };
    } catch (error: unknown) {
      console.error('Error sending message:', error);

      // Gérer spécifiquement les erreurs de limite de tokens et de période d'essai
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTokenLimitError = errorMessage.includes('Limite de tokens atteinte');
      const isTrialExpiredError = errorMessage.includes('période d\'essai') || errorMessage.includes('abonnement');

      // Vérifier si c'est une erreur Claude avec type d'erreur (500, overloaded, prompt_too_long)
      if (error instanceof ChatApiError && error.errorType) {
        setClaudeError({
          errorType: error.errorType,
          canSubscribe: error.canSubscribe ?? false
        });
        // Retirer le message de l'utilisateur
        setMessages(prev => prev.slice(0, -1));
      } else if (isTokenLimitError) {
        // Créer un message d'erreur spécial pour la limite de tokens
        const tokenErrorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          conversation_id: currentConversationId || 'temp',
          role: 'assistant',
          content: `⚠️ **Limite de tokens atteinte**\n\n${errorMessage}\n\nPour continuer à utiliser le chat, veuillez :\n- Attendre le renouvellement de votre abonnement\n- Ou contacter l'administration pour augmenter votre limite`,
          created_at: new Date().toISOString(),
        };

        // Ajouter le message d'erreur après avoir retiré le message utilisateur
        setMessages(prev => [...prev.slice(0, -1), tokenErrorMessage]);
      } else if (isTrialExpiredError) {
        // Créer un message d'erreur spécial pour la période d'essai expirée
        const trialExpiredMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          conversation_id: currentConversationId || 'temp',
          role: 'assistant',
          content: `⚠️ **Période d'essai expirée**\n\n${errorMessage}\n\nPour continuer à utiliser Dairia, veuillez souscrire à un abonnement en cliquant sur le bouton "Gérer l'abonnement" dans les paramètres de votre compte.`,
          created_at: new Date().toISOString(),
        };

        // Ajouter le message d'erreur après avoir retiré le message utilisateur
        setMessages(prev => [...prev.slice(0, -1), trialExpiredMessage]);
      } else {
        // Retirer le message de l'utilisateur en cas d'autres erreurs
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      setProgressStep(null); // Réinitialiser la progression
    }
  }, [messages, currentConversationId, selectedFolderId, onConversationCreated]);

  /**
   * Envoie un message en mode comparaison (compare les réponses de 2 modèles)
   */
  const sendComparisonMessage = useCallback(async (content: string, conversationIdOverride?: string, responseModeKey?: string) => {
    if (!content.trim()) return;

    // Récupérer l'utilisateur connecté
    const authSession = await supabase.auth.getSession();
    const currentUser = authSession.data.session?.user;
    const userRole = currentUser?.user_metadata?.role;

    const actualConversationId = conversationIdOverride || currentConversationId;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: actualConversationId || 'temp',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    try {
      setComparisonLoading(true);
      setLastComparisonResponse(null);
      setComparisonProgress({ model1Step: 'init', model2Step: 'init' }); // Initialiser la progression
      setMessages(prev => [...prev, userMessage]);

      // Déterminer le client_id
      let actualClientId: string | null = null;
      if (userRole === 'client' && currentUser) {
        actualClientId = currentUser.id;
      } else if ((userRole === 'admin' || userRole === 'lawyer') && currentUser) {
        if (actualConversationId) {
          try {
            const { data: conversationData } = await supabase
              .from('conversations')
              .select('user_id')
              .eq('id', actualConversationId)
              .single();
            if (conversationData?.user_id) {
              actualClientId = conversationData.user_id;
            }
          } catch (error) {
            console.error('Error fetching user_id:', error);
          }
        } else {
          actualClientId = currentUser.id;
        }
      }

      // Appeler l'endpoint de comparaison avec progression
      const response = await chatService.chatWithComparisonProgress(
        [...messages, userMessage],
        (step, modelId) => {
          // Mettre à jour la progression pour le modèle correspondant
          setComparisonProgress(prev => ({
            ...prev,
            [modelId === 'model1' ? 'model1Step' : 'model2Step']: step
          }));
        },
        actualConversationId,
        actualClientId,
        selectedFolderId || undefined,
        responseModeKey
      );

      // Stocker la réponse de comparaison
      setLastComparisonResponse(response);
      setCurrentConversationId(response.conversationId);

      // Utiliser la réponse du premier modèle comme réponse principale pour l'historique
      setMessages(prev => [...prev, response.model1Response.message]);
      setCurrentContext(response.model1Response.context);

      // Notifier de la création de conversation si nécessaire
      if (response.conversationId && onConversationCreated && !actualConversationId) {
        onConversationCreated(response.conversationId);
      }
    } catch (error: unknown) {
      console.error('Error in comparison message:', error);

      // Gérer spécifiquement les erreurs de limite de tokens et de période d'essai
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTokenLimitError = errorMessage.includes('Limite de tokens atteinte');
      const isTrialExpiredError = errorMessage.includes('période d\'essai') || errorMessage.includes('abonnement');

      // Vérifier si c'est une erreur Claude avec type d'erreur (500, overloaded, prompt_too_long)
      if (error instanceof ChatApiError && error.errorType) {
        setClaudeError({
          errorType: error.errorType,
          canSubscribe: error.canSubscribe ?? false
        });
        // Retirer le message de l'utilisateur
        setMessages(prev => prev.slice(0, -1));
      } else if (isTokenLimitError || isTrialExpiredError) {
        const errorContent = isTokenLimitError
          ? `⚠️ **Limite de tokens atteinte**\n\n${errorMessage}\n\nPour continuer à utiliser le chat, veuillez :\n- Attendre le renouvellement de votre abonnement\n- Ou contacter l'administration pour augmenter votre limite`
          : `⚠️ **Période d'essai expirée**\n\n${errorMessage}\n\nPour continuer à utiliser Dairia, veuillez souscrire à un abonnement en cliquant sur le bouton "Gérer l'abonnement" dans les paramètres de votre compte.`;

        const errorChatMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          conversation_id: currentConversationId || 'temp',
          role: 'assistant',
          content: errorContent,
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev.slice(0, -1), errorChatMessage]);
      } else {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setComparisonLoading(false);
      setComparisonProgress({ model1Step: null, model2Step: null }); // Réinitialiser la progression
    }
  }, [messages, currentConversationId, selectedFolderId, onConversationCreated]);

  const value = {
    messages,
    loading,
    currentContext,
    currentConversationId,
    selectedFolderId,
    setSelectedFolderId,
    sendMessage,
    loadMessages,
    // Progress tracking
    progressStep,
    // Comparison mode
    comparisonMode,
    setComparisonMode,
    comparisonLoading,
    comparisonProgress,
    lastComparisonResponse,
    sendComparisonMessage,
    // Structured response
    lastStructuredResponse,
    // Claude error state
    claudeError,
    clearClaudeError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
