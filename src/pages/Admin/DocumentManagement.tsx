/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Clear as ClearIcon,
  CloudSync as CloudSyncIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';
import { documentService } from '../../services/documentService';
import { googleDriveSyncService, SyncResult } from '../../services/googleDriveSyncService';
import { Document } from '../../types/document';

interface VectorInfoDialogProps {
  document: Document;
  open: boolean;
  onClose: () => void;
}

interface SemanticSearchResult {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  score: number;
  tags: string[];
}

const getDocumentStatus = (doc: Document) => {
  if (doc.status === 'error') return { label: 'Erreur', color: 'error' as const };
  
  // For completed documents, use the status from the database
  if (doc.status === 'completed') {
    return { label: 'Terminé', color: 'success' as const };
  }
  
  // For non-completed documents, check vectorInfo if available
  if (!doc.vectorInfo) return { label: 'En attente', color: 'warning' as const };
  
  const isVectorizationComplete = doc.vectorInfo.actualVectors === doc.vectorInfo.expectedVectors;
  if (!isVectorizationComplete) {
    return { label: 'Vectorisation partielle', color: 'warning' as const };
  }
  
  return { label: 'En cours', color: 'warning' as const };
};

const VectorInfoDialog: React.FC<VectorInfoDialogProps> = ({ document, open, onClose }) => {
  const status = getDocumentStatus(document);
  const vectorizationProgress = document.vectorInfo ? 
    Math.round((document.vectorInfo.actualVectors / document.vectorInfo.expectedVectors) * 100) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Informations de Vectorisation - {document.filename}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            État Général
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography component="span" sx={{ mr: 1 }}>
                <strong>Statut:</strong>
              </Typography>
              <Chip
                label={status.label}
                color={status.color}
                size="small"
              />
            </Box>
            {document.vectorInfo && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography component="div" sx={{ mb: 1 }}>
                    <strong>Progression de la vectorisation:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={vectorizationProgress}
                        color={status.color}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {vectorizationProgress}%
                    </Typography>
                  </Box>
                </Box>
                <Typography component="div" sx={{ mb: 1 }}>
                  <strong>Vecteurs attendus:</strong> {document.vectorInfo.expectedVectors}
                </Typography>
                <Typography component="div" sx={{ mb: 1 }}>
                  <strong>Vecteurs créés:</strong> {document.vectorInfo.actualVectors}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography component="span" sx={{ mr: 1 }}>
                    <strong>Vectorisation complète:</strong>
                  </Typography>
                  {document.vectorInfo.isFullyVectorized ? (
                    <Chip label="Oui" color="success" size="small" />
                  ) : (
                    <Chip label="Non" color="error" size="small" />
                  )}
                </Box>
              </>
            )}
          </Box>

          {document.vectorInfo?.indexStats && (
            <>
              <Typography variant="h6" gutterBottom>
                Statistiques de l'Index
              </Typography>
              <Box sx={{ mb: 3 }}>
                <pre style={{ overflow: 'auto', maxHeight: '200px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(document.vectorInfo.indexStats, null, 2)}
                </pre>
              </Box>
            </>
          )}

          {document.error_message && (
            <>
              <Typography variant="h6" gutterBottom color="error">
                Erreur
              </Typography>
              <Typography color="error" component="div" sx={{ whiteSpace: 'pre-wrap', background: '#ffebee', padding: '10px', borderRadius: '4px' }}>
                {document.error_message}
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

interface SearchSectionProps {
  searchQuery: string;
  loading: boolean;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onFilenameSearch: () => void;
}

const SearchSection = React.memo<SearchSectionProps>(({ 
  searchQuery, 
  loading, 
  onSearchInputChange, 
  onClearSearch, 
  onFilenameSearch 
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onFilenameSearch();
  }, [onFilenameSearch]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <TextField
        fullWidth
        placeholder="Rechercher par nom de fichier (Entrée ou clic pour rechercher)"
        value={searchQuery}
        onChange={onSearchInputChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          endAdornment: searchQuery && (
            <IconButton onClick={onClearSearch} size="small" edge="end">
              <ClearIcon />
            </IconButton>
          ),
        }}
        disabled={loading}
      />
      <Button 
        variant="contained" 
        onClick={onFilenameSearch}
        startIcon={<SearchIcon />}
        disabled={loading}
      >
        Rechercher
      </Button>
    </Box>
  );
});

// SIMPLE TEST COMPONENT TO ISOLATE THE ISSUE
const SimpleTestComponent: React.FC = () => {
  const [testValue, setTestValue] = useState('');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>ISOLATION TEST - Si ce champ est lent, le problème est EXTERNE</h1>
      <input
        type="text"
        value={testValue}
        onChange={(e) => setTestValue(e.target.value)}
        placeholder="Test d'isolation - devrait être instantané"
        style={{
          padding: '10px',
          fontSize: '16px',
          border: '2px solid red',
          width: '100%',
          marginBottom: '20px'
        }}
      />
      <p>Valeur: {testValue}</p>
      <hr />
      <p>Si ce champ a de la latence, le problème vient de :</p>
      <ul>
        <li>Contextes React (AuthProvider, ChatProvider, etc.)</li>
        <li>Extensions navigateur</li>
        <li>Performance système</li>
        <li>Autre composant dans l'arbre</li>
      </ul>
    </div>
  );
};

// MEMOIZED DOCUMENT TABLE - Prevents re-renders during search typing
interface DocumentTableProps {
  documents: Document[];
  loading: boolean;
  loadingStatuses: Record<string, boolean>;
  onToggleActive: (documentId: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  onOpenInfo: (doc: Document) => void;
}

const MemoizedDocumentTable = React.memo<DocumentTableProps>(({ 
  documents, 
  loading, 
  loadingStatuses, 
  onToggleActive, 
  onDelete, 
  onOpenInfo 
}) => {
  return (
    <TableContainer component={Paper} elevation={2}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Nom du fichier</TableCell>
            <TableCell>Date d'ajout</TableCell>
            <TableCell>Statut Vectorisation</TableCell>
            <TableCell>Actif pour IA</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && documents.length === 0 ? (
            <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
          ) : documents.length === 0 ? (
            <TableRow><TableCell colSpan={5} align="center">Aucun document trouvé.</TableCell></TableRow>
          ) : (
            documents.map((doc) => {
              const statusInfo = getDocumentStatus(doc);
              return (
                <TableRow hover key={doc.id}>
                  <TableCell sx={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <Tooltip title={doc.filename}><span>{doc.filename}</span></Tooltip>
                  </TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {loadingStatuses[doc.id] ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={doc.active ? "Désactiver pour l'IA" : "Activer pour l'IA"}>
                      <IconButton onClick={() => onToggleActive(doc.id, doc.active)} color={doc.active ? "success" : "default"} size="small">
                        {doc.active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Infos Vectorisation">
                      <IconButton onClick={() => onOpenInfo(doc)} size="small">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer Document">
                      <IconButton onClick={() => onDelete(doc.id)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticTags, setSemanticTags] = useState('');
  const [semanticSearchResults, setSemanticSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);

  // Google Drive Sync states
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDriveConfigured, setIsDriveConfigured] = useState<boolean | null>(null);

  const loadDocumentStatuses = useCallback(async (docsToUpdate: Document[]) => {
    if (docsToUpdate.length === 0) return;
    
    const initialLoadingStates = docsToUpdate.reduce((acc, doc) => {
      acc[doc.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setLoadingStatuses(prev => ({ ...prev, ...initialLoadingStates }));

    const BATCH_SIZE = 3;
    const batches = [];
    for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
      batches.push(docsToUpdate.slice(i, i + BATCH_SIZE));
    }

    const allResults: Array<{ id: string; data?: Document; error?: Error }> = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (doc) => {
        try {
          if ((doc.vectorInfo && doc.vectorInfo.isFullyVectorized) || doc.status === 'completed') {
            return { id: doc.id };
          }
          
          const docWithVectorInfo = await documentService.getDocumentVectorInfo(doc.id);
          return { id: doc.id, data: docWithVectorInfo };
        } catch (error) {
          return { id: doc.id, error: error as Error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
    }

    const updateMap = new Map(allResults.filter(r => r.data).map(r => [r.id, r.data]));
    if (updateMap.size > 0) {
      setDocuments(prevDocs =>
        prevDocs.map(d => {
          const update = updateMap.get(d.id);
          return update ? { ...d, ...update, vectorInfo: update.vectorInfo } : d;
        })
      );
    }

    const finalLoadingStates = docsToUpdate.reduce((acc, doc) => {
      acc[doc.id] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setLoadingStatuses(prev => ({ ...prev, ...finalLoadingStates }));
  }, []);

  const loadDocuments = useCallback(async (currentPage: number = page, currentSearchQuery: string = '') => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (currentSearchQuery.trim()) {
        result = await documentService.searchDocumentsByFilename(currentSearchQuery, currentPage, pageSize);
      } else {
        result = await documentService.getAllDocuments(currentPage, pageSize);
      }
      
      setDocuments(result.documents);
      setTotalDocuments(result.total);
      setLoading(false);

      const documentsNeedingStatusUpdate = result.documents.filter(doc => 
        doc.status !== 'completed' && (!doc.vectorInfo || !doc.vectorInfo.isFullyVectorized)
      );
      
      if (documentsNeedingStatusUpdate.length > 0) {
        requestIdleCallback(() => {
          loadDocumentStatuses(documentsNeedingStatusUpdate);
        }, { timeout: 100 });
      }

    } catch (err) {
      setError((err as Error).message);
      setDocuments([]);
      setTotalDocuments(0);
      setLoading(false);
    }
  }, [page, pageSize, loadDocumentStatuses]);

  useEffect(() => {
    loadDocuments(page, '');
  }, [page, pageSize, loadDocuments]);

  const handleChangePage = useCallback((event: React.ChangeEvent<unknown> | null, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRefresh = useCallback(() => {
    loadDocuments(page, '');
  }, [page, loadDocuments]);
  
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setPage(1);
  }, []);

  const handleFilenameSearch = useCallback(() => {
    if (page !== 1) setPage(1);
    else loadDocuments(1, searchQuery);
  }, [searchQuery, page, loadDocuments]);

  const handleSemanticSearch = useCallback(async () => {
    if (!semanticQuery.trim()) {
      setError("La requête sémantique ne peut pas être vide.");
      return;
    }
    setIsSemanticSearching(true);
    setSemanticSearchResults([]);
    setError(null);
    try {
      // Parse tags from comma-separated string
      const tagsArray = semanticTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Call the actual backend endpoint
      const results = await documentService.semanticSearchPublicDocuments(
        semanticQuery,
        tagsArray.length > 0 ? tagsArray : undefined
      );

      setSemanticSearchResults(results);
    } catch (err) {
      console.error('Semantic search error:', err);
      setError((err as Error).message || 'Erreur lors de la recherche sémantique');
    } finally {
      setIsSemanticSearching(false);
    }
  }, [semanticQuery, semanticTags]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const files = Array.from(event.target.files);
    setLoading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });
    
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        // Ne pas passer de clientId pour les documents admin (ils seront automatiquement assignés à DAIRIA_COMMON_UUID)
        await documentService.uploadDocument(files[i], undefined);
      }
      setUploadDialogOpen(false);
      setUploadProgress({ current: 0, total: 0 });
      handleRefresh();
    } catch (err) {
      setError(`Erreur lors du téléversement : ${(err as Error).message}`);
    } finally {
      setLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [handleRefresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document et tous ses vecteurs associés? Cette action est irréversible.')) {
      setError(null);
      try {
        await documentService.deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (documents.length - 1 === 0 && page > 1) {
          setPage(page - 1);
        } else {
          handleRefresh();
        }
      } catch (err) {
        setError((err as Error).message);
      }
    }
  }, [documents, page, handleRefresh]);

  const handleToggleActive = useCallback(async (documentId: string, currentActive: boolean) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => (doc.id === documentId ? { ...doc, active: !currentActive } : doc))
    );
    setError(null);
    try {
      await documentService.toggleDocumentActive(documentId, !currentActive);
    } catch (err) {
      setError((err as Error).message);
      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === documentId ? { ...doc, active: currentActive } : doc))
      );
    }
  }, []);

  const openInfoDialog = useCallback((doc: Document) => {
    setSelectedDocument(doc);
    setInfoDialogOpen(true);
    if (!doc.vectorInfo || !doc.vectorInfo.isFullyVectorized || doc.status !== 'completed') {
      loadDocumentStatuses([doc]);
    }
  }, [loadDocumentStatuses]);

  // Check Google Drive configuration on mount
  useEffect(() => {
    const checkDriveConfig = async () => {
      try {
        const config = await googleDriveSyncService.checkConfiguration();
        setIsDriveConfigured(config.configured);
      } catch (err) {
        console.error('Failed to check Drive configuration:', err);
        setIsDriveConfigured(false);
      }
    };
    checkDriveConfig();
  }, []);

  const handleGoogleDriveSync = useCallback(async () => {
    setSyncDialogOpen(true);
    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const result = await googleDriveSyncService.startSync();
      setSyncResult(result);
      // Refresh the document list after sync
      handleRefresh();
    } catch (err) {
      setSyncError((err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  }, [handleRefresh]);

  const closeSyncDialog = useCallback(() => {
    setSyncDialogOpen(false);
    setSyncResult(null);
    setSyncError(null);
  }, []);

  return (
    <>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            mt: 1,
            ml: { xs: 0, sm: -12 }, // Pas de margin négatif sur mobile
            p: { xs: 1, sm: 1.5, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: 0,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 'md', md: 'lg' },
              p: { xs: 2, sm: 2.5, md: 3 },
              mt: 0,
              mb: { xs: 1, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h5" component="h1">
                Gestion des Documents
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Rafraîchir la liste">
                  <span>
                    <IconButton onClick={handleRefresh} disabled={loading} size="medium">
                      {loading && !isSemanticSearching ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                {isDriveConfigured && (
                  <Tooltip title="Synchroniser les documents depuis Google Drive">
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleGoogleDriveSync}
                      disabled={loading || isSyncing}
                      startIcon={isSyncing ? <CircularProgress size={20} color="inherit" /> : <CloudSyncIcon />}
                    >
                      Sync Drive
                    </Button>
                  </Tooltip>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Téléverser des Documents
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <SearchSection 
              searchQuery={searchQuery}
              loading={loading}
              onSearchInputChange={handleSearchInputChange}
              onClearSearch={handleClearSearch}
              onFilenameSearch={handleFilenameSearch}
            />

            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="semantic-search-content"
                id="semantic-search-header"
              >
                <Typography variant="h6">Recherche Sémantique</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Requête sémantique"
                    variant="outlined"
                    value={semanticQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSemanticQuery(e.target.value)}
                    disabled={isSemanticSearching}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && semanticQuery.trim()) handleSemanticSearch(); }}
                  />
                  <TextField
                    fullWidth
                    label="Tags (optionnel, séparés par des virgules)"
                    variant="outlined"
                    value={semanticTags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSemanticTags(e.target.value)}
                    disabled={isSemanticSearching}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && semanticQuery.trim()) handleSemanticSearch(); }}
                  />
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleSemanticSearch}
                    disabled={isSemanticSearching || !semanticQuery.trim()}
                    startIcon={isSemanticSearching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  >
                    {isSemanticSearching ? 'Recherche...' : 'Recherche Sémantique'}
                  </Button>
                  {isSemanticSearching && <LinearProgress color="secondary" />}
                  
                  {semanticSearchResults.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Résultats de la recherche sémantique:</Typography>
                      <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Document</TableCell>
                              <TableCell>Extrait Pertinent</TableCell>
                              <TableCell>Score</TableCell>
                              <TableCell>Tags</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {semanticSearchResults.map((result) => (
                              <TableRow hover key={result.id}>
                                <TableCell>{result.filename}</TableCell>
                                <TableCell sx={{whiteSpace: "pre-line"}}>{result.content}</TableCell>
                                <TableCell>{result.score?.toFixed(3)}</TableCell>
                                <TableCell>
                                  {(result.tags || []).map((tag: string) => <Chip key={tag} label={tag} size="small" sx={{mr:0.5, mb:0.5}}/>)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* OPTIMIZED: Use memoized table component with stable props */}
            <MemoizedDocumentTable 
              documents={documents}
              loading={loading}
              loadingStatuses={loadingStatuses}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onOpenInfo={openInfoDialog}
            />
            
            {totalDocuments > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, flexDirection: 'column', gap: 1 }}>
                 <Typography variant="body2" color="text.secondary">
                    {`Affichage de ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalDocuments)} sur ${totalDocuments} documents`}
                  </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Première page">
                    <span>
                      <IconButton
                        onClick={() => handleChangePage(null, 1)}
                        disabled={page === 1 || loading}
                        size="small"
                      >
                        <FirstPageIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <TablePagination
                    component="div"
                    count={totalDocuments}
                    page={page - 1}
                    onPageChange={(event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => handleChangePage(event, newPage + 1)}
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const newPageSize = parseInt(event.target.value, 10);
                      setPageSize(newPageSize);
                      setPage(1);
                      loadDocuments(1, searchQuery);
                    }}
                  />
                  <Tooltip title="Dernière page">
                    <span>
                      <IconButton
                        onClick={() => handleChangePage(null, Math.ceil(totalDocuments / pageSize))}
                        disabled={page >= Math.ceil(totalDocuments / pageSize) || loading}
                        size="small"
                      >
                        <LastPageIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {selectedDocument && (
          <VectorInfoDialog
            document={selectedDocument}
            open={infoDialogOpen}
            onClose={() => { setInfoDialogOpen(false); setSelectedDocument(null); }}
          />
        )}

        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Téléverser des Documents Communs</DialogTitle>
          <DialogContent sx={{pt:1}}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Les documents téléversés ici seront des documents communs, accessibles à tous les clients et utilisés pour l'entraînement général de l'IA.
            </Typography>
            <Button
              variant="contained"
              component="label"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Téléversement...' : 'Choisir des fichiers (.pdf, .docx, images)'}
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif,.webp,.gif,.bmp"
              />
            </Button>
            {loading && uploadProgress.total > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Téléversement en cours: {uploadProgress.current} / {uploadProgress.total} fichiers
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(uploadProgress.current / uploadProgress.total) * 100}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
          </DialogActions>
        </Dialog>

        {/* Google Drive Sync Dialog */}
        <Dialog open={syncDialogOpen} onClose={isSyncing ? undefined : closeSyncDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudSyncIcon color="secondary" />
              Synchronisation Google Drive
            </Box>
          </DialogTitle>
          <DialogContent>
            {isSyncing && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <CircularProgress size={48} color="secondary" />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Synchronisation en cours...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Cette opération peut prendre quelques minutes selon le nombre de documents.
                </Typography>
              </Box>
            )}

            {syncError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {syncError}
              </Alert>
            )}

            {syncResult && !isSyncing && (
              <Box sx={{ py: 1 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Synchronisation terminée avec succès !
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Fichiers traités:</Typography>
                    <Chip label={syncResult.totalFiles} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Nouveaux documents uploadés:</Typography>
                    <Chip label={syncResult.uploaded} color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Documents remplacés (nouvelle version):</Typography>
                    <Chip label={syncResult.replaced} color="info" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Documents ignorés (version identique ou plus ancienne):</Typography>
                    <Chip label={syncResult.skipped} color="default" size="small" />
                  </Box>
                </Box>

                {syncResult.errors.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {syncResult.errors.length} fichier(s) n'ont pas pu être synchronisés:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {syncResult.errors.map((err, i) => (
                        <li key={i}>
                          <Typography variant="body2">
                            <strong>{err.filename}:</strong> {err.error}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSyncDialog} disabled={isSyncing}>
              {isSyncing ? 'Veuillez patienter...' : 'Fermer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};