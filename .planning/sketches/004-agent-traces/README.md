---
sketch: 004
name: agent-traces
question: "How should agent activity be visualized during the demo?"
winner: "C"
tags: [trace, split-screen, realtime, visualization]
---

# Sketch 004: Agent Traces

## Design Question
How should agent activity be visualized? This is the demo's hero moment — judges need to see agents observing, reasoning, acting, and guarding in real-time. The visualization must be compelling but not overwhelming.

## How to View
open .planning/sketches/004-agent-traces/index.html

## Variants
- **A: Split-Screen Demo** — Left side: user view (what the customer sees). Right side: dark terminal-style agent log (what the agents are doing). Auto-plays through the full demo scenario. This is the canonical demo layout.
- **B: Visual Flow Diagram** — Top: 4-step pipeline (Trigger → Reason → Act → Guard). Bottom: agent detail cards showing each agent's trace. More visual, less terminal-y. Good for the architecture explanation.
- **C: Floating Activity Feed** — Small floating panel in the bottom-right that pops up when agents are active. Non-intrusive, shows activity as cards. Good as an overlay on any screen.

## What to Look For
- Does the split-screen (A) feel like the right demo layout? The auto-play shows the full story.
- Does the flow diagram (B) help explain the agent architecture to judges?
- Does the floating feed (C) feel too hidden or just right as an overlay?
- In Variant A: click "Replay Demo" to restart, or "Step" to go one line at a time
- In Variant B: click "Run Demo Flow" to see the pipeline animate
- In Variant C: click "Add to Cart & Checkout" to trigger the floating feed
- Which visualization would a judge remember after the demo?
