# PulseCart FastAPI Backend

Day 1 API for products, deterministic recommendation, pending orders, manager approval, and agent traces.

## Run immediately in mock mode

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Keep `USE_MOCK_DATA=true` until Supabase is configured. API docs: `http://localhost:8000/docs`.

Demo bearer tokens for Swagger/testing only:

- Customer: `demo-customer-token`
- Manager: `demo-manager-token`

## Enable Supabase

1. Create a Supabase project.
2. Run `sql/001_day1_schema.sql`, then `sql/002_auth_profile_trigger.sql` in the SQL Editor.
3. Copy `.env.example` to `.env` and provide the project URL, publishable key, and backend-only secret key.
4. Set `USE_MOCK_DATA=false`.
5. Seed products:

```powershell
python scripts/seed.py
```

6. Create customer and manager users through Supabase Auth. Set manager authorization in protected `app_metadata`, for example `{"role":"manager"}`. Never allow public registration to choose this role.

### Promote a manager safely

Ask the manager to register normally, then run this backend-only command:

```powershell
python scripts/set_user_role.py manager@example.com manager
```

The command updates both protected Auth `app_metadata` and the public profile role. The manager must sign out and sign in again afterward. To revoke access:

```powershell
python scripts/set_user_role.py manager@example.com customer
```

## Endpoints

- `GET /health`
- `GET /products`
- `GET /products/{id}`
- `POST /search`
- `POST /orders` (customer)
- `GET /orders/me` (customer)
- `GET /manager/orders` (manager)
- `PATCH /manager/orders/{id}` (manager)
- `GET /agents/traces` (manager)
- `POST /feedback` (customer)
- `GET /feedback` (manager)

Protected requests send the Supabase user access token:

```http
Authorization: Bearer <access-token>
```

FastAPI validates the token and derives the user ID. It never trusts client-provided user IDs, prices, totals, or roles.

## Tests

```powershell
pytest -q
```
