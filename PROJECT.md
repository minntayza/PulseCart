# PulseCart — Project Specification

## Overview

PulseCart is an agentic commerce operations copilot — a hackathon prototype demonstrating multi-agent orchestration in a shopping context. Five AI agents collaborate in real-time to assist customers and empower managers with autonomous e-commerce operations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | FastAPI (Python), Pydantic Settings |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (JWT) |
| AI Agents | Anthropic Messages API (mimo-v2.5-pro) |
| Storage | Supabase Storage (product images) |
| Email | SMTP (Burmese-language notifications) |

---

## Architecture

```
PulseCart/
├── frontend/                 # Next.js 16 App Router
│   ├── src/
│   │   ├── app/              # 6 routes
│   │   ├── components/       # 18 components
│   │   ├── services/         # 10 service modules
│   │   ├── data/             # Fixture data
│   │   └── types/            # TypeScript interfaces
├── backend/                  # FastAPI Python app
│   ├── app/
│   │   ├── agents/           # 5 AI agents
│   │   ├── routes/           # 8 route files (26 endpoints)
│   │   ├── models/           # Pydantic schemas
│   │   ├── services/         # Email delivery
│   │   ├── auth.py           # Auth middleware
│   │   ├── config.py         # Settings
│   │   └── repository.py     # Dual: Memory / Supabase
│   ├── sql/                  # 5 migrations (11 tables)
│   └── scripts/              # seed.py, set_user_role.py
└── .planning/                # Project docs
```

### Dual Repository Pattern

The backend supports two modes controlled by `USE_MOCK_DATA`:

- **MemoryRepository** — Thread-safe in-memory store. No database required. Default for development.
- **SupabaseRepository** — Full CRUD against Supabase. Used in production.

`get_repository()` factory selects the implementation at startup.

---

## Database Schema (11 Tables)

### Core

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (user_id, username, role, interests). Auto-created on signup via trigger. |
| `products` | Product catalog (name, category, price, stock, image, specs, descriptions, is_active) |
| `orders` | Customer orders (status: pending → approved/rejected → delivered) |
| `order_items` | Line items per order (product, quantity, unit_price) |

### Agent & Analytics

| Table | Purpose |
|-------|---------|
| `audit_log` | Immutable agent action trail (agent_name, action, input, output, timestamp) |
| `feedback` | Customer feedback (message, theme, severity) |
| `email_outbox` | Reliable email queue (event_type, recipient, status: pending/sent/failed) |

### Chat System

| Table | Purpose |
|-------|---------|
| `chat_conversations` | Chat session containers (user_id, title) |
| `chat_messages` | Individual messages (role, content, product_ids) |
| `wanted_products` | Customer product requests detected from chat (status: pending/stocked/dismissed) |

### Infrastructure

| Table | Purpose |
|-------|---------|
| `searches` | Search query log |

**Storage:** `product-images` bucket (public, 5MB, JPEG/PNG/WebP)

---

## AI Agents

| Agent | Function | Method |
|-------|----------|--------|
| **RecommenderAgent** | `rank_products()` — Keyword scoring for search results | name (5pts) + category (3pts) + description (2pts) |
| **MarketAnalystAgent** | `analyze_market()` — Competitor price comparison | Compares internal vs competitor prices, recommends keep/review/urgent |
| **OrderCoordinatorAgent** | `order_trace()`, `complete_delivery()`, `notify_rejection()` | Order lifecycle + Burmese email notifications via outbox |
| **FeedbackAgent** | `analyze_feedback()` — Theme/severity extraction | Anthropic API with keyword fallback |
| **ChatAgent** | `chat_respond()` — Conversational AI with tool-use | Product lookup, order status, search, wanted product detection |

---

## API Endpoints (26)

### Public (5)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (status, mode) |
| `GET` | `/products` | List all products |
| `GET` | `/products/{id}` | Get single product |
| `POST` | `/search` | Search with agent re-ranking |
| `GET` | `/feedback/insights` | Latest feedback insights |

### Authenticated — Customer (7)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Create order |
| `GET` | `/orders/me` | User's order history |
| `POST` | `/feedback` | Submit feedback (triggers analysis) |
| `GET` | `/chat/conversations` | List chat conversations |
| `POST` | `/chat/conversations` | Create new conversation |
| `GET` | `/chat/conversations/{id}/messages` | Get conversation messages |
| `POST` | `/chat/conversations/{id}/messages` | Send message, get AI reply |

### Manager Only (14)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/manager/orders` | List all orders |
| `PATCH` | `/manager/orders/{id}` | Approve/reject order |
| `POST` | `/manager/orders/{id}/deliver` | Mark delivered (triggers email) |
| `POST` | `/manager/products` | Create product (FormData) |
| `PUT` | `/manager/products/{id}` | Update product |
| `DELETE` | `/manager/products/{id}` | Delete product |
| `POST` | `/products/generate-details` | Generate product details via LLM |
| `GET` | `/feedback` | List all feedback |
| `POST` | `/feedback/analyze` | Trigger feedback analysis |
| `GET` | `/agents/traces` | Agent activity logs |
| `POST` | `/agents/market_analyst` | Run market analysis |
| `GET` | `/chat/wanted` | List wanted products |
| `PATCH` | `/chat/wanted/{id}` | Update wanted product status |
| `DELETE` | `/chat/wanted/{id}` | Delete wanted product |

---

## Frontend Routes (6)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Storefront | Product grid, search, category filter, checkout, agent activity |
| `/login` | Login | Sign-in form |
| `/register` | Register | Customer registration |
| `/products/[id]` | Product Detail | Image, specs, recommendations, related products |
| `/account/orders` | Order History | User's orders with auto-refresh |
| `/manager` | Dashboard | Stats, orders, market insights, feedback, agents, products, wanted |

---

## Frontend Services (10)

| Service | Purpose |
|---------|---------|
| `api.ts` | Centralized fetch wrapper with token refresh and 401 retry |
| `authService.ts` | Supabase Auth: login, register, logout, session subscribe |
| `chatService.ts` | Chat CRUD: conversations, messages, wanted products |
| `feedbackService.ts` | Feedback: get insights, list feedback, trigger analysis |
| `managerProductService.ts` | Product CRUD with FormData image upload |
| `orderService.ts` | Orders: create, list, update status, mark delivered |
| `productService.ts` | Read-only product catalog |
| `searchService.ts` | Search with agent re-ranking |
| `storage.ts` | localStorage/sessionStorage wrappers with DOM events |
| `supabase.ts` | Lazy singleton Supabase client |

---

## Order Lifecycle

```
Customer creates order (pending)
        │
        ▼
Manager reviews
    ├── Approves ──► Order marked approved
    │                    │
    │                    ▼
    │              Manager delivers ──► Order marked delivered
    │                                      │
    │                                      ▼
    │                              Burmese delivery email sent
    │                              (via email_outbox)
    │
    └── Rejects ──► Order marked rejected
                         │
                         ▼
                  Burmese rejection apology email sent
                  (via email_outbox)
```

---

## Chat Flow

```
User sends message
        │
        ▼
Backend receives via /chat/conversations/{id}/messages
        │
        ▼
ChatAgent.chat_respond() called
        │
        ├── Has Anthropic API key?
        │   ├── Yes → LLM with tool-use (product lookup, order status, search)
        │   └── No  → Keyword-based fallback
        │
        ├── Detects "wanted product" mention?
        │   └── Yes → Saves to wanted_products table
        │
        ├── Response contains product IDs?
        │   └── Yes → Fetches product details for chat cards
        │
        ▼
Returns ChatResponse(response, productIds, wantedProduct)
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
USE_MOCK_DATA=true              # Toggle mock vs Supabase
SUPABASE_URL=                   # Supabase project URL
SUPABASE_PUBLISHABLE_KEY=       # Supabase publishable key
SUPABASE_SECRET_KEY=            # Supabase service role key
ANTHROPIC_API_KEY=              # For LLM agents (optional)
ANTHROPIC_BASE_URL=             # Custom API base URL (optional)
CHAT_MODEL=mimo-v2.5-pro        # Model for chat/feedback agents
EMAIL_ENABLED=false             # Enable SMTP
SMTP_HOST=                      # SMTP server
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Supabase publishable key
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend URL
```

---

## Development Commands

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000  # http://localhost:8000/docs
pytest -q
```

### Database Setup

```bash
# Run SQL migrations in order
sql/001_day1_schema.sql
sql/002_auth_profile_trigger.sql
sql/003_product_catalog_and_storage.sql
sql/004_order_delivery.sql
sql/005_chat_and_wanted_products.sql

# Seed products
python scripts/seed.py

# Promote manager
python scripts/set_user_role.py manager@pulsecart.demo manager
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@pulsecart.demo` | `Manager123!` |
| Customer | `customer@pulsecart.demo` | `Customer123!` |

---

## Key Design Decisions

1. **Agent traces are capped** at 100 entries (backend) / 20 entries (frontend localStorage)
2. **Email notifications** are sent in Burmese language
3. **Backend Pydantic models** use camelCase aliases for JSON serialization
4. **Frontend TypeScript interfaces** match backend camelCase output
5. **Products use `is_active`** (DB) mapped to `isActive` (API/model)
6. **Category:** `headphones` — used in both backend and frontend
7. **Product images** stored in Supabase Storage bucket `product-images`
8. **RLS policies** enforce per-table access control in Supabase
