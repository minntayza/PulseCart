-- Migration 005: Chat conversations, messages, and wanted products
-- Run after 004_order_delivery.sql

-- Conversations
create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_conversations enable row level security;

create policy "Users can read own conversations"
  on chat_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on chat_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on chat_conversations for update
  using (auth.uid() = user_id);

create policy "Managers can read all conversations"
  on chat_conversations for select
  using (exists (
    select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'manager'
  ));

-- Messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  product_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "Users can read messages in own conversations"
  on chat_messages for select
  using (exists (
    select 1 from chat_conversations
    where chat_conversations.id = chat_messages.conversation_id
    and chat_conversations.user_id = auth.uid()
  ));

create policy "Users can insert messages in own conversations"
  on chat_messages for insert
  with check (exists (
    select 1 from chat_conversations
    where chat_conversations.id = chat_messages.conversation_id
    and chat_conversations.user_id = auth.uid()
  ));

create policy "Managers can read all messages"
  on chat_messages for select
  using (exists (
    select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'manager'
  ));

-- Wanted Products
create table if not exists wanted_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  description text,
  mention_count int not null default 1,
  conversation_id uuid references chat_conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'stocked', 'dismissed'))
);

alter table wanted_products enable row level security;

create policy "Customers can insert wanted products"
  on wanted_products for insert
  with check (auth.uid() = user_id);

create policy "Managers can read all wanted products"
  on wanted_products for select
  using (exists (
    select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'manager'
  ));

create policy "Managers can update wanted products"
  on wanted_products for update
  using (exists (
    select 1 from profiles where profiles.user_id = auth.uid() and profiles.role = 'manager'
  ));

-- Indexes
create index if not exists idx_chat_conversations_user on chat_conversations(user_id);
create index if not exists idx_chat_messages_conversation on chat_messages(conversation_id);
create index if not exists idx_wanted_products_status on wanted_products(status);
create index if not exists idx_wanted_products_name on wanted_products(product_name);
