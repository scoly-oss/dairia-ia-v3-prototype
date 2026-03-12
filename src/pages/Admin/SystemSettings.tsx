import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  InputAdornment,
  Divider,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Gavel as GavelIcon,
  Edit as EditIcon,
  ExpandLess,
  ExpandMore,
  Circle as CircleIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { systemParameterService, SystemParameter } from '../../services/systemParameterService';
import { AppNavigation } from '../../components/Navigation/AppNavigation';
import { LAYOUT } from '../../theme/constants';

// Définir les catégories de prompts pour le regroupement
const PROMPT_CATEGORIES: Record<string, { label: string; icon: React.ReactNode; color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' }> = {
  recherche: { label: 'Recherche', icon: <SearchIcon />, color: 'primary' },
  conseil: { label: 'Conseil', icon: <GavelIcon />, color: 'secondary' },
  redaction: { label: 'Rédaction', icon: <EditIcon />, color: 'success' },
  other: { label: 'Autres', icon: <CircleIcon />, color: 'info' },
};

const getCategoryFromName = (name: string): string => {
  if (name.includes('recherche')) return 'recherche';
  if (name.includes('conseil')) return 'conseil';
  if (name.includes('redaction')) return 'redaction';
  return 'other';
};

const getPromptIcon = (promptName: string): React.ReactElement => {
  const category = getCategoryFromName(promptName);
  const icon = PROMPT_CATEGORIES[category]?.icon;
  if (React.isValidElement(icon)) {
    return icon;
  }
  return <EditIcon />;
};

const getPromptColor = (promptName: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
  const category = getCategoryFromName(promptName);
  return PROMPT_CATEGORIES[category]?.color || 'info';
};

export const SystemSettings: React.FC = () => {
  const [prompts, setPrompts] = useState<SystemParameter[]>([]);
  // editedPrompts: promptKey -> model -> value
  const [editedPrompts, setEditedPrompts] = useState<Record<string, Record<string, string>>>({});
  // modelVersions: promptKey -> model -> SystemParameter
  const [modelVersions, setModelVersions] = useState<Record<string, Record<string, SystemParameter>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  // saving: promptKey__model -> boolean
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedPromptModel, setSelectedPromptModel] = useState<string>('gpt-5.1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    recherche: true,
    conseil: true,
    redaction: true,
    other: true,
  });

  // Model configuration state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [savingModel, setSavingModel] = useState<boolean>(false);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemParameterService.getAllPromptsWithModelVersions();
      setPrompts(data.basePrompts);
      setModelVersions(data.modelVersions);

      // Initialiser les valeurs éditées avec structure: promptKey -> model -> value
      const edited: Record<string, Record<string, string>> = {};
      const models = data.availableModels.length > 0 ? data.availableModels : ['gpt-5.1', 'gpt-5.2'];

      data.basePrompts.forEach(p => {
        edited[p.name] = {};
        models.forEach(model => {
          // Utiliser la version spécifique au modèle si elle existe, sinon le prompt de base
          const modelPrompt = data.modelVersions[p.name]?.[model];
          edited[p.name][model] = modelPrompt?.value || p.value;
        });
      });
      setEditedPrompts(edited);

      // Mettre à jour les modèles disponibles si non encore chargés
      if (data.availableModels.length > 0 && availableModels.length === 0) {
        setAvailableModels(data.availableModels);
      }

      // Sélectionner le premier prompt si aucun n'est sélectionné
      if (data.basePrompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(data.basePrompts[0].name);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prompts:', error);
      setError('Erreur lors du chargement des prompts');
    } finally {
      setLoading(false);
    }
  }, [selectedPrompt, availableModels.length]);

  useEffect(() => {
    loadPrompts();
  }, []);

  // Load available models and default model
  const loadModels = useCallback(async () => {
    try {
      setLoadingModels(true);
      const [models, currentDefault] = await Promise.all([
        systemParameterService.getAvailableModels(),
        systemParameterService.getDefaultModel()
      ]);
      setAvailableModels(models);
      setDefaultModel(currentDefault);
      setSelectedModel(currentDefault);
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Erreur lors du chargement des modèles');
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Handle model selection change
  const handleModelChange = (event: SelectChangeEvent<string>) => {
    setSelectedModel(event.target.value);
  };

  // Save default model
  const handleSaveModel = async () => {
    if (selectedModel === defaultModel) return;

    try {
      setSavingModel(true);
      setError(null);
      await systemParameterService.setDefaultModel(selectedModel);
      setDefaultModel(selectedModel);
      setSuccess(`Modèle par défaut mis à jour : ${selectedModel}`);
    } catch (err) {
      console.error('Error saving default model:', err);
      setError('Erreur lors de la mise à jour du modèle par défaut');
    } finally {
      setSavingModel(false);
    }
  };

  // Grouper et filtrer les prompts
  const groupedPrompts = useMemo(() => {
    const filtered = prompts.filter(p => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        (p.display_name?.toLowerCase().includes(query)) ||
        (p.description?.toLowerCase().includes(query))
      );
    });

    const groups: Record<string, SystemParameter[]> = {
      recherche: [],
      conseil: [],
      redaction: [],
      other: [],
    };

    filtered.forEach(p => {
      const category = getCategoryFromName(p.name);
      groups[category].push(p);
    });

    return groups;
  }, [prompts, searchQuery]);

  const handlePromptChange = (promptName: string, model: string, value: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [promptName]: {
        ...prev[promptName],
        [model]: value
      }
    }));
  };

  const handleSave = async (promptName: string, model: string) => {
    const savingKey = `${promptName}__${model}`;
    try {
      setSaving(prev => ({ ...prev, [savingKey]: true }));
      setError(null);
      setSuccess(null);

      const value = editedPrompts[promptName]?.[model] || '';
      await systemParameterService.updatePromptByKeyAndModel(promptName, model, value);

      // Mettre à jour les versions de modèle
      setModelVersions(prev => ({
        ...prev,
        [promptName]: {
          ...prev[promptName],
          [model]: { name: `${promptName}__${model}`, value, display_name: promptName }
        }
      }));

      setSuccess(`Prompt mis à jour avec succès pour ${model.toUpperCase()}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prompt:', error);
      setError('Erreur lors de la mise à jour du prompt');
    } finally {
      setSaving(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  const hasChanges = (promptName: string, model?: string) => {
    if (model) {
      // Vérifier pour un modèle spécifique
      const modelPrompt = modelVersions[promptName]?.[model];
      const originalValue = modelPrompt?.value || prompts.find(p => p.name === promptName)?.value || '';
      return editedPrompts[promptName]?.[model] !== originalValue;
    }
    // Vérifier si le prompt a des changements pour n'importe quel modèle
    const models = availableModels.length > 0 ? availableModels : ['gpt-5.1', 'gpt-5.2'];
    return models.some(m => {
      const modelPrompt = modelVersions[promptName]?.[m];
      const originalValue = modelPrompt?.value || prompts.find(p => p.name === promptName)?.value || '';
      return editedPrompts[promptName]?.[m] !== originalValue;
    });
  };

  const hasChangesForModel = (promptName: string, model: string) => {
    const modelPrompt = modelVersions[promptName]?.[model];
    const originalValue = modelPrompt?.value || prompts.find(p => p.name === promptName)?.value || '';
    return editedPrompts[promptName]?.[model] !== originalValue;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const currentPrompt = prompts.find(p => p.name === selectedPrompt);

  // Compter les prompts modifiés par catégorie
  const modifiedCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    const models = availableModels.length > 0 ? availableModels : ['gpt-5.1', 'gpt-5.2'];
    Object.entries(groupedPrompts).forEach(([category, categoryPrompts]) => {
      counts[category] = categoryPrompts.filter(p => {
        return models.some(m => {
          const modelPrompt = modelVersions[p.name]?.[m];
          const originalValue = modelPrompt?.value || prompts.find(pr => pr.name === p.name)?.value || '';
          return editedPrompts[p.name]?.[m] !== originalValue;
        });
      }).length;
    });
    return counts;
  }, [groupedPrompts, editedPrompts, prompts, modelVersions, availableModels]);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <AppNavigation />

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
            overflow: 'hidden',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Paramètres système
            </Typography>
            <Tooltip title="Rafraîchir">
              <span>
                <IconButton
                  onClick={() => { loadPrompts(); loadModels(); }}
                  disabled={loading || loadingModels}
                  size="medium"
                >
                  {(loading || loadingModels) ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Model Configuration Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SmartToyIcon color="primary" />
              <Typography variant="h6">
                Modèle IA par défaut
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sélectionnez le modèle OpenAI utilisé par défaut pour toutes les conversations dans l'application.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 250 }} disabled={loadingModels}>
                <InputLabel id="model-select-label">Modèle</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={selectedModel}
                  onChange={handleModelChange}
                  label="Modèle"
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SmartToyIcon fontSize="small" />
                        <Typography>{model.toUpperCase()}</Typography>
                        {model === defaultModel && (
                          <Chip label="Actuel" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleSaveModel}
                disabled={savingModel || selectedModel === defaultModel || loadingModels}
                startIcon={savingModel ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{
                  background: (theme) => theme.custom.gradients.primary,
                  color: 'white',
                  '&:hover': {
                    background: (theme) => theme.custom.gradients.primaryHover,
                  },
                  '&.Mui-disabled': {
                    background: (theme) => theme.palette.action.disabledBackground,
                    color: (theme) => theme.palette.action.disabled,
                  },
                }}
              >
                {savingModel ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              {selectedModel !== defaultModel && (
                <Chip
                  label="Modifications non sauvegardées"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>

          {/* Prompts Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">
              Prompts IA
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : prompts.length === 0 ? (
            <Alert severity="info">
              Aucun prompt de mode trouvé. Exécutez la migration de base de données pour initialiser les prompts.
            </Alert>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
              {/* Liste latérale des prompts */}
              <Paper
                sx={{
                  width: 320,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Recherche */}
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher un prompt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Divider />

                {/* Liste groupée */}
                <List
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    py: 0,
                  }}
                  dense
                >
                  {Object.entries(PROMPT_CATEGORIES).map(([categoryKey, category]) => {
                    const categoryPrompts = groupedPrompts[categoryKey] || [];
                    if (categoryPrompts.length === 0) return null;

                    return (
                      <React.Fragment key={categoryKey}>
                        <ListItemButton
                          onClick={() => toggleCategory(categoryKey)}
                          sx={{
                            bgcolor: (theme) => theme.custom.surface,
                            '&:hover': { bgcolor: (theme) => theme.custom.surfaceHighlight },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {category.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{category.label}</span>
                                <Chip
                                  label={categoryPrompts.length}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.75rem' }}
                                />
                                {modifiedCountByCategory[categoryKey] > 0 && (
                                  <Chip
                                    label={`${modifiedCountByCategory[categoryKey]} modifié(s)`}
                                    size="small"
                                    color="warning"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            }
                          />
                          {expandedCategories[categoryKey] ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>

                        <Collapse in={expandedCategories[categoryKey]} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding dense>
                            {categoryPrompts.map((prompt) => (
                              <ListItem
                                key={prompt.name}
                                disablePadding
                                secondaryAction={
                                  hasChanges(prompt.name) ? (
                                    <Chip
                                      label="•"
                                      size="small"
                                      color="warning"
                                      sx={{
                                        minWidth: 20,
                                        height: 20,
                                        '& .MuiChip-label': { px: 0.5 }
                                      }}
                                    />
                                  ) : null
                                }
                              >
                                <ListItemButton
                                  selected={selectedPrompt === prompt.name}
                                  onClick={() => setSelectedPrompt(prompt.name)}
                                  sx={{ pl: 4 }}
                                >
                                  <ListItemText
                                    primary={prompt.display_name || prompt.name}
                                    primaryTypographyProps={{
                                      variant: 'body2',
                                      noWrap: true,
                                      sx: {
                                        fontWeight: selectedPrompt === prompt.name ? 600 : 400,
                                      }
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    );
                  })}
                </List>

                {/* Résumé en bas */}
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: (theme) => theme.custom.surface }}>
                  <Typography variant="caption" color="text.secondary">
                    {prompts.length} prompts • {Object.values(modifiedCountByCategory).reduce((a, b) => a + b, 0)} modifié(s)
                  </Typography>
                </Box>
              </Paper>

              {/* Éditeur de prompt */}
              <Paper
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  p: 3,
                }}
              >
                {currentPrompt ? (
                  <>
                    {/* En-tête du prompt */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            icon={getPromptIcon(currentPrompt.name)}
                            label={currentPrompt.display_name || currentPrompt.name}
                            color={getPromptColor(currentPrompt.name)}
                            size="medium"
                          />
                          {hasChanges(currentPrompt.name) && (
                            <Chip
                              label="Modifications non sauvegardées"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {currentPrompt.description && (
                          <Typography variant="body2" color="text.secondary">
                            {currentPrompt.description}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => handleSave(currentPrompt.name, selectedPromptModel)}
                        disabled={saving[`${currentPrompt.name}__${selectedPromptModel}`] || !hasChangesForModel(currentPrompt.name, selectedPromptModel)}
                        startIcon={saving[`${currentPrompt.name}__${selectedPromptModel}`] ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{
                          background: (theme) => theme.custom.gradients.primary,
                          color: 'white',
                          '&:hover': {
                            background: (theme) => theme.custom.gradients.primaryHover,
                          },
                          '&.Mui-disabled': {
                            background: (theme) => theme.palette.action.disabledBackground,
                            color: (theme) => theme.palette.action.disabled,
                          },
                        }}
                      >
                        {saving[`${currentPrompt.name}__${selectedPromptModel}`] ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </Box>

                    {/* Onglets de modèle */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs
                        value={selectedPromptModel}
                        onChange={(_, newValue) => setSelectedPromptModel(newValue)}
                        aria-label="Sélection du modèle"
                      >
                        {(availableModels.length > 0 ? availableModels : ['gpt-5.1', 'gpt-5.2']).map((model) => (
                          <Tab
                            key={model}
                            value={model}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SmartToyIcon fontSize="small" />
                                <span>{model.toUpperCase()}</span>
                                {hasChangesForModel(currentPrompt.name, model) && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'warning.main',
                                    }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </Tabs>
                    </Box>

                    {/* Éditeur de texte */}
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      value={editedPrompts[currentPrompt.name]?.[selectedPromptModel] || ''}
                      onChange={(e) => handlePromptChange(currentPrompt.name, selectedPromptModel, e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '100%',
                          alignItems: 'flex-start',
                        },
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                          height: '100% !important',
                          overflow: 'auto !important',
                        }
                      }}
                      InputProps={{
                        sx: {
                          fontFamily: 'monospace',
                          height: '100%',
                        },
                      }}
                    />

                    {/* Pied de page */}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Clé: <Box component="code" sx={{ bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: 1 }}>
                          {selectedPromptModel === 'gpt-5.1' ? currentPrompt.name : `${currentPrompt.name}__${selectedPromptModel}`}
                        </Box>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(editedPrompts[currentPrompt.name]?.[selectedPromptModel] || '').length} caractères
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <Typography color="text.secondary">
                      Sélectionnez un prompt dans la liste
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
