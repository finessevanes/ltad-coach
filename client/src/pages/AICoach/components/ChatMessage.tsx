import { Box, Paper, CircularProgress, Typography } from '@mui/material';
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
        mb: 2,
        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          maxWidth: '80%',
          bgcolor: isAssistant ? 'white' : '#EFF6FF',
          borderRadius: 2,
          border: '1px solid',
          borderColor: isAssistant ? 'grey.200' : 'primary.200',
          borderLeft: isAssistant ? '4px solid' : 'none',
          borderLeftColor: isAssistant ? '#2563EB' : 'transparent',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
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
