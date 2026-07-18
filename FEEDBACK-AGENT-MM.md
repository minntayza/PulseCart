# FeedbackAgent လုပ်ဆောင်ပုံ ရှင်းလင်းချက်

## အကျဉ်းချုပ်

`FeedbackAgent` သည် PulseCart customer များပေးပို့သော အကြံပြုချက်များနှင့် တိုင်ကြားချက်များကို စုဆောင်းခြင်း၊ အမျိုးအစားခွဲခြားခြင်း၊ ပြဿနာ၏အရေးကြီးမှုကို သတ်မှတ်ခြင်းနှင့် manager အတွက် ဖြေရှင်းရန်အကြံပြုချက်များ ထုတ်ပေးခြင်းတို့ကို ဆောင်ရွက်သည်။

Customer က feedback ပေးပြီးသည်နှင့် message ကို Supabase တွင် သိမ်းပြီး background analysis ကို အလိုအလျောက်စတင်သည်။ Manager သည် dashboard ရှိ **Feedback** tab တွင် theme အလိုက် အနှစ်ချုပ်နှင့် မူရင်း feedback messages များကို ကြည့်နိုင်သည်။

## Feedback Flow

```text
Customer ရေးသားသော feedback
            │
            ▼
      POST /feedback
            │
            ├── Authentication စစ်ဆေးခြင်း
            │
            ├── Message validation
            │
            ├── Deterministic theme classification
            │
            └── Supabase feedback table တွင် သိမ်းခြင်း
                         │
                         ▼
                Background analysis
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       LLM API ရရှိသည်          LLM API မရရှိပါ
             │                       │
             ▼                       ▼
   Fix suggestion ရယူခြင်း     Local keyword fallback
             │                       │
             └───────────┬───────────┘
                         ▼
              Deterministic category နှင့်
              message count ပြန်လည်စစ်ဆေးခြင်း
                         │
                         ▼
              Insights + Agent trace သိမ်းခြင်း
                         │
                         ▼
             Manager Feedback Dashboard
```

## အဓိက Components

### 1. Customer Feedback Widget

Customer side တွင် floating feedback widget ပါရှိသည်။ Customer သည် message ရေးပြီး submit လုပ်သောအခါ Supabase access token ပါသည့် request ကို backend သို့ ပို့သည်။

```http
POST /feedback
Authorization: Bearer <customer-access-token>
Content-Type: application/json

{
  "message": "More Mac products are required"
}
```

Login မဝင်ထားသော user သို့မဟုတ် token မမှန်သော user သည် feedback submit လုပ်၍မရပါ။

သက်ဆိုင်သော frontend file မှာ—

```text
frontend/src/components/FloatingChatWidget.tsx
```

### 2. Message Validation

Backend သည် feedback message ကို Pydantic schema ဖြင့် စစ်ဆေးသည်။ Message သည် အနည်းဆုံး ၃ လုံးနှင့် အများဆုံး ၂၀၀၀ လုံးအတွင်း ရှိရမည်။

```python
class CreateFeedbackRequest(BaseModel):
    message: str = Field(min_length=3, max_length=2000)
```

Whitespace များကို ဖယ်ရှားပြီးမှ database ထဲသို့ သိမ်းသည်။

## Feedback Theme Classification

Feedback ကို အောက်ပါ theme ငါးမျိုးဖြင့် ခွဲခြားသည်။

| Theme | အဓိပ္ပာယ် | Keyword ဥပမာ |
|---|---|---|
| `delivery` | ပို့ဆောင်မှုဆိုင်ရာ | delivery, shipping, late, arrived |
| `pricing` | ဈေးနှုန်းဆိုင်ရာ | price, expensive, cost, cheap |
| `quality` | ပစ္စည်းအရည်အသွေးဆိုင်ရာ | quality, broken, defective, broke |
| `service` | ဝန်ဆောင်မှုဆိုင်ရာ | service, support, staff, rude |
| `other` | အထက်ပါအမျိုးအစားများနှင့် မကိုက်ညီသော general feedback | Product request၊ feature request နှင့် အခြားအကြံပြုချက်များ |

ဥပမာ—

```text
“Delivery was late”             → delivery
“The price is too expensive”    → pricing
“The product arrived broken”    → quality
“Support staff was rude”        → service
“More Mac products are required” → other
```

Known keywords မတွေ့သော feedback အားလုံးကို `other` အဖြစ် မဖြစ်မနေသတ်မှတ်သည်။ ထို့ကြောင့် general feedback သည် ပျောက်ဆုံးခြင်း သို့မဟုတ် မသက်ဆိုင်သော category ထဲဝင်ခြင်း မဖြစ်စေရန် ကာကွယ်ထားသည်။

Classification logic သည်—

```text
backend/app/agents/feedback_agent.py
```

ရှိ `classify_feedback_theme()` function တွင် တည်ရှိသည်။

## Database Storage

Feedback အသစ်ကို `public.feedback` table တွင် သိမ်းသည်။

အဓိက fields များမှာ—

| Field | ရည်ရွယ်ချက် |
|---|---|
| `id` | Feedback identifier |
| `user_id` | Feedback ပေးသော customer |
| `message` | Customer ရေးသားထားသော စာသား |
| `theme` | delivery, pricing, quality, service သို့မဟုတ် other |
| `severity` | low, medium သို့မဟုတ် high |
| `created_at` | Feedback ပေးသည့်အချိန် |

Theme ကို database default တစ်ခုတည်းအပေါ် မမှီခိုဘဲ feedback သိမ်းချိန်တွင် backend က တိကျစွာ သတ်မှတ်ပေးသည်။

## Background Auto-analysis

Feedback သိမ်းပြီးသည်နှင့် FastAPI `BackgroundTasks` ကို အသုံးပြု၍ `_auto_analyze()` ကို run သည်။ Customer သည် analysis ပြီးဆုံးသည်အထိ စောင့်ရန်မလိုဘဲ submit response ကို ချက်ချင်းရရှိသည်။

Background task သည်—

1. Feedback messages အားလုံးကို database မှဖတ်သည်။
2. `analyze_feedback()` ကို ခေါ်သည်။
3. Theme counts နှင့် severity ကို တွက်သည်။
4. ဖြေရှင်းရန်အကြံပြုချက်များ ထုတ်ပေးသည်။
5. Insights ကို repository တွင် သိမ်းသည်။
6. Agent trace ကို `audit_log` တွင် သိမ်းသည်။

## LLM Analysis နှင့် Local Fallback

`ANTHROPIC_API_KEY` configure ပြုလုပ်ထားပါက agent သည် configured LLM API ကို ခေါ်ပြီး theme တစ်ခုစီအတွက် actionable fix suggestion တောင်းသည်။

LLM API မှ response မရခြင်း၊ timeout ဖြစ်ခြင်း၊ JSON format မှားခြင်း သို့မဟုတ် API key မရှိခြင်းဖြစ်ပါက local keyword-based analysis ကို အလိုအလျောက်အသုံးပြုသည်။ ထို့ကြောင့် external AI service မရရှိသည့်အချိန်တွင်လည်း feedback analysis ဆက်လက်အလုပ်လုပ်နိုင်သည်။

LLM က category မှားယွင်းပေးနိုင်သောကြောင့် နောက်ဆုံး theme နှင့် message count ကို deterministic classifier ဖြင့် ပြန်လည်စစ်ဆေးသည်။ LLM ကို fix suggestion ထုတ်ရန် အသုံးပြုသော်လည်း general feedback ကို `other` category မှ အခြား category သို့ ရွှေ့ခွင့်မပေးထားပါ။

## Severity တွက်ချက်ပုံ

Theme တစ်ခုအောက်ရှိ message အရေအတွက်ကို အသုံးပြု၍ severity သတ်မှတ်သည်။

| Message count | Severity |
|---|---|
| 1–2 | `low` |
| 3–4 | `medium` |
| 5 နှင့်အထက် | `high` |

Severity သည် customer တစ်ဦးချင်း၏ message ကို ဆိုးရွားကြောင်း ဆုံးဖြတ်ခြင်းမဟုတ်ဘဲ theme တစ်ခုကို customer မည်မျှပြောထားသည်ကို ဖော်ပြခြင်းဖြစ်သည်။

## Suggested Fixes

LLM API မရရှိပါက local fallback သည် အောက်ပါ default suggestions များကို အသုံးပြုသည်။

| Theme | Suggested fix |
|---|---|
| delivery | Real-time tracking နှင့် delay notifications ထည့်ရန် |
| pricing | Competitor pricing နှင့် value bundles ပြန်လည်စစ်ဆေးရန် |
| quality | Shipping မပြုမီ QA checks ပိုမိုတင်းကြပ်ရန် |
| service | Customer service training နှင့် response SLA ထည့်ရန် |
| other | Emerging patterns ရှာဖွေရန် general feedback ကို ပြန်လည်သုံးသပ်ရန် |

## Manager Dashboard

Manager သည် **Dashboard → Feedback** တွင်—

- Theme cards
- Theme တစ်ခုစီ၏ mention count
- Severity
- Suggested fix
- Theme card ကိုဖွင့်သောအခါ သက်ဆိုင်ရာ messages
- Recent feedback messages
- **Analyze Now** button

တို့ကို မြင်နိုင်သည်။

Manager UI ရှိ `Others` card သည် known category keywords မပါသော messages များကို ပြသသည်။ Recent Feedback cards တွင် category နှင့် severity badges မပြဘဲ date နှင့် customer message ကိုသာ ရိုးရှင်းစွာပြထားသည်။

သက်ဆိုင်သော file မှာ—

```text
frontend/src/components/dashboard/FeedbackPanel.tsx
```

## API Endpoints

### Customer feedback submit

```http
POST /feedback
```

Authentication လိုအပ်သည်။ Feedback ကို သိမ်းပြီး background analysis စတင်သည်။

### Manager feedback list

```http
GET /feedback
```

Manager role သာ အသုံးပြုနိုင်သည်။ Raw feedback records များကို ပြန်ပေးသည်။

### Latest insights

```http
GET /feedback/insights
```

နောက်ဆုံးသိမ်းထားသော analysis result ကို ပြန်ပေးသည်။ Insights မရှိသေးပါက `null` ဖြစ်နိုင်သည်။

### Manual analysis

```http
POST /feedback/analyze
```

Manager က **Analyze Now** နှိပ်သောအခါ ခေါ်သည်။ Feedback အားလုံးကို ချက်ချင်းပြန်လည် analyze လုပ်သည်။

## Agent Trace

Analysis တစ်ကြိမ်စီတွင် `Feedback Agent` အမည်ဖြင့် trace ဖန်တီးသည်။ Trace တွင်—

- လက်ခံရရှိသော message အရေအတွက်
- LLM API သို့မဟုတ် local fallback အသုံးပြုမှု
- တွေ့ရှိသော theme အရေအတွက်
- Severity calculation
- Analysis result

တို့ပါဝင်သည်။ Manager သည် Agent Activity panel မှ ကြည့်နိုင်သည်။

## Error Handling

| Error | လုပ်ဆောင်ပုံ |
|---|---|
| Customer token မရှိ/မမှန် | `401 Unauthorized` |
| Customer က manager endpoint ခေါ်ခြင်း | `403 Forbidden` |
| Message တိုလွန်း/ရှည်လွန်း | `422 Validation Error` |
| Analyze လုပ်ရန် feedback မရှိ | `400 No feedback to analyze` |
| LLM API error | Local keyword analysis သို့ fallback |
| Background analysis error | Feedback record ကို မဖျက်ဘဲ server log တွင် မှတ်တမ်းတင် |

## Security နှင့် Guardrails

- Feedback submit လုပ်ရန် authenticated user ဖြစ်ရမည်။
- `user_id` ကို browser request body မှမယူဘဲ access token မှရယူသည်။
- Manager feedback list ကို manager role ဖြင့်သာ ကြည့်နိုင်သည်။
- LLM result သည် deterministic theme classification ကို override မလုပ်နိုင်ပါ။
- External API မရရှိလျှင် application flow မရပ်ဘဲ fallback သုံးသည်။
- Supabase secret key နှင့် AI API key ကို backend `.env` တွင်သာထားရမည်။
- Secret keys များကို frontend သို့မပို့ရ၊ Git သို့ commit မလုပ်ရပါ။

လက်ရှိ implementation တွင် advanced PII redaction pipeline မပါဝင်သေးပါ။ Production အသုံးပြုရာတွင် email၊ phone၊ address နှင့် အခြားကိုယ်ရေးအချက်အလက်များကို LLM သို့မပို့မီ redact ပြုလုပ်သင့်သည်။

## အဓိက Project Files

| File | တာဝန် |
|---|---|
| `backend/app/agents/feedback_agent.py` | Classification၊ analysis၊ fallback နှင့် trace generation |
| `backend/app/routes/feedback.py` | Feedback API endpoints နှင့် background task |
| `backend/app/repository.py` | Feedback/insights database operations |
| `backend/app/models/schemas.py` | Feedback၊ theme နှင့် insights models |
| `backend/app/config.py` | LLM API configuration |
| `frontend/src/components/FloatingChatWidget.tsx` | Customer feedback submission UI |
| `frontend/src/components/dashboard/FeedbackPanel.tsx` | Manager insights နှင့် recent feedback UI |
| `frontend/src/services/feedbackService.ts` | Manager feedback API calls |
| `frontend/src/types/index.ts` | Frontend feedback types |

## စမ်းသပ်နည်း

1. Customer account ဖြင့် login ဝင်ပါ။
2. Floating feedback button ကိုဖွင့်ပါ။
3. `More Mac products are required` ဟု submit လုပ်ပါ။
4. FastAPI response `201 Created` ဖြစ်ကြောင်း စစ်ပါ။
5. Supabase `feedback` table တွင် theme `other` ဖြစ်ကြောင်း စစ်ပါ။
6. Manager account ဖြင့် login ဝင်ပါ။
7. Dashboard ရှိ Feedback tab ကိုဖွင့်ပါ။
8. လိုအပ်ပါက **Analyze Now** ကိုနှိပ်ပါ။
9. `Others` card ပေါ်လာကြောင်း စစ်ပါ။
10. `Others` card ကိုဖွင့်ပြီး feedback message ပေါ်လာကြောင်း စစ်ပါ။
11. Recent Feedback တွင် message နှင့် date ပေါ်လာကြောင်း စစ်ပါ။

Supabase တွင် စစ်ရန်—

```sql
select id, user_id, message, theme, severity, created_at
from public.feedback
order by created_at desc;
```

## ဒီဇိုင်းဆုံးဖြတ်ချက်

Feedback classification ကို LLM တစ်ခုတည်းအပေါ် မှီခိုပါက response တစ်ကြိမ်နှင့်တစ်ကြိမ် မတူနိုင်သည်။ ထို့ကြောင့် PulseCart သည် known themes နှင့် general feedback အတွက် deterministic classifier ကို source of truth အဖြစ် အသုံးပြုသည်။ LLM ကို actionable fix suggestion ထုတ်ရန် အသုံးပြုပြီး application ၏ category correctness ကို deterministic rules ဖြင့် ထိန်းချုပ်ထားသည်။ ဤနည်းလမ်းသည် FeedbackAgent ကို စောင့်ကြည့်ရလွယ်ကူစေပြီး AI service မရရှိသည့်အချိန်တွင်လည်း မှန်ကန်စွာ ဆက်လက်အလုပ်လုပ်နိုင်စေသည်။
