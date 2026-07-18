# AI Chat with Product Recommendations + Wanted Products

**Date:** 2026-07-18
**Status:** Approved
**Replaces:** Feedback submission (moved to secondary mode in dual-mode widget)

---

## Overview

Replace the primary feedback widget with a conversational AI chat that recommends products from the inventory. When users ask for products not in stock, the AI automatically logs them to a "wanted products" table visible on the manager dashboard. The existing feedback system is preserved as a secondary mode in the floating widget.

### Goals
1. Customers can have natural conversations to discover products
2. AI recommends products from real inventory based on user needs (budget, brand, category)
3. Missing product requests are automatically captured as demand signals
4. Managers see wanted products as a new dashboard tab for inventory decisions

### Non-Goals
- AI does not place orders or access payment info
- AI does not handle returns, shipping, or general support
- No real-time streaming (request/response model)
- No user profiling or personalization across sessions

---

## Data Model

### `chat_conversations` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | FK to `auth.users(id)`, not null |
| title | text | Auto-generated from first user message (truncated to 80 chars) |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()`, updated on each new message |

RLS: Users can only read/write their own conversations. Managers can read all.

### `chat_messages` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| conversation_id | uuid | FK to `chat_conversations(id)`, not null, ON DELETE CASCADE |
| role | text | CHECK: `'user'` or `'assistant'`, not null |
| content | text | The text message, not null |
| product_ids | jsonb | Array of product UUIDs (assistant messages only). Default `'[]'` |
| created_at | timestamptz | Default `now()` |

RLS: Users can only read messages in their own conversations.

### `wanted_products` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | FK to `auth.users(id)`, not null |
| product_name | text | Normalized (lowercase, trimmed). NOT NULL |
| description | text | Additional context from the user's request |
| mention_count | int | Default 1. Incremented when another user asks for the same product |
| conversation_id | uuid | FK to `chat_conversations(id)` — first mention link |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |
| status | text | CHECK: `'pending'`, `'stocked'`, `'dismissed'`. Default `'pending'` |

**Deduplication:** `product_name` is normalized (lowercase, extra whitespace removed). When a new wanted product matches an existing one (case-insensitive), `mention_count` is incremented and `updated_at` is refreshed instead of creating a duplicate row.

RLS: Customers can insert wanted products. Managers can read/update all.

### Migration File

New file: `backend/sql/005_chat_and_wanted_products.sql`

---

## Backend Architecture

### New Agent: `ChatAgent`

**File:** `backend/app/agents/chat_agent.py`

Core function:

```python
async def chat_respond(
    message: str,
    conversation_history: list[dict],
    products: list[Product]
) -> ChatResponse
```

**Response model:**
```python
class ChatResponse(BaseModel):
    response: str                    # Natural language reply
    product_ids: list[str]           # Product IDs to show as cards
    wanted_product: dict | None      # { "name": "...", "description": "..." } if detected
```

**LLM Prompt Strategy:**

System prompt includes:
- Role: "You are PulseCart's friendly product advisor."
- Full product catalog as compact context (id, name, category, price, stock, description for all active products)
- Instructions to return JSON with `response`, `productIds`, and `wantedProduct`
- Rules: Only recommend products from the catalog. Be honest about what's available. Set `wantedProduct` when user asks for something clearly not in stock. Suggest similar alternatives from the catalog.
- Budget awareness: If user mentions a budget, filter recommendations to products within that range.

**Fallback** (no API key or API error):
- Use existing `rank_products()` keyword scoring
- Template response: "Here are some products that might interest you:"
- `wanted_product` = None (keyword fallback can't detect intent)

### New Routes

**File:** `backend/app/routes/chat.py`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/chat/conversations` | Customer | List user's conversations (sorted by updated_at desc) |
| `POST` | `/chat/conversations` | Customer | Create new conversation (auto-titles from first message) |
| `GET` | `/chat/conversations/{id}/messages` | Customer | Get messages for a conversation |
| `POST` | `/chat/conversations/{id}/messages` | Customer | Send message, get AI response |
| `GET` | `/chat/wanted` | Manager | List all wanted products (aggregated, sorted by mention_count desc) |
| `PATCH` | `/chat/wanted/{id}` | Manager | Update status (pending → stocked/dismissed) |

**`POST /chat/conversations/{id}/messages` flow:**
1. Validate conversation belongs to user
2. Save user message to `chat_messages`
3. Fetch last 10 messages from `chat_messages` for history
4. Fetch all active products from repository
5. Call `chat_respond(message, history, products)`
6. Save AI response to `chat_messages` (with `product_ids`)
7. If `wanted_product` is not None, upsert to `wanted_products` (increment `mention_count` if exists)
8. Fetch full product details for the `product_ids`
9. Return: `{ message: ChatMessage, products: Product[] }`

### Repository Additions

**File:** `backend/app/repository.py`

New methods on both `MemoryRepository` and `SupabaseRepository`:

```python
# Conversations
def create_conversation(self, user_id: str, title: str) -> ChatConversation
def list_conversations(self, user_id: str) -> list[ChatConversation]

# Messages
def get_messages(self, conversation_id: str) -> list[ChatMessage]
def add_message(self, conversation_id: str, role: str, content: str, product_ids: list[str]) -> ChatMessage

# Wanted Products
def upsert_wanted_product(self, user_id: str, product_name: str, description: str, conversation_id: str) -> WantedProduct
def list_wanted_products(self) -> list[WantedProduct]
def update_wanted_status(self, wanted_id: str, status: str) -> WantedProduct
```

### Pydantic Models

**File:** `backend/app/models/schemas.py`

New models:
```python
class ChatConversation(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str

class ChatMessage(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    product_ids: list[str] = []
    created_at: str

class WantedProduct(BaseModel):
    id: str
    user_id: str
    product_name: str
    description: str | None
    mention_count: int
    conversation_id: str
    created_at: str
    updated_at: str
    status: Literal["pending", "stocked", "dismissed"]

class CreateConversationRequest(BaseModel):
    first_message: str | None = None  # Optional first message to seed the conversation

class SendMessageRequest(BaseModel):
    content: str  # 1-2000 chars
```

### Config Addition

**File:** `backend/app/config.py`

Add to `Settings`:
```python
chat_model: str = "mimo-v2.5-pro"  # Model for chat responses
chat_max_tokens: int = 1024
```

---

## Frontend Architecture

### Dual-Mode Floating Widget

**File:** `frontend/src/components/FloatingChatWidget.tsx` (modify existing)

The widget gains a mode toggle at the top of the expanded panel:

```
┌─────────────────────────┐
│ [💬 AI Chat] [📝 Feedback] │  ← Tab toggle
├─────────────────────────┤
│                         │
│  (mode-specific content)│
│                         │
└─────────────────────────┘
```

**AI Chat Mode (default):**
- Shows conversation list if user has existing conversations
- "New Chat" button starts a fresh conversation
- Chat messages with product cards
- Quick action chips at the start of new conversations

**Feedback Mode:**
- Existing feedback submission UI (unchanged)
- One-shot message → "Thank you!" acknowledgment

The mode toggle uses the same `activeTab` pattern used in the manager dashboard.

### Chat Panel Component

**New file:** `frontend/src/components/ChatPanel.tsx`

This is the main chat UI, rendered when "AI Chat" tab is active in the floating widget.

**States:**
1. **Conversation list**: Shows existing conversations with titles and timestamps. "New Chat" button at top.
2. **Active conversation**: Chat messages with product cards. Text input at bottom.
3. **Loading**: Typing indicator while AI responds.
4. **Error**: Friendly fallback message if AI is unavailable.

**Product Card in Chat:**
```
┌──────────────────────────────────┐
│ [img]  Product Name              │
│        Category · $XX.XX         │
│        [View Details →]          │
└──────────────────────────────────┘
```

Compact horizontal layout, renders inside the assistant's message bubble area.

### Quick Action Chips

Shown only at the start of a new conversation (no messages yet):
- "🎮 Gaming setup under $500"
- "🎧 Best headphones"
- "💻 Laptops for work"
- "💰 Budget accessories"

Clicking a chip sends it as the first message.

### Frontend Service

**New file:** `frontend/src/services/chatService.ts`

```typescript
export async function listConversations(token: string): Promise<ChatConversation[]>
export async function createConversation(token: string, firstMessage?: string): Promise<ChatConversation>
export async function getMessages(token: string, conversationId: string): Promise<ChatMessage[]>
export async function sendMessage(token: string, conversationId: string, content: string): Promise<{ message: ChatMessage, products: Product[] }>
export async function getWantedProducts(token: string): Promise<WantedProduct[]>
export async function updateWantedStatus(token: string, wantedId: string, status: string): Promise<WantedProduct>
```

### Manager Dashboard: Wanted Products Tab

**New file:** `frontend/src/components/dashboard/WantedPanel.tsx`

**Tab configuration** (add to manager page tabs):
```typescript
{ id: 'wanted', label: 'Wanted Products', icon: '🎯' }
```

**Layout:**
1. **Stats row**: Total unique wanted products, total mentions, most requested category
2. **Table** with columns:
   - Product Name (bold)
   - Description (truncated)
   - Mentions (badge with count)
   - Status (pending/stocked/dismissed badge)
   - Actions (Mark as Stocked, Dismiss buttons for pending items)
3. **Empty state**: "No wanted products yet. As customers chat with AI, product requests will appear here."

Sorted by `mention_count` descending (highest demand first).

### TypeScript Types

**File:** `frontend/src/types/index.ts`

Add:
```typescript
interface ChatConversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  productIds: string[]
  createdAt: string
}

interface WantedProduct {
  id: string
  userId: string
  productName: string
  description: string | null
  mentionCount: number
  conversationId: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'stocked' | 'dismissed'
}
```

---

## Error Handling

### Backend
- **LLM API failure**: Fall back to keyword-based product search. Log the error. Return response with products but no `wantedProduct`.
- **Invalid JSON from LLM**: Parse the text portion only, return without product cards. Log warning.
- **Conversation not found / unauthorized**: Return 404 (don't leak existence).
- **Empty message**: Return 422 validation error.

### Frontend
- **API error on send**: Show "Something went wrong. Please try again." in the chat as an assistant message.
- **Network error**: Show retry button.
- **Product not found**: Skip rendering that card, show text only.

---

## Migration Strategy

1. Create migration `005_chat_and_wanted_products.sql` with the three new tables + RLS policies
2. Add new Pydantic models to `schemas.py`
3. Add repository methods to both `MemoryRepository` and `SupabaseRepository`
4. Create `chat_agent.py` with the LLM logic
5. Create `chat.py` routes
6. Register the new router in `main.py`
7. Create frontend types, service, and components
8. Modify `FloatingChatWidget.tsx` to add dual-mode toggle
9. Add WantedProducts tab to manager dashboard

---

## Testing

### Backend
- Unit test for `chat_respond()` with mocked LLM
- Unit test for wanted product upsert (deduplication logic)
- Integration test for chat message flow (create conversation → send message → get response)
- Test fallback behavior when LLM is unavailable

### Frontend
- Manual testing of chat flow (send message, see product cards, start new conversation)
- Test dual-mode toggle between AI Chat and Feedback
- Test manager wanted products tab (view, mark as stocked, dismiss)
- Test responsive layout on mobile

---

## Summary of Changes

| Area | Files Modified | Files Created |
|------|---------------|---------------|
| Backend Routes | `main.py` | `app/routes/chat.py` |
| Backend Agent | — | `app/agents/chat_agent.py` |
| Backend Models | `app/models/schemas.py` | — |
| Backend Repository | `app/repository.py` | — |
| Backend Config | `app/config.py` | — |
| Database | — | `sql/005_chat_and_wanted_products.sql` |
| Frontend Types | `src/types/index.ts` | — |
| Frontend Services | — | `src/services/chatService.ts` |
| Frontend Components | `src/components/FloatingChatWidget.tsx` | `src/components/ChatPanel.tsx` |
| Frontend Manager | `src/app/manager/page.tsx` | `src/components/dashboard/WantedPanel.tsx` |
