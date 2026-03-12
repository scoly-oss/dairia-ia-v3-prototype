import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { collectiveAgreementService } from '../services/collectiveAgreementService';
import { ConventionCollective } from '../types/collectiveAgreement';

interface IdccSelectorProps {
  /** Valeur actuelle de la CC sélectionnée */
  value: ConventionCollective | null;
  /** Callback appelé quand une CC est confirmée */
  onChange: (cc: ConventionCollective | null) => void;
  /** Label du champ de saisie */
  label?: string;
  /** Placeholder du champ de saisie */
  placeholder?: string;
  /** Champ obligatoire */
  required?: boolean;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Texte d'aide sous le champ */
  helperText?: string;
  /** Permettre la saisie de texte libre (nom de CC) en plus du code IDCC */
  allowTextInput?: boolean;
}

/**
 * Composant de sélection de Convention Collective par code IDCC ou nom.
 *
 * Flow en 2 étapes :
 * 1. L'utilisateur saisit un code IDCC ou un nom de CC et clique sur "Valider"
 * 2. La CC trouvée s'affiche, l'utilisateur clique sur "Confirmer" pour la sélectionner
 *
 * Si allowTextInput=true (défaut), le composant accepte :
 * - Les codes IDCC (1-4 chiffres) : lookup direct
 * - Les noms de CC (Syntec, métallurgie, etc.) : résolution via gpt-4o-mini
 */
export const IdccSelector: React.FC<IdccSelectorProps> = ({
  value,
  onChange,
  label = 'Convention collective',
  placeholder = 'Ex: Syntec, métallurgie, IDCC 1486...',
  required = false,
  disabled = false,
  helperText = 'Saisissez le nom ou le code IDCC de votre convention collective',
  allowTextInput = true,
}) => {
  const [idccInput, setIdccInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedCC, setValidatedCC] = useState<ConventionCollective | null>(null);

  // Reset l'état de validation quand la valeur externe change
  useEffect(() => {
    if (value) {
      setValidatedCC(null);
      setIdccInput('');
      setError(null);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (!allowTextInput) {
      // Mode IDCC uniquement : ne garder que les chiffres
      newValue = newValue.replace(/\D/g, '').slice(0, 4);
    } else {
      // Mode texte libre : limiter à 100 caractères
      newValue = newValue.slice(0, 100);
    }

    setIdccInput(newValue);
    // Reset la validation si l'utilisateur modifie l'input
    if (validatedCC) {
      setValidatedCC(null);
    }
    if (error) {
      setError(null);
    }
  };

  const handleValidate = async () => {
    const input = idccInput.trim();

    if (!input) {
      setError('Veuillez saisir un nom ou code de convention collective');
      return;
    }

    // Mode IDCC uniquement : validation stricte
    if (!allowTextInput && !/^\d{1,4}$/.test(input)) {
      setError('Veuillez saisir un code IDCC valide (1 à 4 chiffres)');
      return;
    }

    setValidating(true);
    setError(null);
    setValidatedCC(null);

    try {
      // Cas 1: Code IDCC pur (1-4 chiffres) -> lookup direct
      if (/^\d{1,4}$/.test(input)) {
        const result = await collectiveAgreementService.getConventionByIdcc(input);
        if (result.success && result.convention?.titre) {
          setValidatedCC(result.convention);
        } else {
          setError(result.error || `Aucune convention collective trouvée pour l'IDCC ${input}`);
        }
      } else {
        // Cas 2: Texte libre -> résolution via gpt-4o-mini
        const result = await collectiveAgreementService.resolveConvention(input);
        if (result.success && result.convention) {
          setValidatedCC(result.convention);
        } else {
          setError(result.error || `Aucune convention collective trouvée pour "${input}"`);
        }
      }
    } catch (err) {
      // Afficher le message d'erreur du backend s'il est disponible
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur validation CC:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validatedCC) {
        handleConfirm();
      } else {
        handleValidate();
      }
    }
  };

  const handleConfirm = () => {
    if (validatedCC) {
      onChange(validatedCC);
      setIdccInput('');
      setValidatedCC(null);
      setError(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Champ de saisie et bouton de validation */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          label={label}
          placeholder={placeholder}
          value={idccInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          sx={{ width: allowTextInput ? 300 : 150, flexGrow: allowTextInput ? 1 : 0 }}
          inputProps={allowTextInput ? {} : { inputMode: 'numeric', pattern: '[0-9]*' }}
          disabled={disabled || validating}
          required={required}
          error={!!error}
        />
        <Button
          variant="outlined"
          onClick={handleValidate}
          disabled={validating || !idccInput.trim() || disabled}
          startIcon={validating ? <CircularProgress size={16} /> : <SearchIcon />}
        >
          Valider
        </Button>
      </Box>

      {/* Texte d'aide */}
      <Typography variant="caption" color="text.secondary">
        {helperText}
      </Typography>

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* CC validée en attente de confirmation */}
      {validatedCC && (
        <Alert severity="success" sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            IDCC {validatedCC.idcc}
          </Typography>
          <Typography variant="body2">
            {validatedCC.titre}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleConfirm}
              disabled={disabled}
            >
              Confirmer
            </Button>
          </Box>
        </Alert>
      )}

      {/* Affichage de la valeur actuelle */}
      {value && !validatedCC && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.200',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Convention collective sélectionnée
          </Typography>
          <Chip
            label={`IDCC ${value.idcc}`}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" fontWeight="medium">
            {value.titre}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IdccSelector;
