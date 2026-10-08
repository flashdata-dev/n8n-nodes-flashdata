create table public.flashdata_transcript_segments (
  id bigint generated always as identity primary key,
  video_id text not null,
  source_url text not null,
  language text not null,
  is_auto_generated boolean not null,
  captured_at timestamptz not null,
  start_seconds double precision not null,
  end_seconds double precision not null,
  text text not null,
  check (start_seconds >= 0 and end_seconds >= start_seconds)
);

alter table public.flashdata_transcript_segments enable row level security;
