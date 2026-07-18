# PulseCart Recommendation Agent — မြန်မာဘာသာ အကျဉ်းချုပ်နှင့် နည်းပညာရှင်းလင်းချက်

ဒီစာတမ်းမှာ PulseCart ရဲ့ Recommendation Agent ဘယ်လိုအလုပ်လုပ်သလဲ၊ Frontend ကနေ Backend ကို data ဘယ်လိုပို့သလဲ၊ Supabase ထဲမှာ customer တစ်ယောက်ချင်းစီရဲ့ preference ကို ဘယ်လိုခွဲသိမ်းသလဲ၊ နောက်ဆုံးရှာဖွေမှုကို ဘယ်လိုဦးစားပေးသလဲဆိုတာ အဆင့်လိုက်ရှင်းပြထားပါတယ်။

## ၁။ Agent ရဲ့ အဓိကရည်ရွယ်ချက်

Recommendation Agent က customer တစ်ယောက်ချင်းစီအတွက် အောက်ပါလုပ်ဆောင်ချက်တွေကို ပြုလုပ်ပါတယ်။

1. Customer ရိုက်ထည့်တဲ့ search ကို လက်ခံတယ်။
2. Search နဲ့ကိုက်ညီတဲ့ product တွေကို အမှတ်ပေးပြီး ပြန်စီတယ်။
3. Search နဲ့ product-detail click တွေကို customer ရဲ့ interest အဖြစ် Supabase မှာသိမ်းတယ်။
4. နောက်ဆုံးလုပ်ခဲ့တဲ့ search သို့မဟုတ် click ကို အဟောင်းတွေထက်ပိုဦးစားပေးတယ်။
5. Customer ပြန်ဝင်လာတဲ့အခါ သူ့ကိုယ်ပိုင် interest အပေါ်မူတည်ပြီး product feed ကို ပြန်စီတယ်။
6. Manager dashboard မှာ တကယ်ဖြစ်ခဲ့တဲ့ search နဲ့ click activity တွေကို အသစ်ဆုံးမှ အဟောင်းဆုံးအစဉ်နဲ့ပြတယ်။

ဒီ recommendation စနစ်ဟာ deterministic scoring ဖြစ်ပါတယ်။ လက်ရှိ search ranking အတွက် LLM ကိုမလိုအပ်သလို Anthropic/OpenAI API ကိုလည်း မခေါ်ပါဘူး။ အဲဒါကြောင့် result က မြန်ဆန်ပြီး test လုပ်ရလွယ်ကူပါတယ်။

## ၂။ အသုံးပြုထားသော နည်းပညာများ

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- `@supabase/supabase-js` — login, session နှင့် access token အတွက်
- Browser Fetch API — FastAPI endpoints ခေါ်ရန်

### Backend

- Python
- FastAPI — REST API တည်ဆောက်ရန်
- Uvicorn — FastAPI development server
- Pydantic — request/response validation
- Supabase Python SDK — database နှင့် Supabase API ဆက်သွယ်ရန်
- HTTPX — HTTP client
- Pytest — automated testing

### Database နှင့် Authentication

- Supabase PostgreSQL
- Supabase Auth
- Row Level Security policies
- JSONB `profiles.interests` field
- `searches` history table
- `audit_log` agent activity table

## ၃။ အဓိက Data Flow

```text
Customer login
    ↓
Supabase Auth access token
    ↓
Frontend search/click request
    ↓ Authorization: Bearer <token>
FastAPI authentication
    ↓ verified user.id
Customer profile interests ဖတ်ခြင်း
    ↓
Score update နှင့် product ranking
    ↓
Supabase profile/search/audit_log သိမ်းခြင်း
    ↓
Ranked products ကို Frontend ပြန်ပို့ခြင်း
```

Frontend က `userId` ကို ယုံကြည်စိတ်ချရတဲ့ identity အဖြစ် Backend ဆီမပို့ပါဘူး။ Backend က Supabase access token ကိုစစ်ပြီး အမှန်တကယ် login ဝင်ထားသူရဲ့ `user.id` ကိုရယူပါတယ်။ ဒါကြောင့် customer တစ်ယောက်က တခြား customer ရဲ့ recommendation profile ကိုပြောင်းလို့မရပါဘူး။

## ၄။ Customer တစ်ယောက်ချင်းစီ ခွဲခြားပုံ

Supabase `profiles` table ရဲ့ primary key က `user_id` ဖြစ်ပါတယ်။ Customer တစ်ယောက်ချင်းစီမှာ ကိုယ်ပိုင် `interests` JSON object ရှိပါတယ်။

ဥပမာ —

```json
{
  "product:iphone-product-id": 0.35,
  "product:acer-product-id": 1.0
}
```

အဓိပ္ပာယ်က Acer ဟာ နောက်ဆုံး search ဖြစ်တဲ့အတွက် score `1.0` ရပြီး၊ အဟောင်းဖြစ်သွားတဲ့ iPhone score က `0.35` သို့လျော့သွားတာဖြစ်ပါတယ်။

```text
Customer A → profiles.user_id=A → Customer A interests
Customer B → profiles.user_id=B → Customer B interests
Customer C → profiles.user_id=C → Customer C interests
```

Customer A ရဲ့ iPhone search က Customer B ရဲ့ Acer ranking ကို လုံးဝမထိခိုက်ပါဘူး။

## ၅။ Search လုပ်တဲ့အခါ အဆင့်လိုက်အလုပ်လုပ်ပုံ

Frontend က customer ရိုက်ထည့်ထားတဲ့ query ကို `POST /search` နဲ့ပို့ပါတယ်။ Login ဝင်ထားရင် access token ကို Authorization header ထဲထည့်ပို့ပါတယ်။

```http
POST /search
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{
  "query": "iPhone"
}
```

Backend မှာ အောက်ပါအစဉ်အတိုင်းအလုပ်လုပ်ပါတယ်။

1. `optional_user` က token ရှိ/မရှိစစ်တယ်။
2. Token ရှိရင် Supabase နဲ့ validate လုပ်ပြီး `user.id` ရယူတယ်။
3. Product catalog အားလုံးကို database မှဖတ်တယ်။
4. `profiles.interests` ထဲက အဲဒီ customer ရဲ့အရင် score တွေကိုဖတ်တယ်။
5. အရင် product scores အားလုံးကို `0.35` နဲ့မြှောက်ပြီး decay လုပ်တယ်။
6. Product name ထဲမှာ query ပါတဲ့ products ကိုရှာတယ်။
7. ကိုက်ညီတဲ့ product အရေအတွက်ရဲ့ 50% ကိုသာ promotion ပေးတယ်။
8. Updated interests ကို customer profile ထဲပြန်သိမ်းတယ်။
9. Search query ကို `searches` table ထဲသိမ်းတယ်။
10. Meaningful agent trace ကို `audit_log` ထဲသိမ်းတယ်။
11. Ranked products နှင့် trace ကို Frontend ဆီပြန်ပို့တယ်။

## ၆။ 50% Promotion Rule

Search နဲ့ကိုက်ညီတဲ့ products အားလုံးကို recommendation ထိပ်ဆုံးမှာ မတင်ပါဘူး။ ကိုက်ညီတဲ့အရေအတွက်ရဲ့ 50% ကိုသာ promotion ပေးပါတယ်။ `ceil()` သုံးတဲ့အတွက် odd number ဖြစ်ရင် အပေါ်ဘက်ကို round တက်ပါတယ်။

ဥပမာ —

| Matching products | Promoted products |
|---:|---:|
| 1 | 1 |
| 2 | 1 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |

iPhone အမျိုးအစား 4 ခုရှိပြီး customer က `iPhone` လို့ရှာရင် 2 ခုကိုသာ customer profile မှာ promote လုပ်ပါတယ်။ Promoted ပထမ product က `1.0`၊ ဒုတိယ product က `0.99` ရပါတယ်။

## ၇။ Latest Search က Old Search ထက်ရှေ့ရောက်ပုံ

Customer က ပထမဆုံး `iPhone` ရှာတယ်ဆိုပါစို့။ Promoted iPhone scores တွေက `1.0` နှင့် `0.99` ဖြစ်မယ်။

နောက်တစ်ကြိမ် `Acer` ရှာတဲ့အခါ —

```text
အဟောင်း iPhone score: 1.0 × 0.35 = 0.35
အသစ် Acer score: 1.0
```

Customer ပြန်ဝင်လာတဲ့အခါ empty query နဲ့ personalized feed တောင်းပါတယ်။ Backend က product scores ကို descending order စီတဲ့အတွက် `Acer 1.0` က `iPhone 0.35` ထက်ရှေ့ရောက်ပါတယ်။

Search ရိုက်ထားတဲ့အချိန်မှာတော့ text-match score ကိုသုံးပါတယ်။ Term တစ်ခုချင်းစီအတွက် —

- Product name ထဲမှာတွေ့ရင် 5 points
- Category ထဲမှာတွေ့ရင် 3 points
- Description ထဲမှာတွေ့ရင် 2 points

## ၈။ Product Click လုပ်တဲ့အခါ

Login ဝင်ထားတဲ့ customer က product detail page ဖွင့်တဲ့အခါ Frontend က အောက်ပါ endpoint ကိုခေါ်ပါတယ်။

```http
POST /events/product-view/{product_id}
Authorization: Bearer <supabase-access-token>
```

Backend က —

1. Product ID မှန်/မမှန်စစ်တယ်။
2. Customer profile ကို `user.id` နဲ့ဖတ်တယ်။
3. အဟောင်း product scores တွေကို `0.35` နဲ့ decay လုပ်တယ်။
4. Click လုပ်ထားတဲ့ product ကို `1.2` score ပေးတယ်။
5. Profile ကို Supabase မှာပြန်သိမ်းတယ်။
6. `Customer viewed <product name>` trace ကို audit log ထဲသိမ်းတယ်။

Click score `1.2` ဟာ search score `1.0` ထက်မြင့်ပါတယ်။ Product detail ဖွင့်ကြည့်ခြင်းဟာ ရိုးရိုးရှာခြင်းထက် ပိုပြင်းထန်တဲ့ user-interest signal ဖြစ်တယ်လို့ သတ်မှတ်ထားလို့ပါ။

React development mode မှာ effect နှစ်ကြိမ် run နိုင်ပေမယ့် `useRef` guard သုံးထားတဲ့အတွက် page တစ်ကြိမ်ဖွင့်ရာမှာ click event ကိုတစ်ကြိမ်သာပို့ပါတယ်။

## ၉။ Customer ပြန် Login ဝင်လာတဲ့အခါ

Home page စတင်ချိန်မှာ Frontend က empty query ဖြင့် `POST /search` ခေါ်ပါတယ်။

```json
{
  "query": ""
}
```

ဒီ request က search history အသစ်မဟုတ်ပါဘူး။ Returning personalized feed ရယူဖို့သာဖြစ်ပါတယ်။ Backend က login ဝင်ထားသူရဲ့ profile scores ကိုဖတ်ပြီး အမြင့်ဆုံး score ရှိတဲ့ product ကိုအပေါ်ဆုံးထားပါတယ်။

အရေးကြီးတာက empty query ကို `audit_log` ထဲမသိမ်းပါဘူး။ ဒါကြောင့် Manager Agent Activity မှာ `Re-ranked 48 products for "all products"` ဆိုတဲ့ automatic entries တွေ ထပ်မပေါ်တော့ပါဘူး။

## ၁၀။ Manager Agent Activity

Manager dashboard က အောက်ပါ API ကို 5 seconds တစ်ကြိမ်ခေါ်ပါတယ်။

```http
GET /agents/traces
Authorization: Bearer <manager-access-token>
```

ဒီ endpoint ကို manager role ရှိသူသာခေါ်နိုင်ပါတယ်။ Backend က `audit_log.timestamp DESC` နဲ့ဖတ်တာကြောင့် အသစ်ဆုံး activity ကအပေါ်ဆုံးမှာရှိပါတယ်။

Manager panel မှာ အဓိကအားဖြင့် —

- `Searched "iPhone"; promoted 2 of 4 name matches`
- `Searched "Acer"; promoted 1 of 1 name matches`
- `Customer viewed Acer Aspire`

စတဲ့ real search/click activities ကိုမြင်ရပါတယ်။ အဟောင်း database ထဲရှိ `all products` automatic traces တွေကိုလည်း API response မှာ filter လုပ်ထားပါတယ်။ Browser `localStorage` fixture data ကို Agent Activity အတွက်မသုံးတော့ပါဘူး။

## ၁၁။ အသုံးပြုထားသော Recommendation APIs

| Method | Endpoint | Authentication | ရည်ရွယ်ချက် |
|---|---|---|---|
| `POST` | `/search` | Optional | Search ranking; login ဝင်ထားရင် preference သိမ်းခြင်း |
| `POST` | `/events/product-view/{product_id}` | Customer required | Product click/view ကို strong interest အဖြစ်သိမ်းခြင်း |
| `GET` | `/agents/traces` | Manager required | Real agent activity ကို newest-first ဖတ်ခြင်း |
| `GET` | `/products` | Public | Product catalog ဖတ်ခြင်း |
| `GET` | `/products/{id}` | Public | Product detail ဖတ်ခြင်း |

## ၁၂။ Supabase Tables

### `profiles`

- `user_id` — Supabase Auth user UUID
- `username`
- `role`
- `interests` — product scores ပါသော JSONB
- `updated_at`

### `searches`

- `user_id` — search လုပ်သူ
- `query` — ရှာထားတဲ့စာသား
- `created_at` — ရှာခဲ့တဲ့အချိန်

### `audit_log`

- `agent_name`
- `action`
- `input`
- `output` — structured agent trace
- `actor_id` — activity ပြုလုပ်ခဲ့တဲ့ customer UUID
- `timestamp`

### `products`

Product name, category, description, price, rating စတဲ့ catalog information သိမ်းပါတယ်။ Recommendation engine က ဒီ table ရဲ့ product IDs ကို `profiles.interests` keys အဖြစ်အသုံးပြုပါတယ်။

## ၁၃။ Security နှင့် Privacy

- Access token ကို Supabase Auth ဖြင့်စစ်ပါတယ်။
- Backend က verified token မှ `user.id` ထုတ်ယူပါတယ်။
- Frontend ကပို့တဲ့ arbitrary user ID ကို personalization identity အဖြစ်မယုံပါဘူး။
- Customer တစ်ယောက်ရဲ့ profile ကို တခြား customer အတွက်မသုံးပါဘူး။
- Manager endpoint ကို manager role ဖြင့်ကာကွယ်ထားပါတယ်။
- Sensitive personal traits မသိမ်းပါဘူး။ Product interest signals သာသိမ်းပါတယ်။
- Backend Supabase secret key ကို frontend environment ထဲမထည့်ရပါဘူး။

## ၁၄။ Anonymous User အတွက် Behavior

Login မဝင်ထားသူလည်း product search လုပ်နိုင်ပါတယ်။ Search term အလိုက် current result ကိုပြန်စီပေးပေမယ့် —

- Profile interests မသိမ်းပါဘူး။
- Returning personalization မရှိပါဘူး။
- Customer-specific click tracking မလုပ်ပါဘူး။

Persistent recommendation ရဖို့ customer login ဝင်ထားဖို့လိုပါတယ်။

## ၁၅။ အရေးကြီး Source Files

### Backend

- `backend/app/agents/recommender.py` — scoring, decay, 50% promotion, click weighting
- `backend/app/routes/search.py` — search API flow
- `backend/app/routes/events.py` — product-view API
- `backend/app/routes/agents.py` — manager trace API နှင့် filtering
- `backend/app/auth.py` — token validation နှင့် role checks
- `backend/app/repository.py` — Supabase/Memory data access
- `backend/app/models/schemas.py` — API request/response types
- `backend/sql/001_day1_schema.sql` — profiles, products, searches, audit log အခြေခံ schema
- `backend/sql/002_auth_profile_trigger.sql` — signup ပြီးချိန် profile အလိုအလျောက်ဖန်တီးခြင်း

### Frontend

- `frontend/src/app/page.tsx` — search နှင့် returning-feed request
- `frontend/src/services/searchService.ts` — search/product-view API calls
- `frontend/src/components/ProductDetailActions.tsx` — logged-in product click tracking
- `frontend/src/components/dashboard/AgentPanel.tsx` — manager activity polling/display
- `frontend/src/services/agentService.ts` — trace API call
- `frontend/src/components/AuthProvider.tsx` — current user နှင့် access token state
- `frontend/src/services/supabase.ts` — Supabase browser client

## ၁၆။ Local Run နည်း

Backend —

```powershell
cd D:\PulseCart\backend
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Frontend —

```powershell
cd D:\PulseCart\frontend
npm.cmd run dev
```

အသုံးပြုရမည့် URLs —

- Frontend: `http://localhost:3000`
- FastAPI documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## ၁၇။ Test လုပ်နည်း

### Automated tests

```powershell
cd D:\PulseCart\backend
.venv\Scripts\python.exe -m pytest -q
```

```powershell
cd D:\PulseCart\frontend
npm.cmd run build
```

### Multi-user manual test

1. Browser A မှာ Customer A login ဝင်ပါ။
2. `iPhone` ရှာပြီး iPhone product detail တစ်ခုဖွင့်ပါ။
3. Incognito/Browser B မှာ Customer B login ဝင်ပါ။
4. `Acer` ရှာပြီး Acer detail ဖွင့်ပါ။
5. Customer A ပြန်ဝင်ရင် Customer A ရဲ့ clicked iPhone ကအပေါ်ဆုံးဖြစ်ရမယ်။
6. Customer B ပြန်ဝင်ရင် Customer B ရဲ့ clicked Acer ကအပေါ်ဆုံးဖြစ်ရမယ်။
7. Manager login ဝင်ပြီး Agent Activity ဖွင့်ပါ။
8. Customer နှစ်ယောက်ရဲ့ meaningful search/click actions ကို အသစ်ဆုံးမှ အဟောင်းဆုံးစီမြင်ရမယ်။
9. `all products` automatic entries မပေါ်ရပါဘူး။

## ၁၈။ Troubleshooting

### Recommendation ပြန်မပေါ်ခြင်း

- Customer login ဝင်ထားကြောင်းစစ်ပါ။
- Browser console မှာ `401 Unauthorized` ရှိ/မရှိစစ်ပါ။
- Supabase session expired ဖြစ်ရင် logout/login ပြန်လုပ်ပါ။
- Backend `.env` နှင့် frontend `.env.local` ရဲ့ Supabase project URL/key တူကြောင်းစစ်ပါ။

### Agent Activity မပေါ်ခြင်း

- Manager account ရဲ့ Supabase `app_metadata.role` က `manager` ဖြစ်ကြောင်းစစ်ပါ။
- Backend run နေကြောင်းစစ်ပါ။
- `audit_log` table ရှိကြောင်းစစ်ပါ။
- Panel က 5 seconds တစ်ကြိမ် refresh လုပ်တာကြောင့် ခဏစောင့်ပါ။

### Customer များကြား recommendation ရောထွေးခြင်း

- Request မှာ valid Supabase access token ပါကြောင်းစစ်ပါ။
- `profiles.user_id` တန်ဖိုးများ customer တစ်ယောက်ချင်းစီအတွက် သီးခြားဖြစ်ကြောင်းစစ်ပါ။
- Frontend ကို browser နှစ်ခု/Incognito ဖြင့်စမ်းပါ။ Browser tab နှစ်ခုလုံးမှာ account တစ်ခုတည်း session share နေနိုင်တာကို သတိပြုပါ။

## ၁၉။ အကျဉ်းချုပ်

PulseCart Recommendation Agent ဟာ customer တစ်ယောက်ချင်းစီရဲ့ verified Supabase user ID အောက်မှာ search နှင့် product-click preferences ကိုသိမ်းပါတယ်။ Search match များထဲမှ 50% ကိုသာ promote လုပ်ပြီး အဟောင်း scores ကို `0.35` decay လုပ်တာကြောင့် နောက်ဆုံး search က အရင် search ထက်ရှေ့ရောက်ပါတယ်။ Product-detail click ကို `1.2` score ပေးထားတဲ့အတွက် search ထက်ပိုအားကောင်းပါတယ်။ Customer ပြန် login ဝင်လာတဲ့အခါ သူ့ကိုယ်ပိုင် profile ကိုသာဖတ်ပြီး feed ပြန်စီပေးပါတယ်။ Manager ကတော့ Supabase audit log မှ real search/click activity များကို အသစ်ဆုံးမှ အဟောင်းဆုံးစီကြည့်နိုင်ပါတယ်။
