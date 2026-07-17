# PulseCart — Agentic Commerce Operations Copilot

> Multi-agent shopping platform where 4 AI agents collaborate in real-time — personalizing storefronts, analyzing competitors, coordinating orders, and aggregating feedback.

## Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Frontend with mock data |
| Phase 2 | 🔲 Not started | Backend + real agents |

## Quick Start (Phase 1)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo accounts:**
- Manager: `manager@pulsecart.demo` / `Manager123!`
- Customer: `customer@pulsecart.demo` / `Customer123!`

## What's Built

### Phase 1: Frontend ✅
- Next.js 16 + Tailwind CSS 4
- 14 components, 6 pages, 4 services
- Product storefront with search and category filtering
- AI-powered feed re-ranking (client-side scoring)
- 3-step checkout flow
- Manager dashboard with 4 panels (Orders, Market, Feedback, Agents)
- Agent trace visualization
- Dark/light theme
- Responsive design

### Phase 2: Backend 🔲
- FastAPI backend
- CrewAI agent orchestration
- Supabase database + auth
- pgvector embeddings
- Real-time agent collaboration

## Project Structure

```
agentic_based_solutions_hackathon/
├── frontend/           # Next.js 16 app (Phase 1 complete)
│   ├── src/
│   │   ├── app/        # 6 pages
│   │   ├── components/ # 14 components
│   │   ├── data/       # 5 fixture files
│   │   ├── services/   # 4 mock services
│   │   └── types/      # TypeScript interfaces
│   └── package.json
├── .planning/          # Design sketches + project docs
├── PROJECT-PLAN.md     # Full project plan
└── README.md           # This file
```

## Documentation

- [Project Plan](PROJECT-PLAN.md) — Full sprint plan, architecture, and setup guide
- [Frontend README](frontend/README.md) — Frontend-specific documentation
- [Planning Docs](.planning/) — Design sketches, roadmap, requirements, state

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16 + Tailwind CSS 4 | ✅ Implemented |
| Backend | FastAPI (Python) | 🔲 Not started |
| Agents | CrewAI | 🔲 Not started |
| Database | Supabase (PostgreSQL + pgvector) | 🔲 Not started |
| Auth | Mock (sessionStorage) | ✅ Implemented |

## License

Hackathon project — not for production use.
