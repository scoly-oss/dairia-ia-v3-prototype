import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  Chip,
  Paper,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReviewRequest } from '../services/reviewRequestService';

type SortField = 'created_at' | 'status' | 'client.email' | 'conversation.title';
type SortOrder = 'asc' | 'desc';

interface ReviewRequestsTableProps {
  requests: ReviewRequest[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onTakeRequest: (request: ReviewRequest) => void;
  onCompleteRequest: (request: ReviewRequest) => void;
  onSelectRequest: (request: ReviewRequest) => void;
  userRole?: string;
  userId?: string;
}

export const ReviewRequestsTable = ({
  requests,
  sortField,
  sortOrder,
  onSort,
  onTakeRequest,
  onCompleteRequest,
  onSelectRequest,
  userRole,
  userId,
}: ReviewRequestsTableProps): JSX.Element => {
  const getStatusColor = (status: string): 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const handleSort = (field: SortField) => {
    onSort(field);
  };

  return (
    <Paper sx={{ width: '100%', p: 0 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'created_at'}
                  direction={sortOrder}
                  onClick={() => handleSort('created_at')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'conversation.title'}
                  direction={sortOrder}
                  onClick={() => handleSort('conversation.title')}
                >
                  Question
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'client.email'}
                  direction={sortOrder}
                  onClick={() => handleSort('client.email')}
                >
                  Client
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortOrder}
                  onClick={() => handleSort('status')}
                >
                  Statut
                </TableSortLabel>
              </TableCell>
              <TableCell>Pris en charge par</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune demande de relecture trouvée
                </TableCell>
              </TableRow>
            ) : requests.map((request) => {
              return (
                <TableRow
                  key={request.id}
                  hover
                  onClick={() => onSelectRequest(request)}
                  sx={{ cursor: 'pointer' }}
                >
                <TableCell>
                  {formatDistanceToNow(new Date(request.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </TableCell>
                <TableCell>{request.conversation?.title || 'Conversation sans titre'}</TableCell>
                <TableCell>
                  {request.client ? (
                    request.client.first_name && request.client.last_name
                      ? `${request.client.first_name} ${request.client.last_name}`
                      : request.client.email || 'Email inconnu'
                  ) : 'Client inconnu'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(request.status)}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {request.lawyer
                    ? `${request.lawyer.first_name} ${request.lawyer.last_name}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {userRole === 'lawyer' && request.status === 'pending' && !request.lawyer_id && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeRequest(request);
                      }}
                    >
                      Prendre en charge
                    </Button>
                  )}
                  {userRole === 'lawyer' &&
                    request.status === 'in_progress' &&
                    request.lawyer_id === userId && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteRequest(request);
                        }}
                      >
                        Terminer
                      </Button>
                    )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
