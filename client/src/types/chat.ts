/**
 * Chat types for AI Coach Assistant
 */

/**
 * A single message in the chat conversation.
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant';
  /** Text content of the message */
  content: string;
  /** When the message was created */
  timestamp: Date;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
}

/**
 * Request body for the chat stream endpoint.
 */
export interface ChatRequest {
  /** Array of previous messages in the conversation */
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Optional athlete ID to provide context */
  athleteId?: string;
}

/**
 * A chunk received from the SSE stream.
 */
export interface SSEChunk {
  /** Text content (for streaming response) */
  content?: string;
  /** Indicates stream has completed */
  done?: boolean;
  /** Error message if something went wrong */
  error?: string;
}
