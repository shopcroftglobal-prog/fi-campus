-- F.I. College of Nursing · Digital Campus · Phase 1 schema (applied 23 Nov 2026 to Supabase project usumyjcfqjyerdrbufpo, schema "campus")
-- Covers: roles & audit, programmes & students, fees & Razorpay payments, attendance,
-- clinical logbook, admissions CRM, notices and grievances.
-- Every table has row-level security on. Policies below are the starting set.

-- All college objects live in their own schema "campus" so they stay separate from other apps in this Supabase project.
create schema if not exists campus;
set search_path to campus, public, extensions;

-- ============ Roles & people ============
create type app_role as enum ('principal','vice_principal','accounts','admission','hod','faculty','preceptor','warden','student','parent');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,                       -- +91 mobile, used for OTP
  email text,
  role app_role not null,
  department text,
  designation text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Fine-grained permissions: module × action, per role (matches the Settings matrix in the demo)
create type perm_action as enum ('view','add','edit','approve','export','delete');
create table role_permissions (
  role app_role not null,
  module text not null,                   -- 'fees','admissions','attendance','clinical','students','notices','grievances','audit'
  action perm_action not null,
  primary key (role, module, action)
);

create or replace function my_role() returns app_role language sql stable security definer set search_path = campus, public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function can(p_module text, p_action perm_action) returns boolean language sql stable security definer set search_path = campus, public as
$$ select exists(select 1 from role_permissions where role = my_role() and module = p_module and action = p_action)
       or my_role() = 'principal' $$;

-- ============ Academic structure ============
create table programmes (
  id serial primary key,
  code text unique not null,              -- BSC, PBB, GNM, MSC
  name text not null,
  years int not null,
  intake int not null
);

create table batches (
  id serial primary key,
  programme_id int not null references programmes(id),
  admission_year int not null,
  current_year int not null,
  section text,                           -- A / B
  unique (programme_id, admission_year, section)
);

create table students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique not null,       -- FIBSC2402
  profile_id uuid unique references profiles(id),
  batch_id int not null references batches(id),
  full_name text not null,
  dob date,
  gender text,
  blood_group text,
  phone text,
  email text,
  city text,
  hostel_room text,
  mentor_id uuid references profiles(id),
  status text not null default 'active' check (status in ('active','on_leave','passed_out','left')),
  created_at timestamptz not null default now()
);

create table guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  profile_id uuid references profiles(id),  -- parent login
  full_name text not null,
  relation text,
  phone text not null,
  is_primary boolean not null default true
);

create table student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  doc_type text not null,                 -- class_12_marksheet, aadhaar, domicile, medical_fitness ...
  storage_path text not null,             -- Supabase Storage key
  status text not null default 'uploaded' check (status in ('uploaded','verified','rejected')),
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  note text
);

-- ============ Fees & payments ============
create table fee_heads (
  id serial primary key,
  name text not null,                     -- Tuition Sem 5, Hostel & mess, University fee
  tally_ledger text                       -- for phase-2 Tally sync
);

create table fee_structures (
  id serial primary key,
  programme_id int not null references programmes(id),
  academic_year text not null,            -- '2026-27'
  study_year int not null,
  fee_head_id int not null references fee_heads(id),
  amount numeric(12,2) not null check (amount >= 0),
  due_date date
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  fee_head_id int not null references fee_heads(id),
  academic_year text not null,
  amount numeric(12,2) not null,
  concession numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'due' check (status in ('due','partly_paid','paid','waived')),
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  amount numeric(12,2) not null check (amount > 0),
  mode text not null check (mode in ('upi','card','netbanking','neft','cash','dd')),
  razorpay_order_id text,
  razorpay_payment_id text unique,
  status text not null default 'captured' check (status in ('created','captured','failed','refunded')),
  receipt_no text unique,                 -- RCPT/26-27/4812
  received_by uuid references profiles(id), -- null for online
  paid_at timestamptz not null default now()
);

create sequence receipt_seq start 1;

create view student_dues with (security_invoker = true) as
select i.student_id,
       sum(i.amount - i.concession) as billed,
       coalesce(sum(p.paid),0) as paid,
       sum(i.amount - i.concession) - coalesce(sum(p.paid),0) as due,
       max(current_date - i.due_date) filter (where i.status <> 'paid') as max_days_overdue
from invoices i
left join (select invoice_id, sum(amount) paid from payments where status='captured' group by invoice_id) p on p.invoice_id = i.id
group by i.student_id;

-- ============ Attendance ============
create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  batch_id int not null references batches(id),
  session_date date not null,
  kind text not null check (kind in ('theory','practical','clinical')),
  subject text not null,
  taken_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table attendance_records (
  session_id uuid not null references attendance_sessions(id) on delete cascade,
  student_id uuid not null references students(id),
  status char(1) not null check (status in ('P','A','L')),
  primary key (session_id, student_id)
);

create view attendance_summary with (security_invoker = true) as
select r.student_id, s.kind,
       round(100.0 * count(*) filter (where r.status='P') / nullif(count(*),0), 1) as percent
from attendance_records r join attendance_sessions s on s.id = r.session_id
group by r.student_id, s.kind;

-- ============ Clinical logbook ============
create table clinical_sites (
  id serial primary key,
  name text not null,                     -- Parent Hospital, District Women's Hospital
  area text not null                      -- Labour Room & OBG, ICU ...
);

create table postings (
  id uuid primary key default gen_random_uuid(),
  batch_id int not null references batches(id),
  site_id int not null references clinical_sites(id),
  preceptor_id uuid references profiles(id),
  starts_on date not null,
  ends_on date not null,
  hours_required int not null
);

create table competencies (
  id serial primary key,
  programme_id int references programmes(id),
  name text not null                      -- IV cannulation, APGAR assessment ...
);

create table logbook_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  posting_id uuid references postings(id),
  competency_id int not null references competencies(id),
  entry_date date not null,
  hours numeric(4,1) not null default 0,
  case_note text,                         -- no patient identifiers
  status text not null default 'submitted' check (status in ('submitted','signed','returned')),
  signed_by uuid references profiles(id),
  signed_at timestamptz,
  return_reason text
);

-- ============ Admissions CRM ============
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_code text unique not null,      -- ENQ-27-1180
  full_name text not null,
  phone text not null,
  email text,
  city text,
  programme_code text references programmes(code),
  source text not null,                   -- website, walk_in, whatsapp, referral, fair, ads
  stage text not null default 'new' check (stage in ('new','counselling','applied','docs_pending','docs_verified','fee_pending','enrolled','lost')),
  counsellor_id uuid references profiles(id),
  next_action text,
  next_action_at timestamptz,
  class12_stream text,
  class12_percent numeric(5,2),
  created_at timestamptz not null default now()
);

create table enquiry_activities (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  kind text not null,                     -- call, whatsapp, visit, stage_change, note
  note text,
  by_id uuid references profiles(id),
  at timestamptz not null default now()
);

-- ============ Notices & grievances ============
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text not null default 'general',
  show_on_website boolean not null default true,
  show_in_portals boolean not null default true,
  published_by uuid references profiles(id),
  published_at timestamptz not null default now()
);

create table grievances (
  id uuid primary key default gen_random_uuid(),
  ticket_no text unique not null,         -- G-118
  raised_by uuid references profiles(id), -- null when anonymous
  is_anonymous boolean not null default false,
  is_confidential boolean not null default false, -- ICC cases
  category text not null,
  description text not null,
  owner_role app_role,
  sla_hours int not null default 72,
  status text not null default 'new' check (status in ('new','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============ Append-only audit trail ============
create table audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_role app_role,
  module text not null,
  action text not null,
  record_id text,
  before jsonb,
  after jsonb,
  ip inet
);

create or replace function audit_row() returns trigger language plpgsql security definer set search_path = campus, public as $$
begin
  insert into audit_log(actor_id, actor_role, module, action, record_id, before, after)
  values (auth.uid(), my_role(), tg_table_name, lower(tg_op),
          coalesce((case when tg_op='DELETE' then old.id else new.id end)::text, null),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_invoices after insert or update or delete on invoices for each row execute function audit_row();
create trigger audit_payments after insert or update or delete on payments for each row execute function audit_row();
create trigger audit_students after insert or update or delete on students for each row execute function audit_row();
create trigger audit_enquiries after update on enquiries for each row execute function audit_row();
create trigger audit_logbook after update on logbook_entries for each row execute function audit_row();

-- Nobody can change or delete audit rows, including admins using the API
create or replace function block_audit_change() returns trigger language plpgsql set search_path = campus, public as $$
begin raise exception 'audit_log is append-only'; end $$;
create trigger audit_log_immutable before update or delete on audit_log for each row execute function block_audit_change();

-- ============ Row-level security (starting set) ============
alter table profiles enable row level security;
alter table role_permissions enable row level security;
alter table programmes enable row level security;
alter table batches enable row level security;
alter table students enable row level security;
alter table guardians enable row level security;
alter table student_documents enable row level security;
alter table fee_heads enable row level security;
alter table fee_structures enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table clinical_sites enable row level security;
alter table postings enable row level security;
alter table competencies enable row level security;
alter table logbook_entries enable row level security;
alter table enquiries enable row level security;
alter table enquiry_activities enable row level security;
alter table notices enable row level security;
alter table grievances enable row level security;
alter table audit_log enable row level security;

-- helpers: is the current user this student, or a parent of this student?
create or replace function is_self_or_parent(p_student uuid) returns boolean language sql stable security definer set search_path = campus, public as $$
  select exists(select 1 from students s where s.id = p_student and s.profile_id = auth.uid())
      or exists(select 1 from guardians g where g.student_id = p_student and g.profile_id = auth.uid())
$$;

create policy "own profile" on profiles for select using (id = auth.uid() or can('students','view'));
create policy "permissions readable" on role_permissions for select using (auth.uid() is not null);
create policy "reference data readable" on programmes for select using (auth.uid() is not null);
create policy "reference data readable" on batches for select using (auth.uid() is not null);
create policy "reference data readable" on fee_heads for select using (auth.uid() is not null);
create policy "reference data readable" on clinical_sites for select using (auth.uid() is not null);
create policy "reference data readable" on competencies for select using (auth.uid() is not null);
create policy "reference data readable" on fee_structures for select using (auth.uid() is not null);
create policy "postings readable" on postings for select using (auth.uid() is not null);

create policy "staff or self see student" on students for select using (can('students','view') or is_self_or_parent(id));
create policy "staff edit students" on students for update using (can('students','edit'));
create policy "staff add students" on students for insert with check (can('students','add'));
create policy "guardians: staff or family" on guardians for select using (can('students','view') or is_self_or_parent(student_id));
create policy "documents: staff or family" on student_documents for select using (can('students','view') or is_self_or_parent(student_id));
create policy "documents: upload own" on student_documents for insert with check (is_self_or_parent(student_id) or can('students','add'));
create policy "documents: staff verify" on student_documents for update using (can('students','edit'));

create policy "fees: staff or family" on invoices for select using (can('fees','view') or is_self_or_parent(student_id));
create policy "fees: staff manage" on invoices for all using (can('fees','edit')) with check (can('fees','edit'));
create policy "payments: staff or family" on payments for select using (can('fees','view') or exists(select 1 from invoices i where i.id = invoice_id and is_self_or_parent(i.student_id)));
-- payments are inserted only by the Razorpay webhook edge function (service role) or by accounts for cash
create policy "payments: accounts record cash" on payments for insert with check (can('fees','add'));

create policy "attendance: staff" on attendance_sessions for all using (can('attendance','add') or my_role() in ('faculty','preceptor')) with check (taken_by = auth.uid());
create policy "attendance records: staff or family" on attendance_records for select using (can('attendance','view') or is_self_or_parent(student_id));
create policy "attendance records: taker writes" on attendance_records for insert with check (exists(select 1 from attendance_sessions s where s.id = session_id and s.taken_by = auth.uid()));

create policy "logbook: student writes own" on logbook_entries for insert with check (exists(select 1 from students s where s.id = student_id and s.profile_id = auth.uid()));
create policy "logbook: read" on logbook_entries for select using (is_self_or_parent(student_id) or can('clinical','view') or my_role() = 'preceptor');
create policy "logbook: preceptor signs" on logbook_entries for update using (my_role() in ('preceptor','faculty','hod')) with check (signed_by = auth.uid());

create policy "crm: admissions" on enquiries for all using (can('admissions','view')) with check (can('admissions','edit'));
create policy "crm activity" on enquiry_activities for all using (can('admissions','view')) with check (can('admissions','add'));

create policy "notices: everyone reads" on notices for select using (true);
create policy "notices: publishers" on notices for insert with check (can('notices','add'));

create policy "grievance: raise" on grievances for insert with check (auth.uid() is not null);
create policy "grievance: own or handlers" on grievances for select using (
  raised_by = auth.uid()
  or (not is_confidential and can('grievances','view'))
  or (is_confidential and my_role() = 'principal'));

create policy "audit: principal and auditors read" on audit_log for select using (can('audit','view'));

-- ============ Seed: programmes and default permissions ============
insert into programmes(code,name,years,intake) values
 ('BSC','B.Sc Nursing',4,60),('PBB','Post Basic B.Sc Nursing',2,30),('GNM','GNM',3,40),('MSC','M.Sc Nursing',2,15);

insert into role_permissions(role,module,action) values
 ('accounts','fees','view'),('accounts','fees','add'),('accounts','fees','edit'),('accounts','fees','export'),('accounts','students','view'),('accounts','audit','view'),
 ('admission','admissions','view'),('admission','admissions','add'),('admission','admissions','edit'),('admission','students','view'),('admission','students','add'),('admission','notices','add'),
 ('hod','attendance','view'),('hod','attendance','add'),('hod','clinical','view'),('hod','clinical','approve'),('hod','students','view'),('hod','grievances','view'),
 ('vice_principal','students','view'),('vice_principal','attendance','view'),('vice_principal','notices','add'),('vice_principal','grievances','view');

-- ============ API access ============
grant usage on schema campus to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema campus to authenticated;
grant all on all tables in schema campus to service_role;
grant usage, select on all sequences in schema campus to authenticated, service_role;
grant execute on all functions in schema campus to authenticated, service_role;
grant select on campus.notices to anon;            -- public website notices
revoke update, delete on campus.audit_log from authenticated;
