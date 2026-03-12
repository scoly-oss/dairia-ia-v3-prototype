import React, { useState } from 'react';
import { Box, Collapse, Fade, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ModeOptionButton } from './ModeOptionButton';
import { CategoryDropdown } from './CategoryDropdown';
import { ActionButtons } from './ActionButtons';
import { RESPONSE_MODES, REDACTION_CATEGORIES, categoryHasSubCategories, subCategoryHasActions } from '../../../config/responseModes';
import { SelectedMode, ResponseModeType, RedactionCategory } from '../../../types/responseMode';

interface ModeSelectorProps {
  visible: boolean;
  onModeSelect: (mode: SelectedMode) => void;
  onClose?: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  visible,
  onModeSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose: _onClose
}) => {
  // État de navigation dans la hiérarchie
  const [currentLevel, setCurrentLevel] = useState<'modes' | 'categories' | 'subcategories' | 'actions'>('modes');
  const [, setSelectedModeType] = useState<ResponseModeType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RedactionCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  // Reset de l'état quand le sélecteur devient invisible
  React.useEffect(() => {
    if (!visible) {
      setCurrentLevel('modes');
      setSelectedModeType(null);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    }
  }, [visible]);

  // Gestion du clic sur un mode
  const handleModeClick = (modeType: ResponseModeType) => {
    const mode = RESPONSE_MODES.find(m => m.type === modeType);
    if (!mode) return;

    if (mode.hasSubCategories) {
      // Mode avec sous-catégories (Rédaction)
      setSelectedModeType(modeType);
      setCurrentLevel('categories');
    } else {
      // Mode direct (Recherche, Conseil)
      onModeSelect({
        mode: modeType,
        promptKey: mode.promptKey,
        displayLabel: mode.label
      });
    }
  };

  // Gestion du clic sur une catégorie
  const handleCategoryClick = (category: RedactionCategory) => {
    const categoryConfig = REDACTION_CATEGORIES.find(c => c.category === category);
    if (!categoryConfig) return;

    setSelectedCategory(category);

    if (categoryHasSubCategories(category)) {
      // La catégorie a des sous-catégories
      setCurrentLevel('subcategories');
    } else {
      // Pas de sous-catégories, utiliser directement le prompt de la catégorie
      onModeSelect({
        mode: 'redaction',
        category,
        promptKey: categoryConfig.promptKey,
        displayLabel: `Rédaction - ${categoryConfig.label}`
      });
    }
  };

  // Gestion du clic sur une sous-catégorie
  const handleSubCategoryClick = (subCategoryId: string) => {
    const categoryConfig = REDACTION_CATEGORIES.find(c => c.category === selectedCategory);
    const subCategoryConfig = categoryConfig?.subCategories?.find(sc => sc.id === subCategoryId);

    if (!subCategoryConfig || !selectedCategory) return;

    setSelectedSubCategory(subCategoryId);

    if (subCategoryHasActions(selectedCategory, subCategoryId)) {
      // La sous-catégorie a des actions
      setCurrentLevel('actions');
    } else {
      // Pas d'actions, utiliser directement le prompt de la sous-catégorie
      onModeSelect({
        mode: 'redaction',
        category: selectedCategory,
        subCategory: subCategoryId,
        promptKey: subCategoryConfig.promptKey,
        displayLabel: `${categoryConfig?.label} - ${subCategoryConfig.label}`
      });
    }
  };

  // Gestion du clic sur une action
  const handleActionClick = (actionId: string, promptKey: string, label: string) => {
    if (!selectedCategory) return;

    onModeSelect({
      mode: 'redaction',
      category: selectedCategory,
      subCategory: selectedSubCategory || undefined,
      action: actionId,
      promptKey,
      displayLabel: label
    });
  };

  // Navigation arrière
  const handleBack = () => {
    switch (currentLevel) {
      case 'categories':
        setCurrentLevel('modes');
        setSelectedModeType(null);
        break;
      case 'subcategories':
        setCurrentLevel('categories');
        setSelectedCategory(null);
        break;
      case 'actions':
        setCurrentLevel('subcategories');
        setSelectedSubCategory(null);
        break;
    }
  };

  // Obtenir les données pour le niveau actuel
  const getCurrentCategoryConfig = () => {
    return REDACTION_CATEGORIES.find(c => c.category === selectedCategory);
  };

  const getCurrentSubCategoryConfig = () => {
    const categoryConfig = getCurrentCategoryConfig();
    return categoryConfig?.subCategories?.find(sc => sc.id === selectedSubCategory);
  };

  if (!visible) return null;

  return (
    <Fade in={visible}>
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'hidden',
          mt: 1
        }}
      >
        {/* Bouton retour pour les niveaux > 1 */}
        {currentLevel !== 'modes' && (
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={handleBack}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {currentLevel === 'categories' && 'Choisir une catégorie'}
              {currentLevel === 'subcategories' && getCurrentCategoryConfig()?.label}
              {currentLevel === 'actions' && getCurrentSubCategoryConfig()?.label}
            </Typography>
          </Box>
        )}

        {/* Niveau 1: Modes */}
        <Collapse in={currentLevel === 'modes'}>
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {RESPONSE_MODES.map((mode) => (
              <ModeOptionButton
                key={mode.id}
                mode={mode}
                onClick={() => handleModeClick(mode.type)}
              />
            ))}
          </Box>
        </Collapse>

        {/* Niveau 2: Catégories (pour Rédaction) */}
        <Collapse in={currentLevel === 'categories'}>
          <CategoryDropdown
            categories={REDACTION_CATEGORIES}
            onSelect={handleCategoryClick}
          />
        </Collapse>

        {/* Niveau 3: Sous-catégories */}
        <Collapse in={currentLevel === 'subcategories'}>
          {selectedCategory && getCurrentCategoryConfig()?.subCategories && (
            <Box sx={{ p: 1.5 }}>
              {getCurrentCategoryConfig()?.subCategories?.map((subCat) => (
                <Box
                  key={subCat.id}
                  onClick={() => handleSubCategoryClick(subCat.id)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">{subCat.label}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Collapse>

        {/* Niveau 4: Actions (boutons) */}
        <Collapse in={currentLevel === 'actions'}>
          {selectedSubCategory && getCurrentSubCategoryConfig()?.actions && (
            <ActionButtons
              actions={getCurrentSubCategoryConfig()?.actions || []}
              onSelect={handleActionClick}
            />
          )}
        </Collapse>
      </Box>
    </Fade>
  );
};

export default ModeSelector;
