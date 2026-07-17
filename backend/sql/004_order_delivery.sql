-- Delivery lifecycle and reliable email outbox for OrderCoordinatorAgent.
alter table public.orders
  add column if not exists customer_email text,
  add column if not exists delivered_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'approved', 'rejected', 'delivered'));

create table if not exists public.email_outbox (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  event_type text not null,
  recipient text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, event_type)
);

alter table public.email_outbox enable row level security;

-- No browser policy is intentionally created. The backend secret key owns the
-- delivery workflow and email queue.
