# 🎯 OKRs — Agentic Shopping Hackathon

> **Project**: Agentic-Based Shopping Web App
> **Hackathon**: "Agentic-based Solutions for Real-World Problems"
> **Timeline**: 3 days (72 hours)
> **Date**: 2026-07-16
> **Status**: Phase 1 (Frontend) complete as of 2026-07-16

---

## Context

The frontend is fully built and functional with mock data. Phase 2 (backend + real agents) is pending. The team is building a shopping web app powered by multi-agent orchestration (CrewAI / AutoGen / LangGraph) with four core agent capabilities:

1. **Personalized Recommendation Agent** — Modifies home feed based on user search history via vector embeddings
2. **Competitor Analysis Agent** — Weekly scraping + price comparison dashboard
3. **Purchase Workflow Agent** — Collects order details, notifies PM
4. **Feedback & Insight Agent** — Aggregates user feedback, drafts suggested fixes

**Tech Stack** (suggested based on developer profile):
- Frontend: Next.js + Tailwind CSS
- Backend: FastAPI
- AI/Agents: CrewAI or LangGraph
- Database: Supabase (PostgreSQL + Auth)
- Vector DB: Pinecone or pgvector

---

## OKR Set 1 — "Win with a Jaw-Dropping Agent Demo"

> **Focus**: Judges want to see agents *think and collaborate in real-time*. Make the demo the primary deliverable.

**Objective**: Deliver a split-screen live demo that proves autonomous agents can replace manual e-commerce operations, judged by the technical depth of the agent orchestration pipeline.

| # | Key Result | Target | Measurement |
|---|-----------|--------|-------------|
| **KR1** | Agent-to-agent communication latency | < 3 seconds per agent handoff | Timestamp logs between agent calls; p95 latency |
| **KR2** | Number of distinct agent personas collaborating in a single workflow | ≥ 4 agents (Researcher, Analyst, Purchaser, Feedback Aggregator) | Count of unique agent roles registered in CrewAI/LangGraph |
| **KR3** | End-to-end demo completion rate | ≥ 90% success across 10 demo runs | Automated smoke test: search → recommendation → purchase flow → feedback submission |

**Rationale**: Hackathon judges evaluate *technical novelty*, not just features. If your agents can't complete a flow reliably or communicate visibly, nothing else matters. This OKR set ensures the core agent loop is bulletproof before polishing UI.

**Risks**: Over-indexing on the demo pipeline could leave the actual web app undercooked. Mitigate with a clean separation: the demo script is a standalone workflow that connects to the app's API.

---

## OKR Set 2 — "Prove Agents Create Measurable User Value"

> **Focus**: Shift from "cool agents" to "agents that actually make the shopping experience better." Judges see *outcomes*, not just technology.

**Objective**: Demonstrate that agentic personalization and automated workflows reduce friction and increase user engagement compared to a traditional shopping experience.

| # | Key Result | Target | Measurement |
|---|-----------|--------|-------------|
| **KR1** | Click-through rate on agent-recommended products | ≥ 35% CTR (vs. baseline 15% for non-personalized) | A/B test or simulated user sessions during demo |
| **KR2** | Average time from "initiate purchase" to "PM notification sent" | ≤ 5 seconds | Agent workflow timestamps |
| **KR3** | User satisfaction score on feedback submission flow | ≥ 4.0 / 5.0 | In-app micro-survey after feedback submission |

**Rationale**: The "cold start" problem is real—new users have no history. This OKR forces the team to solve it (seed recommendations from trending products, onboarding quiz, or default preferences). The 35% CTR target is ambitious but achievable with even basic vector-based personalization.

**Risks**: Gathering real user data in 3 days is hard. Use simulated user personas + seed data to generate measurable results. Label it clearly: "Projected based on simulated user behavior."

---

## OKR Set 3 — "Ship Production-Grade Agent Architecture"

> **Focus**: Technical architecture and clean code. Judges often award prizes to projects that are well-engineered and extensible, not just flashy demos.

**Objective**: Ship a production-grade agent system with clean APIs, proper error handling, and a documented architecture that could scale beyond the hackathon.

| # | Key Result | Target | Measurement |
|---|-----------|--------|-------------|
| **KR1** | Agent system uptime during live demo | ≥ 99% (no crashes, no unhandled exceptions) | Error logs + uptime monitoring |
| **KR2** | Code coverage on agent orchestration logic | ≥ 60% | Jest/Pytest coverage report |
| **KR3** | Architecture documentation completeness | ≥ 80% of components documented with data flow diagrams | Manual audit against architecture checklist |

**Rationale**: Most hackathon projects are fragile prototypes. If you ship something that *works reliably* and has clean docs, judges remember that. The 80% documentation target forces you to think about what you're actually building—this also becomes your "Scalability & Roadmap" slide.

**Risks**: Documentation is often the first thing cut under time pressure. Front-load it: write the architecture diagram in the first 2 hours, then implement against it.

---

## Comparative Summary

| Dimension | Set 1 (Demo) | Set 2 (User Value) | Set 3 (Architecture) |
|-----------|-------------|-------------------|---------------------|
| **Primary audience** | Hackathon judges | End users / demo viewers | Technical reviewers |
| **Key bet** | Reliability of agent flow | Measurable personalization lift | Clean, extensible code |
| **Riskiest KR** | KR3 (90% demo success) | KR1 (35% CTR without real users) | KR2 (60% coverage in 3 days) |
| **Time allocation** | 60% demo prep, 40% build | 50% build, 30% testing, 20% metrics | 30% build, 40% testing, 30% docs |

---

## ⭐ Recommended Hybrid OKR

> **Objective**: Ship a reliable, well-documented agentic shopping system that demonstrates real-time agent collaboration in a live demo, with architecture that scales beyond the prototype.

| # | Key Result | Source |
|---|-----------|--------|
| **KR1** | ≥ 4 agents collaborate end-to-end with < 3s latency per handoff | Set 1 (KR1 + KR2) |
| **KR2** | ≥ 90% demo success rate across 10 test runs | Set 1 (KR3) |
| **KR3** | ≥ 80% architecture documentation with data flow diagrams | Set 3 (KR3) |

---

## 3-Day Sprint Breakdown (Suggested)

### Day 1 (Foundation)
- [ ] Initialize repo, set up Supabase + FastAPI + Next.js
- [ ] Design agent architecture (diagram first, then code)
- [ ] Implement basic product catalog + user auth
- [ ] Scaffold CrewAI/LangGraph agent roles

### Day 2 (Agent Core)
- [ ] Implement Personalization Agent (vector embeddings + recommendation logic)
- [ ] Implement Competitor Analysis Agent (mock scraper + price comparison)
- [ ] Implement Purchase Workflow Agent (order collection + PM notification)
- [ ] Connect agents to web app API

### Day 3 (Polish & Demo)
- [ ] Implement Feedback Agent (aggregation + report generation)
- [ ] Build PM Dashboard (approve orders, view reports)
- [ ] End-to-end testing (10 demo runs)
- [ ] Documentation + "Scalability & Roadmap" slide
- [ ] Prepare split-screen demo (user action + agent logs)

---

## Open Questions

1. **CrewAI vs LangGraph?** CrewAI is simpler for multi-agent orchestration; LangGraph is more flexible for complex state machines. For 3 days, CrewAI is likely faster.
2. **Supabase or Firebase?** Supabase gives you PostgreSQL + pgvector (good for embeddings) + Auth in one tool. Firebase is more mature but requires separate vector DB.
3. **Mock scraper or real?** Mock is safer. If time allows, add a simple scraper for one specific site (e.g., a product comparison site with weak anti-bot).
4. **Do you have the `agentic-ai-burmese.pdf`** on your Desktop? It may contain hackathon guidelines worth reviewing.

---

*Generated: 2026-07-16 | OKR Framework: Radical Focus (Christina Wodtke)*
