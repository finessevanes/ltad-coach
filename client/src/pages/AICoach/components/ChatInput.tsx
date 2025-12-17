import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Autocomplete,
  Chip,
  Typography,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PeopleIcon from '@mui/icons-material/People';
import { Athlete } from '../../../types/athlete';

interface Props {
  onSend: (message: string, athleteId?: string) => void;
  disabled?: boolean;
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  onAthleteSelect: (athlete: Athlete | null) => void;
  suggestedPrompt?: string;
  onSuggestedPromptConsumed?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  athletes,
  selectedAthlete,
  onAthleteSelect,
  suggestedPrompt,
  onSuggestedPromptConsumed,
}: Props) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (suggestedPrompt) {
      setMessage(suggestedPrompt);
      onSuggestedPromptConsumed?.();
      // Focus and move cursor to end of text
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [suggestedPrompt, onSuggestedPromptConsumed]);

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

  const handleVoiceInput = () => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsListening(false);
      }
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: 'grey.50',
      }}
    >
      {/* Message input with inline athlete selector */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        {/* Athlete selector - compact dropdown */}
        <Autocomplete
          size="small"
          options={athletes}
          getOptionLabel={(option) => `${option.name} (Age ${option.age})`}
          value={selectedAthlete}
          onChange={(_, value) => onAthleteSelect(value)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: 180 }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select Athletes"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PeopleIcon sx={{ color: 'text.secondary', mr: 0.5, ml: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
                sx: {
                  bgcolor: 'white',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.300',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.400',
                  },
                },
              }}
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

        {/* Text input */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing to interact..."
          disabled={disabled}
          inputRef={inputRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'grey.300',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'grey.400',
              },
            },
          }}
        />

        {/* Voice input button */}
        {isVoiceSupported && (
          <Tooltip title={isListening ? 'Stop recording' : 'Voice input'}>
            <IconButton
              onClick={handleVoiceInput}
              disabled={disabled}
              sx={{
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'grey.300',
                color: isListening ? 'error.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: isListening ? 'error.lighter' : 'grey.100',
                  borderColor: 'grey.400',
                },
              }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Send button with lime color */}
        <IconButton
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          sx={{
            bgcolor: '#D4FF00',
            color: 'black',
            '&:hover': { bgcolor: '#c0e600' },
            '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
