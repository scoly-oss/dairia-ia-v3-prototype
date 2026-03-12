import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Token as TokenIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { tokenUsageService, TokenUsageStats } from '../services/tokenUsageService';

interface TokenUsageStatsProps {
  className?: string;
}

const TokenUsageStatsComponent: React.FC<TokenUsageStatsProps> = ({ className }) => {
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tokenUsageService.getUserTokenStats();
      setStats(data);
    } catch (err) {
      console.error('[TokenUsageStats] Erreur lors du chargement des statistiques:', err);
      if (err instanceof Error && err.message.includes('Not authenticated')) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
      } else {
        setError('Impossible de charger les statistiques d\'utilisation');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
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

  if (!stats) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Aucune donnée d'utilisation disponible
      </Alert>
    );
  }

  const usagePercentage = tokenUsageService.calculateUsagePercentage(
    stats.currentMonthTokens,
    stats.tokenLimit
  );
  const usageColor = tokenUsageService.getUsageColor(usagePercentage);
  const daysUntilRenewal = tokenUsageService.getDaysUntilRenewal(stats.renewalDate);

  return (
    <Box className={className}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TokenIcon />
        Utilisation des Tokens
      </Typography>

      <Grid container spacing={3}>
        {/* Carte principale d'utilisation */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consommation ce mois
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    {tokenUsageService.formatTokens(stats.currentMonthTokens)} / {tokenUsageService.formatTokens(stats.tokenLimit)} tokens
                  </Typography>
                  <Chip 
                    label={`${usagePercentage}%`}
                    color={usageColor}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(usagePercentage, 100)}
                  color={usageColor}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {stats.tokenLimit > 0 && (
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Typography variant="body2">
                    <strong>Restants:</strong> {tokenUsageService.formatTokens(stats.remainingTokens)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {stats.subscriptionType}
                  </Typography>
                </Box>
              )}

              {usagePercentage > 90 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Attention ! Vous approchez de votre limite mensuelle.
                </Alert>
              )}

              {stats.remainingTokens <= 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Limite atteinte ! Vous ne pouvez plus utiliser l'IA ce mois.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Informations de souscription */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon />
                Souscription
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Renouvellement"
                    secondary={
                      <>
                        {tokenUsageService.formatRenewalDate(stats.renewalDate)}
                        {daysUntilRenewal > 0 && (
                          <Typography variant="caption" display="block">
                            Dans {daysUntilRenewal} jour{daysUntilRenewal > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AssessmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Type d'abonnement"
                    secondary={stats.subscriptionType}
                  />
                </ListItem>

                {stats.subscriptionStartDate && (
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Date de début"
                      secondary={new Date(stats.subscriptionStartDate).toLocaleDateString('fr-FR')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Historique mensuel */}
        {stats.monthlyHistory && stats.monthlyHistory.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon />
                  Historique mensuel
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mois</TableCell>
                        <TableCell align="right">Tokens utilisés</TableCell>
                        <TableCell align="right">Messages</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.monthlyHistory.map((month) => (
                        <TableRow key={month.month_year}>
                          <TableCell>
                            {new Date(month.month_year).toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell align="right">
                            {tokenUsageService.formatTokens(month.tokens_used)}
                          </TableCell>
                          <TableCell align="right">
                            {month.message_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TokenUsageStatsComponent;