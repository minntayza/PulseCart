# State: PulseCart

> Last updated: 2026-07-16T12:00:00

## Current Phase: Phase 1 — Foundation + Working Vertical Slice

**Status:** NOT STARTED
**Target:** 2026-07-16 (Day 1)

## Completed

None yet.

## Blocked

None.

## Next Actions

1. Lock demo scenario + data fixtures
2. Set up Supabase project + schema
3. Build Next.js app shell
4. Implement search → profile → feed pipeline
5. Implement checkout → order → approval queue

## Decisions Made

| Decision | Choice | Why |
|---|---|---|
| Agent framework | CrewAI | Faster prototyping for hackathon |
| Database | Supabase | Auth + DB + pgvector in one |
| Demo data | Hybrid (fixtures + controlled JSON) | Reliable demo + some real signals |
| Auth | Hardcoded demo user | MVP scope, no real auth needed |
| LLM integration | Optional, deterministic fallback | Demo must not depend on API uptime |

## Risk Log

| Risk | Mitigation | Status |
|---|---|---|
| CrewAI setup takes too long | Fallback to direct function calls | OPEN |
| Demo data too fake | Hybrid approach — some real scraped data | OPEN |
| 3 days not enough | YOLO mode, coarse granularity, skip non-critical | OPEN |
