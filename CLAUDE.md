# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PulseCart is an agentic commerce operations copilot — a hackathon prototype demonstrating multi-agent orchestration in a shopping context. Four AI agents collaborate in real-time: a Recommender Agent (keyword-based product ranking), a Market Analyst Agent (competitor price comparison), an Order Coordinator Agent (order processing + email delivery workflow), and a Feedback Agent (Anthropic API or keyword-based analysis).

## Development Commands

### Frontend (Next.js 16 + Tailwind CSS 4)
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build (use to verify changes)
npm run lint         # ESLint check
```

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000  # API docs: http://localhost:8000/docs
pytest -q            # Run tests (backend/tests/test_day1.py)
```

### Backend Mock Mode
Default: `USE_MOCK_DATA=true` in `backend/.env`. Demo bearer tokens:
- Customer: `Bearer demo-customer-token`
- Manager: `Bearer demo-manager-token`

Demo accounts (Supabase auth):
- Manager: `manager@pulsecart.demo` / `Manager123!`
- Customer: `customer@pulsecart.demo` / `Customer123!`

### Enable Supabase
1. Create Supabase project
2. Run SQL migrations in order: `sql/001_day1_schema.sql` → `002_auth_profile_trigger.sql` → `003_product_catalog_and_storage.sql` → `004_order_delivery.sql`
3. Set `USE_MOCK_DATA=false` in `backend/.env`
4. Seed products: `python scripts/seed.py`
5. Promote manager: `python scripts/set_user_role.py manager@example.com manager`

## Architecture

### Monorepo Structure
```
PulseCart/
├── frontend/           # Next.js 16 app
│   ├── src/
│   │   ├── app/        # 6 routes (App Router): /, /login, /register, /products/[id], /account/orders, /manager
│   │   ├── components/ # 17 components (11 top-level + 6 in dashboard/)
│   │   ├── data/       # Fixture files: products, productDetails, competitors, feedback, agents
│   │   ├── services/   # 9 services (api, auth, feedback, managerProduct, order, product, search, storage, supabase)
│   │   └── types/      # 15 TypeScript interfaces + formatPrice() utility
├── backend/            # FastAPI Python app
│   ├── app/
│   │   ├── agents/     # 3 agents: recommender, order_coordinator, feedback_agent
│   │   ├── routes/     # 6 route files: products, search, orders, feedback, agents, manager_products
│   │   ├── models/     # 15 Pydantic schemas
│   │   ├── services/   # email.py (SMTP delivery/rejection emails in Burmese)
│   │   ├── auth.py     # Demo tokens + Supabase auth validation
│   │   ├── config.py   # pydantic-settings (17 config fields)
│   │   ├── repository.py  # Dual pattern: MemoryRepository + SupabaseRepository
│   │   └── fixtures.py # Mock product data
│   ├── sql/            # 4 migration files (001-004)
│   ├── scripts/        # seed.py, set_user_role.py
│   └── tests/          # test_day1.py
└── .planning/          # Project docs, roadmap, sketches
```

### Key Architectural Patterns

**Frontend:**
- Next.js App Router with `src/` directory
- Tailwind CSS 4 with `@theme inline` and CSS custom properties for dark/light themes (`data-theme` attribute on `<html>`)
- 17 color tokens defined in `globals.css` (`:root` for light, `[data-theme="dark"]` for dark)
- Browser-only mock services using localStorage/sessionStorage (wrapped in `storage.ts`)
- Real-time agent activity feed with trace visualization
- Role-based access: customer vs manager views

**Backend:**
- FastAPI with dependency injection for auth (`current_user()`, `manager_user()`)
- Dual mode: `MemoryRepository` (thread-safe in-memory) or `SupabaseRepository` (full CRUD)
- `get_repository()` factory selects based on `USE_MOCK_DATA` setting
- Routes organized by domain; manager routes (`/manager/*`) require manager role
- Agents are standalone Python functions (not CrewAI despite earlier plans)
- Email outbox pattern for reliable delivery/rejection notifications

**Agent System:**
- **RecommenderAgent** (`recommender.py`): `rank_products()` — keyword scoring (name 5pts, category 3pts, description 2pts)
- **MarketAnalystAgent** (`market_analyst.py`): competitor price comparison analysis
- **OrderCoordinatorAgent** (`order_coordinator.py`): `order_trace()`, `complete_delivery()`, `notify_rejection()` — order lifecycle + email
- **FeedbackAgent** (`feedback_agent.py`): `analyze_feedback()` — Anthropic Messages API (`mimo-v2.5-pro` model) with keyword-based fallback

**Database (Supabase):**
- 9 tables: profiles, products, searches, orders, order_items, audit_log, feedback, email_outbox + auth.users
- pgvector for embeddings (schema-ready)
- RLS policies per table
- Storage bucket `product-images` for product images

### API Endpoints (14 total)

**Public:**
- `GET /health` — Health check
- `GET /products` — Product catalog
- `GET /products/{id}` — Product details
- `POST /search` — Search with agent re-ranking

**Authenticated (Customer):**
- `POST /orders` — Create order
- `GET /orders/me` — Order history
- `POST /feedback` — Submit feedback

**Manager Only:**
- `GET /manager/orders` — Pending orders
- `PATCH /manager/orders/{id}` — Approve/reject order
- `POST /manager/orders/{id}/deliver` — Mark delivered (triggers email)
- `POST /manager/products` — Create product (FormData with image upload)
- `PUT /manager/products/{id}` — Update product
- `DELETE /manager/products/{id}` — Delete product
- `GET /agents/traces` — Agent activity logs
- `GET /feedback` — All feedback messages
- `GET /feedback/insights` — Cached feedback insights
- `POST /feedback/analyze` — Trigger feedback analysis

### Environment Variables

Copy the example files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key (not anon key)
- `NEXT_PUBLIC_API_URL` — Backend URL (default `http://localhost:8000`)

**Backend** (`backend/.env`):
- `USE_MOCK_DATA` — Enable/disable mock mode (default `true`)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` — Supabase credentials
- `ANTHROPIC_API_KEY` — For feedback agent's LLM analysis (optional, falls back to keyword analysis)
- `EMAIL_ENABLED`, `SMTP_*` — Email delivery settings (default disabled)

### Important Patterns

**Frontend Service Layer:** Components call service functions that use mock implementations by default. Backend integration replaces service internals without rewriting UI components. Client-side mock state is persisted via `storage.ts` (localStorage/sessionStorage wrappers).

**GSD Workflow:** This project uses GSD workflow enforcement. Before making file changes, start work through a GSD command (`/gsd-quick`, `/gsd-debug`, `/gsd-execute-phase`) unless the user explicitly bypasses it.

**Auth Flow:** Frontend Supabase Auth → session storage → role-based UI. Backend: Bearer token → demo token check → Supabase `get_user()` with role from `app_metadata`.

**Order Lifecycle:** Customer creates (`pending`) → Manager approves (`approved`) or rejects (`rejected`) → If approved, manager delivers (`delivered`, triggers Burmese-language email via outbox).

**Agent Traces:** Every agent action logs to `audit_log` with: agent_name, action, input, output, timestamp. Frontend displays in Agent Activity panel.

**Product Admin:** Manager can create/update/delete products with image upload via FormData. Images stored in Supabase Storage bucket `product-images`.
