# Agentic Shopping Web App

## What This Is

A hackathon prototype demonstrating multi-agent orchestration in a shopping context. Four AI agents collaborate in real-time: a Personalization Agent (vector embeddings for recommendations), a Competitor Analysis Agent (price comparison), a Purchase Workflow Agent (order processing), and a Feedback Agent (user insight aggregation). The demo proves that autonomous agents can replace manual e-commerce operations.

## Why This Exists

**Hackathon**: "Agentic-based Solutions for Real-World Problems"
**Team**: 4 people, 3-day timeline (72 hours)
**Core Value**: Agent collaboration pipeline — the ONE thing that must work. If everything else breaks, the demo must show multiple agents talking to each other in real-time.

## Context

- **Developer**: Min Tayza (UIT Yangon) — strong AI/ML, full-stack, agentic workflow experience
- **Tech Stack**: Next.js + Tailwind CSS (frontend), FastAPI (backend), CrewAI (agent orchestration), Supabase (auth + PostgreSQL + pgvector)
- **Demo Data**: Hybrid approach — seed mock products + mock competitor prices, with some real scraped data for one controlled source
- **Cold Start**: New users get trending products until they build a search profile
- **Anti-scraping**: Mock competitor data for demo; note in roadmap that production would need advanced bypass
- **Phase 1 Status**: ✅ Frontend complete with mock data (2026-07-16)

## Requirements

### Validated

- [x] Public product browsing (unregistered users can view products)
- [x] User authentication (mock — sessionStorage demo accounts)
- [x] Search personalizes product feed in real-time (client-side scoring)
- [x] Checkout flow with address/phone validation
- [x] Manager approval queue with approve/reject
- [x] Agent trace visualization
- [x] Dark/light theme
- [x] Responsive design

### Active (Phase 2 — Not started)

- [ ] Backend API (FastAPI)
- [ ] CrewAI agent orchestration
- [ ] Supabase database + auth
- [ ] pgvector embeddings
- [ ] Real-time agent collaboration
- [ ] Server-side guardrails
- [ ] Personalized home feed (vector embeddings of search history → recommendations)
- [ ] Competitor price comparison dashboard (agent scrapes/mock data → comparison table)
- [ ] Automated purchase workflow (agent collects details → notifies PM)
- [ ] Feedback submission system (users submit feedback → agent aggregates)
- [ ] PM Dashboard (approve orders, view reports, approve agent-suggested fixes)
- [ ] Agent collaboration logs (visible in demo split-screen)
- [ ] Architecture documentation + Scalability & Roadmap slide

### Out of Scope

- Real-time payment processing — hackathon demo only, manual PM approval
- Production-grade anti-scraping — mock data for demo
- GDPR/PDPA compliance implementation — mention awareness in presentation
- Mobile responsive design — desktop-first for demo
- CI/CD pipeline — not needed for hackathon

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CrewAI over LangGraph | Faster to prototype in 3 days; simpler multi-agent orchestration | — Decided |
| Supabase over Firebase | PostgreSQL + pgvector for embeddings + Auth in one tool | — Decided |
| Hybrid demo data | Mock for most, real scraping for one controlled source | — Decided |
| Agent collaboration as core value | Judges evaluate technical novelty of agent orchestration | — Decided |
| 4 agents: Personalization, Competitor, Purchase, Feedback | Covers all hackathon requirements with clear agent boundaries | — Decided |
| Desktop-first UI | 3 days isn't enough for responsive; demo is on desktop | — Decided |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-16 after initialization*
