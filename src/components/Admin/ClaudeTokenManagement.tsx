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
  LinearProgress,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Collapse,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
  TextField,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ExpandLessIcon,
  Psychology as ClaudeIcon,
  Business as BusinessIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { tokenUsageService, ClaudeCompanyStats, ClaudeTotalStats } from '../../services/tokenUsageService';

// Helper pour formater les tokens
const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

// Helper pour formater le coût
const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
};

// Helper pour obtenir la couleur du modèle (pour Chip)
const getModelChipColor = (model: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default' => {
  if (model.includes('opus')) return 'secondary';
  if (model.includes('sonnet')) return 'primary';
  if (model.includes('haiku')) return 'success';
  return 'default';
};

// Helper pour obtenir la couleur du modèle (pour LinearProgress)
const getModelProgressColor = (model: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'inherit' => {
  if (model.includes('opus')) return 'secondary';
  if (model.includes('sonnet')) return 'primary';
  if (model.includes('haiku')) return 'success';
  return 'inherit';
};

// Helper pour formater le nom du modèle
const formatModelName = (model: string): string => {
  // claude-sonnet-4-6 -> Claude Sonnet 4.6
  const parts = model.replace('claude-', '').split('-');
  if (parts.length >= 2) {
    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const version = parts.slice(1).join('.');
    return `Claude ${name} ${version}`;
  }
  return model;
};

type SortField = 'companyName' | 'totalTokens' | 'estimatedCost';
type FilterType = 'all' | 'internal' | 'external';

// Composant pour afficher une carte de stats
const StatsCard: React.FC<{
  title: string;
  stats: ClaudeTotalStats | null;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  subtitle?: string;
}> = ({ title, stats, icon, color, subtitle }) => {
  const theme = useTheme();

  if (!stats) return null;

  return (
    <Card sx={{
      flex: 1,
      background: alpha(theme.palette[color].main, 0.05),
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
    }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {icon}
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={3} mt={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">Tokens</Typography>
            <Typography variant="h6" color={`${color}.main`}>
              {formatTokens(stats.totalTokens)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Coût</Typography>
            <Typography variant="h6" color={`${color}.main`}>
              {formatCost(stats.estimatedCost)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Helper pour obtenir les dates par défaut (mois en cours)
const getDefaultDates = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
};

const ClaudeTokenManagement: React.FC = () => {
  const theme = useTheme();
  const [companies, setCompanies] = useState<ClaudeCompanyStats[]>([]);
  const [totalStats, setTotalStats] = useState<ClaudeTotalStats | null>(null);
  const [internalStats, setInternalStats] = useState<ClaudeTotalStats | null>(null);
  const [externalStats, setExternalStats] = useState<ClaudeTotalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre par dates
  const [startDate, setStartDate] = useState<string>(() => getDefaultDates().start);
  const [endDate, setEndDate] = useState<string>(() => getDefaultDates().end);

  // Filtre interne/externe
  const [filter, setFilter] = useState<FilterType>('all');

  // Tri
  const [sortBy, setSortBy] = useState<SortField>('totalTokens');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Expansion des lignes pour afficher le détail par modèle
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadClaudeStats();
  }, []);

  const loadClaudeStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await tokenUsageService.getClaudeTokenStats(startDate, endDate);
      setCompanies(stats.companies);
      setTotalStats(stats.totalStats);
      setInternalStats(stats.internalStats);
      setExternalStats(stats.externalStats);
    } catch (err) {
      console.error('Erreur lors du chargement des stats Claude:', err);
      setError('Impossible de charger les statistiques Claude');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleRow = (companyId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedRows(newExpanded);
  };

  // Filtrage et tri des companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies;

    // Appliquer le filtre
    if (filter === 'internal') {
      filtered = companies.filter(c => c.isInternal);
    } else if (filter === 'external') {
      filtered = companies.filter(c => !c.isInternal);
    }

    // Appliquer le tri
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'companyName':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case 'totalTokens':
          comparison = a.totalTokens - b.totalTokens;
          break;
        case 'estimatedCost':
          comparison = a.estimatedCost - b.estimatedCost;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [companies, filter, sortBy, sortOrder]);

  // Compter les companies par type
  const internalCount = companies.filter(c => c.isInternal).length;
  const externalCount = companies.filter(c => !c.isInternal).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Formater les dates pour affichage
  const formatDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ClaudeIcon color="primary" />
          <Typography variant="h5">
            Usage tokens Claude
          </Typography>
        </Stack>
        <Tooltip title="Actualiser">
          <IconButton onClick={loadClaudeStats} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Sélection de période */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Date de début"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Date de fin"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          sx={{ minWidth: 160 }}
        />
        <Button
          variant="contained"
          onClick={loadClaudeStats}
          disabled={loading}
        >
          Appliquer
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          Période : {formatDateRange()}
        </Typography>
      </Box>

      {/* Cartes de stats : Total, Interne, Externe */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <StatsCard
          title="Total"
          subtitle="Toutes companies"
          stats={totalStats}
          icon={<ClaudeIcon color="primary" />}
          color="primary"
        />
        <StatsCard
          title="Interne (Dairia)"
          subtitle="Clé ANTHROPIC_DAIRIA_API_KEY"
          stats={internalStats}
          icon={<BusinessIcon color="warning" />}
          color="warning"
        />
        <StatsCard
          title="Clients externes"
          subtitle="Clé ANTHROPIC_API_KEY"
          stats={externalStats}
          icon={<PeopleIcon color="success" />}
          color="success"
        />
      </Stack>

      {/* Filtre */}
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Typography variant="body2" color="text.secondary">
          Filtrer :
        </Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
          size="small"
        >
          <ToggleButton value="all">
            Tous ({companies.length})
          </ToggleButton>
          <ToggleButton value="internal">
            Internes ({internalCount})
          </ToggleButton>
          <ToggleButton value="external">
            Externes ({externalCount})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table des companies */}
      {filteredAndSortedCompanies.length === 0 ? (
        <Alert severity="info">
          {filter === 'all'
            ? 'Aucune utilisation Claude ce mois-ci'
            : `Aucune utilisation Claude pour les companies ${filter === 'internal' ? 'internes' : 'externes'} ce mois-ci`}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'companyName'}
                    direction={sortBy === 'companyName' ? sortOrder : 'asc'}
                    onClick={() => handleSort('companyName')}
                  >
                    Company
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'totalTokens'}
                    direction={sortBy === 'totalTokens' ? sortOrder : 'asc'}
                    onClick={() => handleSort('totalTokens')}
                  >
                    Tokens totaux
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Input</TableCell>
                <TableCell align="right">Output</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'estimatedCost'}
                    direction={sortBy === 'estimatedCost' ? sortOrder : 'asc'}
                    onClick={() => handleSort('estimatedCost')}
                  >
                    Coût estimé
                  </TableSortLabel>
                </TableCell>
                <TableCell>Modèles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedCompanies.map((company) => (
                <React.Fragment key={company.companyId}>
                  <TableRow
                    hover
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: company.isInternal
                        ? alpha(theme.palette.warning.main, 0.05)
                        : 'inherit'
                    }}
                    onClick={() => toggleRow(company.companyId)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedRows.has(company.companyId) ? (
                          <ExpandMoreIcon />
                        ) : (
                          <ExpandLessIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {company.companyName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={company.isInternal ? 'Interne' : 'Externe'}
                        size="small"
                        color={company.isInternal ? 'warning' : 'success'}
                        variant="outlined"
                        icon={company.isInternal ? <BusinessIcon /> : <PeopleIcon />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        {formatTokens(company.totalTokens)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(company.inputTokens)}
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(company.outputTokens)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="primary" fontWeight="medium">
                        {formatCost(company.estimatedCost)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {Object.keys(company.byModel).map((model) => (
                          <Chip
                            key={model}
                            label={formatModelName(model)}
                            size="small"
                            color={getModelChipColor(model)}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {/* Ligne de détail par modèle */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0, borderBottom: 0 }}>
                      <Collapse in={expandedRows.has(company.companyId)} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 8, pr: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Détail par modèle
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Modèle</TableCell>
                                <TableCell align="right">Tokens totaux</TableCell>
                                <TableCell align="right">Input</TableCell>
                                <TableCell align="right">Output</TableCell>
                                <TableCell align="right">Coût</TableCell>
                                <TableCell>Répartition</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(company.byModel).map(([model, stats]) => {
                                const percentage = company.totalTokens > 0
                                  ? (stats.totalTokens / company.totalTokens) * 100
                                  : 0;
                                return (
                                  <TableRow key={model}>
                                    <TableCell>
                                      <Chip
                                        label={formatModelName(model)}
                                        size="small"
                                        color={getModelChipColor(model)}
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatTokens(stats.totalTokens)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatTokens(stats.inputTokens)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatTokens(stats.outputTokens)}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatCost(stats.estimatedCost)}
                                    </TableCell>
                                    <TableCell width={200}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                          <LinearProgress
                                            variant="determinate"
                                            value={percentage}
                                            color={getModelProgressColor(model)}
                                          />
                                        </Box>
                                        <Box sx={{ minWidth: 35 }}>
                                          <Typography variant="body2" color="text.secondary">
                                            {percentage.toFixed(0)}%
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ClaudeTokenManagement;
