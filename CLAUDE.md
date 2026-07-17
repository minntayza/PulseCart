# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PulseCart is an agentic commerce operations copilot — a hackathon prototype demonstrating multi-agent orchestration in a shopping context. Four AI agents collaborate in real-time: a Personalization Agent (vector embeddings for recommendations), a Competitor Analysis Agent (price comparison), a Purchase Workflow Agent (order processing), and a Feedback Agent (user insight aggregation).

**Current Status:**
- Phase 1 (Frontend): ✅ Complete with mock data
- Phase 2 (Backend): 🔲 In progress (FastAPI + CrewAI + Supabase)

## Development Commands

### Frontend (Next.js 16 + Tailwind CSS 4)
```bash
cd frontend
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
```

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000  # API docs: http://localhost:8000/docs
pytest -q            # Run tests
```

### Backend Mock Mode
The backend runs in mock mode by default (`USE_MOCK_DATA=true` in `.env`). This uses demo bearer tokens for testing:
- Customer: `Bearer demo-customer-token`
- Manager: `Bearer demo-manager-token`

### Enable Supabase
1. Create Supabase project
2. Run SQL migrations: `sql/001_day1_schema.sql`, `sql/002_auth_profile_trigger.sql`
3. Set `USE_MOCK_DATA=false` in `backend/.env`
4. Seed products: `python scripts/seed.py`
5. Promote manager: `python scripts/set_user_role.py manager@example.com manager`

## Architecture

### Monorepo Structure
```
PulseCart/
├── frontend/           # Next.js 16 app (Phase 1 complete)
│   ├── src/
│   │   ├── app/        # 6 pages (Next.js App Router)
│   │   ├── components/ # 14+ components (including dashboard/)
│   │   ├── data/       # Fixture files (products, competitors, feedback, agents)
│   │   ├── services/   # 7 services (auth, search, orders, API, supabase)
│   │   └── types/      # TypeScript interfaces
├── backend/            # FastAPI Python app
│   ├── app/
│   │   ├── agents/     # CrewAI agents (recommender, order_coordinator)
│   │   ├── routes/     # API endpoints (products, search, orders, feedback, agents)
│   │   ├── models/     # Pydantic schemas
│   │   ├── auth.py     # Demo tokens + Supabase auth validation
│   │   ├── config.py   # Settings via pydantic-settings
│   │   └── fixtures.py # Mock data for demo mode
│   ├── sql/            # Database migrations
│   ├── scripts/        # Seed data, role management
│   └── tests/          # Pytest tests
└── .planning/          # Project docs, roadmap, sketches
```

### Key Architectural Patterns

**Frontend:**
- Next.js App Router with `src/` directory
- Tailwind CSS 4 for styling (dark/light theme via `data-theme` attribute)
- Browser-only mock services using localStorage/sessionStorage
- Real-time agent activity feed with trace visualization
- Role-based access: customer vs manager views

**Backend:**
- FastAPI with dependency injection for auth
- Dual mode: mock data (demo tokens) or Supabase (real auth)
- Routes organized by domain: products, search, orders, feedback, agents
- Pydantic models for request/response validation
- CORS configured for frontend dev server

**Database (Supabase):**
- PostgreSQL with pgvector for embeddings
- Tables: profiles, products, searches, orders, order_items, feedback, audit_log
- Row Level Security (RLS) policies for data access
- Auth integration via `auth.users()` table

### Agent System (Planned)
- **RecommenderAgent**: Personalizes product feed based on search behavior
- **OrderCoordinatorAgent**: Validates checkout, queues for manager approval
- **MarketAnalystAgent**: Competitor price analysis
- **FeedbackAgent**: Clusters user feedback by theme

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16 + Tailwind CSS 4 | ✅ Implemented |
| Backend | FastAPI (Python) | ✅ Implemented |
| Agents | CrewAI | 🔲 In progress |
| Database | Supabase (PostgreSQL + pgvector) | ✅ Schema ready |
| Auth | Supabase Auth + demo tokens | ✅ Implemented |

## API Endpoints

### Public
- `GET /health` - Health check
- `GET /products` - Product catalog
- `GET /products/{id}` - Product details
- `POST /search` - Search with agent re-ranking

### Authenticated (Customer)
- `POST /orders` - Create order
- `GET /orders/me` - Order history
- `POST /feedback` - Submit feedback

### Manager Only
- `GET /manager/orders` - Pending orders
- `PATCH /manager/orders/{id}` - Approve/reject order
- `GET /agents/traces` - Agent activity logs
- `GET /feedback` - All feedback messages

## Important Patterns

### Frontend Service Layer
Components call service functions that currently use mock implementations. Backend integration should replace service internals without rewriting UI components.

### Auth Flow
- Frontend: Supabase Auth client → session storage → role-based UI
- Backend: Bearer token validation → Supabase user lookup → role enforcement
- Demo mode: hardcoded tokens bypass Supabase

### Order Lifecycle
1. Customer creates order → status: `pending`
2. Manager approves/rejects → status: `approved`/`rejected`
3. Customer sees updated status in order history

### Agent Traces
Every agent action logs to `audit_log` table with: agent_name, action, input, output, timestamp. Frontend displays these in the Agent Activity panel.

## Environment Variables

Copy the example files and fill in your values:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```
USE_MOCK_DATA=true
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
```

## Testing

### Frontend
- Linting: `npm run lint`
- Build check: `npm run build`

### Backend
- Run all tests: `pytest -q`
- Test file: `backend/tests/test_day1.py`
- Tests use `TestClient` with demo tokens

## Common Tasks

### Add New API Endpoint
1. Create route in `backend/app/routes/`
2. Add Pydantic model in `backend/app/models/schemas.py`
3. Register router in `backend/app/main.py`
4. Add frontend service function in `frontend/src/services/`
5. Update TypeScript types in `frontend/src/types/index.ts`

### Add New Component
1. Create in `frontend/src/components/`
2. Use existing Tailwind classes for consistency
3. Import in relevant page under `frontend/src/app/`

### Database Schema Changes
1. Create migration SQL in `backend/sql/`
2. Update Pydantic models in `backend/app/models/schemas.py`
3. Update fixture data if needed in `backend/app/fixtures.py`
