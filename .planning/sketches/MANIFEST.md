# Sketch Manifest

## Design Direction
Clean, modern e-commerce interface with agent intelligence visible. The UI should feel like a real shopping app but with a "brain layer" — agent traces and insights that show the AI working behind the scenes. Desktop-first, hackathon speed. Split-screen demo: customer view left, agent activity right.

## Tech Stack
- **Frontend**: Next.js + Tailwind CSS
- **Backend**: FastAPI + CrewAI
- **Database**: Supabase (PostgreSQL + pgvector)

## Reference Points
- Shopify admin (clean dashboard layout)
- Vercel dashboard (dark mode, real-time activity)
- ChatGPT (agent trace visualization)
- Amazon product grid (familiar shopping patterns)

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|----------------|--------|------|
| 001 | product-feed | How should product browsing + personalized feed feel? | C: Split Browse | shopping, grid, search |
| 002 | checkout-flow | What checkout interaction pattern works best? | A: Modal Checkout | modal, form, agent-collected |
| 003 | manager-dashboard | How should the manager dashboard organize 4 data panels? | A: Tab Dashboard | dashboard, cards, tabs |
| 004 | agent-traces | How should agent traces be visualized? | C: Floating Feed | trace, split-screen, realtime |
