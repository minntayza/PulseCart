# PulseCart Frontend Handoff

> Living integration guide for the backend, agent, and data teams. The root [`PROJECT-PLAN.md`](../PROJECT-PLAN.md) remains the source of truth for product scope and sprint responsibilities.

## Current status

- **Day 1 frontend:** complete using mock/browser-backed services.
- **Day 2 frontend:** market, feedback, order, and agent panels exist; weekly orchestration, audit viewer, and real agent integration remain.
- **Backend integration:** not started. Current authentication, orders, search ranking, and traces are frontend demo implementations.
- **Verification:** `npm run lint` and `npm run build` pass.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Storefront, search, categories, sorting, cart, checkout entry |
| `/products/[id]` | Public | Product overview, explanations, specifications, quantity and cart action |
| `/login` | Public | Customer/manager login |
| `/register` | Public | Customer registration only |
| `/account/orders` | Customer | Signed-in customer's order history |
| `/manager` | Manager | Approval queue, market insights, feedback, and agent activity |

Frontend route guards improve UX only. Backend endpoints must enforce authentication and roles independently.

## Working frontend flows

### Search and recommendation

1. The header emits a search event.
2. `searchProducts(query)` scores fixture products by name, category, and description.
3. The full feed is re-ranked rather than destructively filtered.
4. A Recommender trace is saved and displayed in Agent Activity.

### Checkout and approval

1. Visitors may browse and add products to the cart.
2. Checkout requires a signed-in customer.
3. Name, address, and phone are validated.
4. `createOrder()` creates a `pending` order and an Order Coordinator trace.
5. The cart clears only after successful order creation.
6. A manager can approve or reject the order.
7. The customer sees the updated status in My Orders.

### Authentication and roles

- Public registration always creates `role: "customer"`.
- There is no manager option on registration.
- The manager navigation and dashboard content are role-gated.
- Current auth is a browser-only demo and is not a security boundary.

## Important source files

| File | Responsibility |
|---|---|
| `src/types/index.ts` | Shared frontend data contracts |
| `src/services/authService.ts` | Mock registration, login, logout, session |
| `src/services/searchService.ts` | Mock product scoring and Recommender trace |
| `src/services/orderService.ts` | Mock order creation, history, approval/rejection |
| `src/services/storage.ts` | Browser persistence and UI synchronization events |
| `src/data/products.ts` | Product fixtures |
| `src/data/productDetails.ts` | Educational product-detail content |
| `src/data/competitors.ts` | Competitor-price fixtures |
| `src/data/feedback.ts` | Feedback-message/theme fixtures |
| `src/data/agents.ts` | Initial agent trace fixtures |

## Current service interface

Components should continue calling these functions. Backend integration should replace their internals rather than rewriting UI components.

```ts
// authService.ts
getStoredUser(): AuthUser | null
login(email, password): Promise<AuthUser>
register(username, email, password): Promise<AuthUser>
logout(): void

// searchService.ts
searchProducts(query): Promise<SearchResult>

// orderService.ts
createOrder(input): Promise<Order>
getOrders(): Promise<Order[]>
getOrdersForUser(userId): Promise<Order[]>
updateOrderStatus(id, status): Promise<Order>
```

## Temporary browser storage

| Key | Storage | Contains |
|---|---|---|
| `pulsecart:cart` | `localStorage` | Product array used as the cart |
| `pulsecart:orders` | `localStorage` | All mock orders in this browser |
| `pulsecart:traces` | `localStorage` | Latest mock agent traces |
| `pulsecart:mock-accounts` | `localStorage` | Demo registered users and browser-generated password hashes |
| `pulsecart:session` | `sessionStorage` | Current mock `AuthUser` |

These keys must not be treated as trusted data. Real passwords, authorization decisions, and production PII must never be stored this way.

## Proposed API contract

The team should review and agree on these endpoints before implementation. Prefixing with `/api` is optional but must be consistent.

### Authentication

| Method | Endpoint | Access | Frontend use |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create customer account |
| `POST` | `/auth/login` | Public | Create/restore authenticated session |
| `POST` | `/auth/logout` | Authenticated | End session |
| `GET` | `/auth/me` | Authenticated | Restore `AuthUser` on page load |

Registration request:

```json
{ "username": "Ava", "email": "ava@example.com", "password": "..." }
```

Auth response:

```json
{ "id": "uuid", "username": "Ava", "email": "ava@example.com", "role": "customer" }
```

The backend must assign `customer`; it must never accept a public client-supplied manager role.

### Products and search

| Method | Endpoint | Access | Frontend use |
|---|---|---|---|
| `GET` | `/products` | Public | Product catalog |
| `GET` | `/products/{id}` | Public | Product details |
| `POST` | `/search` | Public/authenticated | Re-ranked feed and Recommender trace |

Search request:

```json
{ "query": "gaming laptop" }
```

Search response should match `SearchResult`:

```json
{ "products": [], "trace": { "agentName": "Recommender Agent", "status": "active", "logs": [] } }
```

If profile changes are returned later, add an optional `profileUpdate` field without removing `products` or `trace`.

### Orders

| Method | Endpoint | Access | Frontend use |
|---|---|---|---|
| `POST` | `/orders` | Customer | Create pending order |
| `GET` | `/orders/me` | Customer | Current customer's history only |
| `GET` | `/manager/orders` | Manager | All orders and status filters |
| `PATCH` | `/manager/orders/{id}` | Manager | Approve or reject |

Create-order request should contain product IDs/quantities and delivery fields. The backend must derive `userId`, prices, and totals from the authenticated session and database; it must not trust client-supplied values.

Status request:

```json
{ "status": "approved" }
```

Valid states are `pending`, `approved`, and `rejected`. New orders must always start as `pending`.

### Agents and manager insights

| Method | Endpoint | Access | Frontend use |
|---|---|---|---|
| `POST` | `/agents/run-weekly` | Manager | Trigger Market and Feedback agents |
| `GET` | `/agents/traces` | Manager | Latest traces for all agents |
| `GET` | `/market-insights` | Manager | Price gaps and recommendations |
| `GET` | `/feedback-insights` | Manager | Themes, severity, and suggested fixes |
| `GET` | `/audit-log` | Manager | Persistent agent/action audit history |

All risky agent actions must remain proposals or pending tasks. Price changes and order confirmation require manager authorization.

## Required backend behavior

- Return `401` when no valid session/token exists.
- Return `403` when an authenticated customer calls manager endpoints.
- Never accept a user ID from the browser as proof of identity.
- Never expose all orders to a customer and rely on frontend filtering.
- Validate registration, login, delivery fields, order items, and state changes server-side.
- Hash passwords through Supabase Auth or an approved server-side password system.
- Log agent trigger, decision/action, result, guardrail, actor, and timestamp.
- Redact feedback PII before agent processing.

## Integration plan

1. Backend and frontend agree on the models in `src/types/index.ts`.
2. Backend implements one endpoint group at a time.
3. Frontend adds an API client using `NEXT_PUBLIC_API_URL`.
4. Replace mock auth internals, then products/search, then orders, then insights/traces.
5. Keep deterministic fixture fallback available for the hackathon demo.
6. Test `401`, `403`, validation, network failure, loading, and empty states.

```text
React component → frontend service → FastAPI endpoint → agent/data layer
                              ↘ deterministic mock fallback
```

## Known limitations

- Browser storage is local to one browser/device and is editable by the user.
- Frontend role checks do not provide security.
- Search ranking is deterministic frontend scoring, not the real Recommender Agent.
- Market and feedback panels read fixture data.
- Agent traces are mock/local traces.
- Product detail specifications are educational demo content, not guaranteed manufacturer data.
- An audit-trail viewer and weekly orchestrator UI are still pending.
- Cross-device sessions, database persistence, password recovery, and email verification are not implemented.

## Local verification

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Update this document whenever a mock service is replaced, a response shape changes, or a route is added.
