---
sketch: 003
name: manager-dashboard
question: "How should the manager dashboard organize 4 agent output panels?"
winner: "A"
tags: [dashboard, cards, tabs, approval, market, feedback]
---

# Sketch 003: Manager Dashboard

## Design Question
How should the manager dashboard organize outputs from all 4 agents? This is the most complex screen — approval queue, market insights, feedback analysis, and agent activity. It's the centerpiece of the demo's second half.

## How to View
open .planning/sketches/003-manager-dashboard/index.html

## Variants
- **A: Tab Dashboard** — Stats row at top, then tabbed panels (Orders, Market, Feedback, Agents). Clean, focused. One thing at a time.
- **B: Card Grid** — 4 equal cards in a 2x2 grid, each showing a summary of one agent's output. Everything visible at once. Good for the demo "at a glance" moment.
- **C: Sidebar Nav** — Left sidebar navigation, main content area. More app-like, scalable. Good if there were more sections.

## What to Look For
- Which layout tells the demo story best? Judges see this for ~2 minutes.
- Does the tab approach (A) feel too hidden? Can judges see everything quickly?
- Does the card grid (B) feel too dense? Or does seeing everything at once help the demo?
- Does the sidebar (C) feel over-engineered for a hackathon?
- Try the "Run Weekly Analysis" button — watch the loading → success state
- Try approving an order — watch the status update
- Click through all tabs/nav items to see each agent's output
