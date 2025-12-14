---
date: 2025-12-13T22:45:00-06:00
author: NaniSkinner
branch: feat/chat-bot
repository: CoachLens
topic: "AI Coach Chat Assistant Implementation Plan"
tags: [plan, implementation, ai-assistant, chat-interface, openai-integration, sse-streaming]
status: ready-for-implementation
---

# AI Coach Chat Assistant Implementation Plan

**Date**: 2025-12-13T22:45:00-06:00
**Author**: NaniSkinner
**Branch**: feat/chat-bot
**Repository**: CoachLens

## Overview

Add a full-page AI Coach Chat Assistant to CoachLens that provides LTAD-informed coaching guidance using OpenAI with SSE streaming. The chat will integrate with the existing Claude compression agent for athlete history context.

## Decisions Summary

| Decision | Choice |
|----------|--------|
| LLM Provider | OpenAI for chat, keep Claude for existing agents |
| Streaming | Server-Sent Events (SSE) |
| Exercise Library | Embedded in system prompt (BRAINLIFT.md experts) |
| Chat History | Session-only (React state, no persistence) |
| Context Management | Existing Claude compression agent |
| UI Location | Full page at `/ai-coach`, nav item under Assessments |
| Athlete Context | Coach explicitly mentions or selects athlete |
| Guardrails | System prompt only (soft enforcement) |

---

## Phase 1: Backend Foundation

### 1.1 Update Config
**File**: `/backend/app/config.py`

Add OpenAI configuration:
```python
# OpenAI API (for Chat)
openai_api_key: Optional[str] = None
openai_model: str = "gpt-4o"
```

### 1.2 Create OpenAI Client
**File (new)**: `/backend/app/agents/openai_client.py`

Singleton pattern matching existing Anthropic client:
- `AsyncOpenAI` client with 60s timeout
- `chat_stream()` method yielding text chunks
- Error handling for rate limits, timeouts, API errors
- `get_openai_client()` singleton getter

### 1.3 Create Chat System Prompt
**File (new)**: `/backend/app/prompts/chat_context.py`

System prompt incorporating:
- Expert knowledge (Lloyd & Oliver, Gray Cook, Margaret Whitehead, Faigenbaum)
- Age-based expectations (5-7, 8-9, 10-11, 12-13)
- LTAD context from `static_context.py`
- Coaching cues from `static_context.py`
- Guardrails (no comparisons, age-appropriate, safety first, stay in scope)
- Response style guidelines

---

## Phase 2: Backend Chat Agent & Router

### 2.1 Create Chat Agent
**File (new)**: `/backend/app/agents/chat.py`

`ChatAgent` class:
- `__init__(coach_id)` - initialize with coach ID for data access
- `find_mentioned_athlete(message, athletes)` - name matching in message
- `get_athlete_context(athlete_id, name, age)` - fetch assessments, run compression agent, return summary
- `stream_response(messages, athlete_context)` - yield OpenAI chunks

### 2.2 Create SSE Endpoint
**File (new)**: `/backend/app/routers/chat.py`

Pydantic models:
- `ChatMessage` - role (user|assistant), content
- `ChatRequest` - messages array, optional athlete_id

Endpoint `POST /chat/stream`:
1. Validate auth via `get_current_user`
2. If `athlete_id` provided, fetch athlete and get context
3. Else, scan latest message for athlete name mentions
4. Return `StreamingResponse` with `text/event-stream`
5. SSE format: `data: {"content": "..."}\n\n` or `data: {"done": true}\n\n`

### 2.3 Register Router
**File**: `/backend/app/main.py`

Add import and register:
```python
from app.routers.chat import router as chat_router
app.include_router(chat_router)
```

---

## Phase 3: Frontend Foundation

### 3.1 Add Dependencies
**File**: `/client/package.json`

```json
"uuid": "^9.0.0",
"react-markdown": "^9.0.0"
```

### 3.2 Create Types
**File (new)**: `/client/src/types/chat.ts`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  athleteId?: string;
}

interface SSEChunk {
  content?: string;
  done?: boolean;
  error?: string;
}
```

### 3.3 Create Chat Service
**File (new)**: `/client/src/services/chat.ts`

`streamChat(request, onChunk, onError, onDone)`:
- Get Firebase auth token
- POST to `/chat/stream` with fetch
- Read response body as stream
- Parse SSE events and call callbacks
- Return AbortController for cancellation

---

## Phase 4: Frontend Components

### 4.1 ChatMessage Component
**File (new)**: `/client/src/pages/AICoach/components/ChatMessage.tsx`

- Different styling for user vs assistant
- Avatar icons (SmartToy for AI, Person for user)
- Loading spinner when streaming with no content
- Render content with react-markdown

### 4.2 ChatInput Component
**File (new)**: `/client/src/pages/AICoach/components/ChatInput.tsx`

- Athlete selector (Autocomplete with coach's athletes)
- Selected athlete chip with remove button
- Multiline TextField for message
- Send button (disabled when streaming)
- Enter key to send (Shift+Enter for newline)

### 4.3 WelcomeMessage Component
**File (new)**: `/client/src/pages/AICoach/components/WelcomeMessage.tsx`

- Welcome text explaining AI Coach capabilities
- 4 clickable suggestion cards:
  - Balance Exercises
  - Coaching Cues
  - Progression Ideas
  - Athlete Analysis

---

## Phase 5: Frontend Page & Integration

### 5.1 AI Coach Page
**File (new)**: `/client/src/pages/AICoach/index.tsx`

State:
- `messages: ChatMessage[]` - chat history (session only)
- `athletes: Athlete[]` - coach's athletes for selector
- `selectedAthlete: Athlete | null` - currently selected
- `isStreaming: boolean` - disable input during stream

Layout:
- Header with title and clear chat button
- Scrollable message area (flex: 1)
- Fixed input area at bottom

Functions:
- `handleSend(content, athleteId)` - add messages, call streamChat
- `handleClearChat()` - abort stream, reset state
- Auto-scroll to bottom on new messages

### 5.2 Add Route
**File**: `/client/src/routes/index.tsx`

Add import and route after `/assessments`:
```typescript
import AICoach from '../pages/AICoach';

{
  path: '/ai-coach',
  element: (
    <Layout>
      <ProtectedRoute>
        <AICoach />
      </ProtectedRoute>
    </Layout>
  ),
},
```

### 5.3 Add Sidebar Navigation
**File**: `/client/src/components/Layout/Sidebar.tsx`

Add to menuItems array:
```typescript
import SmartToyIcon from '@mui/icons-material/SmartToy';

{ text: 'AI Coach', icon: <SmartToyIcon />, path: '/ai-coach' },
```

---

## Phase 6: Environment & Testing

### 6.1 Environment Variable
**File**: `/backend/.env`

Add:
```
OPENAI_API_KEY=sk-...
```

### 6.2 Manual Testing Checklist
- [ ] Chat loads, shows welcome message
- [ ] Athlete selector populates with active athletes
- [ ] Sending message shows streaming response
- [ ] Selecting athlete includes context in response
- [ ] Mentioning athlete name in message triggers context lookup
- [ ] Clear chat resets state
- [ ] Error handling shows snackbar

---

## Files Summary

### New Files (10)
| File | Purpose |
|------|---------|
| `/backend/app/agents/openai_client.py` | OpenAI streaming client |
| `/backend/app/agents/chat.py` | Chat agent with athlete context |
| `/backend/app/routers/chat.py` | SSE streaming endpoint |
| `/backend/app/prompts/chat_context.py` | System prompt with LTAD/experts |
| `/client/src/types/chat.ts` | TypeScript interfaces |
| `/client/src/services/chat.ts` | SSE client service |
| `/client/src/pages/AICoach/index.tsx` | Main chat page |
| `/client/src/pages/AICoach/components/ChatMessage.tsx` | Message component |
| `/client/src/pages/AICoach/components/ChatInput.tsx` | Input component |
| `/client/src/pages/AICoach/components/WelcomeMessage.tsx` | Welcome screen |

### Modified Files (4)
| File | Change |
|------|--------|
| `/backend/app/config.py` | Add OpenAI config fields |
| `/backend/app/main.py` | Register chat router |
| `/client/src/routes/index.tsx` | Add /ai-coach route |
| `/client/src/components/Layout/Sidebar.tsx` | Add nav item |

---

## Implementation Order

1. Backend config + OpenAI client
2. Chat system prompt
3. Chat agent + router
4. Register router in main.py
5. Frontend types + service
6. Frontend components
7. Frontend page + routing
8. Testing

---

## Architecture Diagram

```
Frontend (React)                 Backend (FastAPI)                External
----------------                 ------------------               --------
ChatInput.tsx                    POST /chat/stream
  |                                   |
  v                                   v
EventSource (SSE) <------------- StreamingResponse
  |                                   |
  v                                   v
ChatMessage.tsx              openai_client.py (stream=True)
                                      |
                                      v
                             (If athlete mentioned)
                                      |
                                      v
                             compression.py (Claude Haiku)
                                      |
                                      v
                             athlete history summary
                                      |
                                      v
                             OpenAI chat completion
```

---

## Related Documents

- Research: `/thoughts/shared/research/ai-chat-assistant-integration.md`
- LTAD Knowledge: `/BRAINLIFT.md`
- Static Context: `/backend/app/prompts/static_context.py`
