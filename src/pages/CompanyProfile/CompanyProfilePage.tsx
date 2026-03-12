import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DSCard } from '../../components/design-system/DSCard';
import { DSButton } from '../../components/design-system/DSButton';
import { supabase } from '../../services/supabase';

const CONTRACT_TYPE_OPTIONS = [
  'CDI',
  'CDD',
  'Alternance',
  'Stage',
  'Intérim',
  'Temps partiel',
  'Forfait jours',
];

interface CompanyProfile {
  name: string;
  siret: string;
  naf_code: string;
  company_address: string;
  company_city: string;
  company_zipcode: string;
  effectif: number | '';
  activite: string;
  convention_collective: string;
  default_idcc: string;
  default_idcc_label: string;
  contract_types: string[];
}

export const CompanyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    siret: '',
    naf_code: '',
    company_address: '',
    company_city: '',
    company_zipcode: '',
    effectif: '',
    activite: '',
    convention_collective: '',
    default_idcc: '',
    default_idcc_label: '',
    contract_types: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.company_id) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.company_id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile({
          name: data.name || '',
          siret: data.siret || '',
          naf_code: data.naf_code || '',
          company_address: data.company_address || '',
          company_city: data.company_city || '',
          company_zipcode: data.company_zipcode || '',
          effectif: data.effectif || '',
          activite: data.activite || '',
          convention_collective: data.convention_collective || '',
          default_idcc: data.default_idcc || '',
          default_idcc_label: data.default_idcc_label || '',
          contract_types: data.contract_types || [],
        });
      }
    } catch (err) {
      console.error('Error loading company profile:', err);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.company_id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: profile.name,
          siret: profile.siret || null,
          naf_code: profile.naf_code || null,
          company_address: profile.company_address || null,
          company_city: profile.company_city || null,
          company_zipcode: profile.company_zipcode || null,
          effectif: profile.effectif || null,
          activite: profile.activite || null,
          contract_types: profile.contract_types,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.company_id);

      if (updateError) throw updateError;

      setSuccess('Profil entreprise mis à jour avec succès');
    } catch (err: any) {
      console.error('Error saving company profile:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyProfile) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleContractTypesChange = (event: SelectChangeEvent<string[]>) => {
    setProfile((prev) => ({
      ...prev,
      contract_types: event.target.value as string[],
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
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
          <BusinessIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Profil entreprise
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Informations utilisées pour personnaliser l'assistance juridique
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <DSCard noHover sx={{ p: 4, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
          Informations générales
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <TextField
            label="Nom de l'entreprise"
            value={profile.name}
            onChange={handleChange('name')}
            fullWidth
          />
          <TextField
            label="SIRET"
            value={profile.siret}
            onChange={handleChange('siret')}
            fullWidth
            inputProps={{ maxLength: 14 }}
            helperText="14 chiffres"
          />
          <TextField
            label="Code NAF/APE"
            value={profile.naf_code}
            onChange={handleChange('naf_code')}
            fullWidth
            placeholder="Ex: 6201Z"
          />
          <TextField
            label="Effectif"
            type="number"
            value={profile.effectif}
            onChange={handleChange('effectif')}
            fullWidth
          />
          <TextField
            label="Activité"
            value={profile.activite}
            onChange={handleChange('activite')}
            fullWidth
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>
      </DSCard>

      <DSCard noHover sx={{ p: 4, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
          Adresse
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <TextField
            label="Adresse"
            value={profile.company_address}
            onChange={handleChange('company_address')}
            fullWidth
            sx={{ gridColumn: '1 / -1' }}
          />
          <TextField
            label="Ville"
            value={profile.company_city}
            onChange={handleChange('company_city')}
            fullWidth
          />
          <TextField
            label="Code postal"
            value={profile.company_zipcode}
            onChange={handleChange('company_zipcode')}
            fullWidth
            inputProps={{ maxLength: 5 }}
          />
        </Box>
      </DSCard>

      <DSCard noHover sx={{ p: 4, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
          Droit social
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <TextField
            label="Convention collective"
            value={profile.default_idcc_label || profile.convention_collective}
            disabled
            fullWidth
            helperText={profile.default_idcc ? `IDCC ${profile.default_idcc}` : 'Définie lors de l\'onboarding'}
          />

          <FormControl fullWidth>
            <InputLabel>Types de contrats utilisés</InputLabel>
            <Select
              multiple
              value={profile.contract_types}
              onChange={handleContractTypesChange}
              input={<OutlinedInput label="Types de contrats utilisés" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {CONTRACT_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DSCard>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <DSButton
          variant="primary"
          onClick={handleSave}
          isLoading={saving}
          startIcon={<SaveIcon />}
        >
          Enregistrer
        </DSButton>
      </Box>
    </Box>
  );
};
