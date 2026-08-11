-- Plataforma moldeable de rifas / leads / propuestas

create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  company_type text default 'rifas',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  slug text not null unique,
  title text not null,
  headline text not null,
  subtitle text,
  hero_image_url text,
  brand_name text not null default 'Rifas de Viajes',
  whatsapp_number text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  number_mode text not null default 'both'
    check (number_mode in ('random', 'pick', 'both')),
  number_min integer not null default 1,
  number_max integer not null default 60000,
  number_digits integer not null default 5,
  ticket_price numeric(10,2) not null default 99,
  currency text not null default 'MXN',
  destinations jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  interest_levels jsonb not null default '[]'::jsonb,
  packages jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_slug_idx on campaigns(slug);
create index if not exists campaigns_status_idx on campaigns(status);

create table if not exists raffle_numbers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  number_value integer not null,
  number_label text not null,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'sold', 'blocked')),
  lead_id uuid,
  reserved_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, number_value)
);

create index if not exists raffle_numbers_campaign_status_idx
  on raffle_numbers(campaign_id, status);
create index if not exists raffle_numbers_label_idx
  on raffle_numbers(campaign_id, number_label);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  full_name text not null,
  whatsapp text not null,
  email text,
  city text,
  destination text,
  channel text,
  interest_level text,
  consent boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'proposal_sent', 'converted', 'lost')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_campaign_idx on leads(campaign_id);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_whatsapp_idx on leads(whatsapp);

alter table raffle_numbers
  drop constraint if exists raffle_numbers_lead_id_fkey;
alter table raffle_numbers
  add constraint raffle_numbers_lead_id_fkey
  foreign key (lead_id) references leads(id) on delete set null;

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  package_key text not null,
  package_name text not null,
  ticket_qty integer not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  currency text not null default 'MXN',
  number_assignment text not null default 'pending'
    check (number_assignment in ('pending', 'random', 'pick', 'assigned')),
  selected_numbers jsonb not null default '[]'::jsonb,
  message text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_lead_idx on proposals(lead_id);
create index if not exists proposals_campaign_idx on proposals(campaign_id);

create table if not exists agency_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  business_name text,
  whatsapp text not null,
  email text,
  city text,
  service_interest text not null,
  goals text,
  budget_range text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists campaigns_updated_at on campaigns;
create trigger campaigns_updated_at
  before update on campaigns
  for each row execute function set_updated_at();

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

drop trigger if exists proposals_updated_at on proposals;
create trigger proposals_updated_at
  before update on proposals
  for each row execute function set_updated_at();

insert into clients (id, name, contact_name, contact_whatsapp, company_type, notes)
values (
  '11111111-1111-1111-1111-111111111111',
  'Viajes de Otro Mundo',
  'Asesor comercial',
  '5216142515875',
  'rifas',
  'Cliente piloto: landing de rifas de viajes'
)
on conflict (id) do nothing;

insert into campaigns (
  id, client_id, slug, title, headline, subtitle, hero_image_url, brand_name,
  whatsapp_number, status, number_mode, number_min, number_max, number_digits,
  ticket_price, destinations, channels, interest_levels, packages, stats, theme
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'rifas-viajes',
  'Rifas de Viajes | Participa y gana tu próximo destino',
  'Gana el viaje que llevas años posponiendo',
  'Rifamos viajes todo incluido para dos personas. Regístrate, elige tu destino favorito y un asesor te acompaña por WhatsApp durante todo el proceso.',
  'https://rifasviajesdeotromundo.lovable.app/assets/hero-viaje-BHT9csOA.jpg',
  'Rifas de Viajes',
  '5216142515875',
  'open',
  'both',
  1,
  60000,
  5,
  99,
  '[
    {"key":"cancun","label":"Cancún / Riviera Maya"},
    {"key":"cabos","label":"Los Cabos"},
    {"key":"vallarta","label":"Puerto Vallarta"},
    {"key":"europa","label":"Europa (París · Roma · Madrid)"},
    {"key":"crucero","label":"Crucero por el Caribe"},
    {"key":"indefinido","label":"Aún no lo decido"}
  ]'::jsonb,
  '[
    {"key":"facebook","label":"Facebook"},
    {"key":"instagram","label":"Instagram"},
    {"key":"whatsapp","label":"WhatsApp"},
    {"key":"ads","label":"Anuncio digital"},
    {"key":"referral","label":"Recomendación"}
  ]'::jsonb,
  '[
    {"key":"buy_now","label":"Quiero mis boletos ya","score":5},
    {"key":"ready_today","label":"Listo para comprar hoy","score":5},
    {"key":"details","label":"Me interesa, quiero detalles","score":3},
    {"key":"soon","label":"Compro en los próximos días","score":4},
    {"key":"exploring","label":"Solo estoy explorando","score":1},
    {"key":"info","label":"Quiero información general","score":2}
  ]'::jsonb,
  '[
    {"key":"starter","name":"Paquete Inicial","tickets":1,"price":99,"min_score":1,"description":"1 boleto para participar en el sorteo"},
    {"key":"chance","name":"Más Oportunidades","tickets":3,"price":249,"min_score":2,"description":"3 boletos con mejor probabilidad"},
    {"key":"pro","name":"Paquete Pro","tickets":5,"price":399,"min_score":3,"description":"5 boletos + seguimiento prioritario"},
    {"key":"vip","name":"Paquete VIP","tickets":10,"price":699,"min_score":4,"description":"10 boletos + asesoría personalizada por WhatsApp"}
  ]'::jsonb,
  '{"participants":8400,"response_hours":24,"trips_delivered":12}'::jsonb,
  '{"accent":"#0d9488","bg_from":"#042f2e","bg_to":"#0f766e","font_display":"Fraunces","font_body":"Manrope"}'::jsonb
)
on conflict (slug) do nothing;
