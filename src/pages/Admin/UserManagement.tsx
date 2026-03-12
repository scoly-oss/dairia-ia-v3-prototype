import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  SelectChangeEvent,
  Tabs,
  Tab,
  TableSortLabel,
  InputAdornment,
  Chip,
  Autocomplete,
  CircularProgress,
  TablePagination,
  Menu,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { userService, CreateUserData, UpdateUserData, EXPORT_COLUMNS, SUBSCRIPTION_STATUS_OPTIONS, SUBSCRIPTION_STATUS_LABELS } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { User, UserRole, Company } from '../../types/auth';
import { LAYOUT } from '../../theme/constants';
import CompanyTokenManagement from '../../components/Admin/CompanyTokenManagement';
import ClaudeTokenManagement from '../../components/Admin/ClaudeTokenManagement';

interface CompanyOption {
  id: string;
  name: string;
  isNew?: boolean;
}

const initialFormData = {
  email: '',
  password: '',
  role: 'client' as UserRole,
  firstName: '',
  lastName: '',
  companyName: '',
  selectedCompany: null as CompanyOption | null,
};

type SortableField = 'email' | 'firstName' | 'lastName' | 'role' | 'companyName';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortableField>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Rôles disponibles pour l'utilisateur connecté
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Companies pour l'autocomplete
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(0); // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);

  // Export
  const [exportMenuAnchor, setExportMenuAnchor] = useState<HTMLElement | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'current_page' | 'filtered'>('filtered');
  const [exportColumns, setExportColumns] = useState<string[]>(
    EXPORT_COLUMNS.map(c => c.key)
  );
  const [exporting, setExporting] = useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      const params: {
        sortBy: string;
        sortOrder: 'asc' | 'desc';
        page: number;
        pageSize: number;
        search?: string;
        role?: string;
        isActive?: boolean;
        subscriptionStatus?: string;
      } = {
        sortBy,
        sortOrder,
        page: page + 1, // Backend uses 1-indexed pages
        pageSize: rowsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;
      if (subscriptionStatusFilter) params.subscriptionStatus = subscriptionStatusFilter;

      const response = await userService.getAllUsers(params);
      setUsers(response.data);
      setTotalUsers(response.pagination.total);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [searchTerm, roleFilter, statusFilter, subscriptionStatusFilter, sortBy, sortOrder, page, rowsPerPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const data = await companyService.getAllCompanies();
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        ...initialFormData,
        email: user.email,
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value as UserRole,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          id: editingUser.id,
          email: formData.email,
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
        await userService.updateUser(updateData);
        setSuccess('Utilisateur mis à jour avec succès');
      } else {
        const createData: CreateUserData = {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };

        // Gestion de la company pour le rôle 'client'
        if (formData.role === 'client' && formData.selectedCompany) {
          if (formData.selectedCompany.isNew) {
            // Créer une nouvelle company
            createData.companyName = formData.selectedCompany.name;
          } else {
            // Assigner à une company existante
            createData.companyId = formData.selectedCompany.id;
          }
        }

        await userService.createUser(createData);
        setSuccess('Utilisateur créé avec succès');
      }
      await loadUsers();
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action supprimera également toutes les données associées.')) {
      try {
        await userService.deleteUser(userId);
        setSuccess('Utilisateur supprimé avec succès');
        await loadUsers();
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? 'désactiver' : 'activer';
    if (window.confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      try {
        if (user.isActive) {
          await userService.deactivateUser(user.id);
          setSuccess('Utilisateur désactivé avec succès');
        } else {
          await userService.activateUser(user.id);
          setSuccess('Utilisateur activé avec succès');
        }
        await loadUsers();
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const handleSort = (field: SortableField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setSubscriptionStatusFilter('');
    setPage(0); // Reset page when clearing filters
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, roleFilter, statusFilter, subscriptionStatusFilter]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export handlers
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportScopeSelect = (scope: 'all' | 'current_page' | 'filtered') => {
    setExportScope(scope);
    setExportMenuAnchor(null);
    setExportDialogOpen(true);
  };

  const toggleExportColumn = (columnKey: string) => {
    setExportColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(c => c !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAllColumns = () => {
    setExportColumns(EXPORT_COLUMNS.map(c => c.key));
  };

  const handleDeselectAllColumns = () => {
    setExportColumns([]);
  };

  const handleExport = async () => {
    if (exportColumns.length === 0) {
      setError('Veuillez sélectionner au moins une colonne à exporter');
      return;
    }

    setExporting(true);
    try {
      if (exportScope === 'current_page') {
        // Export client-side avec les données actuelles
        userService.generateCSVFromUsers(users, exportColumns);
      } else {
        // Export server-side
        const params: {
          columns: string[];
          search?: string;
          role?: string;
          isActive?: boolean;
          subscriptionStatus?: string;
          sortBy?: string;
          sortOrder?: 'asc' | 'desc';
        } = {
          columns: exportColumns,
          sortBy,
          sortOrder,
        };

        // Pour "filtered", inclure les filtres actuels
        // Pour "all", ne pas inclure de filtres
        if (exportScope === 'filtered') {
          if (searchTerm) params.search = searchTerm;
          if (roleFilter) params.role = roleFilter;
          if (statusFilter === 'active') params.isActive = true;
          if (statusFilter === 'inactive') params.isActive = false;
          if (subscriptionStatusFilter) params.subscriptionStatus = subscriptionStatusFilter;
        }

        await userService.exportUsersToCSV(params);
      }
      setExportDialogOpen(false);
      setSuccess('Export réussi');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const activeFiltersCount = [searchTerm, roleFilter, statusFilter, subscriptionStatusFilter].filter(Boolean).length;

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h1">
                Gestion des Utilisateurs
              </Typography>
              {currentTab === 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    endIcon={<ArrowDropDownIcon />}
                    onClick={handleExportMenuOpen}
                  >
                    Exporter
                  </Button>
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={handleExportMenuClose}
                  >
                    <MenuItem onClick={() => handleExportScopeSelect('current_page')}>
                      Page actuelle ({users.length})
                    </MenuItem>
                    <MenuItem onClick={() => handleExportScopeSelect('filtered')}>
                      Résultats filtrés ({totalUsers})
                    </MenuItem>
                    <MenuItem onClick={() => handleExportScopeSelect('all')}>
                      Tous les utilisateurs
                    </MenuItem>
                  </Menu>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                  >
                    Nouvel Utilisateur
                  </Button>
                </Box>
              )}
            </Box>

            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab label="Comptes utilisateurs" />
              <Tab label="Abonnements" />
              <Tab label="Usage Claude" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {currentTab === 0 && (
              <>
                {/* Barre de recherche et filtres */}
                <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Ligne de recherche */}
                  <TextField
                    placeholder="Rechercher par email, prénom, nom ou entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Ligne de filtres */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel id="role-filter-label">Rôle</InputLabel>
                      <Select
                        labelId="role-filter-label"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        label="Rôle"
                      >
                        <MenuItem value="">Tous</MenuItem>
                        {getRoleOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel id="status-filter-label">Statut</InputLabel>
                      <Select
                        labelId="status-filter-label"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Statut"
                      >
                        <MenuItem value="">Tous</MenuItem>
                        <MenuItem value="active">Actif</MenuItem>
                        <MenuItem value="inactive">Inactif</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <InputLabel id="subscription-status-filter-label">Statut abonnement</InputLabel>
                      <Select
                        labelId="subscription-status-filter-label"
                        value={subscriptionStatusFilter}
                        onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                        label="Statut abonnement"
                      >
                        <MenuItem value="">Tous</MenuItem>
                        {SUBSCRIPTION_STATUS_OPTIONS.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {activeFiltersCount > 0 && (
                      <>
                        <Chip
                          icon={<FilterListIcon />}
                          label={`${activeFiltersCount} filtre(s) actif(s)`}
                          onDelete={handleClearFilters}
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {users.length} résultat(s)
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'email'}
                            direction={sortBy === 'email' ? sortOrder : 'asc'}
                            onClick={() => handleSort('email')}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'firstName'}
                            direction={sortBy === 'firstName' ? sortOrder : 'asc'}
                            onClick={() => handleSort('firstName')}
                          >
                            Prénom
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'lastName'}
                            direction={sortBy === 'lastName' ? sortOrder : 'asc'}
                            onClick={() => handleSort('lastName')}
                          >
                            Nom
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Téléphone</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'role'}
                            direction={sortBy === 'role' ? sortOrder : 'asc'}
                            onClick={() => handleSort('role')}
                          >
                            Rôle
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'companyName'}
                            direction={sortBy === 'companyName' ? sortOrder : 'asc'}
                            onClick={() => handleSort('companyName')}
                          >
                            Entreprise
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Statut abonnement</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.firstName || '-'}</TableCell>
                          <TableCell>{user.lastName || '-'}</TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>{getRoleLabel(user.role)}</TableCell>
                          <TableCell>{user.companyName || '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {user.isActive ? (
                                <>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                  <Typography variant="body2" color="success.main">Actif</Typography>
                                </>
                              ) : (
                                <>
                                  <BlockIcon color="error" fontSize="small" />
                                  <Typography variant="body2" color="error.main">Inactif</Typography>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {user.subscriptionStatus ? (
                              <Chip
                                label={SUBSCRIPTION_STATUS_LABELS[user.subscriptionStatus] || user.subscriptionStatus}
                                size="small"
                                color={
                                  user.subscriptionStatus === 'active' ? 'success' :
                                  user.subscriptionStatus === 'trialing' ? 'info' :
                                  user.subscriptionStatus === 'past_due' ? 'error' :
                                  user.subscriptionStatus === 'canceled' ? 'default' :
                                  'warning'
                                }
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpen(user)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color={user.isActive ? "error" : "success"}
                                onClick={() => handleToggleActive(user)}
                                title={user.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
                              >
                                {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(user.id)}
                                title="Supprimer définitivement l'utilisateur"
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

                <TablePagination
                  component="div"
                  count={totalUsers}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Lignes par page :"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                />
              </>
            )}

            {currentTab === 1 && (
              <CompanyTokenManagement />
            )}

            {currentTab === 2 && (
              <ClaudeTokenManagement />
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: 24,
            }
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{
            pb: 1,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTypography-root': {
              fontSize: '1.5rem',
              fontWeight: 500,
            }
          }}>
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              pt: 1,
            }}>
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

              {!editingUser && formData.role === 'client' && (
                <Autocomplete
                  value={formData.selectedCompany}
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                      // L'utilisateur a tapé du texte et appuyé sur Entrée
                      setFormData(prev => ({
                        ...prev,
                        selectedCompany: { id: '', name: newValue, isNew: true },
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        selectedCompany: newValue,
                      }));
                    }
                  }}
                  options={companies.map(c => ({ id: c.id, name: c.name, isNew: false }))}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.name;
                  }}
                  filterOptions={(options, params) => {
                    const inputValue = params.inputValue.trim().toLowerCase();
                    const filtered = options.filter(opt =>
                      opt.name.toLowerCase().includes(inputValue)
                    );

                    // Ajouter l'option "Créer" si le texte tapé ne correspond à aucune company existante
                    const isExisting = options.some(
                      opt => opt.name.toLowerCase() === inputValue
                    );

                    if (inputValue !== '' && !isExisting) {
                      filtered.push({
                        id: '',
                        name: params.inputValue.trim(),
                        isNew: true,
                      });
                    }

                    return filtered;
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.isNew ? `new-${option.name}` : option.id}>
                      {option.isNew ? `Créer "${option.name}"` : option.name}
                    </li>
                  )}
                  loading={companiesLoading}
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  fullWidth
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Entreprise"
                      helperText="Sélectionnez une entreprise existante ou tapez un nom pour en créer une nouvelle"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {companiesLoading ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{
            px: 3,
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            gap: 1
          }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              color="inherit"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Export Column Selection Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Sélectionner les colonnes à exporter
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {exportScope === 'current_page' && `Export de la page actuelle (${users.length} utilisateurs)`}
              {exportScope === 'filtered' && `Export des résultats filtrés (${totalUsers} utilisateurs)`}
              {exportScope === 'all' && 'Export de tous les utilisateurs'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={handleSelectAllColumns}>
                Tout sélectionner
              </Button>
              <Button size="small" onClick={handleDeselectAllColumns}>
                Tout désélectionner
              </Button>
            </Box>
          </Box>
          <FormGroup>
            {EXPORT_COLUMNS.map(col => (
              <FormControlLabel
                key={col.key}
                control={
                  <Checkbox
                    checked={exportColumns.includes(col.key)}
                    onChange={() => toggleExportColumn(col.key)}
                  />
                }
                label={col.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exporting || exportColumns.length === 0}
            startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
          >
            {exporting ? 'Export en cours...' : 'Exporter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
