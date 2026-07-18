# PulseCart — Project Summary

## What is it?

PulseCart is a hackathon prototype demonstrating **multi-agent AI orchestration** in an e-commerce context. Five AI agents collaborate in real-time to automate shopping operations — from product recommendations to order processing to feedback analysis.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | FastAPI (Python), Pydantic, Supabase Python client |
| Database | Supabase (PostgreSQL + pgvector) with in-memory mock mode |
| Auth | Supabase Auth (JWT) + demo token fallback |
| AI/Agents | Anthropic SDK, keyword-based ranking, tool-use chat |

## The 5 Agents

1. **Recommender Agent** — Keyword scoring to rank products (name, category, description)
2. **Market Analyst Agent** — Competitor price comparison analysis
3. **Order Coordinator Agent** — Order lifecycle management + Burmese-language email notifications
4. **Feedback Agent** — LLM-powered feedback analysis (Anthropic API) with keyword fallback
5. **Chat Agent** — Conversational AI with tool-use for product lookup, order status, and search

## Key Features

- **Product catalog** with search and agent-powered re-ranking
- **Order lifecycle** — Customer creates → Manager approves/rejects → Delivery with email notification
- **Real-time agent activity feed** with trace visualization
- **Floating chat widget** for AI agent conversations (streaming)
- **Manager dashboard** — Order management, product CRUD with image upload, feedback insights
- **Role-based access** — Customer vs Manager views
- **Dark/light theme** support via CSS custom properties

## Architecture at a Glance

```
PulseCart/
├── frontend/           # Next.js 16 App Router (6 routes, 18 components, 10 services)
├── backend/            # FastAPI (7 route files, 5 agents, 23 Pydantic models)
│   ├── app/agents/     # Agent implementations
│   ├── app/routes/     # API endpoints (16 total)
│   ├── app/models/     # Pydantic schemas (camelCase)
│   ├── sql/            # 5 migration files
│   └── scripts/        # seed.py, set_user_role.py
└── .planning/          # Project docs and roadmap
```

## Dual Mode

- **Mock mode** (`USE_MOCK_DATA=true`) — In-memory repository, demo tokens, no database needed
- **Live mode** (`USE_MOCK_DATA=false`) — Full Supabase integration with real data

## Running It

```bash
# Frontend
cd frontend && npm install && npm run dev    # → localhost:3000

# Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000  # → localhost:8000/docs
```

## API Endpoints (16)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | Public | Health check |
| GET | `/products` | Public | Product catalog |
| GET | `/products/{id}` | Public | Product details |
| POST | `/search` | Public | Agent-powered search |
| POST | `/orders` | Customer | Create order |
| GET | `/orders/me` | Customer | Order history |
| POST | `/feedback` | Customer | Submit feedback |
| POST | `/chat` | Customer | Chat with AI (streaming) |
| GET | `/manager/orders` | Manager | Pending orders |
| PATCH | `/manager/orders/{id}` | Manager | Approve/reject |
| POST | `/manager/orders/{id}/deliver` | Manager | Mark delivered |
| POST | `/manager/products` | Manager | Create product |
| PUT | `/manager/products/{id}` | Manager | Update product |
| DELETE | `/manager/products/{id}` | Manager | Delete product |
| GET | `/agents/traces` | Manager | Agent activity logs |
| GET | `/feedback` | Manager | All feedback |
| GET | `/feedback/insights` | Manager | Feedback insights |
| POST | `/feedback/analyze` | Manager | Trigger analysis |

## Database

11 tables: `profiles`, `products`, `searches`, `orders`, `order_items`, `audit_log`, `feedback`, `email_outbox`, `chat_conversations`, `chat_messages`, `wanted_products` — plus pgvector for embeddings (schema-ready).
