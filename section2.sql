-- Enable RLS on leads table
alter table leads enable row level security;

---------------------------------------------
-- Policy 1: Admins can read all leads
---------------------------------------------
create policy "admin_can_read_all_leads"
on leads
for select
using (
  auth.jwt() ->> 'role' = 'admin'
);

---------------------------------------------
-- Policy 2: Counselors can read:
-- their own leads OR leads in their team
---------------------------------------------
create policy "counselor_can_read_team_or_owned_leads"
on leads
for select
using (
  (auth.jwt() ->> 'role') = 'counselor'
  AND (
       owner_id = auth.uid()
       OR leads.tenant_id IN (
            select team_id 
            from user_teams 
            where user_id = auth.uid()
         )
  )
);

---------------------------------------------
-- Policy 3: Allow admin + counselors to insert leads
---------------------------------------------
create policy "insert_leads_admin_or_counselor"
on leads
for insert
with check (
  (auth.jwt() ->> 'role') IN ('admin', 'counselor')
);
