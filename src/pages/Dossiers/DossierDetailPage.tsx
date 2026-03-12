import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Chat as ChatIcon,
  Description as DocIcon,
  Timeline as TimelineIcon,
  NoteAdd as NoteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DSCard } from '../../components/design-system/DSCard';
import { dossierService } from '../../services/dossierService';
import { DossierDetail, DossierEvent, DossierStatus, DossierPriority, DossierType } from '../../types/dossier';

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

const EVENT_LABELS: Record<string, string> = {
  created: 'Dossier créé',
  status_change: 'Changement de statut',
  note: 'Note ajoutée',
  document_linked: 'Document lié',
  document_unlinked: 'Document délié',
  conversation_linked: 'Conversation liée',
  conversation_unlinked: 'Conversation déliée',
  updated: 'Dossier mis à jour',
};

export const DossierDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await dossierService.getDossier(id);
        setDossier(data);
      } catch (err) {
        console.error('Failed to fetch dossier:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddNote = async () => {
    if (!id || !noteTitle.trim()) return;
    try {
      setAddingNote(true);
      await dossierService.addNote(id, noteTitle, noteDesc || undefined);
      setNoteTitle('');
      setNoteDesc('');
      // Refresh
      const data = await dossierService.getDossier(id);
      setDossier(data);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: DossierStatus) => {
    if (!id) return;
    try {
      await dossierService.updateDossier(id, { status: newStatus });
      const data = await dossierService.getDossier(id);
      setDossier(data);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dossier) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', py: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/dossiers')} sx={{ mb: 2 }}>
          Retour
        </Button>
        <Typography color="text.secondary">Dossier introuvable.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 3 }}>
      {/* Back */}
      <Button startIcon={<BackIcon />} onClick={() => navigate('/dossiers')} sx={{ mb: 2, color: 'text.secondary' }}>
        Retour aux dossiers
      </Button>

      {/* Header */}
      <DSCard noHover sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {dossier.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={STATUS_LABELS[dossier.status]}
                color={STATUS_COLORS[dossier.status]}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {dossier.type && (
                <Chip label={TYPE_LABELS[dossier.type] || dossier.type} size="small" variant="outlined" />
              )}
              <Chip
                label={PRIORITY_LABELS[dossier.priority]}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, color: PRIORITY_COLORS[dossier.priority], borderColor: PRIORITY_COLORS[dossier.priority] }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {dossier.status !== 'closed' && (
              <TextField
                select
                size="small"
                label="Statut"
                value={dossier.status}
                onChange={(e) => handleStatusChange(e.target.value as DossierStatus)}
                sx={{ minWidth: 140 }}
                SelectProps={{ native: true }}
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </TextField>
            )}
          </Box>
        </Box>
        {dossier.description && (
          <Typography variant="body2" color="text.secondary">
            {dossier.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
          Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </DSCard>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: 'primary.main' },
        }}
      >
        <Tab icon={<TimelineIcon />} iconPosition="start" label={`Timeline (${dossier.events?.length || 0})`} />
        <Tab icon={<ChatIcon />} iconPosition="start" label={`Conversations (${dossier.conversations?.length || 0})`} />
        <Tab icon={<DocIcon />} iconPosition="start" label={`Documents (${dossier.documents?.length || 0})`} />
      </Tabs>

      {/* Tab Content */}
      {tab === 0 && (
        <Box>
          {/* Add Note Form */}
          <DSCard noHover sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Ajouter une note
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                size="small"
                placeholder="Titre de la note"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                placeholder="Description (optionnel)"
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                sx={{ flex: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<NoteIcon />}
                onClick={handleAddNote}
                disabled={!noteTitle.trim() || addingNote}
                sx={{
                  background: (theme) => theme.custom.gradients.primary,
                  '&:hover': { background: (theme) => theme.custom.gradients.primaryHover },
                  whiteSpace: 'nowrap',
                }}
              >
                Ajouter
              </Button>
            </Box>
          </DSCard>

          {/* Timeline */}
          {dossier.events && dossier.events.length > 0 ? (
            <Box sx={{ position: 'relative', pl: 4 }}>
              {/* Vertical line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 11,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  bgcolor: 'divider',
                }}
              />
              {dossier.events
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((event) => (
                  <Box key={event.id} sx={{ position: 'relative', mb: 2.5 }}>
                    <CircleIcon
                      sx={{
                        position: 'absolute',
                        left: -28,
                        top: 4,
                        fontSize: 12,
                        color: event.type === 'note' ? 'primary.main' : 'text.disabled',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.title || EVENT_LABELS[event.type] || event.type}
                      </Typography>
                      {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {event.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {new Date(event.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucun événement pour le moment.
            </Typography>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {dossier.conversations && dossier.conversations.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dossier.conversations.map((conv: any) => (
                <DSCard
                  key={conv.id}
                  sx={{ p: 2.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                  onClick={() => navigate('/chat')}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: 'rgba(232, 132, 44, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ChatIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {conv.title}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(conv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Chip label="Ouvrir" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </DSCard>
              ))}
            </Box>
          ) : (
            <DSCard noHover sx={{ p: 4, textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Aucune conversation liée. Liez des conversations depuis le chat.
              </Typography>
            </DSCard>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {dossier.documents && dossier.documents.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dossier.documents.map((doc: any) => (
                <DSCard
                  key={doc.id}
                  sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: doc.name?.endsWith('.pdf') ? 'rgba(239, 68, 68, 0.1)' : doc.name?.endsWith('.docx') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DocIcon sx={{ color: doc.name?.endsWith('.pdf') ? '#ef4444' : doc.name?.endsWith('.docx') ? '#3b82f6' : '#64748b', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Chip
                    label={doc.name?.split('.').pop()?.toUpperCase() || 'FICHIER'}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: doc.name?.endsWith('.pdf') ? 'rgba(239, 68, 68, 0.1)' : doc.name?.endsWith('.docx') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: doc.name?.endsWith('.pdf') ? '#ef4444' : doc.name?.endsWith('.docx') ? '#3b82f6' : '#64748b',
                    }}
                  />
                </DSCard>
              ))}
            </Box>
          ) : (
            <DSCard noHover sx={{ p: 4, textAlign: 'center' }}>
              <DocIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Aucun document lié. Liez des documents depuis la page Documents.
              </Typography>
            </DSCard>
          )}
        </Box>
      )}
    </Box>
  );
};
