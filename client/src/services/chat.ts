/**
 * Chat service for AI Coach Assistant
 *
 * Handles streaming chat responses via Server-Sent Events (SSE)
 */

import { auth } from '../firebase/config';
import { ChatRequest, SSEChunk } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Stream chat response via Server-Sent Events
 *
 * @param request - Chat request with message history
 * @param onChunk - Callback for each streamed text chunk
 * @param onError - Callback for errors
 * @param onDone - Callback when streaming completes
 * @returns AbortController to cancel the stream
 */
export const streamChat = async (
  request: ChatRequest,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<AbortController> => {
  const controller = new AbortController();

  try {
    // Get auth token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const token = await currentUser.getIdToken();

    // Convert camelCase to snake_case for request body
    const body = {
      messages: request.messages,
      athlete_id: request.athleteId,
    };

    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let doneCalled = false; // Guard against double onDone() calls

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (!doneCalled) {
          doneCalled = true;
          onDone();
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer - events are separated by double newline
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete event in buffer

      for (const event of events) {
        const lines = event.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const chunk: SSEChunk = JSON.parse(data);

              if (chunk.error) {
                onError(chunk.error);
                return controller;
              }

              if (chunk.done) {
                if (!doneCalled) {
                  doneCalled = true;
                  onDone();
                }
                return controller;
              }

              if (chunk.content) {
                onChunk(chunk.content);
              }
            } catch {
              // Skip malformed JSON
              console.warn('Failed to parse SSE chunk:', data);
            }
          }
        }
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name !== 'AbortError') {
      onError(err.message || 'Failed to connect to chat');
    }
  }

  return controller;
};

const chatService = {
  streamChat,
};

export default chatService;
