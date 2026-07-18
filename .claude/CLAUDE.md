<!-- GSD:project-start source:PROJECT.md -->

## Project

**Agentic Shopping Web App**

A hackathon prototype demonstrating multi-agent orchestration in a shopping context. Four AI agents collaborate in real-time: a Personalization Agent (vector embeddings for recommendations), a Competitor Analysis Agent (price comparison), a Purchase Workflow Agent (order processing), and a Feedback Agent (user insight aggregation). The demo proves that autonomous agents can replace manual e-commerce operations.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase JS client
- **Backend:** FastAPI (Python), Pydantic Settings, Supabase Python client, httpx
- **Agents:** CrewAI, LangChain, Anthropic SDK (feedback agent LLM)
- **Database:** Supabase (PostgreSQL + pgvector), with in-memory mock mode
- **Auth:** Supabase Auth (JWT) with demo token fallback
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

- Backend Pydantic models use camelCase aliases (`by_alias=True`) for JSON serialization
- Frontend TypeScript interfaces match backend camelCase output
- Email notifications are sent in Burmese language
- Agent traces are capped at 100 entries (backend) / 20 entries (frontend localStorage)
- Products use `is_active` (DB) mapped to `isActive` (API/model)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Monorepo with `frontend/` (Next.js App Router) and `backend/` (FastAPI). Backend uses a dual repository pattern: `MemoryRepository` for mock mode, `SupabaseRepository` for production. Four AI agents (recommender, market_analyst, order_coordinator, feedback_agent) are standalone Python functions. Frontend services abstract API calls with localStorage-backed mock implementations.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
