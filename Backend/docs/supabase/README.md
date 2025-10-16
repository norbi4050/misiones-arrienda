# 📚 DOCUMENTACIÓN DE SUPABASE - MISIONES ARRIENDA

**Última Actualización:** 16 de Enero 2025  
**Estado:** ✅ 100% Alineado con Proyecto Renovado  
**Versión:** 1.1

---

## 📋 ÍNDICE

1. [Estado Actual](#estado-actual)
2. [Tablas Prisma](#tablas-prisma)
3. [Guías Rápidas](#guías-rápidas)
4. [Documentos de Referencia](#documentos-de-referencia)
5. [Historial de Cambios](#historial-de-cambios)

---

## ✅ ESTADO ACTUAL

### Resumen Ejecutivo

```
✅ Migración Completada:         100%
✅ Tablas Prisma:                7/7 creadas
✅ Usuarios Migrados:            2/2
✅ RLS Habilitado:               7/7 tablas
✅ Realtime Habilitado:          5/5 tablas
✅ Estructura:                   100% alineada
```

### Métricas

| Métrica | Valor |
|---------|-------|
| Tablas Prisma | 7 |
| Usuarios | 2 |
| Perfiles de Comunidad | 2 |
| Políticas RLS | 18 |
| Triggers | 4 |
| Storage Buckets | 13 |

---

## 🗄️ TABLAS PRISMA

### Tablas Principales

| # | Tabla | Registros | RLS | Realtime | Propósito |
|---|-------|-----------|-----|----------|-----------|
| 1 | **User** | 2 | ✅ | ✅ | Usuarios del sistema |
| 2 | **UserProfile** | 2 | ✅ | ✅ | Perfiles de comunidad |
| 3 | **Room** | 0 | ✅ | ❌ | Habitaciones ofrecidas |
| 4 | **Like** | 0 | ✅ | ❌ | Likes entre perfiles |
| 5 | **Conversation** | 0 | ✅ | ✅ | Conversaciones |
| 6 | **Message** | 0 | ✅ | ✅ | Mensajes |
| 7 | **Report** | 0 | ✅ | ❌ | Reportes |

### Tabla Especial

| Tabla | Tipo | Propósito |
|-------|------|-----------|
| **message_attachments** | Legacy (mapeada) | Adjuntos en mensajes |

---

## 🚀 GUÍAS RÁPIDAS

### Verificar Estado de Supabase

```sql
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tablas Prisma
SELECT tablename, rowsecurity as rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
ORDER BY tablename;

-- 2. Verificar Realtime
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('User', 'UserProfile', 'Conversation', 'Message', 'Property')
ORDER BY tablename;

-- 3. Verificar datos
SELECT 
  'Usuarios' as metrica, COUNT(*)::TEXT as valor FROM public."User"
UNION ALL
SELECT 
  'Perfiles', COUNT(*)::TEXT FROM public."UserProfile";
```

**Resultado Esperado:**
- 7 tablas con RLS = true
- 5 tablas en Realtime
- 2 usuarios, 2 perfiles

---

### Agregar Nueva Tabla Prisma

**Paso 1:** Definir en `prisma/schema.prisma`
```prisma
model NuevaTabla {
  id String @id @default(cuid())
  // ... campos
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Paso 2:** Crear en Supabase
```sql
CREATE TABLE public."NuevaTabla" (
  id TEXT PRIMARY KEY DEFAULT ('prefix_' || gen_random_uuid()::text),
  -- ... campos
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

**Paso 3:** Habilitar RLS
```sql
ALTER TABLE public."NuevaTabla" ENABLE ROW LEVEL SECURITY;

CREATE POLICY nueva_tabla_select ON public."NuevaTabla"
FOR SELECT USING (true); -- Ajustar según necesidad
```

**Paso 4:** Habilitar Realtime (si necesario)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public."NuevaTabla";
```

**Paso 5:** Crear trigger para updated_at
```sql
CREATE TRIGGER trigger_nueva_tabla_updated_at
  BEFORE UPDATE ON public."NuevaTabla"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Tablas Prisma | PascalCase | `User`, `UserProfile` |
| Tablas Legacy | snake_case | `users`, `community_profiles` |
| Columnas | camelCase | `isOnline`, `lastSeen` |
| IDs | TEXT con prefijo | `'up_' + uuid`, `'msg_' + uuid` |
| Enums | snake_case | `pet_pref`, `smoke_pref` |

**⚠️ IMPORTANTE:** Siempre usar camelCase para columnas en tablas Prisma.

---

## 📚 DOCUMENTOS DE REFERENCIA

### Inventarios y Estados

| Documento | Propósito | Actualizado |
|-----------|-----------|-------------|
| `INVENTARIO-ACTUALIZADO-SUPABASE-2025.md` | Inventario completo actual | ✅ 16/01/2025 |
| `docs/auditoria/ESTADO-ACTUAL-SUPABASE-POST-MIGRACION-2025.md` | Estado detallado post-migración | ✅ 16/01/2025 |

### Auditorías y Reportes

| Documento | Propósito | Estado |
|-----------|-----------|--------|
| `docs/auditoria/LISTA-COMPLETA-ERRORES-SUPABASE-VS-PROYECTO-2025.md` | Errores detectados (histórico) | 📜 Histórico |
| `docs/auditoria/REPORTE-AUDITORIA-COMPLETA-FINAL-2025.md` | Análisis exhaustivo | 📜 Histórico |
| `TODO-AUDITORIA-SUPABASE-RENOVADO-2025.md` | Reporte inicial | 📜 Histórico |

### Planes SQL

| Documento | Propósito | Estado |
|-----------|-----------|--------|
| `sql-audit/PLAN-EJECUCION-COMPLETO-SUPABASE-2025.sql` | Plan principal (13 fases) | ✅ EJECUTADO |
| `sql-audit/FIX-ERRORES-MIGRACION-2025.sql` | Correcciones | ✅ EJECUTADO |
| `sql-audit/FIX-FINAL-3-PROBLEMAS-PENDIENTES-2025.sql` | Fix final | ✅ EJECUTADO |
| `sql-audit/CLEANUP-COLUMNAS-DUPLICADAS-Y-BUCKETS-2025.sql` | Cleanup | ✅ EJECUTADO |

---

## 📝 HISTORIAL DE CAMBIOS

### 16 de Enero 2025 - Migración Completa ✅

**Problemas Resueltos:** 38/38 (100%)

**Cambios Realizados:**
- ✅ Creadas 7 tablas Prisma (User, UserProfile, Room, Like, Conversation, Message, Report)
- ✅ Migrados 2 usuarios de auth.users → User
- ✅ Creados 2 perfiles de comunidad
- ✅ Habilitado RLS en 7 tablas (18 políticas)
- ✅ Habilitado Realtime en 5 tablas
- ✅ Corregida estructura de message_attachments (12 columnas)
- ✅ Agregado valor CASA_COMPLETA a enum room_type
- ✅ Eliminadas columnas duplicadas snake_case
- ✅ Agregada columna operationType a Property
- ✅ Creados 4 triggers para updated_at
- ✅ Arregladas funciones handle_new_user y cleanup_stale_presence

**Archivos SQL Ejecutados:**
1. `PLAN-EJECUCION-COMPLETO-SUPABASE-2025.sql` (13 fases)
2. `FIX-ERRORES-MIGRACION-2025.sql` (correcciones)
3. `FIX-FINAL-3-PROBLEMAS-PENDIENTES-2025.sql` (fix final)
4. `CLEANUP-COLUMNAS-DUPLICADAS-Y-BUCKETS-2025.sql` (cleanup)

---

## 🔍 VERIFICACIÓN RÁPIDA

### Checklist de Salud de Supabase

```sql
-- Copiar y pegar en Supabase SQL Editor

SELECT 
  '✅ Tablas Prisma: ' || COUNT(*)::TEXT || '/7' as check1
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
UNION ALL
SELECT 
  '✅ RLS Habilitado: ' || COUNT(*)::TEXT || '/7'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('User', 'UserProfile', 'Room', 'Like', 'Conversation', 'Message', 'Report')
  AND rowsecurity = true
UNION ALL
SELECT 
  '✅ Realtime: ' || COUNT(*)::TEXT || '/5'
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('User', 'UserProfile', 'Conversation', 'Message', 'Property')
UNION ALL
SELECT 
  '✅ Usuarios: ' || COUNT(*)::TEXT || '/2'
FROM public."User"
UNION ALL
SELECT 
  '✅ Perfiles: ' || COUNT(*)::TEXT || '/2'
FROM public."UserProfile";
```

**Resultado Esperado:** Todos con ✅

---

## ⚠️ REGLAS IMPORTANTES

### DO's ✅

1. ✅ **Usar tablas Prisma** (PascalCase) para nuevo código
2. ✅ **Usar camelCase** para nombres de columnas
3. ✅ **Usar TEXT** para IDs (no UUID)
4. ✅ **Habilitar RLS** en todas las tablas nuevas
5. ✅ **Crear trigger** para updated_at
6. ✅ **Verificar en Prisma Schema** antes de modificar Supabase

### DON'Ts ❌

1. ❌ **NO usar tablas legacy** (snake_case) para nuevo código
2. ❌ **NO usar UUID** para IDs en tablas Prisma
3. ❌ **NO usar snake_case** para columnas en tablas Prisma
4. ❌ **NO modificar Supabase** sin actualizar Prisma Schema primero
5. ❌ **NO deshabilitar RLS** sin razón justificada

---

## 🆘 TROUBLESHOOTING

### Problema: Tabla no se encuentra

**Error:** `relation "public.NombreTabla" does not exist`

**Solución:**
1. Verificar que la tabla existe: `SELECT * FROM pg_tables WHERE tablename = 'NombreTabla';`
2. Verificar el nombre exacto (case-sensitive)
3. Si es tabla Prisma, usar PascalCase: `"User"`, `"UserProfile"`

### Problema: Columna no existe

**Error:** `column "nombreColumna" does not exist`

**Solución:**
1. Verificar columnas: `SELECT column_name FROM information_schema.columns WHERE table_name = 'NombreTabla';`
2. Verificar camelCase vs snake_case
3. Usar camelCase para tablas Prisma: `isOnline`, `lastSeen`

### Problema: RLS bloquea query

**Error:** Query retorna vacío o error de permisos

**Solución:**
1. Verificar políticas RLS: `SELECT * FROM pg_policies WHERE tablename = 'NombreTabla';`
2. Verificar que el usuario tiene permisos
3. Usar service role key para bypass (solo en desarrollo)

---

## 📞 CONTACTO Y SOPORTE

Para dudas o problemas:
1. Revisar este README
2. Consultar `INVENTARIO-ACTUALIZADO-SUPABASE-2025.md`
3. Revisar `docs/auditoria/ESTADO-ACTUAL-SUPABASE-POST-MIGRACION-2025.md`
4. Ejecutar queries de verificación

---

**Mantenido por:** Equipo de Desarrollo  
**Última Auditoría:** 16 de Enero 2025  
**Próxima Revisión:** Cuando se agreguen nuevas tablas o funcionalidades
