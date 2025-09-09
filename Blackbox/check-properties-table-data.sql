-- A: ¿En cuál tabla hay datos?
select 'Property' as t, count(*) as c from "Property"
union all
select 'properties' as t, count(*) as c from public.properties;

-- B: Conteo por status en la tabla Property (CamelCase)
select status, count(*)
from "Property"
group by status
order by status;

-- C: Ver ejemplos de status distinto a mayúsculas
select id, status
from "Property"
where status not in ('PUBLISHED','DRAFT','ARCHIVED')
limit 10;

-- D: Listar policies RLS vigentes sobre la tabla Property
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'Property';
