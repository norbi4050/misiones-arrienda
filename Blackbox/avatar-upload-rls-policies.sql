begin;
create policy if not exists "Avatars — public read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');
create policy if not exists "Avatars — users can insert into own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
create policy if not exists "Avatars — users can update own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%')
  with check (true);
create policy if not exists "Avatars — users can delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
commit;
