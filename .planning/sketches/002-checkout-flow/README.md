---
sketch: 002
name: checkout-flow
question: "What checkout interaction pattern works best for agent-collected details?"
winner: "A"
tags: [checkout, modal, form, agent-collected]
---

# Sketch 002: Checkout Flow

## Design Question
What checkout interaction pattern works best? The Purchase Workflow Agent needs to collect address and phone, validate the order, and send it for manager approval. The UI must show the agent working.

## How to View
open .planning/sketches/002-checkout-flow/index.html

## Variants
- **A: Modal Checkout** — Full overlay modal with agent status steps at top. Compact, focused. Agent shows progress as numbered steps.
- **B: Slide-in Drawer** — Right-side panel that slides in. Shows a live agent log (terminal-style) while user fills the form. More "agent-y" feel.
- **C: Step-by-Step Flow** — Full-page wizard (Details → Review → Submitted). Cleanest UX, but loses the "agent watching" feel until the final step.

## What to Look For
- Which pattern feels most natural for a hackathon demo?
- Does the agent visibility (steps vs. live log) add to the demo story or distract?
- Click "Checkout" on the product card to open each variant
- In Variant B, watch the agent log update after 2 seconds
- In Variant C, walk through all 3 steps
