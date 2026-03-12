import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  MoreVert as MoreVertIcon,
  DriveFileMove as DriveFileMoveIcon,
  FolderOff as FolderOffIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { documentService } from '../services/documentService';
import { folderService } from '../services/folderService';
import { Document } from '../types/document';
import { FolderWithDocumentCount } from '../types/folder';
import { ConventionCollective } from '../types/collectiveAgreement';
import { IdccSelector } from '../components/IdccSelector';
import { LAYOUT } from '../theme/constants';
import { useAuth } from '../contexts/AuthContext';

export const ClientDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [tags, setTags] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const companyId = user?.company_id;

  // États pour la gestion des folders
  const [folders, setFolders] = useState<FolderWithDocumentCount[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [noFolderDocumentCount, setNoFolderDocumentCount] = useState(0);
  const [folderMenuAnchor, setFolderMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFolderForMenu, setSelectedFolderForMenu] = useState<FolderWithDocumentCount | null>(null);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDocumentForMove, setSelectedDocumentForMove] = useState<Document | null>(null);
  const [moveFolderMenuAnchor, setMoveFolderMenuAnchor] = useState<null | HTMLElement>(null);

  // États pour la création de dossier client avec convention collective
  const [isClientFolder, setIsClientFolder] = useState(false);
  const [selectedCC, setSelectedCC] = useState<ConventionCollective | null>(null);

  // État pour l'édition de la CC dans le dialog de modification
  const [editSelectedCC, setEditSelectedCC] = useState<ConventionCollective | null>(null);

  // Fonction pour charger les folders
  const loadFolders = useCallback(async () => {
    if (!companyId) return;

    try {
      const result = await folderService.getFoldersByCompany(companyId);
      setFolders(result.folders);
      setNoFolderDocumentCount(result.noFolderDocumentCount);
    } catch (err) {
      console.error('Erreur lors du chargement des dossiers:', err);
    }
  }, [companyId]);

  // Fonction pour charger les documents de l'entreprise
  const loadDocuments = useCallback(async (currentPage?: number) => {
    if (!companyId) {
      return;
    }

    const pageToLoad = currentPage ?? page;

    try {
      setLoading(true);
      const result = await documentService.getDocumentsByCompanyId(
        companyId,
        pageToLoad,
        pageSize,
        selectedFolderId || undefined
      );
      setDocuments(result.documents);
      setTotalDocuments(result.total);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, companyId, selectedFolderId]);

  // Gestionnaire pour le changement de page
  const handleChangePage = useCallback((event: React.ChangeEvent<unknown> | null, newPage: number) => {
    setPage(newPage);
    loadDocuments(newPage);
  }, [loadDocuments]);

  // Gestionnaire pour le bouton de rafraîchissement
  const handleRefresh = useCallback(() => {
    loadDocuments(page);
    loadFolders();
  }, [loadDocuments, loadFolders, page]);

  // Gestionnaire pour la suppression d'un document
  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce document ? Cette action ne peut pas être annulée.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await documentService.deleteClientDocument(id);
      setDocuments(docs => docs.filter(doc => doc.id !== id));
      setError(null);
      await loadFolders(); // Recharger les folders pour mettre à jour les compteurs
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadFolders]);

  // Gestionnaire pour la création d'un folder
  const handleCreateFolder = useCallback(async () => {
    if (!folderName.trim() || !companyId) {
      console.log('[handleCreateFolder] Validation failed:', { folderName, companyId });
      return;
    }

    // Validation: un dossier client doit avoir une CC sélectionnée
    if (isClientFolder && !selectedCC) {
      setError('Un dossier client doit avoir une convention collective associée');
      return;
    }

    console.log('[handleCreateFolder] Creating folder:', {
      name: folderName.trim(),
      companyId,
      isClientFolder,
      cc: selectedCC?.idcc
    });

    try {
      const newFolder = await folderService.createFolder({
        name: folderName.trim(),
        company_id: companyId,
        created_by: user?.id,
        is_client_folder: isClientFolder,
        idcc: selectedCC?.idcc,
        idcc_label: selectedCC?.titre
      });
      console.log('[handleCreateFolder] Folder created successfully:', newFolder);
      setCreateFolderDialogOpen(false);
      setFolderName('');
      setIsClientFolder(false);
      setSelectedCC(null);
      await loadFolders();
    } catch (err) {
      console.error('[handleCreateFolder] Error:', err);
      setError(`Erreur lors de la création du dossier : ${(err as Error).message}`);
    }
  }, [folderName, companyId, user?.id, isClientFolder, selectedCC, loadFolders]);

  // Gestionnaire pour la modification d'un folder (renommage + CC)
  const handleRenameFolder = useCallback(async () => {
    if (!selectedFolderForMenu || !folderName.trim() || !companyId) return;

    // Validation: un dossier client doit avoir une CC sélectionnée
    if (selectedFolderForMenu.is_client_folder && !editSelectedCC) {
      setError('Un dossier client doit avoir une convention collective associée');
      return;
    }

    try {
      const updateData: { name: string; idcc?: string; idcc_label?: string } = {
        name: folderName.trim()
      };

      // Ajouter les données CC si c'est un dossier client
      if (selectedFolderForMenu.is_client_folder && editSelectedCC) {
        updateData.idcc = editSelectedCC.idcc;
        updateData.idcc_label = editSelectedCC.titre;
      }

      await folderService.updateFolder(selectedFolderForMenu.id, companyId, updateData);
      setRenameFolderDialogOpen(false);
      setFolderName('');
      setSelectedFolderForMenu(null);
      setEditSelectedCC(null);
      await loadFolders();
    } catch (err) {
      setError(`Erreur lors de la modification : ${(err as Error).message}`);
    }
  }, [selectedFolderForMenu, folderName, companyId, editSelectedCC, loadFolders]);

  // Gestionnaire pour la suppression d'un folder
  const handleDeleteFolder = useCallback(async () => {
    if (!selectedFolderForMenu || !companyId) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le dossier "${selectedFolderForMenu.name}" ? Le dossier doit être vide.`
    );

    if (!confirmed) return;

    try {
      await folderService.deleteFolder(selectedFolderForMenu.id, companyId);
      setFolderMenuAnchor(null);
      setSelectedFolderForMenu(null);
      await loadFolders();
    } catch (err) {
      setError(`Erreur lors de la suppression : ${(err as Error).message}`);
    }
  }, [selectedFolderForMenu, companyId, loadFolders]);

  // Gestionnaire pour déplacer un document vers un folder
  const handleMoveDocument = useCallback(async (targetFolderId: string | null) => {
    if (!selectedDocumentForMove || !companyId) return;

    try {
      if (targetFolderId) {
        await folderService.moveDocumentToFolder(targetFolderId, selectedDocumentForMove.id, companyId);
      } else {
        await folderService.removeDocumentFromFolder(selectedDocumentForMove.id, companyId);
      }
      setMoveFolderMenuAnchor(null);
      setSelectedDocumentForMove(null);
      await loadDocuments();
      await loadFolders();
    } catch (err) {
      setError(`Erreur lors du déplacement : ${(err as Error).message}`);
    }
  }, [selectedDocumentForMove, companyId, loadDocuments, loadFolders]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !companyId) return;

    const files = Array.from(event.target.files);
    setLoading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        // Upload avec le folder sélectionné
        await documentService.uploadClientDocument(files[i], tagsArray, selectedFolderId || undefined);
      }

      setUploadDialogOpen(false);
      setUploadProgress({ current: 0, total: 0 });
      setTags('');
      await loadDocuments();
      await loadFolders();
    } catch (err) {
      setError(`Erreur lors du téléversement : ${(err as Error).message}`);
    } finally {
      setLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [loadDocuments, loadFolders, companyId, tags, selectedFolderId]);

  // Charger les dossiers au montage
  useEffect(() => {
    if (companyId) {
      loadFolders();
    }
  }, [companyId, loadFolders]);

  // Recharger les documents quand companyId, page ou selectedFolderId change
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!companyId) {
        return;
      }

      try {
        setLoading(true);
        const result = await documentService.getDocumentsByCompanyId(
          companyId,
          page,
          pageSize,
          selectedFolderId || undefined
        );
        setDocuments(result.documents);
        setTotalDocuments(result.total);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [companyId, selectedFolderId, page, pageSize]);

  const getDocumentStatus = (doc: Document) => {
    if (doc.status === 'error') return { label: 'Erreur', color: 'error' as const };
    if (doc.status === 'processing') return { label: 'En cours', color: 'warning' as const };
    return { label: 'Terminé', color: 'success' as const };
  };

  const selectedFolderName = selectedFolderId
    ? folders.find(f => f.id === selectedFolderId)?.name
    : 'Hors dossier';

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>


      <Box
        sx={{
          position: 'fixed',
          top: LAYOUT.APPBAR_HEIGHT,
          right: 0,
          bottom: 0,
          left: 0,
          display: 'flex',
        }}
      >
        {/* Navigation Drawer Space */}
        <Box
          sx={{
            width: LAYOUT.NAV_WIDTH,
            display: { xs: 'none', sm: 'block' },
            flexShrink: 0,
          }}
        />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              {/* Liste des dossiers */}
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Dossiers</Typography>
                    <Tooltip title="Nouveau dossier">
                      <IconButton size="small" onClick={() => setCreateFolderDialogOpen(true)}>
                        <CreateNewFolderIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <List dense>
                    <ListItemButton
                      selected={!selectedFolderId}
                      onClick={() => {
                        setPage(1);
                        setSelectedFolderId(null);
                      }}
                    >
                      <ListItemIcon>
                        <FolderOffIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Hors dossier"
                        secondary={`${noFolderDocumentCount} doc(s)`}
                      />
                    </ListItemButton>
                    <Divider sx={{ my: 1 }} />
                    {folders.map((folder) => (
                      <ListItemButton
                        key={folder.id}
                        selected={selectedFolderId === folder.id}
                        onClick={() => {
                          setPage(1);
                          setSelectedFolderId(folder.id);
                        }}
                      >
                        <ListItemIcon>
                          {folder.is_client_folder ? (
                            <WorkIcon color={selectedFolderId === folder.id ? 'primary' : 'inherit'} />
                          ) : selectedFolderId === folder.id ? (
                            <FolderOpenIcon />
                          ) : (
                            <FolderIcon />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{folder.name}</Typography>
                              {folder.is_client_folder && folder.idcc && (
                                <Chip
                                  label={`IDCC ${folder.idcc}`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            folder.is_client_folder && folder.idcc_label
                              ? `${folder.document_count} doc(s) - ${folder.idcc_label.length > 25 ? folder.idcc_label.substring(0, 25) + '...' : folder.idcc_label}`
                              : `${folder.document_count} doc(s)`
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderForMenu(folder);
                            setFolderMenuAnchor(e.currentTarget);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Liste des documents */}
              <Grid item xs={12} md={9}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h1">
                      {selectedFolderName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Tooltip title="Rafraîchir">
                        <span>
                          <Button
                            onClick={handleRefresh}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                          >
                            Actualiser
                          </Button>
                        </span>
                      </Tooltip>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        Téléverser
                      </Button>
                    </Box>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {loading && documents.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : documents.length === 0 ? (
                    <Alert severity="info" sx={{ my: 2 }}>
                      Aucun document dans ce dossier. Utilisez le bouton "Téléverser" pour ajouter des documents.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nom du fichier</TableCell>
                            <TableCell>Date d'ajout</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {documents.map((doc) => {
                            const status = getDocumentStatus(doc);
                            return (
                              <TableRow key={doc.id}>
                                <TableCell>{doc.filename}</TableCell>
                                <TableCell>
                                  {new Date(doc.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={status.label}
                                    color={status.color}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Tooltip title="Déplacer vers dossier">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          setSelectedDocumentForMove(doc);
                                          setMoveFolderMenuAnchor(e.currentTarget);
                                        }}
                                      >
                                        <DriveFileMoveIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                      <IconButton
                                        aria-label="Supprimer le document"
                                        onClick={() => handleDelete(doc.id)}
                                        color="error"
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {totalDocuments > pageSize && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={Math.ceil(totalDocuments / pageSize)}
                        page={page}
                        onChange={handleChangePage}
                        color="primary"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Dialog pour téléverser un document */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Téléverser des Documents
          {selectedFolderName && (
            <Typography variant="body2" color="text.secondary">
              Destination: {selectedFolderName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Ces documents seront uniquement accessibles à vous et à l'équipe juridique lors des consultations.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="tags"
              label="Tags (séparés par des virgules)"
              type="text"
              fullWidth
              variant="outlined"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: contrat, social, important"
            />
            <Button
              variant="contained"
              component="label"
              color="primary"
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
                aria-label="Téléverser un document"
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour créer un dossier */}
      <Dialog
        open={createFolderDialogOpen}
        onClose={() => {
          setCreateFolderDialogOpen(false);
          setFolderName('');
          setIsClientFolder(false);
          setSelectedCC(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer un nouveau dossier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du dossier"
              type="text"
              fullWidth
              variant="outlined"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isClientFolder) {
                  handleCreateFolder();
                }
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isClientFolder}
                  onChange={(e) => {
                    setIsClientFolder(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedCC(null);
                    }
                  }}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon fontSize="small" />
                  <Typography>Dossier client (cabinet RH)</Typography>
                </Box>
              }
            />

            {isClientFolder && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Un dossier client doit être associé à une convention collective obligatoire.
                </Typography>
                <IdccSelector
                  value={selectedCC}
                  onChange={setSelectedCC}
                  label="Convention collective *"
                  required
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateFolderDialogOpen(false);
            setFolderName('');
            setIsClientFolder(false);
            setSelectedCC(null);
          }}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!folderName.trim() || (isClientFolder && !selectedCC)}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour modifier un dossier (renommer + CC) */}
      <Dialog
        open={renameFolderDialogOpen}
        onClose={() => {
          setRenameFolderDialogOpen(false);
          setFolderName('');
          setSelectedFolderForMenu(null);
          setEditSelectedCC(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier le dossier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du dossier"
              type="text"
              fullWidth
              variant="outlined"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !selectedFolderForMenu?.is_client_folder) {
                  handleRenameFolder();
                }
              }}
            />

            {selectedFolderForMenu?.is_client_folder && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Convention collective associée au dossier client :
                </Typography>
                <IdccSelector
                  value={editSelectedCC}
                  onChange={setEditSelectedCC}
                  label="Code IDCC *"
                  required
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRenameFolderDialogOpen(false);
            setFolderName('');
            setSelectedFolderForMenu(null);
            setEditSelectedCC(null);
          }}>
            Annuler
          </Button>
          <Button
            onClick={handleRenameFolder}
            variant="contained"
            disabled={!folderName.trim() || (selectedFolderForMenu?.is_client_folder && !editSelectedCC)}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu contextuel pour les dossiers */}
      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={() => {
          setFolderMenuAnchor(null);
          // Ne pas effacer selectedFolderForMenu ici car il peut être utilisé par le dialog
        }}
      >
        <MenuItem
          onClick={() => {
            const folder = selectedFolderForMenu;
            setFolderName(folder?.name || '');
            // Initialiser la CC si c'est un dossier client avec une CC existante
            if (folder?.is_client_folder && folder.idcc) {
              setEditSelectedCC({
                idcc: folder.idcc,
                titre: folder.idcc_label || ''
              });
            } else {
              setEditSelectedCC(null);
            }
            setRenameFolderDialogOpen(true);
            setFolderMenuAnchor(null);
          }}
        >
          Modifier
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteFolder();
          setSelectedFolderForMenu(null);
        }}>
          Supprimer
        </MenuItem>
      </Menu>

      {/* Menu pour déplacer un document vers un dossier */}
      <Menu
        anchorEl={moveFolderMenuAnchor}
        open={Boolean(moveFolderMenuAnchor)}
        onClose={() => {
          setMoveFolderMenuAnchor(null);
          setSelectedDocumentForMove(null);
        }}
      >
        <MenuItem onClick={() => handleMoveDocument(null)}>
          <ListItemIcon>
            <FolderOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Hors dossier</ListItemText>
        </MenuItem>
        <Divider />
        {folders.map((folder) => (
          <MenuItem
            key={folder.id}
            onClick={() => handleMoveDocument(folder.id)}
          >
            <ListItemIcon>
              <FolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{folder.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ClientDocuments;
