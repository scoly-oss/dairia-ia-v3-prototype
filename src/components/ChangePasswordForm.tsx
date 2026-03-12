import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ChangePasswordForm: React.FC = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReloginDialog, setShowReloginDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      
      // Note: la méthode changePassword du contexte ne vérifie pas le mot de passe actuel
      // Elle utilise directement l'API Supabase pour mettre à jour le mot de passe
      const result = await changePassword(currentPassword, newPassword);
      
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccess('Votre mot de passe a été modifié avec succès');
      
      // Si la reconnexion est nécessaire, afficher la boîte de dialogue
      if (result.requiresRelogin) {
        setShowReloginDialog(true);
      }
    } catch (error) {
      console.error('Change password form error:', error);
      
      if (error instanceof Error) {
        // Gérer les messages d'erreur spécifiques de Supabase
        if (error.message.includes('Invalid login credentials')) {
          setError('Mot de passe actuel incorrect');
        } else if (error.message.includes('session')) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Une erreur est survenue lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToLogin = () => {
    setShowReloginDialog(false);
    navigate('/login');
  };

  return (
    <>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Changer mon mot de passe
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Mot de passe actuel"
            type={showCurrentPassword ? 'text' : 'password'}
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            slotProps={{ input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="Nouveau mot de passe"
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            slotProps={{ input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmer le nouveau mot de passe"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            slotProps={{ input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}}
          />
          
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Modification en cours...' : 'Modifier mon mot de passe'}
          </Button>
        </Box>
      </Paper>

      {/* Boîte de dialogue pour la reconnexion */}
      <Dialog
        open={showReloginDialog}
        onClose={() => setShowReloginDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Reconnexion nécessaire
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Votre mot de passe a été modifié avec succès. Pour des raisons de sécurité, vous devez vous reconnecter avec votre nouveau mot de passe.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRedirectToLogin} color="primary" autoFocus>
            Se reconnecter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
