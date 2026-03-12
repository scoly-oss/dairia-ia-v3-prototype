import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Snackbar
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import WorkIcon from '@mui/icons-material/Work';
import { ChatMessage } from '../../services/chatService';
import { useChat } from '../../hooks/useChat';
import { ReviewRequestButton } from '../ReviewRequestButton';
import { ComparisonToggle } from './ComparisonToggle';
import { ComparisonMessageDisplay } from './ComparisonMessageDisplay';
import { ChatProgressIndicator, ComparisonProgressIndicator } from './ChatProgressIndicator';
import { ClaudeStatusAlert } from './ClaudeStatusAlert';
import { conversationDocumentService, ConversationDocument } from '../../services/conversationDocumentService';
import { conversationService } from '../../services/conversationService';
import { supabase } from '../../services/supabase';
import { folderService } from '../../services/folderService';
import { FolderWithDocumentCount } from '../../types/folder';
import { useAuth } from '../../contexts/AuthContext';
import { SelectedMode } from '../../types/responseMode';
import { GoogleStyleInput } from './SearchInput';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StructuredResponseRenderer } from './StructuredResponse';
import { WelcomeScreen } from './WelcomeScreen';
import { useSearchParams } from 'react-router-dom';

interface ChatInterfaceProps {
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  isAdminView?: boolean;
  hideReviewButton?: boolean;
}

interface ContextItem {
  text: string;
  score: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onConversationCreated: _onConversationCreated, // eslint-disable-line @typescript-eslint/no-unused-vars
  isAdminView = false,
  hideReviewButton = false,
}) => {
  const [input, setInput] = useState('');
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour la gestion des documents
  const [documents, setDocuments] = useState<ConversationDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // État pour les fichiers en attente (avant la création de la conversation)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // États pour le menu contextuel des documents
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<ConversationDocument | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<ConversationDocument | null>(null);

  // États pour la gestion des folders
  const [folders, setFolders] = useState<FolderWithDocumentCount[]>([]);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(false);

  // État pour le mode de réponse sélectionné
  const [selectedMode, setSelectedMode] = useState<SelectedMode | null>(null);

  // État pour la notification de succès du trial
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);

  const { user } = useAuth();
  const {
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
  } = useChat(conversationId);

  useEffect(() => {
    console.log('État loading:', loading);
    setIsWaitingForResponse(loading);
  }, [loading]);

  // Détecter si on vient de configurer le paiement (trial activé)
  useEffect(() => {
    if (searchParams.get('trial_started') === 'true') {
      setShowTrialSuccess(true);
      // Nettoyer le query param après l'avoir détecté
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Charger les folders de l'utilisateur
  const loadFolders = useCallback(async () => {
    if (!user?.company_id) return;

    try {
      setLoadingFolders(true);
      const result = await folderService.getFoldersByCompany(user.company_id);
      setFolders(result.folders);
    } catch (err) {
      console.error('Erreur lors du chargement des dossiers:', err);
    } finally {
      setLoadingFolders(false);
    }
  }, [user?.company_id]);

  useEffect(() => {
    if (user?.company_id) {
      loadFolders();
    }
  }, [user?.company_id, loadFolders]);

  // Gestionnaire pour le changement de folder
  const handleFolderChange = useCallback((event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedFolderId(value === '' ? null : value);
  }, [setSelectedFolderId]);

  // Charger le brouillon depuis le localStorage au montage du composant
  useEffect(() => {
    // Si on passe de quelque chose à undefined, c'est qu'on veut une nouvelle conversation
    // Dans ce cas, on vide TOUJOURS le champ
    if (conversationId === undefined) {
      setInput('');
      // S'assurer que le localStorage est bien vide pour la nouvelle conversation
      localStorage.removeItem('draft_message_new');
      return;
    }

    // Pour une conversation existante, charger le brouillon s'il existe
    const storageKey = `draft_message_${conversationId}`;
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      setInput(savedDraft);
    } else {
      // Important: vider le champ si aucun brouillon n'existe pour cette conversation
      setInput('');
    }
  }, [conversationId]);

  // Vider les fichiers en attente quand on passe à undefined (nouvelle conversation)
  useEffect(() => {
    if (conversationId === undefined && pendingFiles.length > 0) {
      // Ne vider que si on n'est pas en train d'uploader (pour éviter de vider pendant l'upload)
      if (!uploading) {
        setPendingFiles([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Sauvegarder le brouillon dans le localStorage à chaque modification
  useEffect(() => {
    const storageKey = conversationId ? `draft_message_${conversationId}` : 'draft_message_new';
    if (input) {
      localStorage.setItem(storageKey, input);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [input, conversationId]);

  // Charger les documents associés à la conversation
  const loadDocuments = useCallback(async () => {
    if (!conversationId) return;

    setLoadingDocs(true);
    // Ne pas effacer les messages d'erreur/succès ici, ils doivent persister
    // jusqu'à ce que l'utilisateur les ferme manuellement

    try {
      const data = await conversationDocumentService.getConversationDocuments(conversationId);

      // Vérifier si un document qu'on est en train d'uploader vient de terminer son traitement
      if (uploadingDocumentId && uploadingFileName) {
        const uploadedDoc = data.find(doc => doc.id === uploadingDocumentId);
        if (uploadedDoc && uploadedDoc.status !== 'processing') {
          // Le document a terminé son traitement
          if (uploadedDoc.status === 'completed') {
            setSuccess(`Le document "${uploadingFileName}" a été traité avec succès.`);
          } else if (uploadedDoc.status === 'error') {
            setError(uploadedDoc.errorMessage || `Erreur lors du traitement du document "${uploadingFileName}".`);
          }
          // Réinitialiser le tracking
          setUploadingDocumentId(null);
          setUploadingFileName(null);
        }
      }

      setDocuments(data);
    } catch (err) {
      console.error('Error loading conversation documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des documents';
      setError(errorMessage);
    } finally {
      setLoadingDocs(false);
    }
  }, [conversationId, uploadingDocumentId, uploadingFileName]);

  // Charger les documents au montage et quand la conversation change
  useEffect(() => {
    if (conversationId) {
      loadDocuments();
    }
  }, [conversationId, loadDocuments]);

  // Rafraîchir périodiquement les documents en cours de traitement
  useEffect(() => {
    const hasProcessingDocuments = documents.some(doc => doc.status === 'processing');

    let intervalId: NodeJS.Timeout | null = null;

    if (hasProcessingDocuments && conversationId) {
      intervalId = setInterval(() => {
        loadDocuments();
      }, 5000); // Rafraîchir toutes les 5 secondes
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [documents, conversationId, loadDocuments]);

  // NOTE: L'upload des fichiers en attente est maintenant géré dans handleSendTextMessage
  // pour garantir que les fichiers sont uploadés et traités AVANT l'envoi du message à l'IA

  // Gérer l'upload de fichiers (multiple)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Types de fichiers autorisés (comme dans les pages de gestion)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'image/gif', 'image/bmp'
    ];
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 Mo

    // Valider chaque fichier
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: format non supporté`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: taille supérieure à 30 Mo`);
        continue;
      }
      validFiles.push(file);
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Afficher les erreurs de validation si nécessaire
    if (errors.length > 0) {
      setError(`Fichiers ignorés: ${errors.join(', ')}`);
    }

    if (validFiles.length === 0) return;

    // Avant création de conversation : stocker en pending
    if (!conversationId) {
      setPendingFiles(prev => [...prev, ...validFiles]);
      const message = validFiles.length === 1
        ? `Le fichier "${validFiles[0].name}" sera uploadé avant l'envoi de votre premier message.`
        : `${validFiles.length} fichiers seront uploadés avant l'envoi de votre premier message.`;
      setSuccess(message);
      return;
    }

    // Après création de conversation : upload séquentiel avec progression
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress({ current: 0, total: validFiles.length });

    for (let i = 0; i < validFiles.length; i++) {
      setUploadProgress({ current: i + 1, total: validFiles.length });
      try {
        const response = await conversationDocumentService.uploadConversationDocument(
          conversationId,
          validFiles[i]
        );
        setUploadingDocumentId(response.documentId);
        setUploadingFileName(validFiles[i].name);
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(`Erreur lors de l'upload de ${validFiles[i].name}`);
      }
    }

    setUploadProgress({ current: 0, total: 0 });
    await loadDocuments();
    setUploading(false);
  };

  // Gérer le clic sur un document (ouvrir le menu contextuel)
  const handleDocumentClick = (event: React.MouseEvent<HTMLElement>, document: ConversationDocument) => {
    if (document.status !== 'completed') return;
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  // Fermer le menu contextuel
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  // Gérer le téléchargement d'un document
  const handleDownload = async () => {
    if (!selectedDocument || !conversationId) return;

    try {
      const blob = await conversationDocumentService.downloadConversationDocument(conversationId, selectedDocument.id);

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = selectedDocument.originalName || selectedDocument.filename;
      window.document.body.appendChild(link);
      link.click();

      // Nettoyer
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement du document';
      setError(errorMessage);
    } finally {
      handleCloseMenu();
    }
  };

  // Ouvrir la boîte de dialogue de confirmation de suppression
  const handleDeleteClick = () => {
    if (!selectedDocument) return;
    setDocumentToDelete(selectedDocument);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  // Fermer la boîte de dialogue de suppression
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  // Confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!documentToDelete || !conversationId) return;

    setError(null);

    try {
      await conversationDocumentService.deleteConversationDocument(conversationId, documentToDelete.id);

      // Recharger les documents après la suppression
      await loadDocuments();

      setSuccess(`Le document "${documentToDelete.originalName || documentToDelete.filename}" a été supprimé.`);
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du document';
      setError(errorMessage);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Function to handle sending text messages
  const handleSendTextMessage = async () => {
    if (!input.trim() || loading) return;

    setIsWaitingForResponse(true);
    setError(null);

    try {
      let actualConversationId = conversationId || currentConversationId;

      // Si on a des fichiers en attente et pas de conversation, créer la conversation d'abord
      if (pendingFiles.length > 0 && !actualConversationId) {
        console.log('[ChatInterface] Fichiers en attente détectés, création de la conversation avant upload');

        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non connecté');
          return;
        }

        // Créer la conversation avec le premier message comme titre
        const title = input.length > 100 ? input.substring(0, 97) + '...' : input;
        const newConversation = await conversationService.createConversation({
          title: title.trim(),
          userId: user.id
        });

        actualConversationId = newConversation.id;
        console.log('[ChatInterface] Conversation créée:', actualConversationId);

        // IMPORTANT : Charger la conversation dans le ChatContext pour que currentConversationId soit mis à jour
        await loadMessages(actualConversationId);
        console.log('[ChatInterface] Conversation chargée dans le contexte');

        // NE PAS notifier le parent ici ! Le callback sera appelé par ChatContext après la réponse de l'IA
        // Appeler onConversationCreated ici déclenche un rechargement de l'interface avant même d'envoyer le message
        // ce qui fait disparaître le document et la question uploadés
        console.log('[ChatInterface] Conversation créée, callback sera appelé par ChatContext après réponse IA');

        // Attendre un peu pour s'assurer que la conversation est bien créée
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Si on a des fichiers en attente, les uploader et ATTENDRE le traitement complet AVANT d'envoyer le message
      if (pendingFiles.length > 0 && actualConversationId) {
        console.log('[ChatInterface] Upload des fichiers en attente avant envoi du message');
        setUploading(true);

        // Uploader tous les fichiers en attente
        const uploadedDocumentIds: string[] = [];
        for (const file of pendingFiles) {
          try {
            console.log('[ChatInterface] Upload fichier:', file.name);
            setUploadingFileName(file.name);
            const uploadResponse = await conversationDocumentService.uploadConversationDocument(actualConversationId, file);
            console.log('[ChatInterface] Upload réussi, document ID:', uploadResponse.documentId);

            uploadedDocumentIds.push(uploadResponse.documentId);
            // Stocker l'ID pour le suivi du traitement (utilisé par loadDocuments)
            setUploadingDocumentId(uploadResponse.documentId);
          } catch (err) {
            console.error('[ChatInterface] Erreur upload fichier:', file.name, err);
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement du fichier';
            setError(`Erreur pour "${file.name}": ${errorMessage}`);
            setUploading(false);
            setPendingFiles([]);
            setIsWaitingForResponse(false);
            return; // Arrêter si l'upload échoue
          }
        }

        // Vider les fichiers en attente
        setPendingFiles([]);
        setUploading(false);

        console.log('[ChatInterface] Tous les fichiers sont uploadés, attente du traitement (vectorisation Pinecone)...');

        // IMPORTANT : Attendre que tous les documents soient complètement traités (vectorisés dans Pinecone)
        // avant d'envoyer le message à l'IA
        if (uploadedDocumentIds.length > 0) {
          setSuccess('Documents uploadés, traitement en cours (vectorisation)...');

          const maxWaitTime = 120000; // 2 minutes max
          const checkInterval = 2000; // Vérifier toutes les 2 secondes
          const startTime = Date.now();

          let allCompleted = false;
          while (!allCompleted && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));

            // Recharger les documents pour vérifier leur statut
            const docs = await conversationDocumentService.getConversationDocuments(actualConversationId);

            // Mettre à jour l'état pour afficher les Chips dès que les documents sont disponibles
            setDocuments(docs);

            // Vérifier si tous les documents uploadés sont traités
            const uploadedDocs = docs.filter(doc => uploadedDocumentIds.includes(doc.id));
            const completedCount = uploadedDocs.filter(doc => doc.status === 'completed').length;
            const errorCount = uploadedDocs.filter(doc => doc.status === 'error').length;

            console.log('[ChatInterface] État traitement:', {
              total: uploadedDocumentIds.length,
              completed: completedCount,
              errors: errorCount
            });

            if (errorCount > 0) {
              setError('Certains documents n\'ont pas pu être traités correctement.');
              await loadDocuments();
              setIsWaitingForResponse(false);
              return;
            }

            if (completedCount === uploadedDocumentIds.length) {
              allCompleted = true;
              console.log('[ChatInterface] ✓ Tous les documents sont traités et vectorisés dans Pinecone !');
              // Réinitialiser immédiatement les états pour masquer le message de traitement
              setUploadingDocumentId(null);
              setUploadingFileName(null);
              setSuccess(null); // Effacer le message de traitement
              await loadDocuments();
            }
          }

          if (!allCompleted) {
            setError('Le traitement des documents prend plus de temps que prévu. Veuillez réessayer dans quelques instants.');
            setIsWaitingForResponse(false);
            return;
          }
        }
      }

      // Maintenant, envoyer le message (les documents sont prêts)
      // MODIFIÉ: Si aucun mode n'est sélectionné, utiliser "Recherche enrichie" par défaut
      // TODO: Réactiver la sélection de mode quand les modes Conseil et Rédaction seront prêts
      const promptKey = selectedMode?.promptKey || 'prompt_recherche_enrichie';
      console.log('[ChatInterface] Envoi du message à l\'IA avec conversationId:', actualConversationId, 'mode:', promptKey, 'comparison:', comparisonMode);

      // Utiliser sendComparisonMessage si le mode comparaison est activé (admin seulement)
      if (comparisonMode && isAdminView) {
        await sendComparisonMessage(input, actualConversationId, promptKey);
      } else {
        await sendMessage(input, actualConversationId, promptKey);
      }
      setInput('');
      // Réinitialiser le mode après l'envoi
      setSelectedMode(null);

      // Nettoyer le localStorage après l'envoi réussi
      const storageKey = actualConversationId ? `draft_message_${actualConversationId}` : 'draft_message_new';
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message texte:', error);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header with Review Request Button and Comparison Toggle */}
      {(conversationId || isAdminView) && (
        <Box sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}>
          {/* Comparison Toggle - Admin only */}
          <Box>
            {isAdminView && (
              <ComparisonToggle
                enabled={comparisonMode}
                onToggle={setComparisonMode}
                model1="GPT-5.1"
                model2="GPT-5.2"
                disabled={loading || comparisonLoading}
              />
            )}
          </Box>

          {/* Review Request Button */}
          {conversationId && !hideReviewButton && (
            <ReviewRequestButton
              conversationId={conversationId}
              onRequestCreated={(requestId: string) => {
                console.log('Demande de révision créée:', requestId);
              }}
            />
          )}
        </Box>
      )}

      {/* Messages Container */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, md: 3 },
      }}>
        {/* Welcome Screen when no messages */}
        {messages.length === 0 && !loading && (
          <WelcomeScreen onQuickAction={(text) => {
            setInput(text);
          }} />
        )}

        {messages
          // En mode comparaison avec réponse, masquer le dernier message assistant
          // car il est affiché dans ComparisonMessageDisplay
          .filter((message: ChatMessage, index: number) => {
            if (isAdminView && comparisonMode && lastComparisonResponse) {
              // Trouver l'index du dernier message assistant
              const lastAssistantIndex = messages.map(m => m.role).lastIndexOf('assistant');
              // Masquer ce message s'il correspond à la réponse de comparaison
              if (index === lastAssistantIndex && message.role === 'assistant') {
                return false;
              }
            }
            return true;
          })
          .map((message: ChatMessage, index: number) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '100%',
            }}
          >
            <Box sx={{
              maxWidth: { xs: '90%', sm: '85%', md: '75%' },
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: message.role === 'user'
                    ? (theme) => theme.custom.gradients.primary
                    : '#ffffff',
                  border: message.role === 'user'
                    ? 'none'
                    : (theme) => `1px solid ${theme.custom.border}`,
                }}
              >
                {message.role === 'user' ? (
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'white' }}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </Typography>
                ) : (
                  <img src="/assets/logo.svg" alt="AI" style={{ width: '20px', height: '20px' }} />
                )}
              </Avatar>

              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    borderBottomLeftRadius: message.role === 'user' ? '20px' : '4px',
                    borderBottomRightRadius: message.role === 'user' ? '4px' : '20px',
                    background: message.role === 'user'
                      ? (theme) => theme.custom.gradients.primary
                      : '#ffffff',
                    border: message.role === 'user'
                      ? 'none'
                      : (theme) => `1px solid ${theme.custom.border}`,
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    boxShadow: message.role === 'user'
                      ? (theme) => theme.custom.shadows.primary
                      : (theme) => theme.custom.shadows.sm,
                  }}
                >
                  <Box sx={{
                    '& p:last-child': { mb: 0 },
                    '& p': { fontSize: '0.95rem' }
                  }}>
                    {message.role === 'assistant' && lastStructuredResponse && index === messages.length - 1 ? (
                      <StructuredResponseRenderer
                        content={message.content}
                        structuredResponse={lastStructuredResponse}
                        onFollowUp={(text) => setInput(text)}
                      />
                    ) : (
                      <MarkdownRenderer content={message.content} isUser={message.role === 'user'} />
                    )}
                  </Box>
                </Paper>

                {/* Metadata / Actions */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.5,
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  opacity: 0.7
                }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {message.role === 'user' ? 'Vous' : 'Dairia AI'}
                  </Typography>

                  {message.role === 'assistant' && currentContext.length > 0 && isAdminView && (
                    <Tooltip title="Voir le contexte">
                      <IconButton
                        size="small"
                        onClick={() => setContextDrawerOpen(true)}
                        sx={{ p: 0.5, color: 'text.secondary' }}
                      >
                        <InfoIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        ))}

        {/* Affichage côte-à-côte des réponses en mode comparaison */}
        {isAdminView && comparisonMode && (lastComparisonResponse || comparisonLoading) && (
          <ComparisonMessageDisplay
            model1Response={lastComparisonResponse?.model1Response}
            model2Response={lastComparisonResponse?.model2Response}
            isLoading={comparisonLoading}
          />
        )}

        {/* Alerte de statut Claude (erreur de service) */}
        {claudeError && (
          <ClaudeStatusAlert
            errorType={claudeError.errorType}
            canSubscribe={claudeError.canSubscribe}
          />
        )}

        {/* Indicateur de progression (mode normal) */}
        {isWaitingForResponse && !comparisonMode && (
          <ChatProgressIndicator step={progressStep} />
        )}

        {/* Indicateur de progression (mode comparaison admin) */}
        {isAdminView && comparisonMode && comparisonLoading && (
          <ComparisonProgressIndicator
            progress={comparisonProgress}
            model1Name="GPT-5.1"
            model2Name="GPT-5.2"
          />
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Documents associés */}
      {loadingDocs && (
        <Box sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {(documents.length > 0 || pendingFiles.length > 0) && (
        <Box sx={{
          px: 2,
          py: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}>
          {/* Documents uploadés */}
          {documents.map((doc) => (
            <Chip
              key={doc.id}
              label={doc.originalName || doc.filename}
              onClick={(e) => handleDocumentClick(e, doc)}
              onDelete={doc.status === 'processing' ? undefined : () => {
                setDocumentToDelete(doc);
                setDeleteDialogOpen(true);
              }}
              deleteIcon={<DeleteIcon />}
              icon={
                doc.status === 'processing' ?
                  <CircularProgress size={16} /> :
                  <InsertDriveFileIcon />
              }
              color="primary"
              variant="outlined"
              sx={{ maxWidth: 200 }}
            />
          ))}

          {/* Fichiers en attente */}
          {pendingFiles.map((file, index) => (
            <Chip
              key={`pending-${index}`}
              label={file.name}
              onDelete={() => {
                setPendingFiles(prev => prev.filter((_, i) => i !== index));
                setSuccess(null); // Nettoyer le message de succès
              }}
              deleteIcon={<DeleteIcon />}
              icon={<InsertDriveFileIcon />}
              color="warning"
              variant="outlined"
              sx={{ maxWidth: 200 }}
            />
          ))}
        </Box>
      )}

      {/* Menu contextuel pour les documents */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Télécharger</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.originalName || documentToDelete?.filename}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {success && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Box>
      )}

      {/* Indicateur de progression pour l'upload multiple */}
      {uploading && uploadProgress.total > 1 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Téléversement: {uploadProgress.current} / {uploadProgress.total} fichiers
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(uploadProgress.current / uploadProgress.total) * 100}
          />
        </Box>
      )}

      {/* Message de traitement en cours */}
      {uploadingDocumentId && uploadingFileName && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert
            severity="info"
            icon={<CircularProgress size={20} />}
          >
            Le document "{uploadingFileName}" est en cours de traitement...
          </Alert>
        </Box>
      )}

      {/* Input Container */}
      <Box sx={{
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: documents.length > 0 ? 0 : 1,
        borderColor: 'divider',
      }}>
        {/* Sélecteur de dossier */}
        {user?.company_id && folders.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="folder-select-label">Dossier de recherche</InputLabel>
              <Select
                labelId="folder-select-label"
                value={selectedFolderId || ''}
                onChange={handleFolderChange}
                label="Dossier de recherche"
                disabled={loadingFolders || loading}
                startAdornment={
                  selectedFolderId ? (
                    folders.find(f => f.id === selectedFolderId)?.is_client_folder ? (
                      <WorkIcon sx={{ ml: 1, mr: 0.5, color: 'primary.main' }} />
                    ) : (
                      <FolderIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />
                    )
                  ) : (
                    <FolderOffIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />
                  )
                }
              >
                <MenuItem value="">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOffIcon fontSize="small" />
                    <Typography>Tous les documents (hors dossier)</Typography>
                  </Box>
                </MenuItem>
                {folders.map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {folder.is_client_folder ? (
                        <WorkIcon fontSize="small" color="primary" />
                      ) : (
                        <FolderIcon fontSize="small" />
                      )}
                      <Typography>{folder.name}</Typography>
                      {folder.is_client_folder && folder.idcc && (
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                          IDCC {folder.idcc}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        ({folder.document_count} doc{folder.document_count > 1 ? 's' : ''})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box sx={{
          display: 'flex',
          gap: 1,
        }}>
          {/* Input caché pour l'upload de fichiers (multiple) */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif,.webp,.gif,.bmp"
            multiple
          />

          {/* Champ de saisie style Google avec sélection de mode */}
          <GoogleStyleInput
            value={input}
            onChange={setInput}
            onSend={handleSendTextMessage}
            onFileUpload={() => fileInputRef.current?.click()}
            disabled={loading}
            loading={isWaitingForResponse}
            documentCount={documents.length}
            pendingFileCount={pendingFiles.length}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
          />
        </Box>
      </Box>

      {/* Context Drawer */}
      <Drawer
        anchor="right"
        open={contextDrawerOpen}
        onClose={() => setContextDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '300px',
            p: 2,
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Contexte utilisé
        </Typography>
        <List>
          {currentContext.map((item: ContextItem, index: number) => (
            <ListItem key={index}>
              <ListItemText
                primary={item.text}
                secondary={`Score: ${Math.round(item.score * 100)}%`}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Snackbar pour la confirmation du trial */}
      <Snackbar
        open={showTrialSuccess}
        autoHideDuration={6000}
        onClose={() => setShowTrialSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowTrialSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontSize: '1.1rem' }}
        >
          🎉 Paiement configuré avec succès ! Votre essai gratuit de 7 jours commence maintenant.
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default ChatInterface;
export { ChatInterface };
