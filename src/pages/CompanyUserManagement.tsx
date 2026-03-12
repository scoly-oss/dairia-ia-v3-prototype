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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tab,
  Tabs,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import { companyService } from '../services/companyService';
import { collectiveAgreementService } from '../services/collectiveAgreementService';
import { AppNavigation } from '../components/Navigation/AppNavigation';
import { LAYOUT } from '../theme/constants';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types/auth';
import { userService } from '../services/userService';
import { ConventionCollective } from '../types/collectiveAgreement';
import { IdccSelector } from '../components/IdccSelector';

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'company_user',
};

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const CompanyUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);

  // États pour la convention collective par défaut
  const [defaultCC, setDefaultCC] = useState<{ idcc: string; idcc_label: string } | null>(null);
  const [ccLoading, setCcLoading] = useState(false);

  // États pour les informations de l'entreprise
  const [effectif, setEffectif] = useState<number | ''>('');
  const [activite, setActivite] = useState('');
  const [companyInfoLoading, setCompanyInfoLoading] = useState(false);

  // État pour la réactivation d'utilisateur
  const [reactivatingUserId, setReactivatingUserId] = useState<string | null>(null);

  const companyId = user?.company_id || user?.companyId;

  const loadUsers = async () => {
    if (!companyId) {
      setError('Vous n\'êtes pas associé à une entreprise');
      return;
    }

    try {
      setLoading(true);
      const data = await companyService.getCompanyUsers(companyId);
      setUsers(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Réactiver un utilisateur désactivé
  const handleReactivate = async (userId: string) => {
    if (!companyId) return;

    if (!window.confirm(
      'Êtes-vous sûr de vouloir réactiver cet utilisateur ? Votre abonnement sera ajusté au prorata.'
    )) {
      return;
    }

    try {
      setReactivatingUserId(userId);
      await companyService.reactivateUser(companyId, userId);
      setSuccess('Utilisateur réactivé. Votre abonnement a été ajusté au prorata.');
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReactivatingUserId(null);
    }
  };

  // Charger la convention collective par défaut
  const loadDefaultCC = useCallback(async () => {
    if (!companyId) return;

    setCcLoading(true);
    try {
      const response = await collectiveAgreementService.getCompanyDefaultCC(companyId);
      setDefaultCC(response.defaultCC);
    } catch (err) {
      console.error('Erreur lors du chargement de la CC par défaut:', err);
    } finally {
      setCcLoading(false);
    }
  }, [companyId]);

  // Mettre à jour la CC par défaut (appelé par IdccSelector)
  const handleUpdateDefaultCC = async (cc: ConventionCollective | null) => {
    if (!companyId || !cc) return;

    // Validation: IDCC doit être présent et valide
    if (!cc.idcc || cc.idcc.trim() === '') {
      setError('Cette convention collective n\'a pas de code IDCC valide. Veuillez en sélectionner une autre.');
      return;
    }

    setCcLoading(true);
    setError(null);
    try {
      const result = await collectiveAgreementService.updateCompanyDefaultCC(companyId, {
        idcc: cc.idcc,
        idcc_label: cc.titre
      });

      if (result.success) {
        setDefaultCC({ idcc: cc.idcc, idcc_label: cc.titre });
        setSuccess('Convention collective par défaut mise à jour avec succès');
      } else {
        setError(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCcLoading(false);
    }
  };

  // Supprimer la CC par défaut
  const handleRemoveDefaultCC = async () => {
    if (!companyId) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer la convention collective par défaut ?')) {
      return;
    }

    setCcLoading(true);
    setError(null);
    try {
      const result = await collectiveAgreementService.removeCompanyDefaultCC(companyId);

      if (result.success) {
        setDefaultCC(null);
        setSuccess('Convention collective par défaut supprimée');
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCcLoading(false);
    }
  };

  // Mettre à jour les informations de l'entreprise
  const handleUpdateCompanyInfo = async () => {
    if (!companyId) return;

    // Validation
    if (effectif !== '' && effectif < 0) {
      setError('L\'effectif doit être un nombre positif');
      return;
    }

    setCompanyInfoLoading(true);
    setError(null);
    try {
      await companyService.updateCompanyInfo(companyId, {
        effectif: effectif === '' ? undefined : effectif,
        activite: activite.trim() || undefined,
      });
      setSuccess('Informations de l\'entreprise mises à jour avec succès');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCompanyInfoLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadDefaultCC();
  }, [companyId, loadDefaultCC]);

  // Charger les informations de l'entreprise
  useEffect(() => {
    if (user?.company) {
      setEffectif(user.company.effectif ?? '');
      setActivite(user.company.activite ?? '');
    }
  }, [user?.company]);

  useEffect(() => {
    const fetchAvailableRoles = async () => {
      try {
        const roles = await userService.getAvailableRoles();
        setAvailableRoles(roles);
      } catch (err) {
        console.error('Error fetching available roles:', err);
      }
    };
    fetchAvailableRoles();
  }, []);

  const handleOpen = (selectedUser?: User) => {
    if (selectedUser) {
      setEditingUser(selectedUser);
      setFormData({
        email: selectedUser.email,
        password: '',
        firstName: selectedUser.firstName || '',
        lastName: selectedUser.lastName || '',
        role: selectedUser.role,
      });
    } else {
      setEditingUser(null);
      setFormData(initialFormData);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value as UserRole,
    }));
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'lawyer':
        return 'Avocat';
      case 'client':
        return 'Client (Admin Entreprise)';
      case 'company_user':
        return 'Utilisateur Entreprise';
      default:
        return role;
    }
  };

  const getRoleOptions = () => {
    return availableRoles.map(role => ({
      value: role,
      label: getRoleLabel(role as UserRole)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!companyId) {
      setError('Vous n\'êtes pas associé à une entreprise');
      return;
    }

    try {
      setLoading(true);
      if (editingUser) {
        await companyService.updateCompanyUser(companyId, editingUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role as 'client' | 'company_user',
        });
        setSuccess('Utilisateur mis à jour avec succès');
      } else {
        const result = await companyService.addUserToCompany(companyId, {
          email: formData.email,
          password: formData.password,
          role: formData.role as 'client' | 'company_user',
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        if (result.billingUpdated) {
          setSuccess('Utilisateur créé. Votre abonnement a été ajusté au prorata.');
        } else {
          setSuccess('Utilisateur créé avec succès.');
        }
      }
      await loadUsers();
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!companyId) return;

    if (
      window.confirm(
        'Êtes-vous sûr de vouloir désactiver cet utilisateur ? Il ne pourra plus accéder à l\'application.'
      )
    ) {
      try {
        setLoading(true);
        await companyService.removeUserFromCompany(companyId, userId);
        setSuccess('Utilisateur désactivé. Un crédit sera appliqué sur votre prochaine facture.');
        await loadUsers();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!companyId) {
    return (
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <AppNavigation />
        <Box
          sx={{
            position: 'fixed',
            top: LAYOUT.APPBAR_HEIGHT,
            right: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Alert severity="error">
            Vous n'êtes pas associé à une entreprise. Veuillez contacter l'administrateur.
          </Alert>
        </Box>
      </Box>
    );
  }

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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            sx={{
              width: '100%',
              maxWidth: 'lg',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="h5" component="h1">
              Paramètres de l'Entreprise
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                aria-label="paramètres entreprise"
              >
                <Tab
                  icon={<PersonIcon />}
                  iconPosition="start"
                  label="Utilisateurs"
                  id="settings-tab-0"
                  aria-controls="settings-tabpanel-0"
                />
                <Tab
                  icon={<SettingsIcon />}
                  iconPosition="start"
                  label="Paramètres"
                  id="settings-tab-1"
                  aria-controls="settings-tabpanel-1"
                />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Onglet Utilisateurs */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpen()}
                  disabled={loading}
                >
                  Nouvel Utilisateur
                </Button>
              </Box>

              <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((companyUser) => (
                    <TableRow key={companyUser.id}>
                      <TableCell>{companyUser.email}</TableCell>
                      <TableCell>{companyUser.firstName || '-'}</TableCell>
                      <TableCell>{companyUser.lastName || '-'}</TableCell>
                      <TableCell>{getRoleLabel(companyUser.role)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {companyUser.isActive ? (
                            <>
                              <CheckCircleIcon color="success" fontSize="small" />
                              <Chip label="Actif" color="success" size="small" />
                            </>
                          ) : (
                            <>
                              <BlockIcon color="error" fontSize="small" />
                              <Chip label="Inactif" color="error" size="small" />
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {!companyUser.isActive && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleReactivate(companyUser.id)}
                              disabled={loading || reactivatingUserId === companyUser.id}
                              title="Réactiver l'utilisateur (facturation au prorata)"
                            >
                              {reactivatingUserId === companyUser.id ? (
                                <CircularProgress size={20} color="success" />
                              ) : (
                                <CheckCircleIcon />
                              )}
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(companyUser)}
                            disabled={loading || !companyUser.isActive}
                            title="Modifier l'utilisateur"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(companyUser.id)}
                            disabled={loading || !companyUser.isActive || companyUser.id === user?.id}
                            title={
                              companyUser.id === user?.id
                                ? "Vous ne pouvez pas vous supprimer vous-même"
                                : 'Désactiver l\'utilisateur'
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableContainer>

              {users.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">Aucun utilisateur trouvé</Typography>
                </Box>
              )}
            </TabPanel>

            {/* Onglet Paramètres */}
            <TabPanel value={tabValue} index={1}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                  gap: 4,
                }}
              >
                {/* Section Convention Collective */}
                <Card variant="outlined" sx={{ height: 'fit-content' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GavelIcon color="primary" />
                      <Typography variant="h6">
                        Convention Collective par Défaut
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Définissez la convention collective qui sera utilisée par défaut pour enrichir
                      les réponses de l'assistant juridique. Cette convention sera appliquée à toutes
                      les conversations, sauf pour les dossiers clients qui ont leur propre CC associée.
                    </Typography>

                    {/* Affichage de la CC actuelle */}
                    {defaultCC ? (
                      <Card
                        variant="outlined"
                        sx={{
                          mb: 3,
                          bgcolor: 'primary.50',
                          borderColor: 'primary.200',
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Convention collective actuelle
                          </Typography>
                          <Chip
                            label={`IDCC ${defaultCC.idcc}`}
                            color="primary"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body1" fontWeight="medium">
                            {defaultCC.idcc_label}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <Button
                            size="small"
                            color="error"
                            onClick={handleRemoveDefaultCC}
                            disabled={ccLoading}
                            startIcon={<DeleteIcon />}
                          >
                            Supprimer
                          </Button>
                        </CardActions>
                      </Card>
                    ) : (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Aucune convention collective par défaut n'est configurée.
                      </Alert>
                    )}

                    {/* Saisie du code IDCC */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {defaultCC ? 'Modifier la convention collective' : 'Configurer une convention collective'}
                      </Typography>

                      <IdccSelector
                        value={null}
                        onChange={handleUpdateDefaultCC}
                        disabled={ccLoading}
                      />
                    </Box>
                  </CardContent>
                </Card>

                {/* Section Informations de l'entreprise */}
                <Card variant="outlined" sx={{ height: 'fit-content' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SettingsIcon color="primary" />
                      <Typography variant="h6">
                        Informations de l'entreprise
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Ces informations permettent à l'assistant juridique de mieux comprendre
                      le contexte de votre entreprise et d'adapter ses réponses.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Effectif de la société"
                        type="number"
                        value={effectif}
                        onChange={(e) => setEffectif(e.target.value === '' ? '' : Number(e.target.value))}
                        helperText="Nombre de salariés"
                        inputProps={{ min: 0 }}
                        fullWidth
                        size="small"
                      />

                      <TextField
                        label="Activité de la société"
                        multiline
                        rows={4}
                        value={activite}
                        onChange={(e) => setActivite(e.target.value)}
                        placeholder="Décrivez l'activité principale de votre entreprise"
                        fullWidth
                        size="small"
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleUpdateCompanyInfo}
                          disabled={companyInfoLoading}
                          startIcon={companyInfoLoading ? <CircularProgress size={20} /> : undefined}
                        >
                          Enregistrer
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>

      {/* Dialog pour créer/modifier un utilisateur */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            boxShadow: 24,
          }
        }
      }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              pb: 1,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                pt: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="firstName"
                  label="Prénom"
                  value={formData.firstName}
                  onChange={handleTextChange}
                  fullWidth
                  size="small"
                />
                <TextField
                  name="lastName"
                  label="Nom"
                  value={formData.lastName}
                  onChange={handleTextChange}
                  fullWidth
                  size="small"
                />
              </Box>

              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleTextChange}
                required
                fullWidth
                size="small"
              />

              {!editingUser && (
                <TextField
                  name="password"
                  label="Mot de passe"
                  type="password"
                  value={formData.password}
                  onChange={handleTextChange}
                  required={!editingUser}
                  fullWidth
                  size="small"
                  helperText="Minimum 8 caractères"
                />
              )}

              <FormControl fullWidth size="small">
                <InputLabel id="role-label">Rôle</InputLabel>
                <Select
                  labelId="role-label"
                  value={formData.role}
                  onChange={handleRoleChange}
                  label="Rôle"
                >
                  {getRoleOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
              gap: 1,
            }}
          >
            <Button onClick={handleClose} variant="outlined" color="inherit" disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CompanyUserManagement;
