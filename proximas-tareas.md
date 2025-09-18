A) Avatar duplicado y que desaparece
Fase 1 — INVESTIGAR (no tocar código)

Copia y pegá en Blackbox:

Actuá como auditor. NO modifiques nada. Objetivo: por qué el upload de avatar dispara 2 requests y luego la imagen desaparece.

Archivos clave:
- Backend/src/components/ui/avatar-universal.tsx
- Backend/src/app/api/users/avatar/route.ts
- Backend/src/utils/avatar.ts
- Backend/src/contexts/UserContext.tsx

Checklist de auditoría:
1) Ubicá todos los handlers del input file (onChange/onInput/onSubmit) y cualquier useEffect que dispare upload/refresh.
2) Detectá doble invocación por StrictMode o handlers duplicados. ¿Hay router.refresh(), mutate() o setState dos veces?
3) Confirmá respuesta del endpoint:
   - ¿devuelve 204? ¿El frontend espera JSON (url, updated_at)?
   - ¿se actualiza user_profiles.photos[0]? ¿se retorna url con ?v=<updated_at>?
4) Mapeo exacto de llamadas: líneas y funciones que causan el 2º request.
5) Hipótesis raíz (1–2 causas) y plan de fix mínimo (single-flight con ref/mutex, respuesta 200 JSON, actualización única de estado).

Entregables:
- Mapa del flujo (quién llama a quién, con archivos y líneas).
- Tabla con TODAS las llamadas a /api/users/avatar (archivo:línea).
- Causa raíz y plan de fix en bullets.

Fase 2 — ARREGLO mínimo y seguro
Aplicá el fix mínimo:

1) API (Backend/src/app/api/users/avatar/route.ts)
   - Cambiá cualquier 204 por 200 y devolvé JSON:
     { ok: true, url: "<PUBLIC_URL>?v=<epoch>", updated_at: <epoch> }
   - Garantizá escritura en user_profiles.photos[0] y retorná la versión final.

2) Frontend (Backend/src/components/ui/avatar-universal.tsx)
   - Single-flight: implementá inFlight con useRef(false). Si true, no iniciar otro upload.
   - Extraé lógica a uploadAvatarOnce(), llamala SOLO desde onChange.
   - Eliminá cualquier useEffect que relance upload/refresh al montar o al cambiar state (o protegelo con ref didRun).
   - Actualizá SSoT local: reemplazá photos[0] por la url devuelta (no push/concat).
   - Reseteá el input después de subir (input.value = "").
   - Evitá router.refresh()/mutate duplicados; si existen, dejá uno solo.

3) Validación:
   - Network: 1 request, respuesta 200 JSON con url y updated_at.
   - UI: no hay doble imagen; recargar (F5) mantiene avatar.
   - Subida nueva cambia ?v=updated_at.

Entregables:
- Lista de archivos tocados con diffs resumidos.
- Explicación de cómo el guard de single-flight evita duplicados.
- Pasos de prueba (antes/después).

B) Errores 400 en Supabase REST (favorites, user_searches, user_messages, profile_views)

Estrategia: Dejar de llamar REST directo desde el cliente y usar rutas Next.js API + Prisma (tu patrón actual). Arreglamos nombres CamelCase/snake_case “por arriba” (en código), sin tocar DB todavía. Luego, si querés, hacemos un refactor de nombres con @map/@@map.

Fase 1 — INVESTIGAR (trazar llamados REST y componentes)
NO modifiques nada. Objetivo: localizar todos los fetch/queries que golpean Supabase REST directo para:
- /rest/v1/favorites
- /rest/v1/user_searches (o similares)
- /rest/v1/user_messages
- /rest/v1/profile_views
- /rest/v1/rpc/get_user_stats

Tareas:
1) Usá búsqueda en repo para "rest/v1", "favorites?", "user_searches", "user_messages", "profile_views", "rpc/get_user_stats".
2) Listá: archivo, línea, método (GET/HEAD/POST), querystring usado, y qué componente/página lo dispara.
3) Indicá si existe una ruta Next.js equivalente (p.ej. /api/favorites, /api/search-history, /api/users/stats).
4) Marcá cuáles HEAD están usados solo para count=exact (y si el UI realmente necesita ese count en tiempo real).
5) Identificá discrepancias de nombres (created_at vs createdAt, user_id vs userId).

Entregables:
- Tabla con TODOS los callers REST (archivo, línea, endpoint, motivo).
- Sugerencia de reemplazo por cada uno (ruta API interna + payload).

Fase 2 — ARREGLO mínimo (migrar a rutas internas)
Aplicá cambios mínimos:

1) Reemplazos:
   - favorites: cambiar fetch a /api/favorites (GET con params o body) → el handler usa Prisma y respeta createdAt.
   - user_searches: reemplazar por /api/search-history (GET) o deshabilitar si no se usa. Si se necesita count, devolvelo desde la API.
   - user_messages: si la lógica actual usa Conversations/Messages, eliminá llamadas a /user_messages y consumí /api/comunidad/messages/* ya implementadas.
   - profile_views: temporalmente deshabilitar o crear /api/profile-views que retorne 0 (placeholder) hasta implementar DB real.
   - rpc/get_user_stats: eliminar y usar /api/users/stats (ya existe). Ajustar el frontend.

2) HEAD → GET:
   - Donde uses HEAD para count=exact, cambiá a GET con {count} en JSON de respuesta de la API interna.

3) Validación:
   - Network: no deben existir requests a supabase.co/rest/v1 para estos recursos.
   - UI: sin 400/404; datos llegan vía API interna.

Entregables:
- Archivos tocados y diffs resumidos.
- Lista de endpoints externos eliminados y cuál API interna los reemplaza.

C) favorites con 400 por created_at

Si todavía tenés un caller directo:

Fase 1 — INVESTIGAR rápido
Confirmá si hay fetch directo a /rest/v1/favorites con order=created_at.desc o select con join a properties.
Listá archivo:línea y el componente que lo llama.

Fase 2 — ARREGLO mínimo
Refactorizá ese caller para usar /api/favorites (Next.js API) con Prisma.
- Asegurate de mapear createdAt del modelo a “created_at” si el UI lo necesita así (hacerlo en el DTO de salida).
- Devolvé { id, createdAt, property: {...} } en camelCase al frontend.

D) user_searches vs search_history (400 por is_active)
Fase 1 — INVESTIGAR
Ubicá todas las consultas a user_searches (HEAD/GET).
Verificá si el UI realmente necesita “is_active=true”.

Fase 2 — ARREGLO mínimo
Reemplazá por /api/search-history (Prisma) o deshabilitá el feature.
Si necesitás “activas”, añadí un filtro boolean en Prisma o devolvé {total, lastSearchAt}.
Eliminá HEAD y usá GET con JSON {count}.

E) user_messages (400; esquema viejo)
Fase 1 — INVESTIGAR
Encontrá todas las referencias a /rest/v1/user_messages.
Confirmá si el chat actual usa Conversations/Messages (/api/comunidad/messages/*).

Fase 2 — ARREGLO mínimo
Eliminá los callers a /user_messages y migrá a las rutas /api/comunidad/messages/*.
Si algo queda sin reemplazo, creá un adaptador minimal que lea de Prisma.Message con filtros por userId (sent/received).

F) profile_views (400 por viewed_at)
Opción 1 (rápida): deshabilitar hasta implementar
Fase 2 — ARREGLO mínimo
Sustituí el fetch actual por /api/profile-views (nuevo handler) que devuelva:
{ total: 0, since: null } // placeholder
y una nota TODO en el handler.

Opción 2 (completa): implementar tabla y API

SQL (ejecutás vos en Supabase):

-- Tabla base
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  viewer_user_id uuid references public.user_profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices
create index on public.profile_views (profile_user_id, created_at desc);
create index on public.profile_views (viewer_user_id, created_at desc);

-- (Opcional) RLS si pensás exponer por REST:
alter table public.profile_views enable row level security;
create policy "read_own_profile_views" on public.profile_views
  for select using (auth.uid() = profile_user_id);


API interna (Blackbox):

Creá Backend/src/app/api/profile-views/route.ts:
- GET: recibe ?profileUserId=...&since=ISO (opcional)
- Devuelve { total, since } consultando Prisma.profileViews
- Usá camelCase y valida que caller sea el owner (middleware auth).

G) RPC get_user_stats (404)
Fase 2 — ARREGLO mínimo
Eliminá cualquier llamada a /rest/v1/rpc/get_user_stats.
Usá /api/users/stats ya existente. Si faltan campos, extendé el handler de /api/users/stats con Prisma.


(Opcional, si quisieras tener un RPC real en Postgres más adelante, te armo la función SQL a medida.)

H) (Opcional) Alineación de nombres Prisma ↔ DB

Si en el futuro querés volver a exponer por REST, conviene alinear nombres:

Plan largo (con @map/@@map):

Auditar modelos Prisma y aplicar:
- En modelos: @@map("snake_case_table")
- En campos:  @map("snake_case_column")

Regenerar migraciones y aplicar en Supabase (con backup previo).


Plan corto (recomendado ahora):

Evitar REST externo y usar sólo API internas con Prisma.
Normalizar los DTOs del backend a camelCase para el frontend.

I) Seguridad (RLS) — sólo si vas a exponer REST

Si mantenés llamadas REST directas: te dejo ejemplos tipo (vos ejecutás):

-- FAVORITES: leer sólo lo propio
alter table public.favorites enable row level security;
create policy "favorites_self_read" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_self_write" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_self_delete" on public.favorites
  for delete using (auth.uid() = user_id);


(Repetir patrón para search_history, inquiries, messages, etc.)

Verificación rápida (checklist)

Network (avatar): 1 request, 200 JSON con {url, updated_at}; ?v cambia entre subidas.

Network (REST): no hay llamadas a supabase.co/rest/v1 para favorites, user_searches, user_messages, profile_views, get_user_stats.

UI: sin errores 400/404; stats y favoritos cargan normal; chat funciona.

Logs Supabase: caen los 400/404 anteriores.

StrictMode: sin duplicaciones de efectos/handlers.

Sugerencia de commit message (modelo)
fix(avatar): single-flight upload + API 200 JSON; remove duplicate refresh
refactor(data): replace direct Supabase REST calls with internal API (favorites, search-history, messages, profile-views)
chore(stats): drop rpc/get_user_stats usage, use /api/users/stats