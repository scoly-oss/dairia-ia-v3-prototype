import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Container,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ChangePasswordForm } from '../../components/ChangePasswordForm';
import { LAYOUT } from '../../theme/constants';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>


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
            overflow: 'auto',
            p: 3,
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
              Mon Profil
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
              gap: 3
            }}>
              {/* Carte d'information principale */}
              <Card sx={{
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    mb: 3
                  }}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'primary.main',
                        fontSize: '2.5rem',
                        mb: 2
                      }}
                    >
                      {user?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {user?.email}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 500
                      }}
                    >
                      {user?.role === 'admin'
                        ? 'Administrateur'
                        : user?.role === 'lawyer'
                          ? 'Avocat'
                          : user?.role === 'company_user'
                            ? 'Utilisateur Entreprise'
                            : 'Client'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List disablePadding>
                    {(user?.companyName || user?.company?.name) && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="Entreprise"
                          secondary={user?.companyName || user?.company?.name}
                          primaryTypographyProps={{
                            color: 'text.secondary',
                            variant: 'body2',
                            gutterBottom: true
                          }}
                          secondaryTypographyProps={{
                            color: 'text.primary',
                            variant: 'body1',
                            fontWeight: 500
                          }}
                        />
                      </ListItem>
                    )}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Statut du compte"
                        secondary="Actif"
                        primaryTypographyProps={{
                          color: 'text.secondary',
                          variant: 'body2',
                          gutterBottom: true
                        }}
                        secondaryTypographyProps={{
                          color: 'success.main',
                          variant: 'body1',
                          fontWeight: 500
                        }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Section pour les informations détaillées ou les statistiques */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3
                }}>
                  <Card sx={{
                    borderRadius: 2,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Activité récente
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aucune activité récente
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{
                    borderRadius: 2,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Statistiques
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aucune statistique disponible
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Section pour le changement de mot de passe */}
                <Card sx={{
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Sécurité
                    </Typography>
                    <ChangePasswordForm />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};