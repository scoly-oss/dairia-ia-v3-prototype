import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { conversationService } from '../../services/conversationService';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation } from '../../types/conversation';

interface RecentConversationsProps {
  selectedConversationId?: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  showNewConversationButton?: boolean;
}

import { DSButton } from '../design-system/DSButton';

export const RecentConversations: React.FC<RecentConversationsProps> = ({
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  showNewConversationButton = true,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversationMenu, setSelectedConversationMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await conversationService.getConversationsPaginated({
        userId: user.id,
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
      });
      setConversations(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user?.id, page, debouncedSearch]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Recharger quand une conversation est sélectionnée (pour refléter les changements)
  useEffect(() => {
    if (selectedConversationId) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedConversationMenu(conversationId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedConversationMenu(null);
  };

  const handleHideConversation = async () => {
    if (selectedConversationMenu) {
      try {
        await conversationService.hideConversation(selectedConversationMenu);
        setConversations(conversations.filter(conv => conv.id !== selectedConversationMenu));
        handleMenuClose();
      } catch (error) {
        console.error('Error hiding conversation:', error);
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: (theme) => `1px solid ${theme.custom.border}`,
      }}
    >
      <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.custom.border}` }}>
        {showNewConversationButton && (
          <DSButton
            fullWidth
            variant="primary"
            startIcon={<AddIcon />}
            onClick={onNewConversation}
            sx={{ mb: 1.5 }}
          >
            Nouvelle conversation
          </DSButton>
        )}
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
        }}
      >
        {conversations.length === 0 ? (
          <Box sx={{
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 40, opacity: 0.5 }} />
            <Typography variant="body2">
              {debouncedSearch ? 'Aucun résultat' : 'Aucune conversation'}
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              sx={{ mb: 1 }}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuClick(e, conversation.id)}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '.MuiListItem-root:hover &': {
                      opacity: 1
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                selected={selectedConversationId === conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                sx={{
                  borderRadius: 2,
                  pr: 5,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    background: (theme) => theme.custom.gradients.primarySubtle,
                    borderLeft: '3px solid #fe904d',
                    '&:hover': {
                      background: (theme) => theme.custom.gradients.primarySubtleHover,
                    },
                  },
                  '&:hover': {
                    backgroundColor: (theme) => theme.custom.surfaceHighlight,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{
                        fontWeight: selectedConversationId === conversation.id ? 600 : 400,
                        color: selectedConversationId === conversation.id ? 'primary.main' : 'text.primary',
                        fontSize: '0.95rem'
                      }}
                    >
                      {conversation.title || 'Sans titre'}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color: 'text.secondary',
                        fontSize: '0.75rem'
                      }}
                    >
                      {new Date(conversation.created_at).toLocaleString('fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {totalPages > 1 && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', borderTop: (theme) => `1px solid ${theme.custom.border}` }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
            color="primary"
          />
        </Box>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      // Styles handled by global theme override
      >
        <MenuItem onClick={handleHideConversation} sx={{ fontSize: '0.9rem', '&:hover': { background: (theme) => theme.custom.surfaceHighlight } }}>
          Masquer la conversation
        </MenuItem>
      </Menu>
    </Box>
  );
};
