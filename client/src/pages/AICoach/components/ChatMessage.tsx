import { Box, Paper, Avatar, CircularProgress, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../../../types/chat';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isAssistant = message.role === 'assistant';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexDirection: isAssistant ? 'row' : 'row-reverse',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isAssistant ? 'primary.main' : 'secondary.main',
          width: 36,
          height: 36,
        }}
      >
        {isAssistant ? <SmartToyIcon /> : <PersonIcon />}
      </Avatar>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: isAssistant ? 'grey.50' : 'primary.50',
          borderRadius: 2,
        }}
      >
        {message.isStreaming && !message.content ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              '& p:first-of-type': { mt: 0 },
              '& p:last-of-type': { mb: 0 },
              '& ul, & ol': { pl: 2, my: 1 },
              '& li': { mb: 0.5 },
              '& h1, & h2, & h3': { mt: 2, mb: 1 },
              '& code': {
                bgcolor: 'grey.200',
                px: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
              },
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        )}

        {message.isStreaming && message.content && (
          <CircularProgress
            size={12}
            sx={{ ml: 1, verticalAlign: 'middle' }}
          />
        )}
      </Paper>
    </Box>
  );
}
