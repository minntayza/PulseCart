# Roadmap: PulseCart — Agentic Commerce Operations Copilot

> 3-Day Hackathon | Start: 2026-07-16 | End: 2026-07-18
> Positioning: "Agentic Commerce Operations Copilot"
> Core Value: Agents that observe → reason → act → report, with human approval on risky actions

---

## Phase 1: Foundation + Working Vertical Slice (Day 1 — July 16)

**Goal:** Search → personalized feed + Checkout → approval queue — both live end-to-end.

### Morning (9:00–12:00) — Value prop lock + UI shell

| Req ID | Task | Owner |
|---|---|---|
| DEMO-01 | Finalize demo scenario (gaming laptop → checkout → manager approve) | All |
| AUTH-01 | Implement demo user auth (hardcoded demo account) | Backend |
| UI-01 | Build Next.js app shell + Tailwind layout | Frontend |
| DB-01 | Set up Supabase project (PostgreSQL + pgvector) | Backend |
| DB-02 | Create schema: users, products, searches, profiles, orders, feedback, audit_log | Backend |

**Data fixtures to prepare:**
- Product catalog (20–30 items: laptops, chairs, headphones, accessories)
- Competitor price snapshot (JSON fixture — our prices vs competitor for 10 SKUs)
- Feedback messages (25–30 mock messages with delivery, quality, pricing themes)

### Afternoon (12:00–17:00) — Search → Profile → Feed re-ranking

| Req ID | Task | Owner |
|---|---|---|
| PERS-01 | Implement search event tracking (query + timestamps) | Backend |
| PERS-02 | Implement interest profile update (affinity scores from search history) | Backend |
| PERS-03 | Implement feed re-ranking based on profile affinity | Backend |
| UI-02 | Search bar + product grid with real-time feed update | Frontend |
| PERS-04 | Agent trace panel: show input → decision → action for recommendation | Frontend |

### Evening (17:00–21:00) — Checkout → Order → Approval queue

| Req ID | Task | Owner |
|---|---|---|
| PURC-01 | Implement checkout modal with validation (address, phone) | Frontend + Backend |
| PURC-02 | Order coordinator agent: validate + create approval task | Backend |
| PM-01 | Manager approval queue UI (list + approve/reject) | Frontend |
| UI-03 | Approval queue wired to order status updates | Frontend |

**Day 1 checkpoint:** Git commit. Backup demo video. E2E: search "gaming laptop" → feed changes → checkout → enters queue.

---

## Phase 2: Agent Intelligence + Guardrails (Day 2 — July 17)

**Goal:** All 4 agents fully functional with triggers, decisions, actions, and guardrails visible.

### Morning (9:00–12:00) — Market Analyst Agent

| Req ID | Task | Owner |
|---|---|---|
| COMP-01 | Normalize competitor data fixture (SKU match, price gap calc) | Backend |
| COMP-02 | Implement price gap analysis + "keep/review/bundle" recommendation | Backend |
| COMP-03 | Market analyst trace: show SKU → gap → recommendation flow | Frontend |
| PM-02 | Market insights panel on manager dashboard | Frontend |

### Afternoon (12:00–17:00) — Feedback Agent + Weekly Orchestrator

| Req ID | Task | Owner |
|---|---|---|
| FEED-01 | Implement feedback theme clustering (delivery, quality, pricing) | Backend |
| FEED-02 | Implement mention count + severity calculation | Backend |
| FEED-03 | Implement suggested fix generation per theme | Backend |
| PM-03 | Weekly orchestrator button (triggers market + feedback agents) | Frontend |
| UI-04 | Agent activity dashboard showing all 4 agents' latest traces | Frontend |

### Evening (17:00–21:00) — Guardrails + Error States

| Req ID | Task | Owner |
|---|---|---|
| PURC-03 | Guardrail: no order confirm without manager approval | Backend |
| COMP-04 | Guardrail: no auto price change without manager approval | Backend |
| PM-04 | Audit trail viewer (all agent actions logged) | Frontend |
| UI-05 | Loading, error, and empty states across all views | Frontend |

**Optional:** If LLM integration is desired, connect now with structured JSON output. API fallback must not break deterministic demo.

**Day 2 checkpoint:** Each agent's trigger → decision → action → guardrail explainable from UI.

---

## Phase 3: Judge Experience + Polish (Day 3 — July 18)

**Goal:** Flawless 4-minute demo + 2-min explanation + 1-min roadmap.

### Morning (9:00–12:00) — E2E Testing + Polish

| Req ID | Task | Owner |
|---|---|---|
| DEMO-02 | End-to-end walkthrough: all 5 demo steps working | All |
| UI-06 | Mobile layout check (responsive enough for judges) | Frontend |
| DEMO-03 | Data reset button (restore fixtures to clean state) | Backend |
| — | Privacy note / scraper limitations text on dashboard | Frontend |

### Afternoon (12:00–17:00) — Pitch Prep

| Req ID | Task | Owner |
|---|---|---|
| DEMO-02 | Pitch rehearsal (5–7 min): story → live demo → architecture → business value | All |
| — | Architecture diagram (mermaid or hand-drawn) | All |
| — | Fallback screenshots/video in case of live demo failure | All |

### Evening (17:00–21:00) — Feature Freeze + Final Rehearsal

| Req ID | Task | Owner |
|---|---|---|
| — | Feature freeze at 17:00 | All |
| DEMO-02 | Two consecutive successful demo runs | All |
| — | Q&A prep: write answers to likely judge questions | All |
| — | Repo README + run instructions verified | All |

**Day 3 success:** 4-min demo + 2-min business/architecture + 1-min roadmap, on time.

---

## Demo Scenario (What Judges See)

1. **Customer searches "gaming laptop"** → Recommender updates gaming affinity → gaming products rise to top
2. **Customer checks out laptop** → Order agent validates address/phone → creates approval task
3. **Manager dashboard — Market Analyst** shows chair price 10.6% above competitor → suggests review price (no auto-change)
4. **Manager dashboard — Feedback Agent** finds "delivery visibility" as top theme from 27 messages → suggests proactive ETA messages
5. **Manager approves order** → Audit trace shows full agent action history

## Agent Contracts

| Agent | Trigger | Input | Tool/Action | Output | Guardrail |
|---|---|---|---|---|---|
| Recommender | search/view | query + profile | update affinity, re-rank | personalized feed | no sensitive traits |
| Market Analyst | weekly/manual | normalized SKU prices | compare gap | action report | no auto price change |
| Order Coordinator | checkout | item, address, phone | validate, queue | approval task | manager approval |
| Feedback Agent | weekly/manual | feedback batch | cluster themes | insight + proposed fix | redact PII |

## Judging Strengths

- Real business problems (3) linked in one customer + manager loop
- Agent actions visible in dashboard trace — not a black box
- Risk-based human approval, not "full autonomy" overreach
- Controlled data + deterministic fallback = demo reliability
- Clear roadmap from prototype → production adapters
