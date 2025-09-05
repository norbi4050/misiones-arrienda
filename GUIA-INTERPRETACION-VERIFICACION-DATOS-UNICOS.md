# GUÍA DE INTERPRETACIÓN - VERIFICACIÓN DATOS ÚNICOS

## 🎯 CÓMO INTERPRETAR LOS RESULTADOS

### 📊 CONTEOS DE REGISTROS

#### Escenario 1: IDEAL ✅
```
User: 150 registros
users: 0 registros (tabla vacía)
```
**Interpretación**: Seguro para limpieza. La tabla duplicada está vacía.

#### Escenario 2: DUPLICADOS EXACTOS ✅
```
User: 150 registros
users: 150 registros
Únicos en users: 0
```
**Interpretación**: Seguro para limpieza. Los datos son duplicados exactos.

#### Escenario 3: DATOS ÚNICOS ⚠️
```
User: 150 registros
users: 175 registros
Únicos en users: 25
```
**Interpretación**: PELIGRO. Hay 25 registros únicos que se perderían.

#### Escenario 4: SOLO DUPLICADOS ❌
```
User: 0 registros (tabla vacía)
users: 150 registros
```
**Interpretación**: CRÍTICO. Todos los datos están en la tabla duplicada.

### 🚦 SEMÁFORO DE DECISIONES

#### 🟢 VERDE - PROCEDER
- ✅ 0 datos únicos en todas las tablas duplicadas
- ✅ Tablas duplicadas vacías o con duplicados exactos
- ✅ Foreign keys verificados
- **ACCIÓN**: Proceder con PASO 3

#### 🟡 AMARILLO - PRECAUCIÓN
- ⚠️ 1-10 datos únicos encontrados
- ⚠️ Datos únicos en tablas no críticas
- ⚠️ Foreign keys simples
- **ACCIÓN**: Migrar datos únicos, luego proceder

#### 🔴 ROJO - DETENER
- ❌ Más de 10 datos únicos
- ❌ Datos únicos en tablas críticas (User, Property)
- ❌ Foreign keys complejos
- **ACCIÓN**: Análisis detallado requerido

### 🔍 ANÁLISIS DETALLADO POR TABLA

#### Tabla `users` vs `User`:
- **Crítica**: SÍ (autenticación y perfiles)
- **Datos únicos aceptables**: 0
- **Acción si hay únicos**: Migración obligatoria

#### Tabla `properties` vs `Property`:
- **Crítica**: SÍ (propiedades publicadas)
- **Datos únicos aceptables**: 0
- **Acción si hay únicos**: Migración obligatoria

#### Tabla `agents` vs `Agent`:
- **Crítica**: MEDIA (agentes inmobiliarios)
- **Datos únicos aceptables**: 0-5
- **Acción si hay únicos**: Revisar y migrar

#### Tabla `favorites` vs `Favorite`:
- **Crítica**: BAJA (favoritos de usuarios)
- **Datos únicos aceptables**: 0-10
- **Acción si hay únicos**: Evaluar migración

#### Tabla `conversations` vs `Conversation`:
- **Crítica**: MEDIA (conversaciones)
- **Datos únicos aceptables**: 0-5
- **Acción si hay únicos**: Revisar y migrar

#### Tabla `messages` vs `Message`:
- **Crítica**: MEDIA (mensajes)
- **Datos únicos aceptables**: 0-10
- **Acción si hay únicos**: Evaluar migración

### 🛠️ SCRIPTS DE MIGRACIÓN

#### Para migrar datos únicos de `users` a `User`:
```sql
-- SOLO ejecutar si hay datos únicos confirmados
INSERT INTO public."User" (id, email, name, created_at, updated_at)
SELECT id, email, name, created_at, updated_at
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public."User" pu 
    WHERE pu.email = u.email OR pu.id = u.id
);
```

#### Para migrar datos únicos de `properties` a `Property`:
```sql
-- SOLO ejecutar si hay datos únicos confirmados
INSERT INTO public."Property" (id, title, description, price, created_at, updated_at)
SELECT id, title, description, price, created_at, updated_at
FROM public.properties p
WHERE NOT EXISTS (
    SELECT 1 FROM public."Property" pp 
    WHERE pp.title = p.title OR pp.id = p.id
);
```

### ⚠️ ADVERTENCIAS IMPORTANTES

1. **NUNCA ejecutar scripts de migración sin verificar primero**
2. **SIEMPRE hacer backup antes de migrar**
3. **VERIFICAR que los datos migrados son correctos**
4. **RE-EJECUTAR verificación después de migrar**

### 🔄 PROCESO COMPLETO DE MIGRACIÓN

1. **Identificar datos únicos** (PASO 2)
2. **Crear script de migración personalizado**
3. **Probar script en backup/desarrollo**
4. **Ejecutar migración en producción**
5. **Re-ejecutar PASO 2 para verificar**
6. **Solo proceder con PASO 3 cuando sea seguro**

### 📞 CONTACTO DE EMERGENCIA

Si encuentras escenarios no cubiertos en esta guía:
- Detener inmediatamente el proceso
- Documentar los hallazgos exactos
- Consultar con el equipo técnico
- NO improvisar soluciones

---
*Guía generada automáticamente*
*Fecha: 2025-09-05T15:33:18.808Z*
*Versión: 1.0*
