import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DocumentIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les utilisateurs, leurs rôles et leurs permissions',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/admin/users',
    },
    {
      title: 'Gestion des Documents',
      description: 'Gérer les documents et leur vectorisation',
      icon: <DocumentIcon sx={{ fontSize: 40 }} />,
      path: '/admin/documents',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tableau de Bord Administrateur
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {menuItems.map((item) => (
            <Grid item xs={12} md={6} key={item.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    cursor: 'pointer',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => navigate(item.path)}
                  >
                    Accéder
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
