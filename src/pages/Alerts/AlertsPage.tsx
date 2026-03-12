import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Badge,
  TextField,
  MenuItem,
  IconButton,
  Divider,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  MarkEmailRead as MarkEmailReadIcon,
  FilterList as FilterListIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DSCard } from '../../components/design-system/DSCard';
import { alertService } from '../../services/alertService';
import { Alert, AlertType, AlertSeverity } from '../../types/alert';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: 'rgba(239, 68, 68, 0.06)',
  warning: 'rgba(245, 158, 11, 0.06)',
  info: 'rgba(59, 130, 246, 0.06)',
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: 'Critique',
  warning: 'Attention',
  info: 'Information',
};

const TYPE_LABELS: Record<AlertType, string> = {
  legal_watch: 'Jurisprudence',
  deadline: 'Echeance',
  compliance: 'Conformite',
  ccn_update: 'Convention collective',
  token_limit: 'Limite tokens',
};

interface TabDef {
  label: string;
  filter: 'all' | 'unread' | AlertType;
}

const TABS: TabDef[] = [
  { label: 'Toutes', filter: 'all' },
  { label: 'Non lues', filter: 'unread' },
  { label: 'Jurisprudence', filter: 'legal_watch' },
  { label: 'Echeances', filter: 'deadline' },
  { label: 'Conformite', filter: 'compliance' },
  { label: 'CCN', filter: 'ccn_update' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAlertIcon(type: AlertType) {
  switch (type) {
    case 'legal_watch':
      return <GavelIcon />;
    case 'deadline':
      return <ScheduleIcon />;
    case 'compliance':
      return <WarningIcon />;
    case 'ccn_update':
      return <InfoIcon />;
    case 'token_limit':
      return <ErrorIcon />;
    default:
      return <NotificationsIcon />;
  }
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "a l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays === 1) return 'hier';
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  return `il y a ${Math.floor(diffDays / 365)} an(s)`;
}

function getDaysRemaining(dueDateStr: string): number {
  const now = new Date();
  const due = new Date(dueDateStr);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

function getDueDateLabel(dueDateStr: string): string {
  const days = getDaysRemaining(dueDateStr);
  if (days < 0) return `${Math.abs(days)} j en retard`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `${days} jours restants`;
}

function getDueDateColor(dueDateStr: string): 'error' | 'warning' | 'info' | 'success' {
  const days = getDaysRemaining(dueDateStr);
  if (days < 0) return 'error';
  if (days <= 7) return 'error';
  if (days <= 30) return 'warning';
  return 'info';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');

  // ---- Data fetching -------------------------------------------------------

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const tabDef = TABS[activeTab];
      const options: { unreadOnly?: boolean; type?: AlertType } = {};

      if (tabDef.filter === 'unread') {
        options.unreadOnly = true;
      } else if (tabDef.filter !== 'all') {
        options.type = tabDef.filter as AlertType;
      }

      const data = await alertService.getAlerts(options);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ---- Derived state -------------------------------------------------------

  const filteredAlerts =
    severityFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === severityFilter);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  // ---- Handlers ------------------------------------------------------------

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertService.markAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)),
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertService.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  // ---- Render --------------------------------------------------------------

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      {/* ================ HEADER ================ */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: (theme) => theme.custom?.gradients?.primary ?? '#e8842c',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: '#1e2d3d', lineHeight: 1.2 }}
            >
              Veille Juridique & Alertes
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Suivez les evolutions legales, echeances et obligations de votre
              entreprise
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: 'rgba(232, 132, 44, 0.1)',
                color: '#e8842c',
                fontWeight: 600,
              }}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            sx={{
              borderColor: '#e8842c',
              color: '#e8842c',
              textTransform: 'none',
              borderRadius: 3,
              '&:hover': {
                borderColor: '#d0741e',
                bgcolor: 'rgba(232, 132, 44, 0.06)',
              },
            }}
          >
            Tout marquer comme lu
          </Button>
        </Box>
      </Box>

      {/* ================ FILTER BAR ================ */}
      <DSCard noHover sx={{ mb: 3, p: 0, overflow: 'visible' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            px: 2,
            pt: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 44,
                py: 0,
              },
              '& .Mui-selected': { color: '#e8842c' },
              '& .MuiTabs-indicator': { backgroundColor: '#e8842c' },
            }}
          >
            {TABS.map((tab, i) => (
              <Tab
                key={i}
                label={
                  tab.filter === 'unread' && unreadCount > 0 ? (
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: 11, height: 18, minWidth: 18 } }}
                    >
                      <span>{tab.label}</span>
                    </Badge>
                  ) : (
                    tab.label
                  )
                }
              />
            ))}
          </Tabs>

          <TextField
            select
            size="small"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
            InputProps={{
              startAdornment: <FilterListIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />,
            }}
            sx={{
              minWidth: 170,
              mb: 1,
              '& .MuiOutlinedInput-root': { borderRadius: 3 },
            }}
          >
            <MenuItem value="all">Toutes severites</MenuItem>
            <MenuItem value="critical">Critique</MenuItem>
            <MenuItem value="warning">Attention</MenuItem>
            <MenuItem value="info">Information</MenuItem>
          </TextField>
        </Box>
      </DSCard>

      {/* ================ LOADING ================ */}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: '#e8842c' } }} />}

      {/* ================ ALERT LIST ================ */}
      {!loading && filteredAlerts.length === 0 && (
        <DSCard
          noHover
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 56, color: '#e8842c', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e2d3d', mb: 1 }}>
            Aucune alerte
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {activeTab === 1
              ? 'Toutes vos alertes ont ete lues. Bravo !'
              : 'Aucune alerte ne correspond aux filtres selectionnes.'}
          </Typography>
        </DSCard>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        ))}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// AlertCard sub-component
// ---------------------------------------------------------------------------

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onMarkAsRead, onDelete }) => {
  const severityColor = SEVERITY_COLORS[alert.severity];
  const isUnread = !alert.is_read;

  return (
    <DSCard
      noHover
      sx={{
        position: 'relative',
        borderLeft: `4px solid ${severityColor}`,
        bgcolor: isUnread ? SEVERITY_BG[alert.severity] : '#ffffff',
        transition: 'background-color 0.3s',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, p: 2.5 }}>
        {/* Icon */}
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: `${severityColor}14`,
            color: severityColor,
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {getAlertIcon(alert.type)}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Top row: title + chips */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
              mb: 0.75,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: isUnread ? 700 : 500,
                color: '#1e2d3d',
                lineHeight: 1.3,
              }}
            >
              {isUnread && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: severityColor,
                    mr: 1,
                    verticalAlign: 'middle',
                    mb: '2px',
                  }}
                />
              )}
              {alert.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, flexWrap: 'wrap' }}>
              {/* Severity chip */}
              <Chip
                label={SEVERITY_LABELS[alert.severity]}
                size="small"
                sx={{
                  bgcolor: `${severityColor}18`,
                  color: severityColor,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
              {/* Type chip */}
              <Chip
                label={TYPE_LABELS[alert.type]}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              />
            </Box>
          </Box>

          {/* Description */}
          {alert.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 1.5,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {alert.description}
            </Typography>
          )}

          {/* Meta row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {/* Due date */}
            {alert.due_date && (
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                label={getDueDateLabel(alert.due_date)}
                size="small"
                color={getDueDateColor(alert.due_date)}
                variant="outlined"
                sx={{ fontSize: '0.75rem', height: 26 }}
              />
            )}

            {/* Source */}
            {alert.source && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {alert.source}
                {alert.source_url && (
                  <IconButton
                    size="small"
                    href={alert.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    component="a"
                    sx={{ p: 0.25, color: '#e8842c' }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Typography>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16, alignSelf: 'center' }} />

            {/* Relative time */}
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {getRelativeTime(alert.created_at)}
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            flexShrink: 0,
            ml: 1,
          }}
        >
          {isUnread && (
            <IconButton
              size="small"
              onClick={() => onMarkAsRead(alert.id)}
              sx={{
                color: '#e8842c',
                '&:hover': { bgcolor: 'rgba(232, 132, 44, 0.08)' },
              }}
              title="Marquer comme lu"
            >
              <MarkEmailReadIcon fontSize="small" />
            </IconButton>
          )}
          {alert.source_url && (
            <IconButton
              size="small"
              component="a"
              href={alert.source_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: '#e8842c' },
              }}
              title="Ouvrir la source"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => onDelete(alert.id)}
            sx={{
              color: 'text.disabled',
              '&:hover': { color: '#ef4444' },
            }}
            title="Supprimer"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </DSCard>
  );
};

export default AlertsPage;
