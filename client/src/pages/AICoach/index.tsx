import { useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { WelcomeMessage } from './components/WelcomeMessage';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { Athlete } from '../../types/athlete';
import chatService from '../../services/chat';
import athletesService from '../../services/athletes';
import { useSnackbar } from '../../contexts/SnackbarContext';

// Type for navigation state from Dashboard
interface NavigationState {
  initialQuery?: string;
  athleteId?: string;
}

export function AICoach() {
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');
  const initialQueryProcessed = useRef(false);

  // Cleanup on unmount - abort any ongoing stream
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch athletes on mount
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const data = await athletesService.getAll();
        // Only show athletes with active consent
        setAthletes(data.filter((a) => a.consentStatus === 'active'));
      } catch (err) {
        console.error('Failed to fetch athletes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  // Handle initial query from Dashboard navigation
  useEffect(() => {
    const state = location.state as NavigationState | null;

    // Only process once and when athletes are loaded
    if (state?.initialQuery && !loading && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;

      // Find and select athlete if athleteId provided
      if (state.athleteId) {
        const athlete = athletes.find((a) => a.id === state.athleteId);
        if (athlete) {
          setSelectedAthlete(athlete);
        }
      }

      // Send the initial query
      handleSend(state.initialQuery, state.athleteId);

      // Clear location state to prevent re-triggering on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading, athletes]);

  const handleSend = async (content: string, athleteId?: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add placeholder assistant message
    const assistantMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    streamingContentRef.current = ''; // Reset streaming content ref

    // Prepare message history for API (exclude the placeholder)
    const messageHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = await chatService.streamChat(
        {
          messages: messageHistory,
          athleteId,
        },
        // onChunk - accumulate in ref to avoid StrictMode double-append
        (chunk) => {
          streamingContentRef.current += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant') {
              // Set content from ref instead of appending to avoid duplication
              updated[updated.length - 1] = {
                ...lastMsg,
                content: streamingContentRef.current,
              };
            }
            return updated;
          });
        },
        // onError
        (error) => {
          showSnackbar(`Chat error: ${error}`, 'error');
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant' && !lastMsg.content) {
              lastMsg.content = 'Sorry, I encountered an error. Please try again.';
            }
            lastMsg.isStreaming = false;
            return updated;
          });
          setIsStreaming(false);
        },
        // onDone
        () => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            lastMsg.isStreaming = false;
            return updated;
          });
          setIsStreaming(false);
        }
      );
    } catch (err) {
      showSnackbar('Failed to start chat', 'error');
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    // Abort any ongoing stream
    abortControllerRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!isStreaming) {
      handleSend(prompt, selectedAthlete?.id);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Coach Assistant
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get personalized coaching advice based on LTAD principles
          </Typography>
        </Box>
        {messages.length > 0 && (
          <Tooltip title="Clear chat">
            <IconButton onClick={handleClearChat} disabled={isStreaming}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Chat messages area */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          mb: 2,
          p: 3,
          overflow: 'auto',
          bgcolor: 'background.default',
          borderRadius: 2,
        }}
      >
        {messages.length === 0 ? (
          <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Paper>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming || loading}
        athletes={athletes}
        selectedAthlete={selectedAthlete}
        onAthleteSelect={setSelectedAthlete}
      />
    </Container>
  );
}

export default AICoach;
