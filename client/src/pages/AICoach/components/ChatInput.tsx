import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PeopleIcon from '@mui/icons-material/People';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { Athlete } from '../../../types/athlete';

// Type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [athleteMenuAnchor, setAthleteMenuAnchor] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
    <Box>
      {/* Text input with athlete selector and action buttons inside */}
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask CoachAI about athlete performance..."
        disabled={disabled}
        inputRef={inputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Select athlete">
                  <IconButton
                    onClick={(e) => setAthleteMenuAnchor(e.currentTarget)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    <PeopleIcon fontSize="small" />
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {selectedAthlete && (
                  <Chip
                    label={selectedAthlete.name}
                    size="small"
                    onDelete={() => onAthleteSelect(null)}
                    deleteIcon={<CloseIcon />}
                    sx={{
                      bgcolor: 'black',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                        '&:hover': {
                          color: 'grey.200',
                        },
                      },
                    }}
                  />
                )}
              </Box>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Voice input button */}
                {isVoiceSupported && (
                  <Tooltip title={isListening ? 'Stop recording' : 'Voice input'}>
                    <span>
                      <IconButton
                        onClick={handleVoiceInput}
                        disabled={disabled}
                        size="small"
                        sx={{
                          color: isListening ? 'error.main' : 'text.secondary',
                          '&:hover': {
                            bgcolor: 'grey.100',
                          },
                        }}
                      >
                        {isListening ? <MicOffIcon /> : <MicIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}

                {/* Send button with lime color */}
                <IconButton
                  onClick={handleSend}
                  disabled={disabled || !message.trim()}
                  size="small"
                  sx={{
                    bgcolor: '#D4FF00',
                    color: 'black',
                    '&:hover': { bgcolor: '#c0e600' },
                    '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'grey.300',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'grey.400',
            },
          },
        }}
      />

      {/* Athlete selector menu */}
      <Menu
        anchorEl={athleteMenuAnchor}
        open={Boolean(athleteMenuAnchor)}
        onClose={() => setAthleteMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 300,
              width: 250,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onAthleteSelect(null);
            setAthleteMenuAnchor(null);
          }}
          selected={!selectedAthlete}
        >
          <Typography variant="body2" color="text.secondary">
            All Athletes
          </Typography>
        </MenuItem>
        {athletes.map((athlete) => (
          <MenuItem
            key={athlete.id}
            onClick={() => {
              onAthleteSelect(athlete);
              setAthleteMenuAnchor(null);
            }}
            selected={selectedAthlete?.id === athlete.id}
          >
            <Box>
              <Typography variant="body2">{athlete.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Age {athlete.age}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
