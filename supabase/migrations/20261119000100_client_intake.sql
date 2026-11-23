alter table public.cases
  add column intake jsonb check (jsonb_typeof(intake) = 'object'),
  add column intake_token uuid unique;

create unique index payments_active_quote_idx
  on public.payments (quote_id) where status in ('pending', 'paid');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-documents', 'case-documents', false, 3145728,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
