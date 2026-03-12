import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Link,
  Card,
  CardMedia,
  Fade
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Home: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f8f6',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 132, 44, 0.08) 0%, rgba(232, 132, 44, 0) 70%)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-5%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232, 132, 44, 0.06) 0%, rgba(232, 132, 44, 0) 70%)',
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 4, md: 8 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in={animateIn} timeout={1000}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ animation: 'fadeIn 0.7s ease-out' }}>
                  <Box
                    component="img"
                    src="/assets/logo.svg"
                    alt="Dairia IA"
                    sx={{
                      height: { xs: '60px', md: '80px' },
                      width: 'auto',
                      mb: 2
                    }}
                  />
                </Box>

                <Box sx={{ animation: 'fadeIn 0.7s ease-out 0.2s' }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontWeight: 500,
                      lineHeight: 1.4,
                      color: '#1e2d3d',
                      fontSize: { xs: '1.2rem', md: '1.5rem' }
                    }}
                  >
                    Votre assistant intelligent dédié aux questions courantes en droit du travail, de la sécurité sociale et de la paie.
                  </Typography>
                </Box>

                <Box sx={{ animation: 'fadeIn 0.7s ease-out 0.4s' }}>
                  <Typography
                    variant="body1"
                    paragraph
                    sx={{
                      mt: 3,
                      fontSize: '1.1rem',
                      lineHeight: 1.6,
                      color: '#5a6a7a'
                    }}
                  >
                    Grâce à notre interface simple et intuitive, vous pouvez poser vos questions 24h/24 et obtenir des réponses fiables, claires et pratiques.
                  </Typography>
                </Box>

                <Box sx={{ animation: 'scaleIn 0.8s ease-out 0.6s' }}>
                  <Card
                    sx={{
                      mb: 4,
                      maxWidth: { xs: '100%', sm: 500 },
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px rgba(30, 45, 61, 0.08)',
                      border: '1px solid rgba(30, 45, 61, 0.06)',
                      background: '#ffffff',
                    }}
                  >
                    <CardMedia
                      component="img"
                      src="/assets/Dairia_ia.webp"
                      alt="Dairia IA"
                      sx={{
                        borderRadius: '24px',
                        height: { xs: 200, sm: 250 },
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        }
                      }}
                    />
                  </Card>
                </Box>

                <Box sx={{ animation: 'fadeIn 0.7s ease-out 0.8s' }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: '#1e2d3d'
                    }}
                  >
                    Fonctionnalités clés
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {['Réponses instantanées à vos questions juridiques',
                      'Base de connaissances constamment mise à jour',
                      'Interface simple et intuitive',
                      'Disponible 24h/24 et 7j/7'].map((feature, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, #e8842c 0%, #F5A623 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 8px rgba(232, 132, 44, 0.3)'
                            }}
                          >
                            ✓
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: '1rem',
                              color: '#5a6a7a'
                            }}
                          >
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ animation: 'fadeIn 0.8s ease-out 0.3s' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 5 },
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#ffffff',
                  border: '1px solid rgba(30, 45, 61, 0.08)',
                  boxShadow: '0 8px 32px rgba(30, 45, 61, 0.06)',
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography
                    variant="h4"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      color: '#1e2d3d',
                      fontSize: { xs: '1.8rem', sm: '2.2rem' }
                    }}
                  >
                    Commencez gratuitement
                  </Typography>

                  <Typography
                    variant="body1"
                    paragraph
                    sx={{
                      mb: 4,
                      color: '#5a6a7a',
                      lineHeight: 1.6
                    }}
                  >
                    Créez votre compte et profitez de 7 jours d'essai gratuit. Sans engagement, annulez à tout moment.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Pricing reminder */}
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(232, 132, 44, 0.06) 0%, rgba(245, 166, 35, 0.06) 100%)',
                        border: '1px solid rgba(232, 132, 44, 0.15)',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="#5a6a7a" align="center" sx={{ mb: 1 }}>
                        🎁 <strong style={{ color: '#e8842c' }}>7 jours gratuits</strong> puis <strong>90€ HT/mois</strong>
                      </Typography>
                      <Typography variant="caption" color="#5a6a7a" align="center" display="block">
                        Sans engagement • Annulez à tout moment
                      </Typography>
                    </Box>

                    <Button
                      component={RouterLink}
                      to="/signup"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #e8842c 0%, #F5A623 100%)',
                        boxShadow: '0 4px 14px rgba(232, 132, 44, 0.35)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(232, 132, 44, 0.4)',
                          background: 'linear-gradient(135deg, #F5A623 0%, #e8842c 100%)',
                        }
                      }}
                    >
                      Démarrer mon essai gratuit →
                    </Button>

                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      size="large"
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        borderColor: 'rgba(30, 45, 61, 0.2)',
                        color: '#1e2d3d',
                        '&:hover': {
                          borderColor: '#e8842c',
                          backgroundColor: 'rgba(232, 132, 44, 0.04)',
                        }
                      }}
                    >
                      Se connecter
                    </Button>
                  </Box>

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
                        color: '#5a6a7a',
                      }}
                    >
                      En créant un compte, vous acceptez nos{' '}
                      <Link
                        component={RouterLink}
                        to="/terms-of-service"
                        sx={{ color: '#e8842c', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        CGU
                      </Link>
                      {' '}et notre{' '}
                      <Link
                        component={RouterLink}
                        to="/privacy-policy"
                        sx={{ color: '#e8842c', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        politique de confidentialité
                      </Link>
                      .
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 4,
          mt: 'auto',
          textAlign: 'center',
          backgroundColor: 'rgba(30, 45, 61, 0.03)',
          borderTop: '1px solid rgba(30, 45, 61, 0.06)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 2 }}>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{
                color: '#5a6a7a',
                textDecoration: 'none',
                fontSize: '0.85rem',
                mx: 2,
                '&:hover': {
                  color: '#e8842c',
                  textDecoration: 'underline'
                }
              }}
            >
              Politique de confidentialité
            </Link>
            <Link
              component={RouterLink}
              to="/terms-of-service"
              sx={{
                color: '#5a6a7a',
                textDecoration: 'none',
                fontSize: '0.85rem',
                mx: 2,
                '&:hover': {
                  color: '#e8842c',
                  textDecoration: 'underline'
                }
              }}
            >
              Conditions d'utilisation
            </Link>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              color: '#5a6a7a'
            }}
          >
            © {new Date().getFullYear()} Dairia IA. Tous droits réservés.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              fontSize: '0.85rem',
              color: '#5a6a7a',
              opacity: 0.6
            }}
          >
            Propulsé par <Link href="https://openai.com" target="_blank" rel="noopener" underline="hover" sx={{ color: '#5a6a7a' }}>OpenAI</Link>
          </Typography>
        </Container>
      </Box>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </Box>
  );
};

export default Home;
