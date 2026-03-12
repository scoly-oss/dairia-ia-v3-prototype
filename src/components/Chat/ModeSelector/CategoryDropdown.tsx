import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, ListItemIcon, Chip } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { CategoryConfig, RedactionCategory } from '../../../types/responseMode';

interface CategoryDropdownProps {
  categories: CategoryConfig[];
  onSelect: (category: RedactionCategory) => void;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  onSelect
}) => {
  return (
    <List sx={{ py: 0.5 }}>
      {categories.map((category) => {
        const hasSubCategories = category.subCategories && category.subCategories.length > 0;
        const isComingSoon = !hasSubCategories;

        return (
          <ListItemButton
            key={category.id}
            onClick={() => !isComingSoon && onSelect(category.category)}
            disabled={isComingSoon}
            sx={{
              py: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              },
              opacity: isComingSoon ? 0.6 : 1
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FolderIcon fontSize="small" color={isComingSoon ? 'disabled' : 'primary'} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {category.label}
                  </Typography>
                  {isComingSoon && (
                    <Chip
                      label="à définir"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: 'grey.200',
                        color: 'grey.600'
                      }}
                    />
                  )}
                </Box>
              }
              secondary={!isComingSoon ? category.description : undefined}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            {hasSubCategories && (
              <ChevronRightIcon fontSize="small" color="action" />
            )}
          </ListItemButton>
        );
      })}
    </List>
  );
};

export default CategoryDropdown;
