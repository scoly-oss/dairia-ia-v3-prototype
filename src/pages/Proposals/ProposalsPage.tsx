import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper, Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { extractText, extractTextFromPdf } from '../../lib/fileReader';
import { parseProposal } from '../../lib/proposalParser';
import type { ParsedProposal } from '../../lib/proposalTypes';
import ProposalViewer from './ProposalViewer';

type Status = 'idle' | 'parsing' | 'done' | 'error';

export default function ProposalsPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [proposal, setProposal] = useState<ParsedProposal | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dev: auto-load test file via ?demo=filename
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo && status === 'idle') {
      (async () => {
        setStatus('parsing');
        setFileName(demo);
        try {
          const base = import.meta.env.BASE_URL || '/';
          const res = await fetch(`${base}${demo}`);
          const blob = await res.blob();
          const file = new File([blob], demo, { type: 'application/pdf' });
          const text = await extractText(file);
          const parsed = parseProposal(text);
          setProposal(parsed);
          setStatus('done');
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : 'Erreur demo');
          setStatus('error');
        }
      })();
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus('parsing');
    setError('');
    try {
      const text = await extractText(file);
      const parsed = parseProposal(text);
      setProposal(parsed);
      setStatus('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du traitement du fichier.');
      setStatus('error');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  if (status === 'done' && proposal) {
    return <ProposalViewer proposal={proposal} onBack={() => { setStatus('idle'); setProposal(null); }} />;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, px: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2,
          bgcolor: 'rgba(232,132,44,0.08)', borderRadius: 99, px: 2.5, py: 0.8 }}>
          <AutoAwesomeIcon sx={{ color: '#e8842c', fontSize: 20 }} />
          <Typography sx={{ color: '#e8842c', fontWeight: 600, fontSize: 14 }}>
            Transformateur de propositions
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e2d3d', mb: 1 }}>
          Modernisez vos propositions commerciales
        </Typography>
        <Typography sx={{ color: '#5a6c7d', fontSize: 16, maxWidth: 550, mx: 'auto' }}>
          Importez votre proposition en PDF ou DOCX et transformez-la instantanément en une présentation moderne et interactive.
        </Typography>
      </Box>

      {/* Upload zone */}
      <Paper
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? '#e8842c' : '#e2e6ec',
          borderRadius: 4,
          p: 8,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          bgcolor: dragOver ? 'rgba(232,132,44,0.04)' : '#f8f9fb',
          '&:hover': { borderColor: '#e8842c', bgcolor: 'rgba(232,132,44,0.04)' },
        }}
        elevation={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />

        {status === 'parsing' ? (
          <Box>
            <CircularProgress size={48} sx={{ color: '#e8842c', mb: 2 }} />
            <Typography sx={{ color: '#1e2d3d', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
              Analyse en cours...
            </Typography>
            <Typography sx={{ color: '#5a6c7d', fontSize: 14 }}>{fileName}</Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: 'rgba(232,132,44,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
            }}>
              <CloudUploadIcon sx={{ fontSize: 36, color: '#e8842c' }} />
            </Box>
            <Typography sx={{ color: '#1e2d3d', fontWeight: 600, fontSize: 18, mb: 0.5 }}>
              Glissez votre proposition ici
            </Typography>
            <Typography sx={{ color: '#5a6c7d', fontSize: 14, mb: 3 }}>
              ou cliquez pour parcourir vos fichiers
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Chip icon={<DescriptionIcon />} label="PDF" variant="outlined"
                sx={{ borderColor: '#e2e6ec', color: '#5a6c7d' }} />
              <Chip icon={<DescriptionIcon />} label="DOCX" variant="outlined"
                sx={{ borderColor: '#e2e6ec', color: '#5a6c7d' }} />
            </Box>
          </Box>
        )}
      </Paper>

      {status === 'error' && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Info cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mt: 6 }}>
        {[
          { icon: '1', title: 'Importez', desc: 'Glissez votre PDF ou DOCX dans la zone ci-dessus' },
          { icon: '2', title: 'Analyse', desc: 'L\'outil extrait et structure automatiquement le contenu' },
          { icon: '3', title: 'Présentez', desc: 'Votre proposition s\'affiche dans un format moderne et professionnel' },
        ].map((step) => (
          <Paper key={step.icon} elevation={0} sx={{
            p: 3, borderRadius: 3, border: '1px solid #e2e6ec',
            textAlign: 'center',
          }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '50%', bgcolor: '#1e2d3d',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, fontWeight: 700, fontSize: 18,
            }}>
              {step.icon}
            </Box>
            <Typography sx={{ fontWeight: 600, color: '#1e2d3d', mb: 0.5 }}>{step.title}</Typography>
            <Typography sx={{ color: '#5a6c7d', fontSize: 13 }}>{step.desc}</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
