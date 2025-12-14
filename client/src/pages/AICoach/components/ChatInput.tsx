import { useState, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Autocomplete,
  Chip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Athlete } from '../../../types/athlete';

interface Props {
  onSend: (message: string, athleteId?: string) => void;
  disabled?: boolean;
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  onAthleteSelect: (athlete: Athlete | null) => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  athletes,
  selectedAthlete,
  onAthleteSelect,
}: Props) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), selectedAthlete?.id);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      {/* Athlete selector */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          size="small"
          options={athletes}
          getOptionLabel={(option) => `${option.name} (Age ${option.age})`}
          value={selectedAthlete}
          onChange={(_, value) => onAthleteSelect(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select athlete for context (optional)"
              placeholder="Type athlete name..."
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Age {option.age} | {option.consentStatus}
                </Typography>
              </Box>
            </li>
          )}
        />
        {selectedAthlete && (
          <Chip
            label={`Discussing: ${selectedAthlete.name}`}
            onDelete={() => onAthleteSelect(null)}
            size="small"
            color="primary"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Message input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about exercises, balance training, or an athlete's progress..."
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
