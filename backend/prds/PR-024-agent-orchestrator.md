COMPLETED

---
id: BE-024
depends_on: [BE-001]
blocks: [BE-026, BE-027, BE-028]
---

# BE-024: Agent Orchestrator (Routing Logic)

## Scope

**In Scope:**
- Request routing to appropriate agents
- Pure Python logic (no LLM)
- Route based on request type

**Out of Scope:**
- Agent implementations (BE-026, BE-027, BE-028)
- Prompt engineering

## Technical Decisions

- **Pattern**: Simple conditional routing
- **No LLM**: Pure Python decision logic
- **Routes**:
  - New assessment → Assessment Agent
  - Parent report → Compression Agent → Progress Agent
  - Progress view → Compression Agent → Progress Agent
- **Location**: `app/services/agent_orchestrator.py`

## Acceptance Criteria

- [ ] Routes requests to correct agent
- [ ] No LLM calls in orchestrator itself
- [ ] Clear request type enum
- [ ] Returns structured response

## Files to Create/Modify

- `app/services/agent_orchestrator.py` (create)
- `app/models/agent.py` (create - request/response models)

## Implementation Notes

**app/models/agent.py**:
```python
from enum import Enum
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class AgentRequestType(str, Enum):
    NEW_ASSESSMENT = "new_assessment"
    GENERATE_REPORT = "generate_report"
    VIEW_PROGRESS = "view_progress"

class AgentRequest(BaseModel):
    requestType: AgentRequestType
    currentMetrics: Optional[Dict[str, Any]] = None
    historicalAssessments: Optional[List[Dict[str, Any]]] = None
    athleteAge: Optional[int] = None
    coachId: Optional[str] = None

class AgentResponse(BaseModel):
    feedback: str
    agentUsed: str
    tokensUsed: Optional[int] = None
```

**app/services/agent_orchestrator.py**:
```python
from app.models.agent import AgentRequest, AgentResponse, AgentRequestType
from typing import Dict, Any

class AgentOrchestrator:
    """
    Routes requests to appropriate AI agents

    No LLM in orchestrator - pure conditional logic
    """

    def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Route request to appropriate agent

        Args:
            request: AgentRequest with type and context

        Returns:
            AgentResponse with feedback
        """
        if request.requestType == AgentRequestType.NEW_ASSESSMENT:
            return self._route_to_assessment_agent(request)

        elif request.requestType == AgentRequestType.GENERATE_REPORT:
            return self._route_to_progress_agent(request)

        elif request.requestType == AgentRequestType.VIEW_PROGRESS:
            return self._route_to_progress_agent(request)

        else:
            raise ValueError(f"Unknown request type: {request.requestType}")

    def _route_to_assessment_agent(self, request: AgentRequest) -> AgentResponse:
        """Route to Assessment Agent (BE-027)"""
        # Placeholder - will be implemented in BE-027
        return AgentResponse(
            feedback="Assessment agent not yet implemented",
            agentUsed="assessment"
        )

    def _route_to_progress_agent(self, request: AgentRequest) -> AgentResponse:
        """
        Route to Progress Agent (via Compression Agent)

        BE-028 and BE-026
        """
        # Placeholder
        return AgentResponse(
            feedback="Progress agent not yet implemented",
            agentUsed="progress"
        )

# Global instance
agent_orchestrator = AgentOrchestrator()
```

## Testing

```python
# Test routing logic
request = AgentRequest(
    requestType=AgentRequestType.NEW_ASSESSMENT,
    currentMetrics={"duration": 18.5}
)

response = agent_orchestrator.process_request(request)
assert response.agentUsed == "assessment"
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
