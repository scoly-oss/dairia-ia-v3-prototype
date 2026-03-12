import React, { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { tokenUsageService, UserWithTokenStats, UpdateSubscriptionRequest } from '../../services/tokenUsageService';

const UserTokenManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithTokenStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithTokenStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateSubscriptionRequest>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<UserWithTokenStats | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tokenUsageService.getAllUsersTokenStats();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les statistiques des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithTokenStats) => {
    setEditingUser(user);
    setFormData({
      monthlyTokenLimit: user.monthly_token_limit || 0,
      subscriptionStartDate: user.subscription_start_date || '',
      subscriptionType: user.subscription_type || 'basic'
    });
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      await tokenUsageService.updateUserSubscription(editingUser.id, formData);
      await loadUsers(); // Recharger les données
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Impossible de mettre à jour la souscription');
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

  const handleShowHistory = (user: UserWithTokenStats) => {
    setSelectedUserHistory(user);
    setHistoryDialogOpen(true);
  };

  const getStatusIcon = (user: UserWithTokenStats) => {
    if (user.usagePercentage >= 100) {
      return <WarningIcon color="error" />;
    } else if (user.usagePercentage >= 90) {
      return <WarningIcon color="warning" />;
    }
    return <CheckCircleIcon color="success" />;
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
            Gestion des Tokens Clients
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
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

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Souscription</TableCell>
                <TableCell>Usage ce mois</TableCell>
                <TableCell>Coût estimé</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Renouvellement</TableCell>
                <TableCell>Historique</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip 
                        label={user.subscription_type || 'Aucun'}
                        size="small"
                        color={user.subscription_type === 'premium' ? 'primary' : 'default'}
                      />
                      <Typography variant="caption">
                        {formatTokens(user.monthly_token_limit || 0)} tokens/mois
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2">
                          {formatTokens(user.currentMonthTokens)}
                        </Typography>
                        <Typography variant="caption">
                          {user.usagePercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(user.usagePercentage, 100)}
                        color={getUsageColor(user.usagePercentage)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        Restants: {formatTokens(user.remainingTokens)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Ce mois: {tokenUsageService.calculateEstimatedCost(user.currentMonthTokens).toFixed(3)} €
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total estimé: {tokenUsageService.calculateCumulativeCost(user.currentMonthTokens, user.subscription_start_date).toFixed(2)} €
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(user)}
                      {user.is_active ? (
                        <Chip label="Actif" color="success" size="small" />
                      ) : (
                        <Chip label="Inactif" color="error" size="small" />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {user.renewalDate 
                        ? new Date(user.renewalDate).toLocaleDateString('fr-FR')
                        : 'Non défini'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Voir l'historique des tokens">
                      <IconButton 
                        size="small" 
                        onClick={() => handleShowHistory(user)}
                        color="info"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Modifier la souscription">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditUser(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              Aucun client trouvé
            </Typography>
          </Box>
        )}

        {/* Dialog d'édition */}
        <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Modifier la souscription de {editingUser?.first_name && editingUser?.last_name 
              ? `${editingUser.first_name} ${editingUser.last_name}`
              : editingUser?.email}
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
                helperText="Nombre maximum de tokens que le client peut utiliser par mois"
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

              <TextField
                label="Date de début de souscription"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.subscriptionStartDate || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  subscriptionStartDate: e.target.value
                }))}
                helperText="Date à partir de laquelle commence le cycle de facturation mensuel"
              />
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
              Historique des tokens - {selectedUserHistory?.first_name && selectedUserHistory?.last_name 
                ? `${selectedUserHistory.first_name} ${selectedUserHistory.last_name}`
                : selectedUserHistory?.email}
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
                        {formatTokens(selectedUserHistory?.currentMonthTokens || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Limite mensuelle</strong></TableCell>
                      <TableCell align="right">
                        {formatTokens(selectedUserHistory?.monthly_token_limit || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tokens restants</strong></TableCell>
                      <TableCell align="right">
                        {formatTokens(selectedUserHistory?.remainingTokens || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Pourcentage d'utilisation</strong></TableCell>
                      <TableCell align="right">
                        {selectedUserHistory?.usagePercentage || 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coût estimé ce mois</strong></TableCell>
                      <TableCell align="right">
                        {tokenUsageService.calculateEstimatedCost(selectedUserHistory?.currentMonthTokens || 0).toFixed(3)} €
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Coût cumulé estimé</strong></TableCell>
                      <TableCell align="right">
                        {tokenUsageService.calculateCumulativeCost(
                          selectedUserHistory?.currentMonthTokens || 0, 
                          selectedUserHistory?.subscription_start_date
                        ).toFixed(2)} €
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Type d'abonnement</strong></TableCell>
                      <TableCell align="right">
                        {selectedUserHistory?.subscription_type || 'Aucun'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Date de renouvellement</strong></TableCell>
                      <TableCell align="right">
                        {selectedUserHistory?.renewalDate 
                          ? new Date(selectedUserHistory.renewalDate).toLocaleDateString('fr-FR')
                          : 'Non défini'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  📊 <strong>Note :</strong> L'historique mensuel détaillé n'est actuellement disponible que dans le profil utilisateur. 
                  Cette vue admin affiche les statistiques du mois en cours.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setHistoryDialogOpen(false);
              setSelectedUserHistory(null);
            }}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserTokenManagement;