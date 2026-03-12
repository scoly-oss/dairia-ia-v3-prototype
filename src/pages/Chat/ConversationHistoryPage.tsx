import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { RecentConversations } from '../../components/Chat/RecentConversations';
import { useNavigate } from 'react-router-dom';
import { LAYOUT } from '../../theme/constants';

export const ConversationHistoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ouvrir automatiquement le drawer en mobile à l'arrivée sur la page
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(true);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleConversationSelect = (id: string) => {
    navigate(`/chat?conversation=${id}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNewConversation = () => {
    navigate('/chat');
  };

  const drawer = (
    <Box sx={{ width: LAYOUT.CHAT_DRAWER_WIDTH }}>
      <Box
        sx={{
          height: LAYOUT.APPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" noWrap>
          Mes conversations
        </Typography>
      </Box>
      <Box sx={{ overflow: 'auto', height: `calc(100vh - ${LAYOUT.APPBAR_HEIGHT}px)` }}>
        <RecentConversations
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          showNewConversationButton={false}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>


      {/* Mobile Drawer for Conversations */}
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
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Mes conversations</Typography>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ overflow: 'auto', height: `calc(100vh - ${LAYOUT.APPBAR_HEIGHT + 64}px)` }}>
          <RecentConversations
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            showNewConversationButton={false}
          />
        </Box>
      </Drawer>

      {/* Liste des conversations */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: LAYOUT.CHAT_DRAWER_WIDTH,
          ml: `${LAYOUT.NAV_WIDTH}px`,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: LAYOUT.CHAT_DRAWER_WIDTH,
            ml: `${LAYOUT.NAV_WIDTH}px`,
            mt: `${LAYOUT.APPBAR_HEIGHT}px`,
            height: `calc(100% - ${LAYOUT.APPBAR_HEIGHT}px)`,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Contenu principal - vide car la liste des conversations est dans le drawer */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${LAYOUT.APPBAR_HEIGHT}px`,
          ml: { sm: `${LAYOUT.NAV_WIDTH + LAYOUT.CHAT_DRAWER_WIDTH}px` },
          height: `calc(100vh - ${LAYOUT.APPBAR_HEIGHT}px)`,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      />
    </Box>
  );
};
