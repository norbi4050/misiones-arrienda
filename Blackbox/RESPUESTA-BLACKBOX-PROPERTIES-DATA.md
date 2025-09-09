# BLACKBOX RESPONDE - DIAGNÓSTICO COMPLETO DE PROPERTIES DATA

## 📋 Fecha: 2025
## 🔍 Análisis Solicitado: Verificación de datos en tabla Property y diagnóstico de problemas de acceso

---

## 🎯 OBJETIVO DEL ANÁLISIS

Diagnosticar por qué la API `/api/properties` no está devolviendo datos reales y determinar:
- ¿En cuál tabla están los datos? (Property vs properties)
- ¿Cuál es la distribución de status?
- ¿Existen políticas RLS que bloqueen el acceso?
- ¿Qué soluciones implementar?

---

## 🔍 CONSULTAS SQL A EJECUTAR EN SUPABASE

### A: ¿En cuál tabla hay datos?

```sql
-- A: ¿En cuál tabla hay datos?
select 'Property' as tabla, count(*) as filas from "Property"
union all
select 'properties' as tabla, count(*) as filas from public.properties;
```

**Resultado esperado:**
- Una tabla tendrá datos (filas > 0)
- La otra tendrá 0 filas

### B: Conteo por status en la tabla Property

```sql
-- B: Conteo por status en la tabla Property
select status, count(*) as cantidad
from "Property"
group by status
order by status;
```

**Resultado esperado:**
- PUBLISHED: X propiedades
- DRAFT: Y propiedades
- ARCHIVED: Z propiedades

### C: Ver ejemplos de status no estándar

```sql
-- C: Ver ejemplos de status no estándar
select id, status
from "Property"
where status not in ('PUBLISHED', 'DRAFT', 'ARCHIVED')
limit 10;
```

**Resultado esperado:**
- Lista vacía (todos los status son estándar)
- O lista de propiedades con status problemáticos

### D: Listar policies RLS vigentes

```sql
-- D: Listar policies RLS vigentes
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'Property';
```

**Resultado esperado:**
- Lista de políticas RLS activas
- Si está vacía = ¡PROBLEMA IDENTIFICADO!

---

## 📊 ANÁLISIS ESPERADO DE RESULTADOS

### Posibles Escenarios:

#### ✅ ESCENARIO IDEAL:
- **Tabla correcta:** Property (CamelCase) tiene datos
- **Status estándar:** Solo PUBLISHED, DRAFT, ARCHIVED
- **RLS configurado:** Policies existentes para SELECT, INSERT, UPDATE, DELETE

#### ❌ ESCENARIO PROBLEMÁTICO (Más probable):
- **Tabla correcta:** Property tiene datos
- **Status estándar:** OK
- **RLS faltante:** NO hay policies definidas = **CAUSA RAÍZ DEL PROBLEMA**

---

## 🔧 DIAGNÓSTICO PRELIMINAR

Basado en el análisis del código y estructura del proyecto, el problema más probable es:

### **FALTA DE POLÍTICAS RLS (Row Level Security)**

**Síntomas:**
- API devuelve array vacío `[]`
- No hay errores 400/500
- Datos existen en la base de datos
- Usuario está autenticado

**Causa raíz:**
- Supabase tiene RLS activado por defecto
- Sin policies definidas, ningún usuario puede acceder a los datos
- Ni siquiera el owner/admin puede leer datos sin policies explícitas

---

## 💡 SOLUCIONES PROPUESTAS

### SOLUCIÓN 1: Políticas RLS Básicas (Recomendada)

```sql
-- Habilitar RLS en la tabla Property
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT (lectura) - usuarios autenticados
CREATE POLICY "Users can view all properties" ON "Property"
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para INSERT (crear) - usuarios autenticados
CREATE POLICY "Users can create properties" ON "Property"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para UPDATE (editar) - solo el owner
CREATE POLICY "Users can update own properties" ON "Property"
FOR UPDATE USING (auth.uid() = user_id);

-- Policy para DELETE (eliminar) - solo el owner
CREATE POLICY "Users can delete own properties" ON "Property"
FOR DELETE USING (auth.uid() = user_id);
```

### SOLUCIÓN 2: Desactivar RLS Temporalmente (Solo para testing)

```sql
-- ⚠️ SOLO PARA TESTING - NO USAR EN PRODUCCIÓN
ALTER TABLE "Property" DISABLE ROW LEVEL SECURITY;
```

---

## 🚀 PASOS PARA IMPLEMENTAR LA SOLUCIÓN

### Paso 1: Ejecutar consultas de diagnóstico
1. Abrir Supabase Dashboard → SQL Editor
2. Ejecutar las 4 consultas anteriores
3. Anotar los resultados

### Paso 2: Aplicar solución según resultados
- Si faltan policies → Aplicar SOLUCIÓN 1
- Si hay policies pero no funcionan → Revisar configuración de policies

### Paso 3: Verificar funcionamiento
```bash
# Probar la API después de aplicar policies
curl -i "http://localhost:3000/api/properties"
```

**Resultado esperado después de la solución:**
```json
[
  {
    "id": "uuid",
    "title": "Casa en Palermo",
    "status": "PUBLISHED",
    "price": 150000,
    ...
  }
]
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Consultas SQL ejecutadas en Supabase
- [ ] Resultados documentados
- [ ] Causa raíz identificada
- [ ] Solución aplicada
- [ ] API probada y funcionando
- [ ] Datos visibles en el frontend

---

## 🎯 CONCLUSIONES

**Problema identificado:** Alta probabilidad de falta de políticas RLS en tabla Property

**Solución recomendada:** Implementar políticas RLS básicas para usuarios autenticados

**Tiempo estimado:** 15-30 minutos para diagnóstico y solución

**Impacto esperado:** API `/api/properties` funcionará correctamente y devolverá datos reales

---

## 📞 SIGUIENTE PASO

Por favor, ejecuta las consultas SQL en Supabase SQL Editor y comparte los resultados para confirmar el diagnóstico y proceder con la solución específica.

**BLACKBOX AI - DIAGNÓSTICO COMPLETADO**
