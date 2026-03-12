import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import {
  Chat as ChatIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Forum as ForumIcon,
  RateReview as RateReviewIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  SupportAgent as SupportAgentIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  FolderOpen as FolderIcon,
  NotificationsNone as AlertIcon,
  Gavel as GavelIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LAYOUT } from '../../theme/constants';
import { useLayout } from '../../contexts/LayoutContext';

interface AppNavigationProps {
  paymentAlert?: {
    isPastDue: boolean;
    graceRemainingDays: number | null;
  } | null;
}

interface NavItem {
  text: string;
  icon: JSX.Element;
  path: string;
}

interface DividerItem {
  divider: true;
}

type NavItemType = NavItem | DividerItem;

export const AppNavigation: React.FC<AppNavigationProps> = ({ paymentAlert }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mobileOpen, toggleDrawer, closeDrawer } = useLayout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleNavigation = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  const handleNewChat = () => {
    if (location.pathname === '/chat') {
      window.location.href = '/chat';
    } else {
      navigate('/chat');
    }
    closeDrawer();
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  // Navigation items par rôle
  const baseMenuItems: NavItem[] = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Dossiers', icon: <FolderIcon />, path: '/dossiers' },
    { text: 'Assistant IA', icon: <ChatIcon />, path: '/chat' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
    { text: 'Veille juridique', icon: <AlertIcon />, path: '/alerts' },
    { text: 'Simulateur contentieux', icon: <GavelIcon />, path: '/litigation' },
    { text: 'Échéancier RH', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Conversations', icon: <HistoryIcon />, path: '/chat/history' },
  ];

  const clientMenuItems: NavItem[] = [
    { text: 'Profil entreprise', icon: <BusinessIcon />, path: '/company/profile' },
    { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/company/users' },
  ];

  const lawyerMenuItems: NavItem[] = [
    { text: 'Demandes de relecture', icon: <RateReviewIcon />, path: '/review-requests' },
  ];

  const adminMenuItems: NavItem[] = [
    { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/admin/documents' },
    { text: 'Conversations', icon: <ForumIcon />, path: '/admin/conversations' },
    { text: 'Relecture', icon: <RateReviewIcon />, path: '/review-requests' },
    { text: 'Support', icon: <SupportAgentIcon />, path: '/admin/support' },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  const menuItems: NavItemType[] =
    user?.role === 'admin'
      ? [...baseMenuItems, { divider: true }, ...adminMenuItems]
      : user?.role === 'lawyer'
        ? [...baseMenuItems, { divider: true }, ...lawyerMenuItems]
        : user?.role === 'client'
          ? [...baseMenuItems, { divider: true }, ...clientMenuItems]
          : baseMenuItems;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: (theme) => theme.custom.gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>D</Typography>
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            background: (theme) => theme.custom.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          DAIRIA IA
        </Typography>
      </Box>

      {/* New Chat Button */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Button
          fullWidth
          onClick={handleNewChat}
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            py: 1.2,
            background: (theme) => theme.custom.gradients.primary,
            color: '#ffffff',
            fontWeight: 600,
            boxShadow: (theme) => theme.custom.shadows.primary,
            textTransform: 'none',
            '&:hover': {
              background: (theme) => theme.custom.gradients.primaryHover,
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(232, 132, 44, 0.3)',
            },
          }}
        >
          Nouveau chat
        </Button>
      </Box>

      {/* Payment Alert */}
      {paymentAlert?.isPastDue && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleNavigation('/subscription')}
            startIcon={<CreditCardIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            {paymentAlert.graceRemainingDays && paymentAlert.graceRemainingDays > 0
              ? `Paiement en retard - ${paymentAlert.graceRemainingDays}j`
              : 'Paiement en retard'}
          </Button>
        </Box>
      )}

      {/* Navigation Items */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {menuItems.map((item, index) =>
          'divider' in item ? (
            <Divider key={`divider-${index}`} sx={{ my: 1.5, mx: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    background: (theme) => theme.custom.gradients.primarySubtle,
                    borderLeft: '3px solid',
                    borderLeftColor: 'primary.main',
                    '&:hover': {
                      background: (theme) => theme.custom.gradients.primarySubtleHover,
                    },
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                    '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 600 },
                  },
                  '&:hover': {
                    backgroundColor: (theme) => theme.custom.surfaceHighlight,
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>

      {/* User Profile - Bottom */}
      <Box sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.custom.border}` }}>
        <Box
          onClick={handleProfileMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'background 0.2s',
            '&:hover': {
              backgroundColor: (theme) => theme.custom.surfaceHighlight,
            },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: (theme) => theme.custom.gradients.primary,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.firstName || user?.email?.split('@')[0]}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile hamburger button - fixed top-left */}
      <IconButton
        onClick={toggleDrawer}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          color: 'text.primary',
          bgcolor: 'background.paper',
          boxShadow: 1,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: LAYOUT.NAV_WIDTH,
            background: (theme) => theme.palette.background.default,
            borderRight: (theme) => `1px solid ${theme.custom.border}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer - full height, no AppBar offset */}
      <Drawer
        variant="permanent"
        sx={{
          width: LAYOUT.NAV_WIDTH,
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: LAYOUT.NAV_WIDTH,
            height: '100%',
            background: (theme) => theme.palette.background.default,
            borderRight: (theme) => `1px solid ${theme.custom.border}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            ml: -1,
            mt: -1,
          },
        }}
      >
        <MenuItem
          onClick={() => { handleProfileMenuClose(); handleNavigation('/profile'); }}
          sx={{ '&:hover': { background: (theme) => theme.custom.surfaceHighlight } }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText>Mon Profil</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ '&:hover': { background: (theme) => theme.custom.surfaceHighlight } }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText>Déconnexion</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
