import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { SupportRequest, supportRequestService } from '../../services/supportRequestService';
import { SupportRequestAdminChat } from '../../components/SupportRequestAdminChat';
import { SupportRequestsStats } from '../../components/SupportRequestsStats';
import { SupportRequestsFilters } from '../../components/SupportRequestsFilters';
import { SupportRequestsTable } from '../../components/SupportRequestsTable';
import { LAYOUT } from '../../theme/constants';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  averageResponseTime?: number;
}

const DEFAULT_STATS: Stats = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  averageResponseTime: 0
};

export const SupportRequests = (): JSX.Element => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'created_at' | 'status' | 'client.email'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const selectedRequestRef = useRef<SupportRequest | null>(null);

  const updateStats = useCallback((data: SupportRequest[]) => {
    const stats: Stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      inProgress: data.filter(r => r.status === 'in_progress').length,
      completed: data.filter(r => r.status === 'completed').length,
    };

    const completedRequests = data.filter(r => r.status === 'completed');
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, request) => {
        const start = new Date(request.created_at);
        const end = new Date(request.updated_at);
        return sum + (end.getTime() - start.getTime());
      }, 0);
      stats.averageResponseTime = totalTime / completedRequests.length;
    }

    setStats(stats);
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supportRequestService.getSupportRequests();

      if (Array.isArray(data)) {
        const validatedData = data.map(request => ({
          ...request,
          client: request.client || { email: 'Client inconnu', first_name: '', last_name: '' },
          created_at: request.created_at || new Date().toISOString(),
          updated_at: request.updated_at || new Date().toISOString()
        }));

        setRequests(validatedData);
        updateStats(validatedData);
      } else {
        console.error('[SupportRequests] Invalid data format received:', data);
        setRequests([]);
        updateStats([]);
      }
    } catch (error) {
      console.error('Error loading support requests:', error);
      setRequests([]);
      updateStats([]);
    } finally {
      setLoading(false);
    }
  }, [updateStats]);

  useEffect(() => {
    selectedRequestRef.current = selectedRequest;
  }, [selectedRequest]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let subscription: (() => void) | undefined;
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        if (!isSubscribed) return;
        setConnectionError(null);
        await loadRequests();

        if (!isSubscribed) return;
        subscription = await supportRequestService.subscribeToSupportRequests(
          (update: { type: string; data: SupportRequest; old_status: string }) => {
            if (!isSubscribed) return;

            const { type, data: updatedRequest, old_status } = update;
            if (!updatedRequest) {
              console.warn('[SupportRequests] Received update with no data');
              return;
            }

            setRequests(prev => {
              if (!Array.isArray(prev)) {
                console.warn('[SupportRequests] Previous requests is not an array, initializing...');
                return [updatedRequest];
              }

              let newRequests = [...prev];

              if (type === 'INSERT') {
                const exists = newRequests.some(r => r.id === updatedRequest.id);
                if (!exists) {
                  newRequests = [updatedRequest, ...newRequests];
                }
              } else if (type === 'UPDATE') {
                newRequests = newRequests.map(r => (r?.id === updatedRequest.id ? updatedRequest : r));

                if (selectedRequestRef.current?.id === updatedRequest.id) {
                  const hasImportantChanges =
                    selectedRequestRef.current.status !== updatedRequest.status ||
                    selectedRequestRef.current.admin_id !== updatedRequest.admin_id;

                  if (hasImportantChanges) {
                    setSelectedRequest(updatedRequest);
                  }
                }
              }

              setStats(prevStats => {
                if (!prevStats) return DEFAULT_STATS;

                const newStats = {
                  total: newRequests.length,
                  pending: newRequests.filter(r => r?.status === 'pending').length,
                  inProgress: newRequests.filter(r => r?.status === 'in_progress').length,
                  completed: newRequests.filter(r => r?.status === 'completed').length,
                  averageResponseTime: prevStats.averageResponseTime
                };

                if (old_status === 'in_progress' && updatedRequest.status === 'completed') {
                  const responseTime = new Date(updatedRequest.updated_at).getTime() -
                                     new Date(updatedRequest.created_at).getTime();
                  const totalTime = (prevStats.averageResponseTime || 0) * prevStats.completed + responseTime;
                  newStats.averageResponseTime = totalTime / newStats.completed;
                }

                return newStats;
              });

              return newRequests;
            });
          },
          (status: 'disconnected' | 'connecting' | 'connected', error?: string) => {
            if (!isSubscribed) return;
            setIsConnected(status === 'connected');
            setConnectionError(error || null);
          }
        );
      } catch (error) {
        console.error('[SupportRequests] Setup error:', error);
        if (isSubscribed) {
          setIsConnected(false);
          setConnectionError('Erreur de connexion au serveur de mises à jour en temps réel');
        }
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (subscription) {
        subscription();
      }
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [user?.id, loadRequests]);

  const handleTakeRequest = async (request: SupportRequest) => {
    try {
      const updatedRequest = await supportRequestService.assignAdmin(request.id);

      setRequests(prev => {
        if (!Array.isArray(prev)) {
          return [updatedRequest];
        }
        return prev.map(r => r.id === updatedRequest.id ? updatedRequest : r);
      });

      setSelectedRequest(updatedRequest);
    } catch (error) {
      console.error('[SupportRequests] Error assigning admin:', error);
    }
  };

  const handleCompleteRequest = async (request: SupportRequest) => {
    if (!request || !request.id) {
      console.error('Invalid request:', request);
      return;
    }

    try {
      const updatedRequest = await supportRequestService.completeSupportRequest(request.id);

      if (selectedRequest?.id === request.id) {
        setSelectedRequest(null);
      }

      setRequests(prev => {
        if (!Array.isArray(prev)) {
          console.warn('[SupportRequests] Previous requests is not an array');
          return [updatedRequest];
        }

        if (!user) {
          console.warn('[SupportRequests] No user found');
          return prev;
        }

        return prev.map(r => r.id === updatedRequest.id ? updatedRequest : r);
      });
    } catch (error) {
      console.error('[SupportRequests] Error completing request:', error);
      try {
        await loadRequests();
      } catch (loadError) {
        console.error('[SupportRequests] Error reloading requests:', loadError);
      }
    }
  };

  const handleSort = useCallback((field: 'created_at' | 'status' | 'client.email') => {
    setSortField(currentField => {
      if (field === currentField) {
        setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
        return currentField;
      } else {
        setSortOrder('desc');
        return field;
      }
    });
  }, []);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(request => {
        if (statusFilter !== 'all' && request.status !== statusFilter) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
          request.client?.email?.toLowerCase().includes(searchLower) ||
          request.client?.first_name?.toLowerCase().includes(searchLower) ||
          request.client?.last_name?.toLowerCase().includes(searchLower) ||
          request.admin?.email?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const getValue = (obj: SupportRequest, field: typeof sortField): string => {
          switch (field) {
            case 'created_at':
              return obj.created_at;
            case 'status':
              return obj.status;
            case 'client.email':
              return obj.client?.email || '';
          }
        };

        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      });
  }, [requests, searchTerm, statusFilter, sortField, sortOrder]);

  const getClientName = (request: SupportRequest): string => {
    if (request.client?.first_name && request.client?.last_name) {
      return `${request.client.first_name} ${request.client.last_name}`;
    }
    return request.client?.email || 'Client inconnu';
  };

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
        <Box
          sx={{
            width: LAYOUT.NAV_WIDTH,
            display: { xs: 'none', sm: 'block' },
            flexShrink: 0,
          }}
        />

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{
            width: '100%',
            maxWidth: 'lg',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" component="h1">
                  Demandes de support
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: isConnected ? 'success.main' : 'error.main',
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {connectionError || (isConnected ? 'Connecté' : 'Déconnecté')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <SupportRequestsStats stats={stats} />

            <SupportRequestsFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography>Chargement des demandes...</Typography>
                </Box>
              ) : (
                <SupportRequestsTable
                  requests={filteredRequests}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onTakeRequest={handleTakeRequest}
                  onCompleteRequest={handleCompleteRequest}
                  onSelectRequest={setSelectedRequest}
                  userRole={user?.role}
                  userId={user?.id}
                />
              )}

              {selectedRequest ? (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <SupportRequestAdminChat
                    key={selectedRequest.id}
                    supportRequestId={selectedRequest.id}
                    clientName={getClientName(selectedRequest)}
                    onClose={() => setSelectedRequest(null)}
                    readOnly={selectedRequest.status === 'completed'}
                  />
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
