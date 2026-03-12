import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DSCard } from '../../components/design-system/DSCard';
import { dossierService } from '../../services/dossierService';
import { Dossier, DossierStatus, DossierType, DossierPriority } from '../../types/dossier';

const STATUS_LABELS: Record<DossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  pending_review: 'En attente',
  closed: 'Clôturé',
};

const STATUS_COLORS: Record<DossierStatus, 'success' | 'info' | 'warning' | 'default'> = {
  open: 'success',
  in_progress: 'info',
  pending_review: 'warning',
  closed: 'default',
};

const TYPE_LABELS: Record<DossierType, string> = {
  licenciement: 'Licenciement',
  contentieux: 'Contentieux',
  rupture_conv: 'Rupture conv.',
  audit: 'Audit',
  general: 'Général',
};

const PRIORITY_LABELS: Record<DossierPriority, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

const PRIORITY_COLORS: Record<DossierPriority, string> = {
  low: '#94a3b8',
  normal: '#64748b',
  high: '#e8842c',
  urgent: '#ef4444',
};

export const DossiersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<DossierStatus | ''>('');
  const [filterType, setFilterType] = useState<DossierType | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDossier, setNewDossier] = useState({
    title: '',
    description: '',
    type: 'general' as DossierType,
    priority: 'normal' as DossierPriority,
  });

  const fetchDossiers = useCallback(async () => {
    try {
      setLoading(true);
      const opts: { status?: DossierStatus; type?: DossierType } = {};
      if (filterStatus) opts.status = filterStatus;
      if (filterType) opts.type = filterType;
      const data = await dossierService.getDossiers(opts);
      setDossiers(data);
    } catch (err) {
      console.error('Failed to fetch dossiers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  const handleCreate = async () => {
    if (!newDossier.title.trim()) return;
    try {
      setCreating(true);
      const created = await dossierService.createDossier(newDossier);
      setCreateOpen(false);
      setNewDossier({ title: '', description: '', type: 'general', priority: 'normal' });
      navigate(`/dossiers/${created.id}`);
    } catch (err) {
      console.error('Failed to create dossier:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: (theme) => theme.custom.gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Dossiers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérez vos dossiers juridiques
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{
            background: (theme) => theme.custom.gradients.primary,
            '&:hover': { background: (theme) => theme.custom.gradients.primaryHover },
          }}
        >
          Nouveau dossier
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Statut"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DossierStatus | '')}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tous</MenuItem>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>{label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DossierType | '')}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tous</MenuItem>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <MenuItem key={key} value={key}>{label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : dossiers.length === 0 ? (
        <DSCard noHover sx={{ p: 6, textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun dossier
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Créez votre premier dossier pour organiser vos affaires juridiques.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              background: (theme) => theme.custom.gradients.primary,
              '&:hover': { background: (theme) => theme.custom.gradients.primaryHover },
            }}
          >
            Créer un dossier
          </Button>
        </DSCard>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {dossiers.map((dossier) => (
            <DSCard
              key={dossier.id}
              sx={{ p: 3, cursor: 'pointer' }}
              onClick={() => navigate(`/dossiers/${dossier.id}`)}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                  {dossier.title}
                </Typography>
                <Chip
                  label={STATUS_LABELS[dossier.status]}
                  color={STATUS_COLORS[dossier.status]}
                  size="small"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
              {dossier.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dossier.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {dossier.type && (
                  <Chip label={TYPE_LABELS[dossier.type] || dossier.type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                )}
                <Chip
                  label={PRIORITY_LABELS[dossier.priority]}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: PRIORITY_COLORS[dossier.priority],
                    borderColor: PRIORITY_COLORS[dossier.priority],
                  }}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', alignSelf: 'center' }}>
                  {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            </DSCard>
          ))}
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nouveau dossier</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Titre"
            value={newDossier.title}
            onChange={(e) => setNewDossier(prev => ({ ...prev, title: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={newDossier.description}
            onChange={(e) => setNewDossier(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Type"
              value={newDossier.type}
              onChange={(e) => setNewDossier(prev => ({ ...prev, type: e.target.value as DossierType }))}
              fullWidth
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priorité"
              value={newDossier.priority}
              onChange={(e) => setNewDossier(prev => ({ ...prev, priority: e.target.value as DossierPriority }))}
              fullWidth
            >
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newDossier.title.trim() || creating}
            sx={{
              background: (theme) => theme.custom.gradients.primary,
              '&:hover': { background: (theme) => theme.custom.gradients.primaryHover },
            }}
          >
            {creating ? 'Création...' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
