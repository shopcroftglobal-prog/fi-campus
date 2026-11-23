# F.I. College of Nursing · Digital Campus

Central campus management system for F.I. College of Nursing: admissions, students, fees, attendance, clinical logbook, notices and grievances, with student and parent portals.

## Stack

Next.js 15 (App Router, TypeScript) · Supabase (Postgres, Auth, row-level security) · deployed on Vercel. Payments (Razorpay) and WhatsApp/SMS (MSG91) come in later PRs.

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase anon key (Supabase → Project settings → API). Never commit `.env.local`.
3. In Supabase → Project settings → **Data API**, add `campus` to **Exposed schemas**. All college tables live there, separate from other apps in the same project.
4. `npm run dev` and open http://localhost:3000

## Database

The schema is in `supabase/migrations/`. It is already applied to the Supabase project. Access is enforced in the database: every table has row-level security, driven by `campus.my_role()` and the `campus.role_permissions` matrix, so the app's menu is only a convenience. Money, student and logbook changes are written to `campus.audit_log`, which cannot be edited or deleted.

### Adding the first user

1. Supabase → Authentication → Users → **Add user** (email + password).
2. Give them a role:

```sql
insert into campus.profiles (id, full_name, email, role)
select id, 'Dr. Principal Name', email, 'principal' from auth.users where email = 'principal@example.com';
```

Roles: `principal`, `vice_principal`, `accounts`, `admission`, `hod`, `faculty`, `preceptor`, `warden`, `student`, `parent`.

## Checks

`npm run typecheck` · `npm run lint` · `npm run build`
