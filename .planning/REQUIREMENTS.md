# v1 Requirements — Agentic Shopping Web App

## Hackathon Constraints
- **Timeline**: 3 days (72 hours)
- **Team**: 4 people
- **Core Value**: Agent collaboration pipeline (must work in demo)
- **Scope**: Desktop-first, demo-focused, mock data acceptable
> **Status:** Phase 1 (Frontend) ✅ Complete | Phase 2 (Backend) 🔲 Not started

---

## v1 Requirements

### Foundation (AUTH + DB)
- [x] **AUTH-01**: User can create account with email/password (mock — sessionStorage)
- [x] **AUTH-02**: User can log in and stay logged in across sessions (sessionStorage)
- [x] **AUTH-03**: Unregistered users can browse products without signing up
- [ ] **DB-01**: Product catalog seeded in Supabase (50-100 mock products) — Phase 2
- [ ] **DB-02**: User search history stored in Supabase with vector embeddings — Phase 2

### Personalization Agent
- [x] **PERS-01**: Agent generates search scoring from user queries (client-side)
- [x] **PERS-02**: Agent updates feed in real-time on search (client-side scoring)
- [x] **PERS-03**: Home feed displays personalized recommendations based on scoring
- [x] **PERS-04**: New users see trending/default recommendations (cold start)

### Competitor Analysis Agent
- [x] **COMP-01**: Agent loads mock competitor prices (fixture data)
- [x] **COMP-02**: Agent compares platform prices vs competitor prices
- [x] **COMP-03**: Dashboard shows comparison table (Product | Our Price | Competitor | Action)
- [ ] **COMP-04**: Agent recommends price updates when competitor is cheaper — Phase 2

### Purchase Workflow Agent
- [x] **PURC-01**: User can initiate purchase from product page
- [x] **PURC-02**: Agent collects address and phone number during checkout
- [x] **PURC-03**: Agent sends order notification to PM dashboard (localStorage)
- [x] **PURC-04**: PM can approve/reject orders from dashboard

### Feedback & Insight Agent
- [ ] **FEED-01**: User can submit feedback via form — Phase 2
- [x] **FEED-02**: Agent aggregates feedback and identifies common issues (fixture data)
- [x] **FEED-03**: Agent generates weekly report with issue summary (fixture data)
- [ ] **FEED-04**: Agent suggests fixes/approved responses for PM to one-click approve — Phase 2

### PM Dashboard
- [x] **PM-01**: PM can view all pending orders
- [x] **PM-02**: PM can view competitor analysis reports
- [x] **PM-03**: PM can view feedback aggregation reports
- [x] **PM-04**: Agent logs are visible in demo split-screen view (AgentPanel)

### Demo & Presentation
- [x] **DEMO-01**: Agent trace panel shows agent reasoning (AgentFeed + AgentPanel)
- [ ] **DEMO-02**: Architecture diagram documented — Phase 2
- [ ] **DEMO-03**: Scalability & Roadmap slide prepared — Phase 2

---

## v2 Requirements (Deferred — if time permits)

- Real web scraping of one controlled source
- Mobile responsive design
- Real-time order status tracking
- Multi-language support (English/Myanmar)
- OAuth login (Google/GitHub)

---

## Out of Scope

- Real payment processing — manual PM approval only
- Production anti-scraping — mock data for demo
- GDPR/PDPA compliance — mention awareness in presentation
- CI/CD pipeline — not needed for hackathon
- Unit/integration tests — time constraint

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | ✅ Mock (sessionStorage) |
| AUTH-02 | Phase 1 | ✅ Mock (sessionStorage) |
| AUTH-03 | Phase 1 | ✅ Working |
| DB-01 | Phase 2 | 🔲 Not started |
| DB-02 | Phase 2 | 🔲 Not started |
| PERS-01 | Phase 1 | ✅ Client-side scoring |
| PERS-02 | Phase 1 | ✅ Client-side scoring |
| PERS-03 | Phase 1 | ✅ Working |
| PERS-04 | Phase 1 | ✅ Working |
| COMP-01 | Phase 1 | ✅ Fixture data |
| COMP-02 | Phase 1 | ✅ Fixture data |
| COMP-03 | Phase 1 | ✅ Working |
| COMP-04 | Phase 2 | 🔲 Not started |
| PURC-01 | Phase 1 | ✅ Working |
| PURC-02 | Phase 1 | ✅ Working |
| PURC-03 | Phase 1 | ✅ Mock (localStorage) |
| PURC-04 | Phase 1 | ✅ Working |
| FEED-01 | Phase 2 | 🔲 Not started |
| FEED-02 | Phase 1 | ✅ Fixture data |
| FEED-03 | Phase 1 | ✅ Fixture data |
| FEED-04 | Phase 2 | 🔲 Not started |
| PM-01 | Phase 1 | ✅ Working |
| PM-02 | Phase 1 | ✅ Working |
| PM-03 | Phase 1 | ✅ Working |
| PM-04 | Phase 1 | ✅ Working |
| DEMO-01 | Phase 1 | ✅ Working |
| DEMO-02 | Phase 2 | 🔲 Not started |
| DEMO-03 | Phase 2 | 🔲 Not started |

---
