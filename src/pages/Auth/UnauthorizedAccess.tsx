import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const UnauthorizedAccess: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main 
            }}
          >
            Accès non autorisé
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Votre compte n'est pas encore autorisé à accéder à cette application.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Veuillez contacter Dairia Avocats pour obtenir un accès à la plateforme.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{ 
              mt: 3,
              py: 1.5,
              px: 4,
              fontSize: '1rem'
            }}
          >
            Contacter Dairia Avocats
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedAccess;
