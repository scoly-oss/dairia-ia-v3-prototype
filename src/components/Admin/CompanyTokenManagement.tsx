import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Collapse,
  InputAdornment,
  TableSortLabel,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ExpandLessIcon
} from '@mui/icons-material';
import { companyService, CompanyTokenStats } from '../../services/companyService';
import { User } from '../../types/auth';
import { Company } from '../../types/auth';

// Helper function for subscription status badge
const getSubscriptionStatusBadge = (stats?: CompanyTokenStats) => {
  if (!stats) return <Chip label="Aucun" size="small" />;

  const { subscriptionStatus, cancelAtPeriodEnd } = stats;

  if (cancelAtPeriodEnd) {
    return (
      <Chip
        label="Annulation prévue"
        color="warning"
        size="small"
        icon={<CancelIcon />}
      />
    );
  }

  const statusConfig: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
    active: { label: 'Actif', color: 'success' },
    trialing: { label: 'Essai', color: 'info' },
    pending_payment: { label: 'En attente de paiement', color: 'warning' },
    past_due: { label: 'Impayé', color: 'error' },
    canceled: { label: 'Annulé', color: 'default' },
    incomplete: { label: 'Incomplet', color: 'warning' },
    incomplete_expired: { label: 'Expiré', color: 'default' },
    unpaid: { label: 'Impayé', color: 'error' },
    paused: { label: 'En pause', color: 'default' },
  };

  const config = statusConfig[subscriptionStatus] || { label: subscriptionStatus || 'Inconnu', color: 'default' as const };

  return <Chip label={config.label} color={config.color} size="small" />;
};

// Using CompanyWithStats from service for batch response
// Local interface for component state (allows undefined tokenStats)
interface CompanyWithOptionalStats extends Company {
  tokenStats?: CompanyTokenStats;
}

// Options de statut pour le filtre
const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'trialing', label: 'Essai' },
  { value: 'past_due', label: 'Impayé' },
  { value: 'pending_payment', label: 'En attente de paiement' },
  { value: 'canceled', label: 'Annulé' },
  { value: 'incomplete', label: 'Incomplet' },
];

type SortField = 'name' | 'status';

const CompanyTokenManagement: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyWithOptionalStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyWithOptionalStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    monthlyTokenLimit: 0,
    subscriptionType: 'basic'
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCompanyHistory, setSelectedCompanyHistory] = useState<CompanyWithOptionalStats | null>(null);

  // Recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Tri
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Expansion des lignes pour afficher les users
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [companyUsers, setCompanyUsers] = useState<Record<string, User[]>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // OPTIMIZED: Une seule requête batch au lieu de N+1 requêtes
      const companiesWithStats = await companyService.getAllCompaniesWithStats();
      setCompanies(companiesWithStats);
    } catch (err) {
      console.error('Erreur lors du chargement des companies:', err);
      setError('Impossible de charger les statistiques des companies');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = (company: CompanyWithOptionalStats) => {
    setEditingCompany(company);
    setFormData({
      monthlyTokenLimit: company.monthly_token_limit || 0,
      subscriptionType: company.subscription_type || 'basic'
    });
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingCompany(null);
    setFormData({
      monthlyTokenLimit: 0,
      subscriptionType: 'basic'
    });
  };

  const handleSave = async () => {
    if (!editingCompany) return;

    try {
      const dataToSend = {
        monthlyTokenLimit: formData.monthlyTokenLimit,
        subscriptionType: formData.subscriptionType
      };
      await companyService.updateCompanySubscription(editingCompany.id, dataToSend);
      await loadCompanies(); // Recharger les données
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Impossible de mettre à jour l\'abonnement');
    }
  };

  const getUsageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number): string => {
    // Afficher en euros avec 3 décimales minimum, 4 pour les petites valeurs
    if (cost < 0.001) {
      return `${(cost).toFixed(4)} €`;
    }
    return `${(cost).toFixed(3)} €`;
  };

  const handleShowHistory = (company: CompanyWithOptionalStats) => {
    setSelectedCompanyHistory(company);
    setHistoryDialogOpen(true);
  };

  // Logique de filtrage et tri
  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];

    // Filtre recherche par nom
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par statut d'abonnement
    if (statusFilter !== 'all') {
      result = result.filter(c =>
        c.tokenStats?.subscriptionStatus === statusFilter
      );
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'fr');
      } else if (sortBy === 'status') {
        const statusA = a.tokenStats?.subscriptionStatus || '';
        const statusB = b.tokenStats?.subscriptionStatus || '';
        comparison = statusA.localeCompare(statusB, 'fr');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [companies, searchTerm, statusFilter, sortBy, sortOrder]);

  // Gestion du tri
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Pagination des résultats filtrés
  const paginatedCompanies = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedCompanies.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedCompanies, page, rowsPerPage]);

  // Handlers de pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  // Gestion de l'expansion des lignes pour afficher les users
  const handleToggleExpand = async (companyId: string) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
      // Charger les users si pas encore fait
      if (!companyUsers[companyId]) {
        setLoadingUsers(prev => ({ ...prev, [companyId]: true }));
        try {
          const users = await companyService.getCompanyUsers(companyId);
          setCompanyUsers(prev => ({ ...prev, [companyId]: users }));
        } catch (err) {
          console.error('Erreur lors du chargement des utilisateurs:', err);
        } finally {
          setLoadingUsers(prev => ({ ...prev, [companyId]: false }));
        }
      }
    }

    setExpandedRows(newExpanded);
  };

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      lawyer: 'Avocat',
      client: 'Client',
      company_user: 'Utilisateur'
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Gestion des abonnements par Entreprise
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCompanies}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Barre de recherche et filtres */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher une entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250, flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Statut</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
            >
              {SUBSCRIPTION_STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchTerm || statusFilter !== 'all') && (
            <Typography variant="body2" color="text.secondary">
              {filteredAndSortedCompanies.length} résultat(s)
            </Typography>
          )}
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }} />
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Entreprise
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Statut abonnement
                  </TableSortLabel>
                </TableCell>
                <TableCell>Utilisateurs</TableCell>
                <TableCell>Usage ce mois</TableCell>
                <TableCell>Coût estimé</TableCell>
                <TableCell>Prochaine facture</TableCell>
                <TableCell>Alertes</TableCell>
                <TableCell>Historique</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCompanies.map((company) => {
                const stats = company.tokenStats;
                const usagePercentage = stats && stats.tokenLimit > 0
                  ? (stats.currentMonthTokens / stats.tokenLimit) * 100
                  : 0;
                const isExpanded = expandedRows.has(company.id);
                const users = companyUsers[company.id] || [];
                const isLoadingUsers = loadingUsers[company.id] || false;

                return (
                  <React.Fragment key={company.id}>
                    <TableRow
                      sx={{
                        '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell sx={{ width: 50 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(company.id)}
                        >
                          {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                        </IconButton>
                      </TableCell>

                      <TableCell onClick={() => handleToggleExpand(company.id)}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {company.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {company.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          {getSubscriptionStatusBadge(stats)}
                          <Typography variant="caption">
                            {formatTokens(company.monthly_token_limit || 0)} tokens/mois
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {stats?.userCount || 0}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2">
                              {formatTokens(stats?.currentMonthTokens || 0)}
                            </Typography>
                            <Typography variant="caption">
                              {usagePercentage.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(usagePercentage, 100)}
                            color={getUsageColor(usagePercentage)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            Restants: {formatTokens(stats?.remainingTokens || 0)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ minWidth: 100 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCost(stats?.currentMonthCost || 0)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {stats?.renewalDate
                              ? new Date(stats.renewalDate).toLocaleDateString('fr-FR')
                              : 'Non défini'}
                          </Typography>
                          {stats?.daysRemaining !== null && stats?.daysRemaining !== undefined && (
                            <Typography variant="caption" color="textSecondary">
                              Dans {stats.daysRemaining} jour{stats.daysRemaining > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {stats?.subscriptionStatus === 'past_due' && (
                            <Tooltip title="Paiement en retard">
                              <WarningIcon color="error" fontSize="small" />
                            </Tooltip>
                          )}
                          {stats?.cancelAtPeriodEnd && (
                            <Tooltip title={stats.cancelAt ? `Annulation prévue le ${new Date(stats.cancelAt).toLocaleDateString('fr-FR')}` : 'Annulation prévue'}>
                              <CancelIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                          {!stats?.subscriptionStatus || stats.subscriptionStatus === 'active' && !stats.cancelAtPeriodEnd ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : null}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Voir l'historique des tokens">
                          <IconButton
                            size="small"
                            onClick={() => handleShowHistory(company)}
                            color="info"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Modifier l'abonnement">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCompany(company)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Ligne expandable avec les utilisateurs */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon fontSize="small" />
                              Utilisateurs ({users.length})
                            </Typography>

                            {isLoadingUsers ? (
                              <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress size={24} />
                              </Box>
                            ) : users.length === 0 ? (
                              <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
                                Aucun utilisateur dans cette entreprise
                              </Typography>
                            ) : (
                              <Table size="small" sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Téléphone</TableCell>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Rôle</TableCell>
                                    <TableCell>Statut</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {users.map((user) => (
                                    <TableRow key={user.id}>
                                      <TableCell>{user.email}</TableCell>
                                      <TableCell>{user.phone || '-'}</TableCell>
                                      <TableCell>
                                        {user.firstName || user.lastName
                                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                          : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={getRoleLabel(user.role)}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={user.isActive !== false ? 'Actif' : 'Inactif'}
                                          size="small"
                                          color={user.isActive !== false ? 'success' : 'default'}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredAndSortedCompanies.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />

        {filteredAndSortedCompanies.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              {searchTerm || statusFilter !== 'all'
                ? 'Aucune entreprise ne correspond aux critères de recherche'
                : 'Aucune entreprise trouvée'}
            </Typography>
          </Box>
        )}

        {/* Dialog d'édition */}
        <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Modifier l'abonnement de {editingCompany?.name}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Limite mensuelle de tokens"
                type="number"
                fullWidth
                value={formData.monthlyTokenLimit || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  monthlyTokenLimit: parseInt(e.target.value) || 0
                }))}
                helperText="Nombre maximum de tokens que l'entreprise peut utiliser par mois"
              />

              <FormControl fullWidth>
                <InputLabel>Type d'abonnement</InputLabel>
                <Select
                  value={formData.subscriptionType || 'basic'}
                  label="Type d'abonnement"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    subscriptionType: e.target.value
                  }))}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} variant="contained">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog d'historique des tokens */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon />
              Historique des tokens - {selectedCompanyHistory?.name}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques actuelles
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Usage ce mois</strong></TableCell>
                      <TableCell align="right">
                        {formatTokens(selectedCompanyHistory?.tokenStats?.currentMonthTokens || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Limite mensuelle</strong></TableCell>
                      <TableCell align="right">
                        {formatTokens(selectedCompanyHistory?.tokenStats?.tokenLimit || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tokens restants</strong></TableCell>
                      <TableCell align="right">
                        {formatTokens(selectedCompanyHistory?.tokenStats?.remainingTokens || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Pourcentage d'utilisation</strong></TableCell>
                      <TableCell align="right">
                        {selectedCompanyHistory?.tokenStats?.tokenLimit && selectedCompanyHistory.tokenStats.tokenLimit > 0
                          ? ((selectedCompanyHistory.tokenStats.currentMonthTokens / selectedCompanyHistory.tokenStats.tokenLimit) * 100).toFixed(0)
                          : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Nombre d'utilisateurs</strong></TableCell>
                      <TableCell align="right">
                        {selectedCompanyHistory?.tokenStats?.userCount || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coût estimé ce mois</strong></TableCell>
                      <TableCell align="right">
                        {formatCost(selectedCompanyHistory?.tokenStats?.currentMonthCost || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Type d'abonnement</strong></TableCell>
                      <TableCell align="right">
                        {selectedCompanyHistory?.subscription_type || 'Aucun'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Statut abonnement</strong></TableCell>
                      <TableCell align="right">
                        {getSubscriptionStatusBadge(selectedCompanyHistory?.tokenStats)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Prochaine facture</strong></TableCell>
                      <TableCell align="right">
                        {selectedCompanyHistory?.tokenStats?.renewalDate
                          ? new Date(selectedCompanyHistory.tokenStats.renewalDate).toLocaleDateString('fr-FR')
                          : 'Non défini'}
                        {selectedCompanyHistory?.tokenStats?.daysRemaining !== null &&
                          selectedCompanyHistory?.tokenStats?.daysRemaining !== undefined && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Dans {selectedCompanyHistory.tokenStats.daysRemaining} jour{selectedCompanyHistory.tokenStats.daysRemaining > 1 ? 's' : ''}
                            </Typography>
                          )}
                      </TableCell>
                    </TableRow>
                    {selectedCompanyHistory?.tokenStats?.cancelAtPeriodEnd && (
                      <TableRow>
                        <TableCell><strong>Annulation prévue</strong></TableCell>
                        <TableCell align="right">
                          <Chip label="Oui" color="warning" size="small" icon={<CancelIcon />} />
                          {selectedCompanyHistory?.tokenStats?.cancelAt && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Le {new Date(selectedCompanyHistory.tokenStats.cancelAt).toLocaleDateString('fr-FR')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  📊 <strong>Note :</strong> Les statistiques affichées représentent l'usage agrégé de tous les utilisateurs de l'entreprise.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setHistoryDialogOpen(false);
              setSelectedCompanyHistory(null);
            }}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CompanyTokenManagement;
