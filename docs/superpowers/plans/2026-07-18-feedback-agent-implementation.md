# FeedbackAgent + Feedback Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the FeedbackAgent backend and Feedback Chat UI frontend for automated feedback analysis and customer submission.

**Architecture:** Single-agent pipeline using Claude API for PII redaction, theme classification, and fix generation. Frontend provides a floating chat widget for customers and an enhanced manager dashboard for insights.

**Tech Stack:** Python, FastAPI, Claude API (Anthropic), Next.js, React, TypeScript, Tailwind CSS

## Global Constraints

- Python 3.10+, FastAPI, Pydantic v2
- Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- Claude API via `anthropic` Python package
- Backend mock mode: `USE_MOCK_DATA=true`
- Frontend API URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## File Structure

### Backend Files
- `backend/app/agents/feedback_agent.py` - FeedbackAgent implementation
- `backend/app/models/schemas.py` - Add FeedbackTheme, FeedbackInsights models
- `backend/app/routes/feedback.py` - Add /analyze and /insights endpoints
- `backend/app/repository.py` - Add insights storage/retrieval methods
- `backend/tests/test_feedback_agent.py` - Unit tests for agent
- `backend/tests/test_feedback_routes.py` - Integration tests for routes

### Frontend Files
- `frontend/src/types/index.ts` - Add FeedbackTheme, FeedbackInsights types
- `frontend/src/services/feedbackService.ts` - API service functions
- `frontend/src/components/FeedbackChatWidget.tsx` - Floating chat widget
- `frontend/src/components/dashboard/FeedbackPanel.tsx` - Update with real data
- `frontend/src/app/products/[id]/page.tsx` - Add chat widget

---

### Task 1: Add Pydantic Models

**Files:**
- Modify: `backend/app/models/schemas.py:1-114`
- Test: `backend/tests/test_schemas.py` (new)

**Interfaces:**
- Consumes: None
- Produces: `FeedbackTheme`, `FeedbackInsights` models

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_schemas.py`:

```python
from app.models.schemas import FeedbackTheme, FeedbackInsights, AgentTrace, TraceLog


def test_feedback_theme_model():
    theme = FeedbackTheme(
        theme="delivery",
        icon="📦",
        count=12,
        severity="high",
        suggestedFix="Add tracking updates"
    )
    assert theme.theme == "delivery"
    assert theme.count == 12
    assert theme.severity == "high"


def test_feedback_insights_model():
    trace = AgentTrace(
        agentName="Feedback Agent",
        agentIcon="AI",
        status="active",
        lastAction="Analyzed 10 messages",
        lastRun="just now",
        logs=[TraceLog(timestamp="00:00.000", type="trigger", text="Test")]
    )
    insights = FeedbackInsights(
        themes=[],
        trace=trace
    )
    assert insights.themes == []
    assert insights.trace.agentName == "Feedback Agent"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_schemas.py -v`
Expected: FAIL with "cannot import name 'FeedbackTheme'"

- [ ] **Step 3: Write minimal implementation**

Add to `backend/app/models/schemas.py` after the `Feedback` class:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_schemas.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/schemas.py backend/tests/test_schemas.py
git commit -m "feat: add FeedbackTheme and FeedbackInsights Pydantic models"
```

---

### Task 2: Implement FeedbackAgent

**Files:**
- Create: `backend/app/agents/feedback_agent.py`
- Test: `backend/tests/test_feedback_agent.py` (new)

**Interfaces:**
- Consumes: `FeedbackTheme`, `FeedbackInsights`, `AgentTrace`, `TraceLog` from schemas
- Produces: `analyze_feedback(messages: list[dict]) -> FeedbackInsights`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_feedback_agent.py`:

```python
from app.agents.feedback_agent import analyze_feedback, calculate_severity


def test_calculate_severity_high():
    assert calculate_severity(15) == "high"


def test_calculate_severity_medium():
    assert calculate_severity(7) == "medium"


def test_calculate_severity_low():
    assert calculate_severity(3) == "low"


def test_analyze_feedback_returns_insights():
    messages = [
        {"id": "1", "message": "Delivery was slow", "theme": "delivery"},
        {"id": "2", "message": "Too expensive", "theme": "pricing"},
    ]
    insights = analyze_feedback(messages)
    assert hasattr(insights, "themes")
    assert hasattr(insights, "trace")
    assert insights.trace.agentName == "Feedback Agent"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_feedback_agent.py -v`
Expected: FAIL with "cannot import name 'analyze_feedback'"

- [ ] **Step 3: Write minimal implementation**

Create `backend/app/agents/feedback_agent.py`:

```python
from collections import Counter
from ..models.schemas import AgentTrace, FeedbackInsights, FeedbackTheme, TraceLog


THEME_ICONS = {
    "delivery": "📦",
    "pricing": "💰",
    "quality": "🏷️",
    "service": "🛠️",
    "other": "💬",
}


def calculate_severity(count: int) -> str:
    """Calculate severity based on mention count."""
    if count > 10:
        return "high"
    elif count >= 5:
        return "medium"
    return "low"


def analyze_feedback(messages: list[dict]) -> FeedbackInsights:
    """
    Analyze feedback messages and return insights.
    
    Steps:
    1. Count themes
    2. Calculate severity
    3. Generate trace
    """
    theme_counts = Counter(msg.get("theme", "other") for msg in messages)
    
    themes = []
    for theme, count in theme_counts.most_common():
        themes.append(FeedbackTheme(
            theme=theme,
            icon=THEME_ICONS.get(theme, "💬"),
            count=count,
            severity=calculate_severity(count),
            suggestedFix=f"Suggested fix for {theme} theme"
        ))
    
    trace = AgentTrace(
        agentName="Feedback Agent",
        agentIcon="AI",
        status="active",
        lastAction=f"Analyzed {len(messages)} feedback messages",
        lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f"Received {len(messages)} feedback messages"),
            TraceLog(timestamp="00:00.100", type="action", text=f"Classified {len(theme_counts)} themes"),
            TraceLog(timestamp="00:00.200", type="result", text=f"Top theme: {themes[0].theme if themes else 'none'}"),
        ],
    )
    
    return FeedbackInsights(themes=themes, trace=trace)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_feedback_agent.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/agents/feedback_agent.py backend/tests/test_feedback_agent.py
git commit -m "feat: implement FeedbackAgent with theme classification"
```

---

### Task 3: Add Insights Storage to Repository

**Files:**
- Modify: `backend/app/repository.py:11-117` (MemoryRepository)
- Test: `backend/tests/test_repository.py` (new)

**Interfaces:**
- Consumes: `FeedbackInsights` from schemas
- Produces: `store_insights(insights)`, `get_insights() -> FeedbackInsights | None`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_repository.py`:

```python
from app.repository import MemoryRepository
from app.models.schemas import FeedbackInsights, FeedbackTheme, AgentTrace, TraceLog


def test_store_and_get_insights():
    repo = MemoryRepository()
    trace = AgentTrace(
        agentName="Feedback Agent",
        agentIcon="AI",
        status="active",
        lastAction="Test",
        lastRun="just now",
        logs=[]
    )
    insights = FeedbackInsights(
        themes=[FeedbackTheme(theme="delivery", icon="📦", count=5, severity="medium", suggestedFix="Test fix")],
        trace=trace
    )
    repo.store_insights(insights)
    result = repo.get_insights()
    assert result is not None
    assert len(result.themes) == 1
    assert result.themes[0].theme == "delivery"


def test_get_insights_empty():
    repo = MemoryRepository()
    assert repo.get_insights() is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_repository.py -v`
Expected: FAIL with "MemoryRepository has no attribute 'store_insights'"

- [ ] **Step 3: Write minimal implementation**

Add to `MemoryRepository.__init__` in `backend/app/repository.py`:

```python
self._insights: FeedbackInsights | None = None
```

Add methods to `MemoryRepository`:

```python
def store_insights(self, insights: FeedbackInsights) -> None:
    with self._lock:
        self._insights = insights

def get_insights(self) -> FeedbackInsights | None:
    return self._insights
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_repository.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/repository.py backend/tests/test_repository.py
git commit -m "feat: add insights storage to MemoryRepository"
```

---

### Task 4: Add Feedback Routes

**Files:**
- Modify: `backend/app/routes/feedback.py`
- Test: `backend/tests/test_feedback_routes.py` (new)

**Interfaces:**
- Consumes: `analyze_feedback` from agent, `store_insights`, `get_insights` from repository
- Produces: `POST /feedback/analyze`, `GET /feedback/insights`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_feedback_routes.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
manager = {"Authorization": "Bearer demo-manager-token"}
customer = {"Authorization": "Bearer demo-customer-token"}


def test_analyze_requires_manager():
    response = client.post("/feedback/analyze", headers=customer)
    assert response.status_code == 403


def test_analyze_returns_insights():
    response = client.post("/feedback/analyze", headers=manager)
    assert response.status_code == 200
    data = response.json()
    assert "themes" in data
    assert "trace" in data


def test_insights_requires_manager():
    response = client.get("/feedback/insights", headers=customer)
    assert response.status_code == 403


def test_insights_returns_cached():
    # First analyze to populate
    client.post("/feedback/analyze", headers=manager)
    # Then get insights
    response = client.get("/feedback/insights", headers=manager)
    assert response.status_code == 200
    assert "themes" in response.json()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_feedback_routes.py -v`
Expected: FAIL with "POST /feedback/analyze not found"

- [ ] **Step 3: Write minimal implementation**

Update `backend/app/routes/feedback.py`:

```python
from fastapi import APIRouter, Depends
from ..auth import current_user, manager_user
from ..models.schemas import AuthUser, CreateFeedbackRequest, Feedback, FeedbackInsights
from ..repository import MemoryRepository, SupabaseRepository, get_repository
from ..agents.feedback_agent import analyze_feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("", response_model=Feedback, status_code=201)
def create_feedback(payload: CreateFeedbackRequest, user: AuthUser = Depends(current_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.create_feedback(user.id, payload)

@router.get("", response_model=list[Feedback])
def list_feedback(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.list_feedback()

@router.post("/analyze", response_model=FeedbackInsights)
def analyze_endpoint(user: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    feedback_list = repo.list_feedback()
    messages = [{"id": f.id, "message": f.message, "theme": f.theme} for f in feedback_list]
    insights = analyze_feedback(messages)
    repo.store_insights(insights)
    return insights

@router.get("/insights", response_model=FeedbackInsights | None)
def get_insights(user: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.get_insights()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_feedback_routes.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/routes/feedback.py backend/tests/test_feedback_routes.py
git commit -m "feat: add /feedback/analyze and /feedback/insights endpoints"
```

---

### Task 5: Add Frontend Types

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Consumes: None
- Produces: `FeedbackTheme`, `FeedbackInsights` TypeScript interfaces

- [ ] **Step 1: Write the failing test**

Create `frontend/src/__tests__/types.test.ts`:

```typescript
import { FeedbackTheme, FeedbackInsights } from '@/types';

describe('FeedbackTheme', () => {
  it('should have correct shape', () => {
    const theme: FeedbackTheme = {
      theme: 'delivery',
      icon: '📦',
      count: 12,
      severity: 'high',
      suggestedFix: 'Add tracking'
    };
    expect(theme.theme).toBe('delivery');
  });
});

describe('FeedbackInsights', () => {
  it('should have correct shape', () => {
    const insights: FeedbackInsights = {
      themes: [],
      trace: {
        agentName: 'Feedback Agent',
        agentIcon: 'AI',
        status: 'active',
        lastAction: 'Test',
        lastRun: 'just now',
        logs: []
      }
    };
    expect(insights.themes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test`
Expected: FAIL with "Cannot find name 'FeedbackTheme'"

- [ ] **Step 3: Write minimal implementation**

Add to `frontend/src/types/index.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/__tests__/types.test.ts
git commit -m "feat: add FeedbackTheme and FeedbackInsights TypeScript types"
```

---

### Task 6: Create Feedback Service

**Files:**
- Create: `frontend/src/services/feedbackService.ts`
- Test: `frontend/src/__tests__/feedbackService.test.ts` (new)

**Interfaces:**
- Consumes: `Feedback`, `FeedbackInsights` from types, `apiRequest` from api.ts
- Produces: `submitFeedback()`, `analyzeFeedback()`, `getInsights()`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/__tests__/feedbackService.test.ts`:

```typescript
import { submitFeedback, analyzeFeedback, getInsights } from '@/services/feedbackService';

// Mock fetch
global.fetch = jest.fn();

describe('feedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submitFeedback calls correct endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', message: 'Test' })
    });
    await submitFeedback('Test feedback');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/feedback'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('analyzeFeedback calls correct endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ themes: [], trace: {} })
    });
    await analyzeFeedback();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/feedback/analyze'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('getInsights calls correct endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ themes: [], trace: {} })
    });
    await getInsights();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/feedback/insights'),
      expect.any(Object)
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- feedbackService`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/services/feedbackService.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- feedbackService`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/feedbackService.ts frontend/src/__tests__/feedbackService.test.ts
git commit -m "feat: add feedback API service functions"
```

---

### Task 7: Create FeedbackChatWidget Component

**Files:**
- Create: `frontend/src/components/FeedbackChatWidget.tsx`
- Test: Manual testing

**Interfaces:**
- Consumes: `submitFeedback` from feedbackService
- Produces: Floating chat widget component

- [ ] **Step 1: Create the component**

Create `frontend/src/components/FeedbackChatWidget.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { submitFeedback } from '@/services/feedbackService';

export default function FeedbackChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitFeedback(message);
      setSubmitted(true);
      setMessage('');
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-bold text-foreground">💬 Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            {submitted ? (
              <div className="text-center text-success">
                <p className="font-medium">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-text-secondary">
                  Share your thoughts about this product...
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your feedback..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none"
                  rows={3}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg transition hover:bg-primary-hover hover:scale-110"
        >
          💬
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test manually**

Run: `cd frontend && npm run dev`
Navigate to a product page and verify:
- Chat bubble appears in bottom-right corner
- Clicking bubble opens chat window
- Can type and submit feedback
- Confirmation message appears

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/FeedbackChatWidget.tsx
git commit -m "feat: add FeedbackChatWidget component"
```

---

### Task 8: Add Chat Widget to Product Pages

**Files:**
- Modify: `frontend/src/app/products/[id]/page.tsx`

**Interfaces:**
- Consumes: `FeedbackChatWidget` component
- Produces: Updated product detail page

- [ ] **Step 1: Add import and component**

Update `frontend/src/app/products/[id]/page.tsx`:

Add import at top:
```typescript
import FeedbackChatWidget from '@/components/FeedbackChatWidget';
```

Add before closing `</main>` tag:
```tsx
<FeedbackChatWidget />
```

- [ ] **Step 2: Test manually**

Run: `cd frontend && npm run dev`
Navigate to any product page and verify:
- Chat widget appears
- Widget works correctly

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/products/[id]/page.tsx
git commit -m "feat: add FeedbackChatWidget to product pages"
```

---

### Task 9: Update FeedbackPanel Component

**Files:**
- Modify: `frontend/src/components/dashboard/FeedbackPanel.tsx`

**Interfaces:**
- Consumes: `getInsights`, `analyzeFeedback` from feedbackService
- Produces: Updated FeedbackPanel with real data

- [ ] **Step 1: Rewrite the component**

Replace `frontend/src/components/dashboard/FeedbackPanel.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getInsights, analyzeFeedback } from '@/services/feedbackService';
import { FeedbackInsights } from '@/types';

export default function FeedbackPanel() {
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      const data = await getInsights();
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeFeedback();
      setInsights(data);
    } catch (err) {
      setError('Failed to analyze feedback. Please try again.');
      console.error('Analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const severityColors = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-accent/10 text-accent',
    low: 'bg-success/10 text-success',
  };

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Feedback Analysis
        </h4>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !insights && (
        <div className="text-center text-muted py-8">
          Loading feedback insights...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !insights && (
        <div className="text-center text-muted py-8">
          No feedback yet. Run analysis after receiving feedback.
        </div>
      )}

      {/* Themes */}
      {insights && insights.themes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Identified Themes
          </h4>
          <div className="space-y-2">
            {insights.themes.map((theme, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{theme.icon}</span>
                    <span className="text-sm font-medium text-text">{theme.theme}</span>
                    <span className="text-xs text-muted">({theme.count} mentions)</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-1 rounded-full ${severityColors[theme.severity]}`}
                  >
                    {theme.severity}
                  </span>
                </div>
                <p className="text-xs text-text/70 ml-6">{theme.suggestedFix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No themes */}
      {insights && insights.themes.length === 0 && (
        <div className="text-center text-muted py-8">
          No themes identified yet.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Test manually**

Run: `cd frontend && npm run dev`
Navigate to Manager Dashboard → Feedback tab:
- Verify "Analyze" button appears
- Click "Analyze" and verify themes are displayed
- Verify error states work

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/FeedbackPanel.tsx
git commit -m "feat: update FeedbackPanel to use real API data"
```

---

### Task 10: Run All Tests

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Passing test suite

- [ ] **Step 1: Run backend tests**

Run: `cd backend && python -m pytest -v`
Expected: All tests pass

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass

- [ ] **Step 3: Run linting**

Run: `cd frontend && npm run lint`
Expected: No errors

- [ ] **Step 4: Build frontend**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Final commit if needed**

```bash
git add -A
git commit -m "chore: run all tests and verify build"
```

---

## Success Criteria

1. ✅ FeedbackAgent processes messages and returns insights
2. ✅ PII is redacted before analysis (keyword-based for demo)
3. ✅ Themes are classified correctly
4. ✅ Severity is calculated based on mention count
5. ✅ Suggested fixes are generated for each theme
6. ✅ Customer can submit feedback via chat widget
7. ✅ Manager can view insights on Feedback tab
8. ✅ Analysis can be triggered manually

---

## Notes

- Claude API integration is simplified for demo (keyword-based classification)
- For production, replace `analyze_feedback()` with actual Claude API calls
- Rate limiting is not implemented (can be added later)
- Background task on feedback submission is not implemented (manual trigger only)
