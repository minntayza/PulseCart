# PulseCart — Milestone Summary v1

> **Agentic Commerce Operations Copilot**
> Generated: 2026-07-17 | Hackathon: 3-day (Jul 16–18, 2026)

---

## 1. Overview

PulseCart is a hackathon prototype demonstrating **multi-agent orchestration** in an e-commerce context. Five AI agents collaborate in real-time to automate shopping operations: product recommendations, competitor analysis, order processing, feedback analysis, and conversational AI. The demo proves that autonomous agents can replace manual e-commerce operations with human oversight on high-risk actions.

**Core Value Proposition:** Agent collaboration pipeline — agents observe → reason → act → report, with human approval on risky actions.

**Hackathon Constraints:**
- 3-day timeline, 4-person team
- Desktop-first, demo-focused
- Mock data acceptable; deterministic fallback required

---

## 2. Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript | App shell, UI, real-time dashboards |
| Backend | FastAPI (Python), Pydantic Settings | REST API, agent orchestration, auth |
| Agents | 5 standalone Python functions | Recommender, Market Analyst, Order Coordinator, Feedback, Chat |
| Database | Supabase (PostgreSQL + pgvector) | Auth, product catalog, orders, chat, embeddings |
| Auth | Supabase Auth (JWT) with demo token fallback | Customer/Manager role-based access |

### Monorepo Structure

```
PulseCart/
├── frontend/                    # Next.js 16 App Router (49 TS/TSX files)
│   ├── src/app/                 # 6 routes: /, /login, /register, /products/[id], /account/orders, /manager
│   ├── src/components/          # 18 components (12 top-level + 6 in dashboard/)
│   ├── src/services/            # 10 services (api, auth, chat, feedback, order, product, search, storage, supabase, managerProduct)
│   ├── src/data/                # Fixture files (products, competitors, feedback, agents)
│   └── src/types/               # 20 TypeScript interfaces
├── backend/                     # FastAPI Python app (26 .py files)
│   ├── app/agents/              # 5 agents: recommender, market_analyst, order_coordinator, feedback_agent, chat_agent
│   ├── app/routes/              # 7 route files: products, search, orders, feedback, agents, manager_products, chat
│   ├── app/models/              # 23 Pydantic schemas (camelCase aliases)
│   ├── app/services/            # Email delivery (Burmese language)
│   ├── sql/                     # 5 migration files (001–005)
│   └── scripts/                 # seed.py, set_user_role.py
└── .planning/                   # Project docs, roadmap, sketches
```

### Agent System

| Agent | Trigger | Action | Guardrail |
|-------|---------|--------|-----------|
| **Recommender** | Search/view events | Keyword scoring (name 5pts, category 3pts, description 2pts) → re-ranked feed | No sensitive traits |
| **Market Analyst** | Weekly/manual | Competitor price comparison → "keep/review/bundle" recommendation | No auto price change |
| **Order Coordinator** | Checkout | Validate address/phone → create approval task → trigger email on delivery | Manager approval required |
| **Feedback Agent** | Weekly/manual | Cluster feedback themes → severity + suggested fixes | Redact PII |
| **Chat Agent** | User message | Conversational AI with tool-use (product lookup, order status, search) | N/A |

### Database Schema (5 migrations)

1. **001_day1_schema.sql** — Core tables (profiles, products, orders, feedback, audit_log)
2. **002_auth_profile_trigger.sql** — Auto-create profile on signup
3. **003_product_catalog_and_storage.sql** — Product catalog + Supabase Storage bucket
4. **004_order_delivery.sql** — Order lifecycle + delivery workflow
5. **005_chat_and_wanted_products.sql** — Chat conversations, messages, wanted products + pgvector

11 tables total: profiles, products, searches, orders, order_items, audit_log, feedback, email_outbox, chat_conversations, chat_messages, wanted_products.

### API Endpoints (16+)

**Public:** `GET /health`, `GET /products`, `GET /products/{id}`, `POST /search`
**Customer:** `POST /orders`, `GET /orders/me`, `POST /feedback`, `POST /chat` (streaming)
**Manager:** `GET /manager/orders`, `PATCH /manager/orders/{id}`, `POST /manager/orders/{id}/deliver`, `POST /manager/products`, `PUT /manager/products/{id}`, `DELETE /manager/products/{id}`
**Observability:** `GET /agents/traces`, `GET /feedback`, `GET /feedback/insights`, `POST /feedback/analyze`

---

## 3. Phases

### Phase 1: Foundation + Working Vertical Slice ✅ (Day 1 — July 16)

**Goal:** Search → personalized feed + Checkout → approval queue — both live end-to-end.

**Completed:**
- Next.js 16 + Tailwind CSS 4 frontend with 14 components
- 6 pages with dark/light theme system
- Auth system with demo accounts (manager + customer)
- Search with client-side scoring and real-time feed updates
- Checkout flow with validation
- Manager dashboard with 4 tabbed panels (Orders, Market, Feedback, Agent)
- Agent trace visualization
- Responsive design with skeleton loading states

### Phase 2: Backend + Real Agents ✅ (Day 2 — July 17)

**Goal:** All 5 agents fully functional with triggers, decisions, actions, and guardrails visible.

**Completed:**
- FastAPI backend with dependency injection auth
- Dual repository pattern: `MemoryRepository` (mock) + `SupabaseRepository` (production)
- 5 AI agents implemented as standalone Python functions
- Full product CRUD with image upload via FormData
- Order lifecycle: pending → approved/rejected → delivered (with email notification)
- Feedback analysis with Anthropic API (`mimo-v2.5-pro`) + keyword fallback
- Chat agent with streaming responses and tool-use
- Agent trace logging to `audit_log` table
- 5 SQL migrations for full database schema
- Demo mode toggle (`USE_MOCK_DATA=true/false`)

### Phase 3: Judge Experience + Polish (Day 3 — July 18)

**Goal:** Flawless 4-minute demo + 2-min explanation + 1-min roadmap.

**Status:** In progress (current day)

**Remaining:**
- E2E walkthrough verification
- Architecture diagram
- Pitch rehearsal
- Feature freeze + final demo runs
- README + run instructions

---

## 4. Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **FastAPI over Django** | Lightweight, async-native, fast prototyping | ✅ Adopted |
| **Standalone agents over CrewAI** | Simpler, fewer dependencies, more control | ✅ Adopted (deviated from initial plan) |
| **Supabase over Firebase** | PostgreSQL + pgvector + Auth in one tool | ✅ Adopted |
| **Dual repository pattern** | Mock mode for dev/demo, Supabase for production | ✅ Adopted |
| **Anthropic API for feedback/chat** | LLM-powered analysis with keyword fallback for reliability | ✅ Adopted |
| **camelCase serialization** | Frontend TypeScript alignment with backend Pydese | ✅ Convention |
| **Desktop-first UI** | 3 days isn't enough for responsive; demo on desktop | ✅ Adopted |
| **Demo token fallback** | Bearer tokens for quick demo without Supabase setup | ✅ Adopted |

---

## 5. Requirements Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01/02/03 | Phase 1 | ✅ Mock (sessionStorage) + Supabase auth |
| DB-01 (Product catalog) | Phase 2 | ✅ Supabase + seed script |
| DB-02 (Search history + embeddings) | Phase 2 | ✅ pgvector schema-ready |
| PERS-01/02/03/04 | Phase 1 | ✅ Client-side scoring |
| COMP-01/02/03 | Phase 1 | ✅ Fixture data |
| COMP-04 (Price recommendations) | Phase 2 | ✅ Market Analyst agent |
| PURC-01/02/03/04 | Phase 1–2 | ✅ Full order lifecycle |
| FEED-01 (Feedback submission) | Phase 2 | ✅ POST /feedback endpoint |
| FEED-02/03 | Phase 1 | ✅ Fixture data + LLM analysis |
| FEED-04 (Suggested fixes) | Phase 2 | ✅ Feedback Agent with Anthropic API |
| PM-01/02/03/04 | Phase 1–2 | ✅ Full manager dashboard |
| DEMO-01 (Agent traces) | Phase 1 | ✅ AgentFeed + AgentPanel |
| DEMO-02 (Architecture diagram) | Phase 3 | 🔲 Pending |
| DEMO-03 (Scalability slide) | Phase 3 | 🔲 Pending |

---

## 6. Tech Debt & Known Issues

| Item | Severity | Notes |
|------|----------|-------|
| No unit tests | Medium | `backend/tests/test_day1.py` exists but minimal; hackathon time constraint |
| pgvector embeddings schema-ready but not populated | Low | Products have embedding column but no vector generation yet |
| Email delivery disabled by default | Low | `EMAIL_ENABLED=false` in `.env`; requires SMTP config for real emails |
| Agent traces capped at 100 (backend) / 20 (frontend) | Low | Prevents memory growth; acceptable for demo |
| No CI/CD pipeline | Low | Not needed for hackathon |
| Desktop-first, not fully responsive | Low | Demo target is desktop |
| Chat agent model set to `mimo-v2.5-pro` | Info | Custom model; may need updating for production |

---

## 7. Getting Started

### Quick Start (Mock Mode — No Supabase Required)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Demo tokens (mock mode):
- Customer: `Bearer demo-customer-token`
- Manager: `Bearer demo-manager-token`

Demo accounts (Supabase auth):
- Manager: `manager@pulsecart.demo` / `Manager123!`
- Customer: `customer@pulsecart.demo` / `Customer123!`

### Full Setup (Supabase)

1. Create Supabase project
2. Run SQL migrations: `001` → `002` → `003` → `004` → `005`
3. Set `USE_MOCK_DATA=false` in `backend/.env`
4. Seed products: `python scripts/seed.py`
5. Promote manager: `python scripts/set_user_role.py manager@pulsecart.demo manager`

### Environment Variables

**Backend** (`backend/.env`):
- `USE_MOCK_DATA=true` (default) — Toggle mock mode
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` — Supabase credentials
- `ANTHROPIC_API_KEY` — For LLM-powered feedback/chat agents (optional, falls back to keywords)
- `CHAT_MODEL` — Model for chat agent (default: `mimo-v2.5-pro`)

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:8000`)

---

## 8. Demo Scenario (What Judges See)

1. **Customer searches "gaming laptop"** → Recommender updates gaming affinity → gaming products rise to top
2. **Customer checks out laptop** → Order agent validates address/phone → creates approval task
3. **Manager dashboard — Market Analyst** shows chair price 10.6% above competitor → suggests review price
4. **Manager dashboard — Feedback Agent** finds "delivery visibility" as top theme → suggests proactive ETA messages
5. **Manager approves order** → Audit trace shows full agent action history

---

*Generated from: ROADMAP.md, PROJECT.md, STATE.md, REQUIREMENTS.md, CLAUDE.md, codebase analysis*
