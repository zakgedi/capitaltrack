-- Owner-only reusable labels and many-to-many card assignments.
create table if not exists public.lp_tags (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) between 1 and 32),
  color text not null check (color in ('slate','blue','teal','green','amber','orange','rose','violet')),
  created_at timestamptz not null default now()
);
create unique index if not exists lp_tags_name_ci on public.lp_tags (lower(btrim(name)));
create table if not exists public.lp_card_tags (
  firm_id integer not null references public.lp_pipeline(firm_id) on delete cascade,
  tag_id bigint not null references public.lp_tags(id) on delete cascade,
  primary key (firm_id, tag_id)
);
alter table public.lp_tags enable row level security;
alter table public.lp_card_tags enable row level security;
grant select, insert, update, delete on public.lp_tags, public.lp_card_tags to authenticated;
revoke all on public.lp_tags, public.lp_card_tags from anon;
create policy "Owner manages tags" on public.lp_tags for all to authenticated
  using (auth.uid() is not null and auth.jwt() ->> 'email' = 'zakaria.m.gedi@gmail.com')
  with check (auth.uid() is not null and auth.jwt() ->> 'email' = 'zakaria.m.gedi@gmail.com');
create policy "Owner manages card tags" on public.lp_card_tags for all to authenticated
  using (auth.uid() is not null and auth.jwt() ->> 'email' = 'zakaria.m.gedi@gmail.com')
  with check (auth.uid() is not null and auth.jwt() ->> 'email' = 'zakaria.m.gedi@gmail.com');
