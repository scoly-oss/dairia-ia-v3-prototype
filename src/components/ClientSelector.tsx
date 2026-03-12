import React, { useState, useEffect } from 'react';
import { SxProps, Theme } from '@mui/material';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress
} from '@mui/material';
import { clientService, ClientOption } from '../services/clientService';

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  label = "Client",
  placeholder = "Sélectionner un client",
  required = false,
  fullWidth = true,
  helperText,
  disabled = false,
  sx
}) => {
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);

  // Charger les clients depuis le service
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const clients = await clientService.getClients();
        setOptions(clients || []);
        
        // Si un client est déjà sélectionné, récupérer ses informations
        if (value) {
          const selectedClient = clients?.find(client => client.id === value) || null;
          setSelectedClient(selectedClient);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [value]);

  // Gérer le changement de sélection
  const handleChange = (
    _event: React.SyntheticEvent<Element, Event>,
    newValue: ClientOption | null
  ) => {
    setSelectedClient(newValue);
    onChange(newValue?.id || null);
  };

  return (
    <Autocomplete
      value={selectedClient}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(
        _event: React.SyntheticEvent<Element, Event>,
        newInputValue: string
      ) => {
        setInputValue(newInputValue);
      }}
      options={options}
      getOptionLabel={(option) => 
        option.full_name 
          ? `${option.full_name} (${option.email})` 
          : option.email
      }
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField sx={sx}
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }
          }}
        />
      )}
      // Use the default renderOption behavior
      slotProps={{
        popper: {
          placement: 'bottom-start'
        }
      }}
    />
  );
};

export default ClientSelector;
