import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  NotificationsNone as AlertIcon,
  FolderOpen as FolderIcon,
  ArrowForward as ArrowIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingIcon,
  Chat as ChatIcon,
  Gavel as GavelIcon,
  MoreHoriz as MoreIcon,
  Circle as DotIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DSCard } from '../../components/design-system/DSCard';
import { alertService } from '../../services/alertService';
import { dossierService } from '../../services/dossierService';
import { Alert } from '../../types/alert';
import { Dossier } from '../../types/dossier';
import {
  MOCK_COMPLIANCE,
  MOCK_DEADLINES,
  calculateHealthScore,
  ComplianceItem,
  Deadline,
} from '../../data/mockData';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.08)',
  warning: 'rgba(245, 158, 11, 0.08)',
  info: 'rgba(59, 130, 246, 0.08)',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  pending_review: 'En attente',
  closed: 'Clôturé',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#22c55e',
  in_progress: '#3b82f6',
  pending_review: '#f59e0b',
  closed: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  normal: '#64748b',
  high: '#e8842c',
  urgent: '#ef4444',
};

const DEADLINE_TYPE_COLORS: Record<string, string> = {
  legal: '#8b5cf6',
  dossier: '#3b82f6',
  ccn: '#e8842c',
  internal: '#64748b',
};

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  legal: 'Légal',
  dossier: 'Dossier',
  ccn: 'CCN',
  internal: 'Interne',
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const company = user?.company;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const compliance = MOCK_COMPLIANCE;
  const deadlines = MOCK_DEADLINES;
  const healthScore = calculateHealthScore(compliance);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsData, dossiersData] = await Promise.all([
          alertService.getAlerts({ limit: 7 }).catch(() => []),
          dossierService.getDossiers().catch(() => []),
        ]);
        setAlerts(alertsData);
        setDossiers(dossiersData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const activeDossiers = dossiers.filter(d => d.status !== 'closed');
  const urgentDossiers = dossiers.filter(d => d.priority === 'urgent' || d.priority === 'high');
  const criticalCompliance = compliance.filter(c => c.status === 'critical').length;
  const warningCompliance = compliance.filter(c => c.status === 'warning').length;
  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Bonjour {user?.firstName} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {company?.name} &middot; {company?.effectif} salariés &middot; {company?.convention_collective || `IDCC ${company?.default_idcc}`}
        </Typography>
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Health Score */}
        <DSCard noHover sx={{ p: 2.5, position: 'relative', overflow: 'visible' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: `${getHealthColor(healthScore)}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldIcon sx={{ color: getHealthColor(healthScore), fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Santé sociale
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: getHealthColor(healthScore), lineHeight: 1 }}>
                {healthScore}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={healthScore}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: getHealthColor(healthScore),
                },
              }}
            />
          </Box>
        </DSCard>

        {/* Active Dossiers */}
        <DSCard noHover sx={{ p: 2.5, cursor: 'pointer' }} onClick={() => navigate('/dossiers')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderIcon sx={{ color: '#3b82f6', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Dossiers actifs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {activeDossiers.length}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {urgentDossiers.length > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{urgentDossiers.length} urgent{urgentDossiers.length > 1 ? 's' : ''}</span>
            )}
            {urgentDossiers.length > 0 && ' · '}{dossiers.filter(d => d.status === 'in_progress').length} en cours
          </Typography>
        </DSCard>

        {/* Alerts */}
        <DSCard noHover sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: unreadAlerts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Badge badgeContent={unreadAlerts.length} color="error" max={9}>
                <AlertIcon sx={{ color: unreadAlerts.length > 0 ? '#ef4444' : '#22c55e', fontSize: 26 }} />
              </Badge>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Alertes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, color: unreadAlerts.length > 0 ? '#ef4444' : 'text.primary' }}>
                {unreadAlerts.length}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {alerts.filter(a => a.severity === 'critical' && !a.is_read).length > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{alerts.filter(a => a.severity === 'critical' && !a.is_read).length} critique{alerts.filter(a => a.severity === 'critical' && !a.is_read).length > 1 ? 's' : ''}</span>
            )}
          </Typography>
        </DSCard>

        {/* Compliance Issues */}
        <DSCard noHover sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: criticalCompliance > 0 ? 'rgba(239, 68, 68, 0.1)' : warningCompliance > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {criticalCompliance > 0 ? (
                <ErrorIcon sx={{ color: '#ef4444', fontSize: 26 }} />
              ) : warningCompliance > 0 ? (
                <WarningIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
              ) : (
                <CheckIcon sx={{ color: '#22c55e', fontSize: 26 }} />
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Points de conformité
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, color: criticalCompliance > 0 ? '#ef4444' : warningCompliance > 0 ? '#f59e0b' : '#22c55e' }}>
                {criticalCompliance + warningCompliance}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {criticalCompliance > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{criticalCompliance} critique{criticalCompliance > 1 ? 's' : ''}</span>}
            {criticalCompliance > 0 && warningCompliance > 0 && ' · '}
            {warningCompliance > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{warningCompliance} avertissement{warningCompliance > 1 ? 's' : ''}</span>}
          </Typography>
        </DSCard>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>

        {/* === LEFT COLUMN === */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Alerts Feed */}
          <DSCard noHover sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Veille juridique
                </Typography>
                {unreadAlerts.length > 0 && (
                  <Chip label={unreadAlerts.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#ef4444', color: '#fff' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ px: 1.5, pb: 2 }}>
              {alerts.slice(0, 5).map((alert, i) => (
                <Box
                  key={alert.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 1.5,
                    mx: 0.5,
                    borderRadius: 2,
                    bgcolor: !alert.is_read ? SEVERITY_BG[alert.severity] : 'transparent',
                    borderLeft: '3px solid',
                    borderLeftColor: SEVERITY_COLORS[alert.severity] || '#94a3b8',
                    mb: i < 4 ? 1 : 0,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: !alert.is_read ? 700 : 500, mb: 0.25, lineHeight: 1.3 }}>
                      {alert.title}
                    </Typography>
                    {alert.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {alert.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                      {alert.source && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                          {alert.source}
                        </Typography>
                      )}
                      {alert.due_date && (
                        <Chip
                          label={`Échéance : ${new Date(alert.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </DSCard>

          {/* Compliance Checklist */}
          <DSCard noHover sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ShieldIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Conformité sociale
              </Typography>
              <Chip
                label={`${healthScore}%`}
                size="small"
                sx={{
                  ml: 'auto',
                  fontWeight: 700,
                  bgcolor: `${getHealthColor(healthScore)}15`,
                  color: getHealthColor(healthScore),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {compliance.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    px: 1,
                    borderRadius: 1.5,
                    ...(item.status !== 'ok' && {
                      bgcolor: item.status === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                    }),
                  }}
                >
                  {item.status === 'ok' ? (
                    <CheckIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                  ) : item.status === 'warning' ? (
                    <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                  ) : (
                    <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                  )}
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: item.status !== 'ok' ? 600 : 400, fontSize: '0.8rem' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {item.detail}
                  </Typography>
                  {item.action && (
                    <Chip
                      label={item.action}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, borderColor: item.status === 'critical' ? '#ef4444' : '#f59e0b', color: item.status === 'critical' ? '#ef4444' : '#f59e0b' }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </DSCard>
        </Box>

        {/* === RIGHT COLUMN === */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Active Dossiers */}
          <DSCard noHover sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Dossiers actifs
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/dossiers')}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Voir tout
              </Button>
            </Box>
            <Box sx={{ px: 1.5, pb: 2 }}>
              {activeDossiers.slice(0, 5).map((d, i) => (
                <Box
                  key={d.id}
                  onClick={() => navigate(`/dossiers/${d.id}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    mx: 0.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    mb: i < activeDossiers.length - 1 ? 0.5 : 0,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)', transform: 'translateX(2px)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: '100%',
                      minHeight: 40,
                      borderRadius: 2,
                      bgcolor: PRIORITY_COLORS[d.priority],
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, lineHeight: 1.3 }}>
                      {d.title}
                    </Typography>
                    {d.metadata?.next_action && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        → {d.metadata.next_action as string}
                      </Typography>
                    )}
                    {d.metadata?.next_deadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <CalendarIcon sx={{ fontSize: 12, color: daysUntil(d.metadata.next_deadline as string) <= 7 ? '#ef4444' : 'text.disabled' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: daysUntil(d.metadata.next_deadline as string) <= 7 ? '#ef4444' : 'text.disabled',
                          }}
                        >
                          {new Date(d.metadata.next_deadline as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {' '}({daysUntil(d.metadata.next_deadline as string)}j)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip
                      label={STATUS_LABELS[d.status]}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: `${STATUS_COLORS[d.status]}15`,
                        color: STATUS_COLORS[d.status],
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </DSCard>

          {/* Upcoming Deadlines Calendar */}
          <DSCard noHover sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Échéances à venir
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {upcomingDeadlines.map((dl) => {
                const days = daysUntil(dl.date);
                return (
                  <Box
                    key={dl.id}
                    onClick={() => dl.dossierId && navigate(`/dossiers/${dl.dossierId}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      cursor: dl.dossierId ? 'pointer' : 'default',
                      transition: 'background 0.2s',
                      ...(dl.dossierId && { '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' } }),
                      ...(dl.urgent && days <= 10 && { bgcolor: 'rgba(239,68,68,0.04)' }),
                    }}
                  >
                    <Box sx={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.85rem', color: days <= 7 ? '#ef4444' : days <= 14 ? '#f59e0b' : 'text.primary', lineHeight: 1 }}>
                        {new Date(dl.date).getDate()}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                        {new Date(dl.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.3 }}>
                        {dl.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={DEADLINE_TYPE_LABELS[dl.type]}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        bgcolor: `${DEADLINE_TYPE_COLORS[dl.type]}15`,
                        color: DEADLINE_TYPE_COLORS[dl.type],
                      }}
                    />
                    {days <= 10 && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: days <= 7 ? '#ef4444' : '#f59e0b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                        {days}j
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </DSCard>

          {/* Convention Collective */}
          <DSCard noHover sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <GavelIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Convention collective
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {company?.default_idcc_label || company?.convention_collective || 'Non renseignée'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              IDCC {company?.default_idcc} &middot; {company?.effectif} salariés &middot; {company?.activite}
            </Typography>
          </DSCard>
        </Box>
      </Box>

      {/* Quick action bar */}
      <Box sx={{
        mt: 3,
        p: 2,
        borderRadius: 3,
        bgcolor: 'rgba(232, 132, 44, 0.04)',
        border: '1px solid rgba(232, 132, 44, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Actions rapides :
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ChatIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/chat')}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}
        >
          Poser une question juridique
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FolderIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/dossiers')}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}
        >
          Nouveau dossier
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<TrendingIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}
        >
          Simuler une rupture conventionnelle
        </Button>
      </Box>
    </Box>
  );
};
