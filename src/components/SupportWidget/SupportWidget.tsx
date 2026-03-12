import React, { useState, useEffect, useCallback } from 'react';
import {
  Fab,
  Badge,
  Popover,
  Box,
  CircularProgress,
  keyframes,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

// Animation pulse pour attirer l'attention
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 145, 76, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 145, 76, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 145, 76, 0);
  }
`;
import { supportRequestService, SupportRequest, SupportRequestUpdate } from '../../services/supportRequestService';
import { SupportChat } from './SupportChat';

export const SupportWidget: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [supportRequest, setSupportRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const open = Boolean(anchorEl);

  // Charger la demande de support active au montage
  useEffect(() => {
    const loadActiveSupportRequest = async () => {
      try {
        const activeRequest = await supportRequestService.getActiveSupportRequest();
        setSupportRequest(activeRequest);
      } catch (error) {
        console.error('[SupportWidget] Error loading active support request:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    loadActiveSupportRequest();
  }, []);

  // Gérer les mises à jour SSE quand une demande est active
  useEffect(() => {
    if (!supportRequest || supportRequest.status === 'completed') return;

    let unsubscribe: (() => void) | null = null;

    const subscribeToUpdates = async () => {
      try {
        unsubscribe = await supportRequestService.subscribeToMessages(
          supportRequest.id,
          (update: SupportRequestUpdate) => {
            // Incrémenter le compteur de messages non lus si le widget est fermé
            if (update.type === 'message' && !open) {
              setUnreadCount(prev => prev + 1);
            }
            // Mettre à jour la demande si elle est complétée
            if (update.type === 'UPDATE' && 'status' in update.data) {
              setSupportRequest(update.data as SupportRequest);
            }
          }
        );
      } catch (error) {
        console.error('[SupportWidget] Error subscribing to updates:', error);
      }
    };

    subscribeToUpdates();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [supportRequest, open]);

  // Réinitialiser le compteur quand le widget est ouvert
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
    }
  }, [open]);

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);

    // Si pas de demande active, en créer une
    if (!supportRequest || supportRequest.status === 'completed') {
      setLoading(true);
      try {
        const newRequest = await supportRequestService.createOrGetSupportRequest();
        setSupportRequest(newRequest);
      } catch (error) {
        console.error('[SupportWidget] Error creating support request:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [supportRequest]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleRequestCompleted = useCallback(() => {
    setSupportRequest(null);
    setAnchorEl(null);
  }, []);

  if (isInitializing) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 100, // Plus haut pour ne pas cacher le bouton d'envoi
          right: 24,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        {/* Label "Besoin d'aide ?" */}
        {!open && (
          <Box
            sx={{
              backgroundColor: 'white',
              color: '#1E345A',
              px: 2,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              },
            }}
            onClick={handleClick}
          >
            Besoin d'aide ?
          </Box>
        )}

        <Fab
          color="primary"
          aria-label="support"
          onClick={handleClick}
          size="large"
          sx={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #ff914c 0%, #ff6b2c 100%)',
            boxShadow: '0 4px 20px rgba(255, 145, 76, 0.4)',
            animation: unreadCount > 0 ? `${pulse} 2s infinite` : 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff6b2c 0%, #e55a1f 100%)',
              transform: 'scale(1.05)',
              boxShadow: '0 6px 24px rgba(255, 145, 76, 0.5)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: -3,
                backgroundColor: '#e53935',
                fontWeight: 700,
              },
            }}
          >
            <SupportAgentIcon sx={{ fontSize: 32 }} />
          </Badge>
        </Fab>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: 400,
            height: 550,
            maxHeight: '80vh',
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : supportRequest ? (
          <SupportChat
            supportRequest={supportRequest}
            onClose={handleClose}
            onRequestCompleted={handleRequestCompleted}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Popover>
    </>
  );
};
