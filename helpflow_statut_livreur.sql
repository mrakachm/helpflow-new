-- HelpFlow - statut livreur réel En ligne / Pause
alter table public.profiles
  add column if not exists courier_availability text not null default 'ONLINE';

alter table public.profiles
  add column if not exists courier_availability_updated_at timestamptz;

update public.profiles
set courier_availability = 'ONLINE'
where courier_availability is null
   or courier_availability not in ('ONLINE', 'PAUSED');
