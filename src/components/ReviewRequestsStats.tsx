import { Grid, Card, CardContent, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  averageResponseTime?: number;
}

interface ReviewRequestsStatsProps {
  stats: Stats;
}

export const ReviewRequestsStats = ({ stats }: ReviewRequestsStatsProps): JSX.Element => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} j`;
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3, ml: 0, width: '100%' }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ p: 0 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total
            </Typography>
            <Typography variant="h5" component="div">
              <AssignmentIcon sx={{ mr: 1 }} />
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ p: 0 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              En attente
            </Typography>
            <Typography variant="h5" component="div" color="warning.main">
              <AccessTimeIcon sx={{ mr: 1 }} />
              {stats.pending}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ p: 0 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              En cours
            </Typography>
            <Typography variant="h5" component="div" color="info.main">
              <AccessTimeIcon sx={{ mr: 1 }} />
              {stats.inProgress}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ p: 0 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Terminées
            </Typography>
            <Typography variant="h5" component="div" color="success.main">
              <CheckCircleIcon sx={{ mr: 1 }} />
              {stats.completed}
            </Typography>
            {stats.averageResponseTime && (
              <Typography variant="caption" color="textSecondary">
                Temps moyen : {formatTime(stats.averageResponseTime)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
