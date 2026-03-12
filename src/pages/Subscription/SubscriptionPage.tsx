import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    Stack,
    alpha,
    useTheme,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Container,
} from '@mui/material';
import {
    CreditCard as CreditCardIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Receipt as ReceiptIcon,
    Rocket as RocketIcon,
    Token as TokenIcon,
    TrendingUp as TrendingUpIcon,
    EventBusy as EventBusyIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { subscriptionService, SubscriptionStatus } from '../../services/subscriptionService';
import { tokenUsageService, TokenUsageStats } from '../../services/tokenUsageService';
import { companyService, SubscriptionSeats } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';
import { LAYOUT } from '../../theme/constants';

export const SubscriptionPage: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [tokenStats, setTokenStats] = useState<TokenUsageStats | null>(null);
    const [seatInfo, setSeatInfo] = useState<SubscriptionSeats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const companyId = user?.company_id || user?.companyId;

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setSuccessMessage('Votre abonnement a été activé avec succès !');
        } else if (searchParams.get('canceled') === 'true') {
            setError('Le paiement a été annulé.');
        }

        loadData();
    }, [searchParams]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subData, tokData, seatData] = await Promise.all([
                subscriptionService.getSubscriptionStatus(),
                tokenUsageService.getUserTokenStats().catch(() => null),
                companyId ? companyService.getSubscriptionSeats(companyId).catch(() => null) : Promise.resolve(null),
            ]);
            setSubscriptionStatus(subData);
            setTokenStats(tokData);
            setSeatInfo(seatData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        try {
            setActionLoading(true);
            setError(null);
            await subscriptionService.redirectToCheckout();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création de la session de paiement');
            setActionLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setActionLoading(true);
            setError(null);
            await subscriptionService.redirectToPortal();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'accès au portail client');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = () => {
        if (!subscriptionStatus) return { label: 'Inconnu', color: 'default' as const, icon: <WarningIcon /> };

        // Check if subscription is scheduled for cancellation
        // Also check cancelAt as fallback (in case cancelAtPeriodEnd wasn't correctly set)
        if (subscriptionStatus.cancelAtPeriodEnd || subscriptionStatus.cancelAt) {
            return { label: 'Annulation programmée', color: 'warning' as const, icon: <EventBusyIcon /> };
        }

        switch (subscriptionStatus.status) {
            case 'trialing':
                return { label: "Période d'essai", color: 'info' as const, icon: <AccessTimeIcon /> };
            case 'active':
                return { label: 'Actif', color: 'success' as const, icon: <CheckCircleIcon /> };
            case 'past_due':
                return { label: 'Paiement en retard', color: 'warning' as const, icon: <WarningIcon /> };
            case 'pending_payment':
                return { label: 'En attente de paiement', color: 'warning' as const, icon: <AccessTimeIcon /> };
            default:
                return { label: 'Expiré', color: 'error' as const, icon: <WarningIcon /> };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const statusConfig = getStatusConfig();
    const usagePercentage = tokenStats
        ? tokenUsageService.calculateUsagePercentage(tokenStats.currentMonthTokens, tokenStats.tokenLimit)
        : 0;
    const usageColor = tokenUsageService.getUsageColor(usagePercentage);

    if (loading) {
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
                    <Box sx={{ width: LAYOUT.NAV_WIDTH, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                    </Box>
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
                        p: { xs: 2, sm: 3 },
                    }}
                >
                    <Container maxWidth="lg">
                        {/* Header */}
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            Abonnement & Consommation
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Gérez votre abonnement et suivez votre utilisation des tokens.
                        </Typography>

                        {/* Alerts */}
                        {successMessage && (
                            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                                {successMessage}
                            </Alert>
                        )}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {/* Section 1: Statut de l'abonnement - Compact header */}
                        <Card
                            sx={{
                                mb: 4,
                                background: theme.palette.mode === 'dark'
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    spacing={2}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                background: alpha(theme.palette.primary.main, 0.1),
                                                display: 'flex',
                                            }}
                                        >
                                            <CreditCardIcon color="primary" sx={{ fontSize: 28 }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Statut de l'abonnement
                                            </Typography>
                                            <Chip
                                                icon={statusConfig.icon}
                                                label={statusConfig.label}
                                                color={statusConfig.color}
                                                size="small"
                                                sx={{ fontWeight: 600, mt: 0.5 }}
                                            />
                                        </Box>
                                    </Stack>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                        {subscriptionStatus?.status === 'expired' || subscriptionStatus?.status === 'canceled' || subscriptionStatus?.status === 'pending_payment' ? (
                                            <Button
                                                variant="contained"
                                                startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <RocketIcon />}
                                                onClick={handleSubscribe}
                                                disabled={actionLoading}
                                                size="small"
                                            >
                                                S'abonner
                                            </Button>
                                        ) : subscriptionStatus?.status === 'past_due' ? (
                                            <Button
                                                variant="contained"
                                                color="warning"
                                                startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CreditCardIcon />}
                                                onClick={handleManageSubscription}
                                                disabled={actionLoading}
                                                size="small"
                                            >
                                                Mettre à jour le paiement
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                startIcon={actionLoading ? <CircularProgress size={18} /> : <ReceiptIcon />}
                                                onClick={handleManageSubscription}
                                                disabled={actionLoading}
                                                size="small"
                                            >
                                                Gérer mon abonnement
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>

                                {/* Warning for subscription scheduled for cancellation */}
                                {subscriptionStatus?.cancelAt && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Votre abonnement a été annulé et se terminera le{' '}
                                        <strong>{formatDate(subscriptionStatus.cancelAt)}</strong>.
                                        Vous pouvez réactiver votre abonnement depuis le portail client.
                                    </Alert>
                                )}

                                {/* Warning for past_due with grace period */}
                                {subscriptionStatus?.status === 'past_due' && subscriptionStatus?.canAccess && subscriptionStatus?.graceRemainingDays && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Votre paiement a échoué. Veuillez mettre à jour vos informations de paiement dans les{' '}
                                        <strong>{subscriptionStatus.graceRemainingDays} jour{subscriptionStatus.graceRemainingDays > 1 ? 's' : ''}</strong>{' '}
                                        restants pour éviter la suspension de votre accès.
                                    </Alert>
                                )}

                                {/* Warning for past_due with expired grace period */}
                                {subscriptionStatus?.status === 'past_due' && !subscriptionStatus?.canAccess && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        Votre paiement a échoué et la période de grâce est expirée. Veuillez mettre à jour vos informations de paiement pour rétablir votre accès.
                                    </Alert>
                                )}

                                {/* Warning for expired subscription (trial or other) */}
                                {!subscriptionStatus?.canAccess && !subscriptionStatus?.cancelAt && subscriptionStatus?.status !== 'past_due' && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Votre période d'essai a expiré. Souscrivez à un abonnement pour continuer à utiliser l'application.
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section 2: Two columns - Token Usage + Subscription Details */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                gap: 3,
                                mb: 4,
                            }}
                        >
                            {/* Token Usage Card */}
                            <Card variant="outlined">
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                        <TokenIcon color="primary" />
                                        <Typography variant="h6" fontWeight={600}>
                                            Consommation des tokens
                                        </Typography>
                                    </Stack>

                                    {tokenStats ? (
                                        <>
                                            <Box sx={{ mb: 3 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Ce mois
                                                    </Typography>
                                                    <Chip
                                                        label={`${usagePercentage}%`}
                                                        color={usageColor}
                                                        size="small"
                                                    />
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min(usagePercentage, 100)}
                                                    color={usageColor}
                                                    sx={{ height: 10, borderRadius: 5, mb: 1 }}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {tokenUsageService.formatTokens(tokenStats.currentMonthTokens)} / {tokenUsageService.formatTokens(tokenStats.tokenLimit)} tokens
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ my: 2 }} />

                                            <Stack spacing={1.5}>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">Tokens restants</Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {tokenUsageService.formatTokens(tokenStats.remainingTokens)}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">Type d'abonnement</Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {tokenStats.subscriptionType}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            {usagePercentage > 90 && tokenStats.remainingTokens > 0 && (
                                                <Alert severity="warning" sx={{ mt: 2 }}>
                                                    Vous approchez de votre limite mensuelle.
                                                </Alert>
                                            )}
                                            {tokenStats.remainingTokens <= 0 && (
                                                <Alert severity="error" sx={{ mt: 2 }}>
                                                    Limite atteinte ! Renouvellement automatique à la prochaine période.
                                                </Alert>
                                            )}
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Aucune donnée de consommation disponible.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Subscription Details Card */}
                            <Card variant="outlined">
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                        <CreditCardIcon color="primary" />
                                        <Typography variant="h6" fontWeight={600}>
                                            Détails de l'abonnement
                                        </Typography>
                                    </Stack>

                                    <Stack spacing={2}>
                                        {/* Informations de facturation par siège */}
                                        {seatInfo && (
                                            <>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 1,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                                    }}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                                        <PeopleIcon fontSize="small" color="primary" />
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            Facturation par siège
                                                        </Typography>
                                                    </Stack>
                                                    <Stack spacing={1}>
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="body2" color="text.secondary">
                                                                Utilisateurs actifs
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {seatInfo.currentSeats} siège{seatInfo.currentSeats > 1 ? 's' : ''}
                                                            </Typography>
                                                        </Stack>
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="body2" color="text.secondary">
                                                                Prix par siège
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {seatInfo.pricePerSeat.toFixed(2)}€ HT/mois
                                                            </Typography>
                                                        </Stack>
                                                        <Divider sx={{ my: 0.5 }} />
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="body2" fontWeight={600}>
                                                                Total mensuel
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight={700} color="primary">
                                                                {seatInfo.monthlyTotal.toFixed(2)}€ HT
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    L'ajout ou la suppression d'utilisateurs ajuste automatiquement votre facturation au prorata.
                                                </Typography>
                                            </>
                                        )}

                                        {subscriptionStatus?.status === 'trialing' && subscriptionStatus.trialEndsAt && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Fin de la période d'essai
                                                </Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {formatDate(subscriptionStatus.trialEndsAt)}
                                                </Typography>
                                                {subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining > 0 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {subscriptionStatus.daysRemaining} jour{subscriptionStatus.daysRemaining > 1 ? 's' : ''} restant{subscriptionStatus.daysRemaining > 1 ? 's' : ''}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {subscriptionStatus?.status === 'active' && subscriptionStatus.currentPeriodEnd && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Prochaine facturation
                                                </Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {formatDate(subscriptionStatus.currentPeriodEnd)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {tokenStats?.renewalDate && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Renouvellement des tokens
                                                </Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {tokenUsageService.formatRenewalDate(tokenStats.renewalDate)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {tokenStats?.subscriptionStartDate && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Date de début
                                                </Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {new Date(tokenStats.subscriptionStartDate).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Section 3: Monthly History */}
                        {tokenStats?.monthlyHistory && tokenStats.monthlyHistory.length > 0 && (
                            <Card variant="outlined" sx={{ mb: 4 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                        <TrendingUpIcon color="primary" />
                                        <Typography variant="h6" fontWeight={600}>
                                            Historique de consommation
                                        </Typography>
                                    </Stack>

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
                                                {tokenStats.monthlyHistory.map((month) => (
                                                    <TableRow key={month.month_year}>
                                                        <TableCell>
                                                            {new Date(month.month_year).toLocaleDateString('fr-FR', {
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {tokenUsageService.formatTokens(month.tokens_used)}
                                                        </TableCell>
                                                        <TableCell align="right">{month.message_count}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Section 4: Info Box */}
                        <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    À propos
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    L'abonnement vous donne accès à l'assistant IA, la gestion documentaire et les demandes de review.
                                    Les tokens sont renouvelés chaque mois. Gérez votre abonnement et consultez vos factures via le portail client.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
};

export default SubscriptionPage;
