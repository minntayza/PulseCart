# Agent Engineer Plan — Phase 2 Backend

> **Owner:** Agent Engineer  
> **Sprint:** Day 2 (July 17)  
> **Depends on:** Backend Lead (FastAPI project init, Supabase schema)  
> **Blocks:** Frontend Lead (agent trace wiring), Demo Day 3  
> **Status:** 🔲 Not started

---

## Overview

This plan covers setting up the CrewAI agent framework and defining the first two agents: **RecommenderAgent** (personalization) and **OrderCoordinatorAgent** (checkout flow). These agents replace the frontend mock services with real backend logic.

---

## Prerequisites

Before starting, confirm these are ready (or unblock with Backend Lead):

| Dependency | Owner | Status |
|-----------|-------|--------|
| FastAPI project initialized (`backend/app/main.py`) | Backend Lead | 🔲 |
| Supabase project created + tables created | Data/Infra Lead | 🔲 |
| `backend/.env` with `SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY` | Data/Infra Lead | 🔲 |
| `backend/requirements.txt` includes `crewai`, `supabase`, `fastapi` | Backend Lead | 🔲 |
| Fixture data seeded (products, competitor prices, feedback) | Data/Infra Lead | 🔲 |

---

## Task 1: Set Up CrewAI Project Structure

**Goal:** CrewAI installed, project scaffolded, agent directory ready.

### Steps

1. **Create agent directory structure:**
   ```
   backend/
   ├── app/
   │   ├── agents/
   │   │   ├── __init__.py
   │   │   ├── recommender.py
   │   │   ├── order_coordinator.py
   │   │   └── orchestrator.py
   │   ├── tools/
   │   │   ├── __init__.py
   │   │   ├── search_tools.py
   │   │   └── order_tools.py
   │   └── models/
   │       ├── __init__.py
   │       └── schemas.py
   ```

2. **Add CrewAI dependencies to `requirements.txt`:**
   ```
   crewai[tools]
   supabase
   fastapi
   uvicorn
   pydantic
   python-dotenv
   ```

3. **Create `app/config.py`:**
   ```python
   import os
   from dotenv import load_dotenv

   load_dotenv()

   SUPABASE_URL = os.getenv("SUPABASE_URL")
   SUPABASE_KEY = os.getenv("SUPABASE_KEY")
   OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # optional, for LLM summaries
   ```

4. **Create `app/agents/orchestrator.py`:**
   - Simple orchestrator that instantiates agents and routes events
   - `run_recommender(query: str, user_id: str) -> dict`
   - `run_order_coordinator(order_data: dict) -> dict`
   - Logs every agent action to `audit_log` table via Supabase client

### Definition of Done
- [ ] `crewai` imports work without errors
- [ ] Agent files exist and are importable
- [ ] Orchestrator can be called from a FastAPI route
- [ ] Audit logging stub writes to `audit_log` table

---

## Task 2: Define RecommenderAgent

**Goal:** Agent that personalizes product feed based on search behavior.

### Agent Contract

| Field | Value |
|-------|-------|
| **Trigger** | Customer searches or views a product |
| **Input** | Search query + user profile (affinity scores) |
| **Action** | Update affinity scores, re-rank products by relevance |
| **Output** | Ordered list of product IDs with scores |
| **Guardrail** | No sensitive trait tracking (age, gender, income, etc.) |

### Steps

1. **Create `app/tools/search_tools.py`:**

   ```python
   def update_affinity_scores(query: str, user_id: str, current_profile: dict) -> dict:
       """
       Extract category keywords from query and update affinity scores.

       Rules:
       - Match query against product categories (gaming, office, audio, accessories)
       - Boost matching category by 0.1 (capped at 1.0)
       - Decay all other categories by 0.02 (floored at 0.0)
       - Never track: age, gender, income, location, health data
       """
       pass

   def re_rank_products(products: list, profile: dict) -> list:
       """
       Re-rank products by combining base relevance with profile affinity.

       Score = (keyword_match * 0.6) + (category_affinity * 0.4)
       Return products sorted by score descending.
       """
       pass

   def get_user_profile(user_id: str) -> dict:
       """
       Fetch user interest profile from Supabase `profiles` table.
       Return empty dict if no profile exists (cold start).
       """
       pass

   def save_user_profile(user_id: str, profile: dict) -> bool:
       """
       Upsert interest profile to Supabase `profiles` table.
       """
       pass
   ```

2. **Create `app/agents/recommender.py`:**

   ```python
   from crewai import Agent, Task, Crew

   recommender_agent = Agent(
       role="Personalization Specialist",
       goal="Re-rank the product feed based on the customer's search behavior and interest profile",
       backstory="""You are PulseCart's personalization agent. You observe what
       customers search for, update their interest profile, and re-rank the
       product feed so the most relevant items appear first. You never track
       sensitive personal traits — only product category interests.""",
       tools=[update_affinity_scores_tool, re_rank_products_tool],
       verbose=True,
       allow_delegation=False,
   )

   def run_recommender(query: str, user_id: str) -> dict:
       """
       Execute the recommendation pipeline:
       1. Fetch user profile (or create cold-start default)
       2. Update affinity scores based on query
       3. Fetch all products from Supabase
       4. Re-rank products using updated profile
       5. Log action to audit_log
       6. Return ranked product IDs + updated profile
       """
       pass
   ```

3. **Guardrail: sensitive trait filter:**
   - Scan query for blocked categories: `age`, `gender`, `income`, `race`, `religion`, `health`, `location`
   - If detected, log a warning and skip the query for personalization
   - Fall back to default trending products

4. **Wire to FastAPI route (coordinate with Backend Lead):**
   - `POST /api/recommend` — receives `{ query, user_id }`, returns `{ ranked_products, profile }`

### Definition of Done
- [ ] `update_affinity_scores()` correctly boosts matching categories
- [ ] `re_rank_products()` sorts by combined score
- [ ] Cold start handled (new user gets default profile)
- [ ] Sensitive trait guardrail blocks problematic queries
- [ ] Audit log records: agent_name, action, input, output, timestamp
- [ ] Route `/api/recommend` returns ranked products

---

## Task 3: Define OrderCoordinatorAgent

**Goal:** Agent that validates checkout data and queues orders for manager approval.

### Agent Contract

| Field | Value |
|-------|-------|
| **Trigger** | Customer submits checkout |
| **Input** | Product ID, address, phone number, user ID |
| **Action** | Validate data format, check completeness, create order |
| **Output** | Pending order in approval queue |
| **Guardrail** | Order stays `pending` until manager approves — never auto-confirm |

### Steps

1. **Create `app/tools/order_tools.py`:**

   ```python
   def validate_address(address: str) -> dict:
       """
       Validate shipping address format.

       Rules:
       - Must be non-empty
       - Must contain at least a street + city
       - Returns { valid: bool, errors: list[str] }
       """
       pass

   def validate_phone(phone: str) -> dict:
       """
       Validate phone number format.

       Rules:
       - Must be non-empty
       - Must be 8-15 digits (allowing +, -, spaces)
       - Returns { valid: bool, errors: list[str] }
       """
       pass

   def create_order(product_id: str, user_id: str, address: str, phone: str) -> dict:
       """
       Insert order into Supabase `orders` table with status='pending'.

       Returns { order_id, status: 'pending', created_at }
       """
       pass

   def check_order_exists(product_id: str, user_id: str) -> bool:
       """
       Check if user already has a pending order for this product.
       Prevent duplicate orders.
       """
       pass
   ```

2. **Create `app/agents/order_coordinator.py`:**

   ```python
   from crewai import Agent, Task, Crew

   order_coordinator_agent = Agent(
       role="Order Processing Coordinator",
       goal="Validate checkout data, create order, and queue for manager approval",
       backstory="""You are PulseCart's order coordinator. When a customer
       checks out, you validate their shipping address and phone number,
       then create a pending order in the approval queue. You NEVER
       confirm an order yourself — that requires manager approval.""",
       tools=[validate_address_tool, validate_phone_tool, create_order_tool],
       verbose=True,
       allow_delegation=False,
   )

   def run_order_coordinator(product_id: str, user_id: str, address: str, phone: str) -> dict:
       """
       Execute the order pipeline:
       1. Validate address (reject if invalid)
       2. Validate phone (reject if invalid)
       3. Check for duplicate pending order
       4. Create order with status='pending' in Supabase
       5. Log action to audit_log
       7. Return order confirmation (status: pending)
       """
       pass
   ```

3. **Guardrail: manager approval required:**
   - Order is created with `status='pending'` — never `'confirmed'`
   - `confirm_order()` function exists but is ONLY callable by manager role
   - Frontend approval button calls `POST /api/orders/{id}/approve`
   - If any validation fails, return structured error with specific field messages

4. **Wire to FastAPI route (coordinate with Backend Lead):**
   - `POST /api/orders` — receives checkout data, returns `{ order, status }`
   - `POST /api/orders/{id}/approve` — manager-only, sets status to `approved`
   - `POST /api/orders/{id}/reject` — manager-only, sets status to `rejected`

### Definition of Done
- [ ] Address validation catches empty/invalid addresses
- [ ] Phone validation catches non-phone strings
- [ ] Duplicate order prevention works
- [ ] Order created with `status='pending'` (never auto-confirmed)
- [ ] Audit log records all validation + creation actions
- [ ] Routes `/api/orders`, `/api/orders/{id}/approve`, `/api/orders/{id}/reject` work

---

## Task 4: Audit Logging (Shared)

**Goal:** Every agent action is logged to the `audit_log` table.

### Steps

1. **Create shared audit helper:**
   ```python
   # app/tools/audit.py
   def log_agent_action(agent_name: str, action: str, input_data: dict, output_data: dict):
       """
       Insert into Supabase `audit_log` table:
       {
         agent_name: str,
         action: str,
         input: JSONB,
         output: JSONB,
         timestamp: NOW()
       }
       """
       pass
   ```

2. **Call `log_agent_action()` at the end of every `run_*` function**

### Definition of Done
- [ ] Every `run_recommender()` call writes an audit log entry
- [ ] Every `run_order_coordinator()` call writes an audit log entry
- [ ] Audit entries include: agent name, action type, input JSON, output JSON, timestamp

---

## Implementation Order

```
1. Task 1: CrewAI project structure    (1-2 hours)
   └── Depends on: Backend Lead init
2. Task 4: Audit logging helper        (30 min)
   └── Can parallel with Task 1
3. Task 2: RecommenderAgent            (2-3 hours)
   └── Depends on: Task 1, Task 4
4. Task 3: OrderCoordinatorAgent       (2-3 hours)
   └── Depends on: Task 1, Task 4
```

**Total estimated time:** 5-8 hours (fits Day 2)

---

## Integration Points

| Who | What they need from you | What you need from them |
|-----|------------------------|------------------------|
| **Backend Lead** | Agent route handlers to mount in FastAPI | FastAPI app init, Supabase client setup |
| **Frontend Lead** | Agent trace data shape (input → decision → action → output) | API endpoint contracts for `/api/recommend`, `/api/orders` |
| **Data/Infra Lead** | Supabase table schemas match agent expectations | Seeded product/order/feedback data |
