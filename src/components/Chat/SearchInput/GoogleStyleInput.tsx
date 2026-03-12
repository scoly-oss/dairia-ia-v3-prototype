import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { SelectedMode } from '../../../types/responseMode';

interface GoogleStyleInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: () => void;
  disabled?: boolean;
  loading?: boolean;
  documentCount?: number;
  pendingFileCount?: number;
  selectedMode: SelectedMode | null;
  onModeChange: (mode: SelectedMode | null) => void;
  placeholder?: string;
}

export const GoogleStyleInput: React.FC<GoogleStyleInputProps> = ({
  value,
  onChange,
  onSend,
  onFileUpload,
  disabled,
  loading,
  documentCount = 0,
  pendingFileCount = 0,
  selectedMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onModeChange,
  placeholder = 'Effectuez une recherche ou posez une question'
}) => {
  const [focused, setFocused] = useState(false);
  const [, setShowModeSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Afficher le sélecteur de mode quand l'utilisateur tape et qu'aucun mode n'est sélectionné
  // DÉSACTIVÉ TEMPORAIREMENT - Le mode "Recherche enrichie" est auto-sélectionné
  // TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
  /* useEffect(() => {
    if (focused && value.length > 0 && !selectedMode) {
      setShowModeSelector(true);
    }
  }, [value, focused, selectedMode]); */

  // Fermer le sélecteur si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowModeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      // DÉSACTIVÉ TEMPORAIREMENT - Le mode "Recherche enrichie" est auto-sélectionné
      // TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
      /* if (!selectedMode) {
        setShowModeSelector(true);
        return;
      } */
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowModeSelector(false);
    }
  };

  const handleSend = () => {
    // MODIFIÉ: Ne vérifie plus selectedMode - le mode "Recherche enrichie" est auto-sélectionné
    // TODO: Réactiver la vérification quand les modes Conseil et Rédaction seront prêts
    // Ancienne condition: if (!value.trim() || loading || disabled || !selectedMode) return;
    if (!value.trim() || loading || disabled) return;
    onSend();
    setShowModeSelector(false);
  };

  // Vérifie si l'envoi est possible
  // MODIFIÉ: Ne vérifie plus selectedMode - le mode "Recherche enrichie" est auto-sélectionné
  // TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
  // Ancienne condition: const canSend = value.trim() && selectedMode && !loading && !disabled;
  const canSend = value.trim() && !loading && !disabled;

  // DÉSACTIVÉ TEMPORAIREMENT - handleModeSelect et clearMode non utilisés
  // TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
  // const handleModeSelect = (mode: SelectedMode) => {
  //   onModeChange(mode);
  //   setShowModeSelector(false);
  //   inputRef.current?.focus();
  // };
  // const clearMode = () => {
  //   onModeChange(null);
  // };

  const totalDocCount = documentCount + pendingFileCount;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      {/* Indicateur du mode sélectionné - DÉSACTIVÉ TEMPORAIREMENT
       * TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
       * Le mode "Recherche enrichie" est maintenant sélectionné automatiquement
       */}
      {/* selectedMode && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={selectedMode.displayLabel}
            onDelete={clearMode}
            deleteIcon={<ClearIcon fontSize="small" />}
            color="primary"
            size="small"
            sx={{ fontWeight: 500, maxWidth: '100%' }}
          />
        </Box>
      ) */}

      {/* Champ de saisie principal */}
      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={4}
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title="Ajouter des documents (PDF, DOCX, images - max 30 Mo par fichier)">
                <span>
                  <IconButton
                    onClick={onFileUpload}
                    disabled={disabled}
                    size="small"
                    color={totalDocCount > 0 ? 'primary' : 'default'}
                  >
                    <Badge
                      badgeContent={totalDocCount > 0 ? totalDocCount : undefined}
                      color="primary"
                      max={99}
                    >
                      <AttachFileIcon />
                    </Badge>
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {/* MODIFIÉ: Tooltip simplifié - le mode "Recherche enrichie" est auto-sélectionné */}
              {/* TODO: Réactiver le message conditionnel quand les modes seront prêts */}
              {/* Ancienne condition: title={!selectedMode ? 'Sélectionnez un mode de réponse' : 'Envoyer'} */}
              <Tooltip title="Envoyer">
                <span>
                  <IconButton
                    onClick={handleSend}
                    disabled={!canSend}
                    color={canSend ? 'primary' : 'default'}
                    size="small"
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: selectedMode ? 2 : 4,
            bgcolor: 'background.paper',
            boxShadow: focused ? 3 : 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 2
            },
            '&.Mui-focused': {
              boxShadow: 3
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: focused ? 'primary.main' : 'divider'
          }
        }}
      />

      {/* Sélecteur de mode - DÉSACTIVÉ TEMPORAIREMENT
       * TODO: Réactiver quand les modes Conseil et Rédaction seront prêts
       * Le mode "Recherche enrichie" est maintenant sélectionné automatiquement
       */}
      {/* <ModeSelector
        visible={showModeSelector && !selectedMode}
        onModeSelect={handleModeSelect}
        onClose={() => setShowModeSelector(false)}
      /> */}
    </Box>
  );
};

export default GoogleStyleInput;
