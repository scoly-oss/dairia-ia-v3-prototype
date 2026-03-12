import { Box, TextField, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

interface SupportRequestsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const SupportRequestsFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SupportRequestsFiltersProps): JSX.Element => {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
      <TextField
        size="small"
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{ input: {
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
        }}}
        sx={{ flexGrow: 1 }}
      />
      <TextField
        select
        size="small"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        slotProps={{ input: {
          startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />,
        }}}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="all">Tous les statuts</MenuItem>
        <MenuItem value="pending">En attente</MenuItem>
        <MenuItem value="in_progress">En cours</MenuItem>
        <MenuItem value="completed">Terminées</MenuItem>
      </TextField>
    </Box>
  );
};
