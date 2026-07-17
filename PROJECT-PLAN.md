# PulseCart: Agentic Commerce Operations Copilot — Project Plan

> Multi-agent shopping platform where 4 AI agents collaborate in real-time — personalizing storefronts, analyzing competitors, coordinating orders, and aggregating feedback.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Team & Roles](#team--roles)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [3-Day Sprint Plan](#3-day-sprint-plan)
6. [Day 1: Foundation + Working Vertical Slice](#day-1-foundation--working-vertical-slice)
7. [Day 2: Agent Intelligence + Guardrails](#day-2-agent-intelligence--guardrails)
8. [Day 3: Judge Experience + Polish](#day-3-judge-experience--polish)
9. [Agent Contracts](#agent-contracts)
10. [Folder Structure](#folder-structure)
11. [Setup Guide](#setup-guide)
12. [Demo Scenario](#demo-scenario)
13. [Testing Checklist](#testing-checklist)
14. [Git Workflow](#git-workflow)
15. [Risks & Mitigations](#risks--mitigations)

---

## Project Overview

### What is PulseCart?
PulseCart is a shopping web app powered by 4 autonomous AI agents that:
- **Personalizes storefronts** — tracks search behavior, builds interest profiles, re-ranks product feeds in real-time
- **Analyzes competitors** — matches SKUs, calculates price gaps, suggests keep/review/bundle actions
- **Coordinates orders** — validates checkout data, queues orders for manager approval
- **Aggregates feedback** — clusters user messages by theme, calculates severity, proposes fixes

The key differentiator: agents observe → reason → act → report, with **human approval required** on risky actions (price changes, order confirmations).

### The Problem We Solve
- E-commerce personalization today is manual or generic — no real-time agent-driven adaptation
- Competitor price monitoring requires analysts to manually check dozens of SKUs
- Order processing is either fully manual or fully automated with no human-in-the-loop guardrails
- Customer feedback gets buried in spreadsheets instead of being auto-clustered into actionable insights

### Who Is Our User?
**Manager May** — runs a small e-commerce store. She's overwhelmed by manual competitor checks, order approvals, and sifting through customer feedback. PulseCart's agents handle the boring work and present decisions, not just data.

---

## Team & Roles

### 4 Members

| Role | Responsibility | Focus Areas |
|------|---------------|-------------|
| **Frontend Lead** | UI/UX, agent trace panels, dashboard | Next.js, Tailwind, React components |
| **Backend Lead** | API routes, agent orchestration, data layer | FastAPI, CrewAI, Supabase |
| **Agent Engineer** | Agent logic, tool definitions, guardrails | CrewAI agents, prompt engineering |
| **Data/Infra Lead** | Database schema, fixtures, deployment | Supabase, pgvector, mock data |

### How to Work Together
- **Frontend + Backend** pair on UI ↔ API integration
- **Agent Engineer + Backend** pair on agent triggers and tool wiring
- **Data/Infra** supports everyone with schema changes and fixture updates
- **Daily sync** at morning and evening to unblock and re-prioritize

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js + Tailwind CSS | Fast UI development, great DX |
| **Backend** | FastAPI (Python) | Async, fast, great for agent workflows |
| **Agent Framework** | CrewAI | Multi-agent orchestration, faster than LangGraph for prototyping |
| **Database** | Supabase (PostgreSQL + pgvector) | Auth + DB + vector search in one tool |
| **Auth** | Supabase Auth | Demo user, minimal setup |
| **Vector Search** | pgvector (via Supabase) | Power personalized recommendations from search history |
| **State** | React + FastAPI sessions | Simple enough for hackathon |
| **Charts** | Recharts or Chart.js | PM dashboard visualizations |

### Why CrewAI Over LangGraph?
- Faster to prototype with built-in agent definitions
- Easier tool integration for hackathon timeline
- Good enough for demo; production would use LangGraph or Agents SDK

### Why Supabase Over Firebase?
- pgvector built-in for vector embeddings (personalization)
- PostgreSQL gives us real SQL queries for competitor analysis
- Auth + DB + vector in one tool = less setup

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Customer + Manager UI               │
│              (Next.js + Tailwind CSS)                │
└───────────────┬──────────────────────┬──────────────┘
                │                      │
        ┌───────▼───────┐      ┌───────▼───────┐
        │  Customer Flow │      │ Manager Flow  │
        │  Search/Browse │      │ Dashboard     │
        │  Checkout      │      │ Approval Queue│
        └───────┬───────┘      └───────┬───────┘
                │                      │
        ┌───────▼──────────────────────▼───────┐
        │         FastAPI Backend               │
        │    (API Routes + Agent Orchestrator)  │
        └──┬──────────┬──────────┬──────────┬──┘
           │          │          │          │
    ┌──────▼──┐ ┌─────▼────┐ ┌──▼─────┐ ┌──▼──────┐
    │Recomm-  │ │ Market   │ │ Order  │ │Feedback │
    │ender    │ │ Analyst  │ │Coord.  │ │Agent    │
    │Agent    │ │ Agent    │ │Agent   │ │         │
    └────┬────┘ └────┬─────┘ └──┬─────┘ └──┬──────┘
         │           │          │           │
    ┌────▼───────────▼──────────▼───────────▼────┐
    │              Supabase                       │
    │  PostgreSQL + pgvector + Auth               │
    │  Tables: users, products, searches,         │
    │  profiles, orders, feedback, audit_log      │
    └────────────────────────────────────────────┘
```

---

## 3-Day Sprint Plan

```
Day 1: Foundation       → UI shell, search→feed pipeline, checkout→approval queue
Day 2: Agent Intel      → Market Analyst, Feedback Agent, guardrails, audit trail
Day 3: Judge Experience → E2E test, pitch rehearsal, polish, demo ready
```

---

## Day 1: Foundation + Working Vertical Slice

### Goal
Search changes the product feed live. Order enters the approval queue. Both visible in the UI.

### Tasks

#### Frontend Lead
- [ ] Initialize Next.js project with Tailwind CSS
- [ ] Set up folder structure (components, pages, services)
- [ ] Build app shell: header, sidebar, main content area
- [ ] Build search bar component with real-time input
- [ ] Build product grid with dynamic feed display
- [ ] Build checkout modal (address, phone fields)
- [ ] Build manager approval queue UI (list + approve/reject buttons)
- [ ] Build agent trace panel (shows agent input → decision → action)

#### Backend Lead
- [ ] Initialize FastAPI project
- [ ] Set up Supabase project (console.supabase.com)
- [ ] Create database schema:
  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    role TEXT DEFAULT 'customer',  -- 'customer' | 'manager'
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    category TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    interests JSONB DEFAULT '{}',  -- {"gaming": 0.8, "office": 0.3}
    embedding VECTOR(384),         -- for semantic search
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    message TEXT,
    theme TEXT,
    severity TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT,
    action TEXT,
    input JSONB,
    output JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Create API routes: `/search`, `/products`, `/orders`, `/feedback`
- [ ] Implement demo user auth (hardcoded demo account)
- [ ] Seed mock data: 20–30 products across categories

#### Agent Engineer
- [ ] Set up CrewAI project structure
- [ ] Define RecommenderAgent:
  - Trigger: search event
  - Input: query + user profile
  - Action: update affinity scores, re-rank products
  - Output: personalized product feed
  - Guardrail: no sensitive trait tracking
- [ ] Define OrderCoordinatorAgent:
  - Trigger: checkout
  - Input: item, address, phone
  - Action: validate data, create approval task
  - Output: pending order in queue
  - Guardrail: requires manager approval before confirm

#### Data/Infra Lead
- [ ] Create product fixture data (20–30 items):
  - 5 gaming laptops ($799–$1,999)
  - 5 office chairs ($149–$599)
  - 5 headphones ($49–$349)
  - 5 accessories ($19–$99)
- [ ] Create competitor price fixture (our price vs competitor for 10 SKUs)
- [ ] Create feedback message fixture (25–30 messages with delivery, quality, pricing themes)
- [ ] Set up `.env` with Supabase URL + anon key
- [ ] Write seed script to populate Supabase

### End of Day 1 Checklist
- [ ] Search "gaming laptop" → feed re-ranks to show gaming products first
- [ ] Agent trace panel shows: input → affinity update → re-rank action
- [ ] Checkout with valid address/phone → order appears in approval queue
- [ ] Manager can approve/reject order in dashboard
- [ ] Git checkpoint committed + backup demo video recorded

---

## Day 2: Agent Intelligence + Guardrails

### Goal
All 4 agents fully functional. Each agent's trigger → decision → action → guardrail visible in the UI.

### Tasks

#### Frontend Lead
- [ ] Build market insights panel on manager dashboard
- [ ] Show price gap data: product, our price, competitor price, gap %, recommendation
- [ ] Build feedback insights panel on manager dashboard
- [ ] Show theme clusters, mention counts, severity, suggested fixes
- [ ] Add weekly orchestrator button (triggers market + feedback agents)
- [ ] Build agent activity dashboard showing all 4 agents' latest traces
- [ ] Add loading, error, and empty states across all views
- [ ] Build audit trail viewer (all agent actions logged)

#### Backend Lead
- [ ] Implement MarketAnalystAgent:
  - Trigger: weekly/manual button
  - Input: normalized SKU prices from fixture
  - Action: compare price gaps, generate recommendations
  - Output: action report ("keep", "review price", "bundle deal")
  - Guardrail: no auto price change — requires manager approval
- [ ] Implement FeedbackAgent:
  - Trigger: weekly/manual button
  - Input: batch of feedback messages
  - Action: cluster themes, count mentions, calculate severity
  - Output: insight report with suggested fix per theme
  - Guardrail: redact PII from analysis
- [ ] Implement audit logging (every agent action → audit_log table)
- [ ] Add error handling and fallback states

#### Agent Engineer
- [ ] Wire MarketAnalystAgent with CrewAI tools:
  - `normalize_sku_data()` — standardize competitor prices
  - `calculate_price_gap()` — compute % difference per SKU
  - `generate_recommendation()` — keep/review/bundle decision
- [ ] Wire FeedbackAgent with CrewAI tools:
  - `cluster_themes()` — group messages by topic
  - `calculate_severity()` — rank by mention count + sentiment
  - `suggest_fix()` — propose solution per theme
- [ ] Add guardrail checks:
  - Price change → block without manager approval
  - Order confirm → block without manager approval
  - PII in feedback → redact before processing
- [ ] Optional: connect LLM for natural language summaries (with deterministic fallback)

#### Data/Infra Lead
- [ ] Normalize competitor price fixture (consistent SKU IDs)
- [ ] Add price gap threshold config (e.g., >5% = review, >15% = urgent)
- [ ] Create feedback theme categories: delivery, quality, pricing, service, other
- [ ] Add severity calculation rules: high (>10 mentions), medium (5–10), low (<5)
- [ ] Update seed script with richer fixture data

### End of Day 2 Checklist
- [ ] Market Analyst: shows "Chair X is 10.6% above competitor — suggest reviewing price"
- [ ] Feedback Agent: shows "delivery visibility" as top theme from 27 messages
- [ ] Neither agent auto-changes prices or confirms orders (guardrails work)
- [ ] Audit trail shows all agent actions with timestamps
- [ ] Agent trace panel explains each agent's reasoning

---

## Day 3: Judge Experience + Polish

### Goal
Flawless 4-minute demo. Judges see agent collaboration, guardrails, and business value.

### Tasks

#### Frontend Lead
- [ ] Polish UI: consistent spacing, colors, typography
- [ ] Add app logo and loading splash
- [ ] Ensure mobile layout works (responsive enough for demo)
- [ ] Add privacy note / scraper limitations text
- [ ] Create fallback screenshots for each major screen
- [ ] Record backup demo video (screen capture of full walkthrough)

#### Backend Lead
- [ ] End-to-end walkthrough: all 5 demo steps working
- [ ] Add data reset button (restore fixtures to clean state)
- [ ] Verify API responses are fast (< 500ms for demo)
- [ ] Add graceful error messages for demo scenarios
- [ ] Write README.md with setup + run instructions

#### Agent Engineer
- [ ] Test all agent flows end-to-end
- [ ] Ensure deterministic fallback works if LLM API is down
- [ ] Add agent explanation text (plain English summaries of agent actions)
- [ ] Prepare answers to likely judge questions:
  - "Is this just automation?" → Agents observe, reason, choose tools, act, report
  - "Where's the ML?" → Affinity scoring, vector embeddings (explainable)
  - "Scraping legal?" → Demo uses controlled snapshots
  - "PII safety?" → Demo doesn't persist PII; production adds encryption
  - "Agent errors?" → Confidence thresholds, deterministic validation, approval queues

#### Data/Infra Lead
- [ ] Final data reset: clean all fixtures, re-seed
- [ ] Create architecture diagram (mermaid or hand-drawn)
- [ ] Prepare pitch slides (5–7 minutes):
  1. Problem (30 sec)
  2. Solution + live demo (4 min)
  3. Architecture + agent contracts (1 min)
  4. Business value + roadmap (1 min)
- [ ] Test full demo flow twice consecutively without failure

### Evening: Feature Freeze
- [ ] Feature freeze at 17:00
- [ ] Two consecutive successful demo runs
- [ ] Q&A answers written and reviewed
- [ ] Repo README verified with correct run commands
- [ ] Demo backup: screenshots + video ready

### End of Day 3 Checklist
- [ ] 4-minute demo + 2-min explanation + 1-min roadmap — on time
- [ ] Demo runs successfully 2x in a row
- [ ] Judges can see agent trace: observe → reason → act → report
- [ ] Guardrails demonstrated (approval required for risky actions)
- [ ] README has clear setup instructions

---

## Agent Contracts

| Agent | Trigger | Input | Tool/Action | Output | Guardrail |
|---|---|---|---|---|---|
| **Recommender** | search/view | query + profile | update affinity, re-rank | personalized feed | no sensitive traits |
| **Market Analyst** | weekly/manual | normalized SKU prices | compare gap, recommend | action report (keep/review/bundle) | no auto price change |
| **Order Coordinator** | checkout | item, address, phone | validate, create task | approval task | manager approval required |
| **Feedback Agent** | weekly/manual | feedback batch | cluster themes, count, severity | insight + proposed fix | redact PII |

---

## Folder Structure

```
pulsecart/
├── frontend/                    # Next.js app
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── page.tsx         # Home / search page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── products/        # Product grid
│   │   │   ├── checkout/        # Checkout flow
│   │   │   └── manager/         # Manager dashboard
│   │   │
│   │   ├── components/          # Reusable UI components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── ApprovalQueue.tsx
│   │   │   ├── AgentTracePanel.tsx
│   │   │   ├── MarketInsights.tsx
│   │   │   ├── FeedbackInsights.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   └── AgentDashboard.tsx
│   │   │
│   │   ├── services/            # API calls
│   │   │   ├── api.ts           # FastAPI client
│   │   │   └── supabase.ts      # Supabase client
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   └── utils/               # Helpers
│   │       └── constants.ts
│   │
│   ├── public/                  # Static assets
│   ├── .env.local               # API keys (NEVER commit)
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── routes/
│   │   │   ├── search.py        # /api/search
│   │   │   ├── products.py      # /api/products
│   │   │   ├── orders.py        # /api/orders
│   │   │   ├── feedback.py      # /api/feedback
│   │   │   └── agents.py        # /api/agents/*
│   │   │
│   │   ├── agents/              # CrewAI agent definitions
│   │   │   ├── recommender.py
│   │   │   ├── market_analyst.py
│   │   │   ├── order_coordinator.py
│   │   │   ├── feedback_agent.py
│   │   │   └── orchestrator.py  # Agent orchestration logic
│   │   │
│   │   ├── tools/               # Agent tool functions
│   │   │   ├── search_tools.py
│   │   │   ├── price_tools.py
│   │   │   ├── order_tools.py
│   │   │   └── feedback_tools.py
│   │   │
│   │   ├── models/              # Pydantic models
│   │   │   └── schemas.py
│   │   │
│   │   └── config.py            # Settings, env vars
│   │
│   ├── fixtures/                # Mock data
│   │   ├── products.json
│   │   ├── competitors.json
│   │   └── feedback.json
│   │
│   ├── scripts/
│   │   └── seed.py              # Seed Supabase with fixtures
│   │
│   ├── .env                     # API keys (NEVER commit)
│   ├── requirements.txt
│   └── README.md
│
├── .planning/                   # Project planning docs
│   ├── ROADMAP.md
│   ├── STATE.md
│   ├── REQUIREMENTS.md
│   └── config.json
│
├── PROJECT-PLAN.md              # This file
├── OKRs-agentic-shopping-hackathon.md
├── .gitignore
├── README.md
└── package.json                 # Root package (optional monorepo scripts)
```

---

## Setup Guide

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account (free tier)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/minntayza/PulseCart.git
cd PulseCart

# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `pulsecart`
3. Set database password
4. Choose region (closest to you)
5. Go to Settings → API → Copy `URL` and `anon public key`

### 3. Environment Variables

**Frontend** — create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Backend** — create `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key  # Optional, for LLM summaries
```

### 4. Seed Database

```bash
cd backend
python scripts/seed.py
```

### 5. Run

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Scenario

### What Judges See (4 minutes)

| Step | Action | Agent Response | What's Visible |
|------|--------|---------------|----------------|
| 1 | Customer searches "gaming laptop" | Recommender updates gaming affinity | Feed re-ranks, gaming products rise to top |
| 2 | Customer checks out laptop | Order Coordinator validates + queues | Order appears in manager approval queue |
| 3 | Manager opens dashboard | Market Analyst shows price gaps | "Chair X is 10.6% above competitor — review price" |
| 4 | Manager views feedback | Feedback Agent clusters themes | "Delivery visibility" top theme, ETA fix suggested |
| 5 | Manager approves order | Audit trail logs all actions | Full agent action history visible |

### Key Points to Emphasize
- **Agents observe → reason → act → report** — not just text output
- **Human approval required** for risky actions (not full autonomy overreach)
- **Agent trace visible** — judges can follow each agent's decision-making
- **Controlled data** — reliable demo, no anti-bot or scraping risk
- **Production roadmap** — clear path from prototype to real system

---

## Testing Checklist

### Functional Tests
- [ ] Search returns relevant products
- [ ] Feed re-ranks based on search history
- [ ] Checkout validates address and phone
- [ ] Order appears in approval queue after checkout
- [ ] Manager can approve/reject orders
- [ ] Market Analyst shows price gaps with recommendations
- [ ] Feedback Agent clusters themes correctly
- [ ] Guardrails prevent auto price change
- [ ] Guardrails prevent order confirm without approval
- [ ] Audit trail logs all agent actions

### Demo Tests
- [ ] Full demo flow completes in < 4 minutes
- [ ] Demo runs 2x consecutively without failure
- [ ] Fallback screenshots ready if live demo fails
- [ ] Data reset works (restore clean state)
- [ ] Mobile layout doesn't break demo

### Edge Cases
- [ ] Empty search query handled gracefully
- [ ] Network error shows user-friendly message
- [ ] No products match search → "No results" state
- [ ] Approval queue empty → appropriate empty state
- [ ] Agent processing → loading spinner shown

---

## Git Workflow

### Branch Naming
```
feat/search-feed-pipeline
feat/market-analyst-agent
fix/order-validation-bug
chore/supabase-setup
```

### Daily Workflow
```bash
# Start of day
git checkout main
git pull

# Create feature branch
git checkout -b feat/your-feature

# Work, commit often
git add .
git commit -m "feat: add search tracking and profile update"

# Push and share
git push origin feat/your-feature

# Merge to main when ready (or pair review)
git checkout main
git merge feat/your-feature
git push
```

### Rules
1. Commit at least once per task
2. Write clear commit messages (feat/fix/chore prefix)
3. Pull main before starting new work
4. Keep main branch working (no broken commits)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CrewAI setup takes too long | Agent integration delayed | Fallback to direct function calls |
| Demo data too fake | Judges not impressed | Hybrid approach: fixtures + some real signals |
| 3 days not enough | Incomplete demo | YOLO mode: skip non-critical, focus on core 4 agents |
| LLM API down during demo | No natural language summaries | Deterministic fallback: rules-based responses |
| Supabase free tier limits | Hit rate limits | Seed minimal data, batch API calls |
| Team members stuck | Blocked on integration | Daily syncs, pair programming on integration points |

---

## Success Criteria

### Demo is done when:
- [ ] 4 agents each demonstrate observe → reason → act → report
- [ ] Agent trace panel shows each agent's decision-making process
- [ ] Human approval required for price changes and order confirmation
- [ ] Search personalizes the product feed in real-time
- [ ] Competitor analysis shows actionable price gap insights
- [ ] Feedback clustering surfaces top themes with suggested fixes
- [ ] Full demo completes in 4 minutes
- [ ] 2 consecutive successful demo runs
- [ ] Judges can explain the system after watching

---

## Important Links

- **GitHub:** https://github.com/minntayza/PulseCart
- **CrewAI Docs:** https://docs.crewai.com
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com

---

**Last updated:** 2026-07-16
**Project:** PulseCart — Agentic Commerce Operations Copilot
**Team:** 4 members
**Timeline:** 3 days
