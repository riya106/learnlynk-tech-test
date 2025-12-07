create extension if not exists "pgcrypto";

-----------------------------
-- 1) LEADS TABLE
-----------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid,
  stage text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_owner on leads(owner_id);
create index if not exists idx_leads_stage on leads(stage);
create index if not exists idx_leads_created on leads(created_at);

-----------------------------
-- 2) APPLICATIONS TABLE
-----------------------------
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint fk_app_lead foreign key (lead_id) references leads(id) on delete cascade
);

create index if not exists idx_app_lead on applications(lead_id);

-----------------------------
-- 3) TASKS TABLE
-----------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  related_id uuid not null,
  type text not null,
  due_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint fk_tasks_application 
    foreign key (related_id) references applications(id) on delete cascade,

  constraint chk_task_type 
    check (type in ('call','email','review')),

  constraint chk_due_after_created 
    check (due_at >= created_at)
);

create index if not exists idx_tasks_due on tasks(due_at);
