# v1 Requirements — Agentic Shopping Web App

## Hackathon Constraints
- **Timeline**: 3 days (72 hours)
- **Team**: 4 people
- **Core Value**: Agent collaboration pipeline (must work in demo)
- **Scope**: Desktop-first, demo-focused, mock data acceptable

---

## v1 Requirements

### Foundation (AUTH + DB)
- [ ] **AUTH-01**: User can create account with email/password via Supabase Auth
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: Unregistered users can browse products without signing up
- [ ] **DB-01**: Product catalog seeded in Supabase (50-100 mock products)
- [ ] **DB-02**: User search history stored in Supabase with vector embeddings

### Personalization Agent
- [ ] **PERS-01**: Agent generates vector embeddings from user search queries
- [ ] **PERS-02**: Agent updates user interest profile in real-time on search
- [ ] **PERS-03**: Home feed displays personalized recommendations based on embeddings
- [ ] **PERS-04**: New users see trending/default recommendations (cold start)

### Competitor Analysis Agent
- [ ] **COMP-01**: Agent scrapes or loads mock competitor prices for products
- [ ] **COMP-02**: Agent compares platform prices vs competitor prices
- [ ] **COMP-03**: Dashboard shows comparison table (Product | Our Price | Competitor | Action)
- [ ] **COMP-04**: Agent recommends price updates when competitor is cheaper

### Purchase Workflow Agent
- [ ] **PURC-01**: User can initiate purchase from product page
- [ ] **PURC-02**: Agent collects address and phone number during checkout
- [ ] **PURC-03**: Agent sends order notification to PM dashboard
- [ ] **PURC-04**: PM can approve/reject orders from dashboard

### Feedback & Insight Agent
- [ ] **FEED-01**: User can submit feedback via form
- [ ] **FEED-02**: Agent aggregates feedback and identifies common issues
- [ ] **FEED-03**: Agent generates weekly report with issue summary
- [ ] **FEED-04**: Agent suggests fixes/approved responses for PM to one-click approve

### PM Dashboard
- [ ] **PM-01**: PM can view all pending orders
- [ ] **PM-02**: PM can view competitor analysis reports
- [ ] **PM-03**: PM can view feedback aggregation reports
- [ ] **PM-04**: Agent logs are visible in demo split-screen view

### Demo & Presentation
- [ ] **DEMO-01**: Split-screen view: user action (left) + agent logs (right)
- [ ] **DEMO-02**: Architecture diagram documented
- [ ] **DEMO-03**: Scalability & Roadmap slide prepared

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
| (filled by roadmap) | | |

---
