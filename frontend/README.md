# PulseCart — Frontend

> AI-powered shopping platform with multi-agent orchestration

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@pulsecart.demo` | `Manager123!` |
| Customer | `customer@pulsecart.demo` | `Customer123!` |

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript 5

## Project Structure

```
src/
├── app/              # Pages (6 routes)
├── components/       # UI components (14)
├── data/             # Fixture data (5 files)
├── services/         # Mock services (4 files)
└── types/            # TypeScript interfaces
```

## What's Included

- **Storefront**: Product grid with search, category filtering, and AI-powered feed re-ranking
- **Product Detail**: Specs, explanations, and add-to-cart
- **Checkout**: 3-step flow (cart → delivery → confirmation)
- **Manager Dashboard**: Orders, market insights, feedback, and agent activity panels
- **Agent Visualization**: Real-time agent trace panel showing reasoning process
- **Theme**: Dark/light mode with smooth transitions
- **Responsive**: Mobile-friendly layout

## Data

All data is mocked in browser (localStorage/sessionStorage). No backend required for Phase 1.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React 19](https://react.dev)
