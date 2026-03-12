import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  CircularProgress,
  Divider,
  Tooltip,
  Alert,
  Collapse,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { conversationDocumentService, ConversationDocument } from '../services/conversationDocumentService';

interface ConversationDocumentsProps {
  conversationId: string;
  collapsed?: boolean;
}

export const ConversationDocuments: React.FC<ConversationDocumentsProps> = ({ 
  conversationId,
  collapsed = true 
}) => {
  const [documents, setDocuments] = useState<ConversationDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<ConversationDocument | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(!collapsed);
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les documents associés à la conversation
  const loadDocuments = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
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
      setLoading(false);
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
    // Vérifier s'il y a des documents en cours de traitement
    const hasProcessingDocuments = documents.some(doc => doc.status === 'processing');
    
    // Si des documents sont en cours de traitement, mettre en place un intervalle de rafraîchissement
    let intervalId: NodeJS.Timeout | null = null;
    
    if (hasProcessingDocuments && conversationId) {
      intervalId = setInterval(() => {
        loadDocuments();
      }, 5000); // Rafraîchir toutes les 5 secondes
    }
    
    // Nettoyer l'intervalle lorsque le composant est démonté ou lorsque les documents changent
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [documents, conversationId, loadDocuments]);

  // Ouvrir le sélecteur de fichier
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Gérer l'upload de fichier
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[ConversationDocuments] handleFileUpload called');
    const files = event.target.files;
    console.log('[ConversationDocuments] files:', files);
    console.log('[ConversationDocuments] conversationId:', conversationId);

    if (!files || files.length === 0 || !conversationId) {
      console.log('[ConversationDocuments] Early return - no files or no conversationId');
      return;
    }

    const file = files[0];
    console.log('[ConversationDocuments] file selected:', file.name, file.type, file.size);
    
    // Vérifier le format du fichier (PDF uniquement)
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Vérifier la taille du fichier (max 30 Mo)
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 Mo en octets
    if (file.size > MAX_FILE_SIZE) {
      setError('La taille du fichier ne doit pas dépasser 30 Mo.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Vérifier le nombre de documents (max 20)
    if (documents.length >= 20) {
      setError('Vous ne pouvez pas ajouter plus de 20 documents à une conversation.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    console.log('[ConversationDocuments] Starting upload...');
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[ConversationDocuments] Calling conversationDocumentService.uploadConversationDocument...');
      const response = await conversationDocumentService.uploadConversationDocument(conversationId, file);
      console.log('[ConversationDocuments] Upload response:', response);

      // Stocker l'ID et le nom du document en cours d'upload pour le tracking
      setUploadingDocumentId(response.documentId);
      setUploadingFileName(file.name);

      // Recharger les documents après le téléchargement
      await loadDocuments();

      // Ne pas afficher de message de succès immédiatement
      // Le message sera affiché par loadDocuments() quand le traitement sera terminé

      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement du fichier';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Gérer le téléchargement d'un document
  const handleDownload = async (document: ConversationDocument) => {
    try {
      const blob = await conversationDocumentService.downloadConversationDocument(conversationId, document.id);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.filename;
      window.document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement du document';
      setError(errorMessage);
    }
  };

  // Ouvrir la boîte de dialogue de confirmation de suppression
  const handleDeleteClick = (document: ConversationDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await conversationDocumentService.deleteConversationDocument(conversationId, documentToDelete.id);

      // Recharger les documents après la suppression
      await loadDocuments();

      setSuccess(`Le document "${documentToDelete.originalName || documentToDelete.filename}" a été supprimé.`);
    } catch (err) {
      console.error('Error deleting document:', err);

      // Si le document n'existe plus (404), considérer comme un succès
      // (comportement idempotent - le document est déjà supprimé)
      const errorWithTags = err as { tags?: { status_code?: number }; message?: string };
      const isNotFoundError = errorWithTags?.tags?.status_code === 404 ||
                              errorWithTags?.message?.includes('not found') ||
                              errorWithTags?.message?.includes('Document not found');

      if (isNotFoundError) {
        // Rafraîchir la liste et afficher un message de succès
        await loadDocuments();
        setSuccess(`Le document "${documentToDelete.originalName || documentToDelete.filename}" a été supprimé.`);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du document';
        setError(errorMessage);
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Annuler la suppression
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  // Obtenir l'icône de statut pour un document
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <CircularProgress size={16} />;
      case 'completed':
        return <InsertDriveFileIcon color="success" />;
      case 'error':
        return <InsertDriveFileIcon color="error" />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  // Obtenir le texte de statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'En cours de traitement...';
      case 'completed':
        return 'Prêt';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Paper elevation={1} sx={{ mb: 2 }}>
      {/* En-tête avec bouton d'expansion */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          Documents spécifiques ({documents.length})
          {documents.some(doc => doc.status === 'processing') && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
        </Typography>
        <IconButton size="small">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Contenu collapsible */}
      <Collapse in={isExpanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Bouton d'upload */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={handleUploadButtonClick}
              disabled={uploading}
              data-testid="upload-button"
            >
              {uploading ? 'Téléchargement...' : 'Ajouter un document'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif,.webp,.gif,.bmp"
              data-testid="file-input"
            />
          </Box>

          {/* Messages d'erreur et de succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} data-testid="error-alert">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)} data-testid="success-alert">
              {success}
            </Alert>
          )}

          {/* Message de traitement en cours */}
          {uploadingDocumentId && uploadingFileName && (
            <Alert
              severity="info"
              icon={<CircularProgress size={20} />}
              sx={{ mb: 2 }}
              data-testid="processing-alert"
            >
              Le document "{uploadingFileName}" est en cours de traitement...
            </Alert>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Liste des documents */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                Aucun document spécifique n'est associé à cette conversation.
              </Typography>
            </Box>
          ) : (
            <List dense data-testid="document-list">
              {documents.map((document) => (
                <ListItem
                  key={document.id}
                  data-testid="document-item"
                  secondaryAction={
                    <Box>
                      <Tooltip title="Télécharger">
                        <IconButton 
                          edge="end" 
                          aria-label="download" 
                          size="small"
                          sx={{ mr: 1 }} 
                          data-testid="download-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(document);
                          }}
                          disabled={document.status !== 'completed'}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(document);
                          }}
                          disabled={deleting}
                          data-testid="delete-button"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {getStatusIcon(document.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={document.originalName || document.filename}
                    secondary={
                      <Box component="span">
                        <Typography variant="caption" component="span">
                          {formatFileSize(document.size)} • {getStatusText(document.status)}
                        </Typography>
                        {document.errorMessage && (
                          <Typography variant="caption" color="error" component="div">
                            {document.errorMessage}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Collapse>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.originalName || documentToDelete?.filename}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConversationDocuments;
