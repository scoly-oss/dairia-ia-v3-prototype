import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Drawer,
  IconButton,
  TextField,
  InputAdornment,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { SelectChangeEvent } from '@mui/material/Select';
import { companyService } from '../../services/companyService';
import { conversationService } from '../../services/conversationService';
import { ChatInterface } from '../../components/Chat/ChatInterface';
import { LAYOUT } from '../../theme/constants';
import { Company, User } from '../../types/auth';

interface Conversation {
  id: string;
  created_at: string;
  title: string;
  is_visible: boolean;
}

const ALL_USERS_VALUE = '__all__';

export const AdminConversationHistory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filtres
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [allUsersSelected, setAllUsersSelected] = useState(false);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Recherche et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Charger les companies au mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companyService.getAllCompanies();
        setCompanies(data);
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };
    loadCompanies();
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sélection d'une company
  const handleCompanySelect = async (event: SelectChangeEvent) => {
    const companyId = event.target.value;
    const company = companies.find(c => c.id === companyId) || null;
    setSelectedCompany(company);
    setSelectedUser(null);
    setAllUsersSelected(false);
    setSelectedConversation(null);
    setConversations([]);
    setPage(1);

    if (company) {
      try {
        const users = await companyService.getCompanyUsers(company.id);
        setCompanyUsers(users);
      } catch (error) {
        console.error('Error loading company users:', error);
        setCompanyUsers([]);
      }
    } else {
      setCompanyUsers([]);
    }
  };

  // Sélection d'un user
  const handleUserSelect = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedConversation(null);
    setPage(1);

    if (value === ALL_USERS_VALUE) {
      setSelectedUser(null);
      setAllUsersSelected(true);
    } else {
      const user = companyUsers.find(u => u.id === value) || null;
      setSelectedUser(user);
      setAllUsersSelected(false);
    }
  };

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!selectedUser && !allUsersSelected) return;

    try {
      const result = await conversationService.getConversationsPaginated({
        userId: selectedUser?.id || undefined,
        companyId: allUsersSelected && selectedCompany ? selectedCompany.id : undefined,
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
      });
      setConversations(result.data as Conversation[]);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [selectedUser, allUsersSelected, selectedCompany, page, debouncedSearch]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const toggleVisibility = async (conversationId: string, currentVisibility: boolean) => {
    try {
      await conversationService.updateConversation(conversationId, { is_visible: !currentVisibility });
      loadConversations();
    } catch (error) {
      console.error('Error toggling conversation visibility:', error);
    }
  };

  const getUserDisplayName = (user: User) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email;
  };

  const conversationsList = (
    <>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Dropdown Company */}
        <FormControl size="small" fullWidth>
          <InputLabel>Entreprise</InputLabel>
          <Select
            value={selectedCompany?.id || ''}
            label="Entreprise"
            onChange={handleCompanySelect}
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography noWrap>{company.name}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Dropdown User */}
        <FormControl size="small" fullWidth disabled={!selectedCompany}>
          <InputLabel>Utilisateur</InputLabel>
          <Select
            value={allUsersSelected ? ALL_USERS_VALUE : selectedUser?.id || ''}
            label="Utilisateur"
            onChange={handleUserSelect}
          >
            <MenuItem value={ALL_USERS_VALUE}>
              <Typography noWrap sx={{ fontStyle: 'italic' }}>Tous les utilisateurs</Typography>
            </MenuItem>
            {companyUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography noWrap>{getUserDisplayName(user)} ({user.email})</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Barre de recherche */}
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={!selectedUser && !allUsersSelected}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List sx={{
        overflow: 'auto',
        flex: 1,
        p: 1,
      }}>
        {conversations.map((conversation) => (
          <ListItem key={conversation.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={selectedConversation === conversation.id}
              onClick={() => {
                setSelectedConversation(conversation.id);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemText
                primary={conversation.title || 'Sans titre'}
                secondary={
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 0.5,
                  }}>
                    <Typography variant="body2" component="span">
                      {new Date(conversation.created_at).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(conversation.id, conversation.is_visible);
                      }}
                      sx={{
                        minWidth: 'auto',
                        color: conversation.is_visible ? 'error.main' : 'success.main',
                        '&:hover': {
                          bgcolor: 'transparent',
                        },
                      }}
                    >
                      {conversation.is_visible ? 'Masquer' : 'Afficher'}
                    </Button>
                  </Box>
                }
                primaryTypographyProps={{
                  noWrap: true,
                  sx: { color: 'inherit' }
                }}
                secondaryTypographyProps={{
                  component: 'div',
                  sx: {
                    color: selectedConversation === conversation.id
                      ? 'inherit'
                      : 'text.secondary'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {totalPages > 1 && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
            color="primary"
          />
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>


      {/* Layout Container */}
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

        {/* Conversations List - Desktop */}
        <Box
          sx={{
            width: LAYOUT.CHAT_DRAWER_WIDTH,
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          {conversationsList}
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: LAYOUT.CHAT_DRAWER_WIDTH,
            },
          }}
        >
          <Box sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6">Conversations</Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          {conversationsList}
        </Drawer>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            bgcolor: 'background.default',
            display: 'flex',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Mobile: Button to open drawer */}
          {isMobile && !selectedConversation && (
            <Box sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1
            }}>
              <Button
                variant="contained"
                startIcon={<MenuIcon />}
                onClick={handleDrawerToggle}
              >
                Filtres
              </Button>
            </Box>
          )}

          {selectedConversation ? (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ChatInterface conversationId={selectedConversation} />
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
              <Typography
                color="text.secondary"
                variant="h6"
                align="center"
                sx={{ maxWidth: 400, px: 2 }}
              >
                {isMobile
                  ? "Appuyez sur le bouton pour accéder aux filtres"
                  : !selectedCompany
                    ? "Sélectionnez une entreprise pour commencer"
                    : !selectedUser && !allUsersSelected
                      ? "Sélectionnez un utilisateur pour voir ses conversations"
                      : "Sélectionnez une conversation pour voir son contenu"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
