import React, { useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export const NotificationPermission: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  const setupNotifications = useCallback(async () => {
    try {
      await notificationService.registerServiceWorker();
    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
      setError('Impossible d\'activer les notifications. Veuillez vérifier vos paramètres de navigateur.');
    }
  }, []);

  useEffect(() => {
    const checkPermission = async () => {
      // Ne vérifier qu'une seule fois par session
      if (hasCheckedPermission) {
        return;
      }

      // Ne rien faire si l'utilisateur n'est pas connecté
      if (!user) {
        return;
      }

      if (!('Notification' in window)) {
        return;
      }

      try {
        const permission = await notificationService.getPermissionStatus();
        if (permission === 'granted') {
          await setupNotifications();
        }
      } finally {
        setHasCheckedPermission(true);
      }
    };

    checkPermission();
  }, [user, hasCheckedPermission, setupNotifications]);

  // Ne rien afficher si l'utilisateur n'est pas connecté ou si les notifications ne sont pas supportées
  if (!user || !('Notification' in window)) {
    return null;
  }

  return (
    <>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};
