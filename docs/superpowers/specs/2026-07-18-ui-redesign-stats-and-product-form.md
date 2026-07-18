# UI Redesign: StatsRow + ProductAdminPanel

## Overview

Two changes to the manager dashboard:
1. Replace "Agent Uptime" and "Customer Satisfaction" stats with "Active Agents" and "Feedback Signals"
2. Simplify the product admin form by removing manual detail fields and adding AI auto-generation via Anthropic API

## Change 1: StatsRow

### Current State
4 hardcoded cards: Total Revenue, Pending Orders, Agent Uptime, Customer Satisfaction

### Target State
4 hardcoded cards with colored accent dots instead of emoji icons:

| Card | Accent Color | Value | Subtext |
|------|-------------|-------|---------|
| Total Revenue | Green (`success`) | $24,580 | +12.5% |
| Pending Orders | Amber (`accent`) | 7 | 3 need approval |
| Active Agents | Purple (`agent`) | 2/3 | All systems nominal |
| Feedback Signals | Blue (`primary`) | 12 total | 3 high severity |

### Visual Design
- Each card: small 8x8 `rounded-full` colored dot (top-left) + label + value + subtext
- No emoji icons
- Same grid layout: `grid-cols-2` on mobile, `grid-cols-4` on desktop
- Same card style: `bg-surface rounded-xl border border-border p-4`

### Files
- `frontend/src/components/dashboard/StatsRow.tsx` — rewrite stats array, replace emoji with colored dot element

---

## Change 2: ProductAdminPanel — Simplified Form + AI Generation

### Current State
11 fields in the form: Name, Category, Price, Stock, Description, Overview, How it works, Best for, Limitations, Delivery estimate, Warranty, Image

### Target State

**Step 1 — Basic fields (always visible):**
- Name (text input, required)
- Category (select: laptops, chairs, headphones, accessories)
- Price (number input, required)
- Stock (number input, required)
- Short description (textarea, 2 rows, required)
- Warranty (text input, default: "1-year limited warranty")
- Product image (file upload, optional)

**Step 2 — AI Generate Details:**
- "Generate Details" button appears after name + category + description are filled
- Calls `POST /products/generate-details`
- Loading state while generating
- On success, 4 editable fields expand below:

| Field | Type | Required |
|-------|------|----------|
| Overview | textarea, 3 rows | No |
| How it works | textarea, 3 rows | No |
| Best for | text input (comma-separated) | No |
| Limitations | text input (comma-separated) | No |

- All generated fields are fully editable
- Manager can save without generating (fields are optional)

**Preview panel** stays on the right, updates in real-time.

### Removed Fields
- `deliveryEstimate` — removed from admin form and auto-generation entirely (no address data to estimate delivery)

---

## Change 3: Backend — Generate Details Endpoint

### New Endpoint
```
POST /products/generate-details
Authorization: Bearer <manager-token>
```

### Request
```json
{
  "name": "AuraMax Pro",
  "category": "chairs",
  "description": "Ergonomic office chair with lumbar support"
}
```

### Response
```json
{
  "overview": "The AuraMax Pro is an ergonomic chair designed for people who want lumbar support...",
  "howItWorks": "Adjustable height, tilt, and lumbar support help keep your spine...",
  "bestFor": ["Long work sessions", "Home offices", "People with back pain"],
  "limitations": ["Requires assembly", "Premium price point"]
}
```

### Implementation
- Route: `backend/app/routes/products.py` (add to existing products router)
- Uses `anthropic` Python package (already in requirements.txt)
- Reads `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` from config
- Calls Anthropic Messages API with structured prompt
- Manager role required via `manager_user()` dependency
- No database changes — fields generated on-the-fly

### Error Handling
- Anthropic API failure → 500 with error message
- Missing required fields → 422 validation error
- Frontend shows error inline, manager can still save without generated fields

---

## Change 4: Types & Models

### TypeScript (`frontend/src/types/index.ts`)
- Add `GenerateDetailsRequest`: `{ name: string; category: string; description: string }`
- Add `GenerateDetailsResponse`: `{ overview: string; howItWorks: string; bestFor: string[]; limitations: string[] }`
- `Product` interface unchanged (fields already optional)

### Pydantic (`backend/app/models/schemas.py`)
- Add `GenerateDetailsRequest`: `name`, `category`, `description` (all required strings)
- Add `GenerateDetailsResponse`: `overview`, `howItWorks`, `bestFor`, `limitations`

---

## Change 5: Frontend Service

### `frontend/src/services/managerProductService.ts`
- Add `generateProductDetails(data: GenerateDetailsRequest, token: string): Promise<GenerateDetailsResponse>`
- POST to `/products/generate-details` with Bearer token

---

## Database

No schema changes. `delivery_estimate` column exists in `products` table from migration 003, but won't be populated from the admin form anymore. Existing data unaffected.

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/components/dashboard/StatsRow.tsx` | Rewrite stats, replace emoji with colored dots |
| `frontend/src/components/dashboard/ProductAdminPanel.tsx` | Simplify form, add AI generation flow |
| `frontend/src/types/index.ts` | Add GenerateDetailsRequest/Response |
| `frontend/src/services/managerProductService.ts` | Add generateProductDetails() |
| `backend/app/routes/products.py` | Add /generate-details endpoint |
| `backend/app/models/schemas.py` | Add request/response models |
| `backend/app/config.py` | Verify Anthropic config fields exist |

---

## Testing

- Verify StatsRow renders 4 cards with colored dots on desktop and mobile
- Verify ProductAdminPanel shows only basic fields initially
- Verify "Generate Details" button calls API and populates editable fields
- Verify generated fields can be edited before saving
- Verify product saves with all fields (basic + generated)
- Verify error handling when Anthropic API is unavailable
- Verify manager role is required for generation endpoint
