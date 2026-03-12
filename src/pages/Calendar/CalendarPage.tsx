import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  Avatar,
  IconButton,
  Badge,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon,
  FolderOpen as FolderIcon,
  Business as BusinessIcon,
  NotificationsActive as NotifIcon,
  ChevronLeft,
  ChevronRight,
  Circle as DotIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DSCard } from '../../components/design-system/DSCard';
import { MOCK_DEADLINES, Deadline } from '../../data/mockData';

// ── Constants ────────────────────────────────────────────────────────────────

const TODAY = '2026-03-12';
const TODAY_DATE = new Date(TODAY);

const TYPE_LABELS: Record<Deadline['type'], string> = {
  legal: 'Légal',
  dossier: 'Dossier',
  ccn: 'Convention',
  internal: 'Interne',
};

const TYPE_COLORS: Record<Deadline['type'], string> = {
  legal: '#3b82f6',
  dossier: '#e8842c',
  ccn: '#8b5cf6',
  internal: '#94a3b8',
};

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTH_ABBR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysRemaining(dateStr: string): number {
  const target = new Date(dateStr);
  const diff = target.getTime() - TODAY_DATE.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDaysRemaining(days: number): { label: string; color: string } {
  if (days < 0) return { label: 'PASSÉ', color: '#ef4444' };
  if (days === 0) return { label: "aujourd'hui", color: '#e8842c' };
  if (days === 1) return { label: 'demain', color: '#e8842c' };
  return { label: `dans ${days} jours`, color: days <= 7 ? '#f59e0b' : '#64748b' };
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getLeftBorderColor(deadline: Deadline, days: number): string {
  if (deadline.urgent && days <= 7) return '#ef4444';
  if (deadline.urgent) return '#e8842c';
  return '#e2e8f0';
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const diff = d.getTime() - TODAY_DATE.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 7;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getMonth() === TODAY_DATE.getMonth() && d.getFullYear() === TODAY_DATE.getFullYear();
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < TODAY_DATE;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthGroup {
  key: string;
  label: string;
  deadlines: Deadline[];
}

// ── Component ────────────────────────────────────────────────────────────────

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // ── Computed data ────────────────────────────────────────────────────────

  const sortedDeadlines = useMemo(
    () => [...MOCK_DEADLINES].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [],
  );

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const dl of sortedDeadlines) {
      const key = getMonthKey(dl.date);
      if (!map.has(key)) {
        map.set(key, { key, label: getMonthLabel(dl.date), deadlines: [] });
      }
      map.get(key)!.deadlines.push(dl);
    }
    return Array.from(map.values());
  }, [sortedDeadlines]);

  const stats = useMemo(() => {
    const thisMonth = sortedDeadlines.filter((d) => isThisMonth(d.date)).length;
    const urgent = sortedDeadlines.filter((d) => d.urgent).length;
    const thisWeek = sortedDeadlines.filter((d) => isThisWeek(d.date)).length;
    const overdue = sortedDeadlines.filter((d) => isOverdue(d.date)).length;
    return { thisMonth, urgent, thisWeek, overdue };
  }, [sortedDeadlines]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDeadlineClick = (dl: Deadline) => {
    if (dl.dossierId) {
      navigate(`/dossiers/${dl.dossierId}`);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderStatCard = (
    label: string,
    value: number,
    color: string,
    icon: React.ReactNode,
  ) => (
    <DSCard
      noHover
      sx={{
        flex: 1,
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 180,
      }}
    >
      <Avatar
        sx={{
          width: 44,
          height: 44,
          bgcolor: `${color}14`,
          color,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: 13 }}>
          {label}
        </Typography>
      </Box>
    </DSCard>
  );

  const renderDeadlineItem = (dl: Deadline) => {
    const d = new Date(dl.date);
    const day = d.getDate();
    const monthAbbr = MONTH_ABBR[d.getMonth()];
    const days = getDaysRemaining(dl.date);
    const remaining = formatDaysRemaining(days);
    const borderColor = getLeftBorderColor(dl, days);
    const isClickable = !!dl.dossierId;

    return (
      <Box
        key={dl.id}
        onClick={() => handleDeadlineClick(dl)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          p: 2,
          pl: 0,
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: 2,
          bgcolor: '#fff',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'all 0.2s',
          '&:hover': isClickable
            ? { bgcolor: 'rgba(232, 132, 44, 0.04)', transform: 'translateX(4px)' }
            : {},
        }}
      >
        {/* Date block */}
        <Box
          sx={{
            minWidth: 56,
            textAlign: 'center',
            pl: 2,
          }}
        >
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1e2d3d', lineHeight: 1.1 }}>
            {day}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
            {monthAbbr}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderColor: '#f1f5f9' }} />

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1e2d3d',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 200, sm: 400, md: 'none' },
              }}
            >
              {dl.title}
            </Typography>
            {dl.urgent && (
              <Chip
                label="Urgent"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={TYPE_LABELS[dl.type]}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: `${TYPE_COLORS[dl.type]}14`,
                color: TYPE_COLORS[dl.type],
                borderRadius: 1.5,
              }}
            />
            {dl.dossierId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FolderIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Dossier lié</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Days remaining */}
        <Box sx={{ textAlign: 'right', flexShrink: 0, pr: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: remaining.color,
              whiteSpace: 'nowrap',
            }}
          >
            {remaining.label}
          </Typography>
        </Box>
      </Box>
    );
  };

  // ── Liste view ───────────────────────────────────────────────────────────

  const renderListView = () => {
    if (sortedDeadlines.length === 0) {
      return renderEmptyState();
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {monthGroups.map((group) => (
          <Box key={group.key}>
            {/* Month header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#1e2d3d',
                }}
              >
                {group.label}
              </Typography>
              <Badge
                badgeContent={group.deadlines.length}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#e8842c',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                  },
                }}
              />
            </Box>

            {/* Deadline items */}
            <DSCard
              noHover
              sx={{ p: 0, overflow: 'hidden' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {group.deadlines.map((dl, idx) => (
                  <React.Fragment key={dl.id}>
                    {renderDeadlineItem(dl)}
                    {idx < group.deadlines.length - 1 && (
                      <Divider sx={{ mx: 2, borderColor: '#f1f5f9' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </DSCard>
          </Box>
        ))}
      </Box>
    );
  };

  // ── Chronologique (timeline) view ────────────────────────────────────────

  const renderTimelineView = () => {
    if (sortedDeadlines.length === 0) {
      return renderEmptyState();
    }

    // Find the index where "today" marker should appear
    const todayInsertIndex = sortedDeadlines.findIndex(
      (dl) => new Date(dl.date) >= TODAY_DATE,
    );

    return (
      <Box sx={{ position: 'relative', pl: 5 }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: '#e2e8f0',
            borderRadius: 1,
          }}
        />

        {sortedDeadlines.map((dl, idx) => {
          const d = new Date(dl.date);
          const day = d.getDate();
          const monthAbbr = MONTH_ABBR[d.getMonth()];
          const days = getDaysRemaining(dl.date);
          const remaining = formatDaysRemaining(days);
          const isClickable = !!dl.dossierId;
          const showTodayBefore = idx === todayInsertIndex;

          return (
            <React.Fragment key={dl.id}>
              {/* Today marker */}
              {showTodayBefore && (
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    ml: -5,
                  }}
                >
                  {/* Orange dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 8,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: '#e8842c',
                      border: '3px solid #fff',
                      boxShadow: '0 0 0 2px #e8842c',
                      zIndex: 2,
                    }}
                  />
                  {/* Label */}
                  <Box sx={{ ml: 5, pl: 2 }}>
                    <Chip
                      label="Aujourd'hui — 12 mars 2026"
                      sx={{
                        background: (theme: any) => theme.custom?.gradients?.primary || 'linear-gradient(135deg, #e8842c 0%, #f5a623 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        height: 32,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Timeline node */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  mb: 3,
                  ml: -5,
                }}
              >
                {/* Node dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 11,
                    top: 14,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: dl.urgent ? '#ef4444' : '#94a3b8',
                    border: '2px solid #fff',
                    zIndex: 1,
                  }}
                />

                {/* Date label */}
                <Box
                  sx={{
                    width: 60,
                    ml: 5,
                    pt: 0.5,
                    textAlign: 'right',
                    pr: 2,
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1e2d3d', lineHeight: 1.1 }}>
                    {day}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {monthAbbr}
                  </Typography>
                </Box>

                {/* Card */}
                <DSCard
                  noHover={!isClickable}
                  onClick={() => handleDeadlineClick(dl)}
                  sx={{
                    flex: 1,
                    p: 2,
                    cursor: isClickable ? 'pointer' : 'default',
                    borderLeft: `3px solid ${dl.urgent ? '#ef4444' : TYPE_COLORS[dl.type]}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1e2d3d',
                          }}
                        >
                          {dl.title}
                        </Typography>
                        {dl.urgent && (
                          <Chip
                            label="Urgent"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={TYPE_LABELS[dl.type]}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: `${TYPE_COLORS[dl.type]}14`,
                            color: TYPE_COLORS[dl.type],
                            borderRadius: 1.5,
                          }}
                        />
                        {dl.dossierId && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FolderIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                            <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Dossier lié</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: remaining.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {remaining.label}
                    </Typography>
                  </Box>
                </DSCard>
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  // ── Empty state ──────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <DSCard
      noHover
      sx={{
        p: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Avatar
        sx={{
          width: 72,
          height: 72,
          bgcolor: 'rgba(232, 132, 44, 0.1)',
          color: '#e8842c',
          mb: 2,
        }}
      >
        <CalendarIcon sx={{ fontSize: 36 }} />
      </Avatar>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1e2d3d', mb: 1 }}>
        Aucune échéance
      </Typography>
      <Typography sx={{ fontSize: 14, color: '#94a3b8', maxWidth: 360 }}>
        Vous n'avez aucune échéance enregistrée pour le moment. Ajoutez vos premières échéances
        pour ne rien manquer.
      </Typography>
    </DSCard>
  );

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: { xs: 2, md: 3 } }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: (theme: any) => theme.custom?.gradients?.primary || 'linear-gradient(135deg, #e8842c 0%, #f5a623 100%)',
            }}
          >
            <CalendarIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: '#1e2d3d', lineHeight: 1.2 }}
            >
              Échéancier RH
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
              Toutes vos échéances légales, conventionnelles et dossiers
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: (theme: any) => theme.custom?.gradients?.primary || 'linear-gradient(135deg, #e8842c 0%, #f5a623 100%)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 3,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: 14,
            boxShadow: '0 4px 14px rgba(232, 132, 44, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d4771f 0%, #e09520 100%)',
              boxShadow: '0 6px 20px rgba(232, 132, 44, 0.4)',
            },
          }}
        >
          Ajouter une échéance
        </Button>
      </Box>

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        {renderStatCard('Échéances ce mois', stats.thisMonth, '#3b82f6', <CalendarIcon sx={{ fontSize: 22 }} />)}
        {renderStatCard('Urgentes', stats.urgent, '#ef4444', <NotifIcon sx={{ fontSize: 22 }} />)}
        {renderStatCard('Cette semaine', stats.thisWeek, '#e8842c', <ScheduleIcon sx={{ fontSize: 22 }} />)}
        {renderStatCard('En retard', stats.overdue, '#ef4444', <GavelIcon sx={{ fontSize: 22 }} />)}
      </Box>

      {/* ── View toggle ──────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              bgcolor: '#e8842c',
              borderRadius: 2,
              height: 3,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              minHeight: 40,
              color: '#94a3b8',
              '&.Mui-selected': {
                color: '#e8842c',
              },
            },
          }}
        >
          <Tab label="Liste" />
          <Tab label="Chronologique" />
        </Tabs>
        <Divider sx={{ borderColor: '#f1f5f9' }} />
      </Box>

      {/* ── View content ─────────────────────────────────────────────────── */}
      {tabIndex === 0 ? renderListView() : renderTimelineView()}
    </Box>
  );
};
