# OrderCoordinatorAgent ရှင်းလင်းချက်နှင့် လုပ်ဆောင်ပုံ

## အကျဉ်းချုပ်

`OrderCoordinatorAgent` သည် PulseCart ရှိ customer order များကို checkout မှ delivery ပြီးဆုံးသည်အထိ စီမံပေးသည့် agent ဖြစ်သည်။ Customer တင်လိုက်သော order ကို ချက်ချင်းအတည်ပြုခြင်းမပြုဘဲ manager ၏ အတည်ပြုချက်ရပြီးမှ ဆက်လက်လုပ်ဆောင်သည်။ Delivery ပြီးဆုံးချိန်တွင် customer ထံ order အသေးစိတ်ပါဝင်သော email ကို Gmail SMTP မှတစ်ဆင့် အလိုအလျောက်ပို့ပေးသည်။

ဤ workflow တွင် AI/agent က အန္တရာယ်ရှိသောဆုံးဖြတ်ချက်ကို ကိုယ်တိုင်မပြုလုပ်ပါ။ Manager approval သည် မဖြစ်မနေလိုအပ်သော human-in-the-loop guardrail ဖြစ်သည်။

## အဓိကတာဝန်များ

`OrderCoordinatorAgent` ၏ အဓိကတာဝန်များမှာ—

1. Customer checkout အချက်အလက်ကို စစ်ဆေးခြင်း
2. Product ID၊ quantity နှင့် database ထဲရှိ လက်ရှိဈေးနှုန်းများကို အသုံးပြု၍ total တွက်ခြင်း
3. Order ကို `pending` အခြေအနေဖြင့် Supabase တွင် သိမ်းခြင်း
4. Manager ထံ approve သို့မဟုတ် reject ပြုလုပ်ရန် စောင့်ဆိုင်းခြင်း
5. Approved order ကိုသာ delivered အဖြစ်ပြောင်းခွင့်ပေးခြင်း
6. Delivery email ကို Gmail SMTP ဖြင့် ပို့ခြင်း
7. Email အောင်မြင်မှသာ order ကို `delivered` အဖြစ်ထားခြင်း
8. Agent လုပ်ဆောင်ချက်များကို `audit_log` တွင် မှတ်တမ်းတင်ခြင်း

## Order State Flow

```text
Customer Checkout
       │
       ▼
   pending
       │
       ├──────── Manager Reject ────────► rejected
       │
       └──────── Manager Approve ───────► approved
                                             │
                                             ▼
                                  Manager clicks Mark delivered
                                             │
                                             ▼
                                  Queue delivery email in outbox
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                          ▼                                     ▼
                    Email success                         Email failure
                          │                                     │
                          ▼                                     ▼
                     delivered                    Restore status to approved
                          │                          and allow retry
                          ▼
             Customer sees “Delivery process is done”
```

## Step-by-step လုပ်ဆောင်ပုံ

### 1. Customer က order တင်ခြင်း

Customer သည် cart ထဲမှ products များကို ရွေးပြီး customer name၊ delivery address နှင့် phone number ထည့်ကာ checkout တင်သည်။ Frontend က Supabase access token ပါသော request ကို backend သို့ ပို့သည်။

```http
POST /orders
Authorization: Bearer <customer-access-token>
```

Backend သည် browser မှပို့သော product price နှင့် total ကို မယုံကြည်ပါ။ Product ID များကိုအသုံးပြုပြီး Supabase မှ လက်ရှိ product price ကို ပြန်ဖတ်ကာ total ကို backend ဘက်တွင် ပြန်တွက်သည်။

Order အသစ်၏ status သည် အမြဲတမ်း `pending` ဖြစ်သည်။

### 2. Manager က order ကို စစ်ဆေးခြင်း

Manager dashboard သည် အောက်ပါ protected endpoint မှ orders များကို ရယူသည်။

```http
GET /manager/orders
Authorization: Bearer <manager-access-token>
```

Customer role ဖြင့် manager endpoint ကို ခေါ်ပါက `403 Forbidden` ပြန်ပေးသည်။ Token မရှိခြင်း သို့မဟုတ် token မမှန်ခြင်းဖြစ်ပါက `401 Unauthorized` ပြန်ပေးသည်။

### 3. Manager က approve သို့မဟုတ် reject ပြုလုပ်ခြင်း

Manager သည် pending order ကို approve သို့မဟုတ် reject ပြုလုပ်နိုင်သည်။

```http
PATCH /manager/orders/{order_id}
```

Approved order သာ delivery process ကို ဆက်လုပ်နိုင်သည်။ `pending` သို့မဟုတ် `rejected` order ကို delivered အဖြစ်ပြောင်းရန် ကြိုးစားပါက backend က `409 Conflict` ပြန်ပေးသည်။

### 4. Manager က Mark delivered ကို နှိပ်ခြင်း

Manager က approved order တွင် **Mark delivered** ကို နှိပ်သောအခါ အောက်ပါ endpoint ကို ခေါ်သည်။

```http
POST /manager/orders/{order_id}/deliver
Authorization: Bearer <manager-access-token>
```

`complete_delivery()` workflow သည်—

1. SMTP configuration ပြည့်စုံမှုရှိမရှိ စစ်ဆေးသည်။
2. Order သည် `approved` ဖြစ်ကြောင်း စစ်ဆေးသည်။
3. Delivery email job ကို `email_outbox` တွင် တစ်ကြိမ်သာ queue လုပ်သည်။
4. Gmail SMTP မှတစ်ဆင့် email ပို့သည်။
5. Email အောင်မြင်ပါက outbox ကို `sent` အဖြစ်ပြောင်းသည်။
6. Agent trace ကို `audit_log` တွင် သိမ်းသည်။
7. Customer UI တွင် **Delivery process is done** ပြသည်။

### 5. Email မပို့နိုင်ပါက

Gmail authentication၊ network သို့မဟုတ် SMTP error ဖြစ်ပါက—

- `email_outbox.status` ကို `failed` အဖြစ်ပြောင်းသည်။
- Error message ကို `error_message` တွင် သိမ်းသည်။
- Order status ကို `approved` သို့ ပြန်ထားသည်။
- Manager သည် email configuration ကို ပြင်ပြီး ထပ်မံစမ်းနိုင်သည်။
- Customer UI တွင် delivery ပြီးဆုံးကြောင်း မပြသေးပါ။

ဤအပြုအမူကြောင့် email မပို့ရသေးသော်လည်း delivery အောင်မြင်သကဲ့သို့ မှားယွင်းပြသခြင်းကို ကာကွယ်ထားသည်။

## Email Outbox Pattern

`email_outbox` table သည် email ပို့ခြင်းကို စောင့်ကြည့်နိုင်ရန်နှင့် email ထပ်ပို့ခြင်းကို ကာကွယ်ရန် အသုံးပြုသည်။

အရေးကြီးသော columns များမှာ—

| Column | ရည်ရွယ်ချက် |
|---|---|
| `order_id` | Email နှင့်သက်ဆိုင်သော order |
| `event_type` | `order_delivered` event |
| `recipient` | Customer email address |
| `status` | `pending`, `sent`, သို့မဟုတ် `failed` |
| `attempts` | ပို့ရန်ကြိုးစားသည့်အကြိမ် |
| `provider_message_id` | SMTP မှ လက်ခံပြီးနောက် message identifier |
| `error_message` | Email မအောင်မြင်ပါက error အကြောင်းအရာ |
| `sent_at` | Email အောင်မြင်စွာပို့ခဲ့သည့်အချိန် |

`order_id` နှင့် `event_type` ကို unique သတ်မှတ်ထားသောကြောင့် delivery email တစ်စောင်ကို မတော်တဆ နှစ်ကြိမ်မပို့နိုင်ပါ။

## Gmail SMTP Configuration

Private values များကို `backend/.env` တွင်သာ သိမ်းရမည်။ Frontend environment file ထဲတွင် SMTP password မထည့်ရပါ။

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true
```

`SMTP_PASSWORD` တွင် ပုံမှန် Gmail password ကို မသုံးရပါ။ Google Account 2-Step Verification ကိုဖွင့်ပြီး ထုတ်ယူထားသော App Password ကိုသာ အသုံးပြုရမည်။ `.env` file နှင့် App Password ကို Git သို့ commit မပြုရပါ။

## Security Guardrails

Agent တွင် အောက်ပါ guardrails များ ပါဝင်သည်။

- Customer သည် manager endpoint များကို ခေါ်၍မရပါ။
- Manager approval မရမီ order ကို delivered ပြုလုပ်၍မရပါ။
- Customer ပို့သော price နှင့် total ကို backend က မယုံကြည်ပါ။
- Customer email ကို request body မှ မယူဘဲ authenticated Supabase user မှ ရယူသည်။
- Supabase secret key နှင့် SMTP password ကို browser သို့ မပို့ပါ။
- Email HTML တွင် customer/product text များကို escape ပြုလုပ်ထားသည်။
- Email အောင်မြင်မှသာ customer ကို delivery ပြီးဆုံးကြောင်း ပြသည်။
- အောင်မြင်ပြီးသော email ကို retry လုပ်လျှင် ထပ်မပို့ပါ။
- Agent လုပ်ဆောင်ချက်အားလုံးကို audit log ထားသည်။

## အဓိက Project Files

| File | တာဝန် |
|---|---|
| `backend/app/agents/order_coordinator.py` | Agent orchestration၊ delivery flow နှင့် trace generation |
| `backend/app/services/email.py` | Gmail SMTP email တည်ဆောက်ခြင်းနှင့် ပို့ခြင်း |
| `backend/app/routes/orders.py` | Customer/manager order API endpoints |
| `backend/app/repository.py` | Supabase order၊ delivery နှင့် email outbox operations |
| `backend/app/models/schemas.py` | Order status နှင့် API data models |
| `backend/app/config.py` | SMTP၊ Supabase နှင့် application settings |
| `backend/sql/004_order_delivery.sql` | Delivery columns နှင့် email outbox schema |
| `frontend/src/services/orderService.ts` | Frontend order API calls |
| `frontend/src/components/dashboard/OrdersPanel.tsx` | Manager approval နှင့် delivery controls |
| `frontend/src/app/account/orders/page.tsx` | Customer order history နှင့် delivery message |

## စမ်းသပ်နည်း

1. Customer account ဖြင့် login ဝင်ပါ။
2. Product ကို cart ထဲထည့်ပြီး order တင်ပါ။
3. Supabase `orders` table တွင် status `pending` ဖြစ်ကြောင်း စစ်ပါ။
4. Manager account ဖြင့် login ဝင်ပါ။
5. Order ကို approve ပြုလုပ်ပါ။
6. Approved order တွင် **Mark delivered** ကို နှိပ်ပါ။
7. Customer inbox တွင် delivery email ရောက်ကြောင်း စစ်ပါ။
8. Customer order history တွင် **Delivery process is done** ပြကြောင်း စစ်ပါ။
9. Supabase `email_outbox` တွင် status `sent` ဖြစ်ကြောင်း စစ်ပါ။
10. Supabase `audit_log` တွင် Order Coordinator trace ရှိကြောင်း စစ်ပါ။

Email outbox ကို စစ်ရန်—

```sql
select order_id, event_type, status, attempts, error_message, sent_at
from public.email_outbox
order by created_at desc;
```

Agent audit log ကို စစ်ရန်—

```sql
select agent_name, action, output, timestamp
from public.audit_log
where agent_name = 'Order Coordinator'
order by timestamp desc;
```

## ဒီဇိုင်းဆုံးဖြတ်ချက်

Order validation၊ status transition နှင့် email sending တို့သည် deterministic business operations ဖြစ်သောကြောင့် LLM ကို တိုက်ရိုက်ဆုံးဖြတ်ခွင့်မပေးထားပါ။ `OrderCoordinatorAgent` သည် လုံခြုံသော tools များကို အစဉ်လိုက်ခေါ်ခြင်း၊ guardrails ကို ထိန်းသိမ်းခြင်းနှင့် audit trace ထုတ်ပေးခြင်းကို လုပ်ဆောင်သည်။ ဤပုံစံသည် AI agent ကို ရှင်းလင်းစွာ စောင့်ကြည့်နိုင်ပြီး စီးပွားရေးဆိုင်ရာ အန္တရာယ်ရှိသောဆုံးဖြတ်ချက်များတွင် လူ၏အတည်ပြုချက်ကို ဆက်လက်ထားရှိပေးသည်။
