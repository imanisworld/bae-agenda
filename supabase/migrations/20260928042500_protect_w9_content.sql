-- W-9 fields contain tax information and must never be available through the public content policy.
drop policy if exists site_content_public_read on public.site_content;

create policy site_content_public_read
on public.site_content
for select
to public
using (key !~ '^w9_');
