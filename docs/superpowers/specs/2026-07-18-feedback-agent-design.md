# FeedbackAgent + Feedback Chat UI Design

**Date:** 2026-07-18  
**Status:** Approved  
**Author:** Claude Code

---

## Overview

This design covers the FeedbackAgent (backend) and the Feedback Chat UI (frontend). The FeedbackAgent processes customer feedback messages, classifies themes, calculates severity, and generates suggested fixes using Claude API. The Feedback Chat UI provides a floating widget for customers to submit feedback and an enhanced manager dashboard to view insights.

---

## Goals

1. **Automated Feedback Analysis** - Classify feedback themes and calculate severity automatically
2. **Actionable Insights** - Generate suggested fixes for each theme
3. **Customer Feedback Flow** - Easy submission via chat widget on product pages
4. **Manager Visibility** - Real-time insights on the Feedback tab

---

## Architecture

### Single-Agent Pipeline

```
FeedbackAgent
├── Input: Batch of feedback messages
├── Step 1: PII Redaction (Claude API)
│   └── Detect emails, phones, names → replace with [REDACTED]
├── Step 2: Theme Classification (Claude API)
│   └── Classify into: delivery, pricing, quality, service, other
├── Step 3: Severity Calculation
│   └── Count mentions per theme → high (>10), medium (5-10), low (<5)
├── Step 4: Fix Generation (Claude API)
│   └── Generate suggested fix per theme
└── Output: FeedbackInsights { themes: FeedbackTheme[], trace: AgentTrace }
```

---

## Backend Implementation

### New File: `backend/app/agents/feedback_agent.py`

```python
from ..models.schemas import AgentTrace, FeedbackTheme, TraceLog

def analyze_feedback(messages: list[dict]) -> dict:
    """
    Analyze feedback messages and return insights.
    
    Steps:
    1. PII Redaction via Claude API
    2. Theme Classification via Claude API
    3. Severity Calculation (count-based)
    4. Fix Generation via Claude API
    
    Returns:
        {
            "themes": [FeedbackTheme, ...],
            "trace": AgentTrace
        }
    """
    pass

def redact_pii(text: str) -> str:
    """Use Claude API to detect and redact PII."""
    pass

def classify_theme(text: str) -> str:
    """Use Claude API to classify feedback theme."""
    pass

def calculate_severity(count: int) -> str:
    """Calculate severity based on mention count."""
    if count > 10:
        return "high"
    elif count >= 5:
        return "medium"
    return "low"

def generate_fix(theme: str, messages: list[str]) -> str:
    """Use Claude API to generate suggested fix."""
    pass
```

### Updated File: `backend/app/models/schemas.py`

Add new models:

```python
class FeedbackTheme(BaseModel):
    theme: str
    icon: str
    count: int
    severity: Literal["low", "medium", "high"]
    suggestedFix: str

class FeedbackInsights(BaseModel):
    themes: list[FeedbackTheme]
    trace: AgentTrace
```

### Updated File: `backend/app/routes/feedback.py`

Add new endpoints:

```python
@router.post("/analyze", response_model=FeedbackInsights)
def analyze_feedback(user: AuthUser = Depends(manager_user)):
    """Trigger FeedbackAgent analysis on all feedback."""
    pass

@router.get("/insights", response_model=FeedbackInsights)
def get_insights(user: AuthUser = Depends(manager_user)):
    """Get latest feedback insights from audit_log."""
    pass
```

### Environment Variables

Add to `backend/.env`:

```
ANTHROPIC_API_KEY=your_claude_api_key
```

---

## Frontend Implementation

### New File: `frontend/src/services/feedbackService.ts`

```typescript
import { Feedback, FeedbackInsights } from '@/types';
import { apiRequest } from './api';

export async function submitFeedback(message: string): Promise<Feedback> {
  return apiRequest<Feedback>('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

export async function analyzeFeedback(): Promise<FeedbackInsights> {
  return apiRequest<FeedbackInsights>('/feedback/analyze', {
    method: 'POST',
  });
}

export async function getInsights(): Promise<FeedbackInsights> {
  return apiRequest<FeedbackInsights>('/feedback/insights');
}
```

### New File: `frontend/src/components/FeedbackChatWidget.tsx`

A floating chat bubble component:

- **Position:** Fixed bottom-right corner
- **States:**
  - Collapsed: Chat bubble icon
  - Expanded: Chat window with input and submit button
- **Behavior:**
  - Click bubble to expand/collapse
  - Type message and click Send
  - Show confirmation after submission
  - Auto-close after 2 seconds

**UI Structure:**
```
┌─────────────────────────┐
│  💬 Feedback            │
├─────────────────────────┤
│  Share your thoughts... │
│  ┌───────────────────┐  │
│  │ Type feedback...  │  │
│  └───────────────────┘  │
│           [Send]        │
└─────────────────────────┘
```

### Updated File: `frontend/src/components/dashboard/FeedbackPanel.tsx`

Replace hardcoded data with real API calls:

- Fetch insights on mount
- Show theme cards with severity badges
- Show recent feedback messages with theme tags
- Add "Analyze" button for manual trigger
- Loading and error states

### Updated File: `frontend/src/app/products/[id]/page.tsx`

Add FeedbackChatWidget to product pages.

### Updated File: `frontend/src/types/index.ts`

Add new types:

```typescript
export interface FeedbackTheme {
  theme: string;
  icon: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

export interface FeedbackInsights {
  themes: FeedbackTheme[];
  trace: AgentTrace;
}
```

---

## API Endpoints

### POST /feedback/analyze

**Trigger:** Manager clicks "Analyze" button or auto-trigger on new submission

**Request:** None (processes all feedback)

**Response:**
```json
{
  "themes": [
    {
      "theme": "delivery",
      "icon": "📦",
      "count": 12,
      "severity": "high",
      "suggestedFix": "Add proactive ETA messages at checkout and post-purchase tracking updates"
    }
  ],
  "trace": {
    "agentName": "Feedback Agent",
    "agentIcon": "AI",
    "status": "active",
    "lastAction": "Analyzed 27 feedback messages",
    "lastRun": "just now",
    "logs": [
      {"timestamp": "00:00.000", "type": "trigger", "text": "Received 27 feedback messages"},
      {"timestamp": "00:00.100", "type": "reasoning", "text": "Redacting PII from messages"},
      {"timestamp": "00:00.300", "type": "action", "text": "Classified 5 themes"},
      {"timestamp": "00:00.500", "type": "result", "text": "Top theme: delivery (12 mentions)"},
      {"timestamp": "00:00.600", "type": "guardrail", "text": "PII redacted before analysis"}
    ]
  }
}
```

### GET /feedback/insights

**Response:** Same as POST /feedback/analysis (returns cached insights from audit_log)

---

## Data Flow

```
Customer submits feedback
        ↓
POST /feedback → backend stores in DB
        ↓
Background task triggers FeedbackAgent (async)
        ↓
Step 1: PII Redaction (Claude API)
Step 2: Theme Classification (Claude API)
Step 3: Severity Calculation
Step 4: Fix Generation (Claude API)
        ↓
Store insights in audit_log
        ↓
Manager views Feedback tab
        ↓
GET /feedback/insights → display themes + fixes
```

**Auto-trigger mechanism:**
- When `POST /feedback` is called, spawn a background task to run `analyze_feedback()`
- Use `BackgroundTasks` from FastAPI for async execution
- Rate limit: max 1 analysis per minute (skip if last analysis was <60s ago)

---

## Guardrails

1. **PII Redaction** - All PII removed before analysis
2. **No Sensitive Data in Audit** - Redacted messages only
3. **Fallback Handling** - If Claude API fails, use keyword-based classification
4. **Rate Limiting** - Max 1 analysis per minute

---

## Error Handling

| Error | Fallback |
|-------|----------|
| Claude API failure | Keyword-based classification |
| Network error | Show retry button in UI |
| Empty feedback | Show "No feedback yet" state |
| Rate limit hit | Show "Analysis in progress" message |

---

## Testing

### Backend Tests

- `test_feedback_agent.py`:
  - Test PII redaction (emails, phones, names)
  - Test theme classification
  - Test severity calculation
  - Test fix generation
  
- `test_feedback_routes.py`:
  - Test POST /feedback/analyze
  - Test GET /feedback/insights
  - Test authentication (manager only)

### Frontend Tests

- Manual testing of chat widget
- Verify FeedbackPanel shows real data
- Test error states and loading states

---

## Implementation Order

1. **Backend Agent** - `feedback_agent.py` with Claude API integration
2. **Backend Routes** - Update `feedback.py` with new endpoints
3. **Frontend Service** - `feedbackService.ts`
4. **Frontend Types** - Update `types/index.ts`
5. **FeedbackChatWidget** - New component
6. **FeedbackPanel** - Update to use real data
7. **Product Pages** - Add chat widget
8. **Testing** - Backend and frontend tests

---

## Dependencies

- Claude API (Anthropic) for PII redaction, theme classification, fix generation
- Existing feedback routes and repository
- Supabase for data storage (mock mode for demo)

---

## Success Criteria

1. ✅ FeedbackAgent processes messages and returns insights
2. ✅ PII is redacted before analysis
3. ✅ Themes are classified correctly
4. ✅ Severity is calculated based on mention count
5. ✅ Suggested fixes are generated for each theme
6. ✅ Customer can submit feedback via chat widget
7. ✅ Manager can view insights on Feedback tab
8. ✅ Analysis can be triggered manually or automatically
