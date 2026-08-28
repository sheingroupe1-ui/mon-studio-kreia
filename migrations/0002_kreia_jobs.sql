create table if not exists kreia_jobs (
  id text primary key,
  type text not null,
  status text not null,
  result jsonb,
  error text,
  progress jsonb,
  checkpoint jsonb,
  payload jsonb,
  frames jsonb not null default '[]'::jsonb,
  audio_chunks jsonb not null default '[]'::jsonb,
  phase text,
  working boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists kreia_jobs_updated_at_idx on kreia_jobs (updated_at);
