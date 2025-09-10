-- Verificación de paths de avatar en base de datos
select id, bucket_id, name, created_at
from storage.objects
where bucket_id='avatars'
order by created_at desc
limit 5;

-- Verificación de políticas RLS actuales
select policyname, cmd, qual, with_check
from pg_policies
where schemaname='storage' and tablename='objects'
order by policyname;
