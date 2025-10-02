-- Supabase schema for Kivo Nexa MVP

create extension if not exists "pgcrypto";

create table if not exists public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.users enable row level security;

create policy "Users can view own profile"
    on public.users
    for select
    using (auth.uid() = id);

create policy "Users manage own profile"
    on public.users
    for all
    using (auth.uid() = id)
    with check (auth.uid() = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_auth_user();

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    title text not null,
    description text,
    keywords text[] not null default '{}'::text[],
    competitor_urls text[] not null default '{}'::text[],
    platforms text[] not null default '{}'::text[],
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists projects_user_id_idx on public.projects (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;

create trigger projects_set_updated_at
    before update on public.projects
    for each row execute procedure public.set_updated_at();

alter table public.projects enable row level security;

create policy "Users can view their projects"
    on public.projects
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their projects"
    on public.projects
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their projects"
    on public.projects
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their projects"
    on public.projects
    for delete
    using (auth.uid() = user_id);

create type public.job_status as enum ('queued', 'processing', 'completed', 'failed');

create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    project_id uuid not null references public.projects (id) on delete cascade,
    status public.job_status not null default 'queued',
    priority integer not null default 5,
    error_message text,
    result_report_id uuid,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    payload jsonb default '{}'::jsonb
);

create index if not exists jobs_project_id_idx on public.jobs (project_id);
create index if not exists jobs_user_status_idx on public.jobs (user_id, status);
create index if not exists jobs_created_idx on public.jobs (created_at desc);

drop trigger if exists jobs_set_updated_at on public.jobs;

create trigger jobs_set_updated_at
    before update on public.jobs
    for each row execute procedure public.set_updated_at();

alter table public.jobs enable row level security;

create policy "Users can view their jobs"
    on public.jobs
    for select
    using (auth.uid() = user_id);

create policy "Users can insert jobs"
    on public.jobs
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update job status"
    on public.jobs
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    project_id uuid not null references public.projects (id) on delete cascade,
    job_id uuid references public.jobs (id) on delete set null,
    payload_json jsonb not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists reports_project_idx on public.reports (project_id, created_at desc);

alter table public.reports enable row level security;

create policy "Users can view their reports"
    on public.reports
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their reports"
    on public.reports
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update reports"
    on public.reports
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

alter table public.jobs
    add constraint jobs_result_report_fk
    foreign key (result_report_id)
    references public.reports (id)
    on delete set null;

comment on table public.projects is 'Projects configured by users to run quick Nexa research jobs.';
comment on table public.jobs is 'Queue of report generation jobs executed by Edge Function.';
comment on table public.reports is 'Persisted Grok-4 research reports for projects.';
