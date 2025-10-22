# 🧪 Testing Plan - Sistema de Reportes de Propiedades

## 📋 Pre-requisitos

### 1. Aplicar Migración de Base de Datos

**Opción A: Desde Supabase Dashboard (Recomendado)**
1. Ir a Supabase Dashboard → SQL Editor
2. Abrir el archivo: `prisma/migrations/add_property_reports_system.sql`
3. Copiar todo el contenido
4. Pegarlo en el SQL Editor
5. Ejecutar (Run)
6. Verificar que se creó la tabla: `SELECT * FROM property_reports LIMIT 1;`

**Opción B: Desde CLI local** (requiere conexión directa a BD)
```bash
# Conectar a Supabase con psql
psql "postgresql://postgres:[PASSWORD]@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres"

# Ejecutar migration
\i prisma/migrations/add_property_reports_system.sql

# Verificar
\dt property_reports
```

### 2. Verificar que el build compiló correctamente
```bash
npm run build
```

✅ Debe completarse sin errores (warnings están OK)

---

## 🎯 TEST SUITE 1: Backend API Tests

### Test 1.1: Crear Reporte (Happy Path)

**Setup:**
- Usuario autenticado con ID: `user123`
- Propiedad existente con ID: `prop456`

**Request:**
```bash
POST /api/properties/prop456/report
Content-Type: application/json
Authorization: Bearer [TOKEN]

{
  "reason": "fake_images",
  "details": "Las fotos que se muestran no corresponden a la realidad de la propiedad. Las imágenes son de otra ubicación."
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "report": {
    "id": "pr_...",
    "propertyId": "prop456",
    "reason": "fake_images",
    "reasonLabel": "Fotos falsas o engañosas",
    "status": "PENDING",
    "createdAt": "2025-10-22T..."
  },
  "message": "Reporte enviado correctamente. Nuestro equipo lo revisará en breve."
}
```

---

### Test 1.2: Validación - Razón Inválida

**Request:**
```json
{
  "reason": "invalid_reason",
  "details": "Este es un detalle válido con más de 10 caracteres"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "invalid_enum_value",
      "message": "Categoría de reporte inválida",
      ...
    }
  ]
}
```

---

### Test 1.3: Validación - Detalles Muy Cortos

**Request:**
```json
{
  "reason": "scam",
  "details": "Mal"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "message": "Los detalles deben tener al menos 10 caracteres",
      ...
    }
  ]
}
```

---

### Test 1.4: Validación - Detalles Muy Largos

**Request:**
```json
{
  "reason": "other",
  "details": "[String de 501 caracteres]"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "message": "Los detalles no pueden exceder 500 caracteres",
      ...
    }
  ]
}
```

---

### Test 1.5: Usuario No Autenticado

**Request:**
```bash
POST /api/properties/prop456/report
# Sin header Authorization
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Debes iniciar sesión para reportar una propiedad"
}
```

---

### Test 1.6: Propiedad No Existe

**Request:**
```bash
POST /api/properties/INVALID_ID/report
Authorization: Bearer [TOKEN]

{
  "reason": "scam",
  "details": "Este es un detalle válido con más de 10 caracteres"
}
```

**Expected Response:** `404 Not Found`
```json
{
  "error": "Propiedad no encontrada"
}
```

---

### Test 1.7: Reportar Propia Propiedad

**Setup:**
- Usuario `user123` es dueño de la propiedad `prop789`

**Request:**
```bash
POST /api/properties/prop789/report
Authorization: Bearer [TOKEN de user123]

{
  "reason": "other",
  "details": "Intentando reportar mi propia propiedad"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "No puedes reportar tu propia propiedad"
}
```

---

### Test 1.8: Reporte Duplicado

**Setup:**
- Usuario `user123` ya reportó la propiedad `prop456` anteriormente

**Request:**
```bash
POST /api/properties/prop456/report
Authorization: Bearer [TOKEN de user123]

{
  "reason": "scam",
  "details": "Segundo intento de reportar la misma propiedad"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Ya has reportado esta propiedad anteriormente"
}
```

---

### Test 1.9: GET Reportes (Owner)

**Setup:**
- Usuario `user123` es dueño de la propiedad `prop456`
- La propiedad tiene 2 reportes

**Request:**
```bash
GET /api/properties/prop456/report
Authorization: Bearer [TOKEN de user123]
```

**Expected Response:** `200 OK`
```json
{
  "success": true,
  "reports": [
    {
      "id": "pr_xxx",
      "reason": "fake_images",
      "reasonLabel": "Fotos falsas o engañosas",
      "details": "...",
      "status": "PENDING",
      "created_at": "...",
      "updated_at": "...",
      "reporter": {
        "name": "Juan Pérez"
      }
    },
    {
      "id": "pr_yyy",
      "reason": "scam",
      "reasonLabel": "Estafa/Fraude",
      "details": "...",
      "status": "PENDING",
      "created_at": "...",
      "updated_at": "...",
      "reporter": {
        "name": "María García"
      }
    }
  ],
  "count": 2
}
```

---

### Test 1.10: GET Reportes (No Owner)

**Setup:**
- Usuario `user999` NO es dueño de la propiedad `prop456`

**Request:**
```bash
GET /api/properties/prop456/report
Authorization: Bearer [TOKEN de user999]
```

**Expected Response:** `403 Forbidden`
```json
{
  "error": "No tienes permiso para ver estos reportes"
}
```

---

## 🎨 TEST SUITE 2: Frontend UI Tests

### Test 2.1: Botón de Reporte Visible

**Steps:**
1. Abrir página de detalle de propiedad
2. Verificar que el botón con ícono de bandera (Flag) está visible en la esquina superior derecha
3. Verificar tooltip "Reportar propiedad" al hacer hover

**Expected:**
- ✅ Botón visible con ícono `<Flag />`
- ✅ Botón tiene tooltip
- ✅ Botón tiene estilos correctos (bg-white/90, backdrop-blur)

---

### Test 2.2: Abrir Modal de Reporte

**Steps:**
1. Click en botón de bandera
2. Verificar que el modal se abre

**Expected:**
- ✅ Modal aparece con título "Reportar Propiedad"
- ✅ Muestra el nombre de la propiedad
- ✅ Muestra alerta informativa azul
- ✅ Muestra 8 opciones de categoría
- ✅ Campo de textarea visible
- ✅ Botones "Cancelar" y "Enviar Reporte"

---

### Test 2.3: Seleccionar Categoría

**Steps:**
1. Abrir modal de reporte
2. Click en categoría "Estafa o Fraude"
3. Verificar que se selecciona

**Expected:**
- ✅ Card se marca con borde azul
- ✅ Aparece checkmark azul
- ✅ Texto cambia a azul
- ✅ Solo una categoría seleccionada a la vez

---

### Test 2.4: Validación de Detalles Mínimos

**Steps:**
1. Seleccionar categoría
2. Escribir "Test" (4 caracteres)
3. Click en "Enviar Reporte"

**Expected:**
- ✅ Muestra toast error: "Por favor proporciona más detalles (mínimo 10 caracteres)"
- ✅ No cierra el modal
- ✅ No hace request al backend

---

### Test 2.5: Contador de Caracteres

**Steps:**
1. Escribir en textarea
2. Verificar contador actualiza

**Expected:**
- ✅ Muestra "X/500" caracteres
- ✅ Se pone rojo cuando > 450 caracteres
- ✅ No permite más de 500 caracteres

---

### Test 2.6: Envío Exitoso

**Steps:**
1. Seleccionar categoría "Fotos Falsas"
2. Escribir detalles válidos (>10 caracteres)
3. Click en "Enviar Reporte"
4. Esperar respuesta

**Expected:**
- ✅ Botón muestra "Enviando..." con spinner
- ✅ Botones se deshabilitan
- ✅ Hace POST request correcto
- ✅ Muestra toast success
- ✅ Modal cambia a vista de éxito con checkmark verde
- ✅ Modal se cierra automáticamente después de 2 segundos

---

### Test 2.7: Error de Red

**Steps:**
1. Desconectar internet
2. Intentar enviar reporte válido

**Expected:**
- ✅ Muestra toast error con mensaje del servidor
- ✅ Modal permanece abierto
- ✅ Formulario mantiene los datos ingresados
- ✅ Usuario puede reintentar

---

### Test 2.8: Cerrar Modal

**Steps:**
1. Abrir modal
2. Click en botón "Cancelar"
3. Verificar que se cierra y limpia

**Expected:**
- ✅ Modal se cierra
- ✅ Formulario se resetea (categoría y detalles limpios)
- ✅ Al reabrir, modal está limpio

---

### Test 2.9: Cerrar Modal con Backdrop

**Steps:**
1. Abrir modal
2. Click fuera del modal (en el backdrop oscuro)

**Expected:**
- ✅ Modal se cierra
- ✅ Formulario se resetea

---

### Test 2.10: Responsive Design

**Steps:**
1. Abrir modal en móvil (375px)
2. Verificar diseño

**Expected:**
- ✅ Categorías se muestran en 1 columna
- ✅ Modal ocupa todo el ancho con margins
- ✅ Botones se adaptan correctamente
- ✅ Texto es legible

---

## 🔍 TEST SUITE 3: Database & Security Tests

### Test 3.1: Verificar Constraint Único

**SQL:**
```sql
-- Intentar insertar 2 reportes del mismo usuario a la misma propiedad
INSERT INTO property_reports (id, property_id, reporter_id, reason, details)
VALUES ('test1', 'prop123', 'user456', 'scam', 'First report');

-- Este debe fallar:
INSERT INTO property_reports (id, property_id, reporter_id, reason, details)
VALUES ('test2', 'prop123', 'user456', 'fake_images', 'Second report');
```

**Expected:**
- ❌ Segunda inserción debe fallar con error de constraint único

---

### Test 3.2: Verificar RLS Políticas

**Test:** Usuario solo ve sus propios reportes
```sql
-- Como usuario 'user123'
SELECT * FROM property_reports WHERE reporter_id != 'user123';
```

**Expected:**
- ✅ Retorna 0 filas (RLS bloqueó el acceso)

---

### Test 3.3: Verificar Cascade Delete

**Test:** Al eliminar propiedad, se eliminan reportes
```sql
-- Crear reporte
INSERT INTO property_reports (id, property_id, reporter_id, reason, details)
VALUES ('test_report', 'temp_prop', 'user123', 'other', 'Test report for cascade');

-- Eliminar propiedad
DELETE FROM "Property" WHERE id = 'temp_prop';

-- Verificar que reporte también se eliminó
SELECT * FROM property_reports WHERE id = 'test_report';
```

**Expected:**
- ✅ Reporte eliminado automáticamente (0 filas)

---

### Test 3.4: Verificar Trigger updated_at

**SQL:**
```sql
-- Crear reporte
INSERT INTO property_reports (id, property_id, reporter_id, reason, details, created_at, updated_at)
VALUES ('test_trigger', 'prop123', 'user456', 'scam', 'Test', NOW(), NOW());

-- Esperar 2 segundos

-- Actualizar
UPDATE property_reports SET status = 'RESOLVED' WHERE id = 'test_trigger';

-- Verificar que updated_at cambió
SELECT created_at, updated_at, (updated_at > created_at) as was_updated
FROM property_reports WHERE id = 'test_trigger';
```

**Expected:**
- ✅ `was_updated` = true
- ✅ `updated_at` > `created_at`

---

## 📊 TEST SUITE 4: End-to-End User Flow

### Escenario Completo: Usuario Reporta Fraude

**Actors:**
- Usuario A (reportador)
- Usuario B (dueño de la propiedad)

**Flow:**

1. **Usuario A navega a propiedad de Usuario B**
   - ✅ Ve página de detalle completa
   - ✅ Ve botón de reporte (bandera)

2. **Usuario A abre modal de reporte**
   - ✅ Modal se abre correctamente
   - ✅ Ve nombre de la propiedad
   - ✅ Ve 8 categorías

3. **Usuario A completa formulario**
   - Selecciona: "Estafa o Fraude"
   - Escribe: "Esta propiedad no existe en la realidad. Las fotos son de internet y el teléfono no contesta."
   - ✅ Contador muestra 95/500 caracteres

4. **Usuario A envía reporte**
   - Click en "Enviar Reporte"
   - ✅ Botón muestra "Enviando..."
   - ✅ Request POST exitoso
   - ✅ Toast: "Reporte enviado correctamente"
   - ✅ Modal muestra pantalla de éxito
   - ✅ Modal se cierra automáticamente

5. **Verificar en Base de Datos**
   ```sql
   SELECT * FROM property_reports
   WHERE property_id = '[ID_PROPIEDAD]'
   AND reporter_id = '[ID_USUARIO_A]';
   ```
   - ✅ Reporte existe con status 'PENDING'
   - ✅ reason = 'scam'
   - ✅ details almacenados correctamente

6. **Usuario A intenta reportar nuevamente**
   - Abre modal
   - Completa formulario
   - Click en "Enviar Reporte"
   - ✅ Toast error: "Ya has reportado esta propiedad anteriormente"
   - ✅ No se crea reporte duplicado

7. **Usuario B (owner) consulta reportes** (Futuro - requiere admin panel)
   - GET /api/properties/[ID]/report
   - ✅ Ve su reporte en la lista
   - ✅ Ve nombre del reportador (Usuario A)
   - ✅ Ve razón y detalles

---

## ✅ Checklist Final

Antes de marcar como completo, verificar:

### Backend
- [ ] Migración SQL aplicada en Supabase
- [ ] Tabla `property_reports` creada correctamente
- [ ] Índices creados
- [ ] RLS políticas aplicadas
- [ ] Trigger `updated_at` funciona
- [ ] API endpoint `/api/properties/[id]/report` responde
- [ ] Validaciones Zod funcionan
- [ ] Constraints únicos se respetan

### Frontend
- [ ] Botón de reporte visible en propiedad
- [ ] Modal se abre y cierra correctamente
- [ ] Categorías son seleccionables
- [ ] Validación de caracteres mínimos funciona
- [ ] Contador de caracteres actualiza
- [ ] Envío exitoso muestra pantalla de éxito
- [ ] Errores se manejan correctamente
- [ ] Modal se resetea al cerrar

### Integration
- [ ] Request/Response completo funciona end-to-end
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor
- [ ] Build de Next.js sin errores

### Performance
- [ ] Modal abre sin lag
- [ ] Envío de reporte < 2 segundos
- [ ] No hay memory leaks al abrir/cerrar modal múltiples veces

---

## 🐛 Bug Tracking Template

Si encuentras bugs, documenta aquí:

**Bug #1:**
- **Descripción:**
- **Pasos para reproducir:**
  1.
  2.
  3.
- **Comportamiento esperado:**
- **Comportamiento actual:**
- **Severidad:** Alta / Media / Baja
- **Estado:** Pendiente / En progreso / Resuelto

---

## 📝 Test Results Log

Documenta los resultados de cada test:

| Test ID | Nombre | Status | Fecha | Notas |
|---------|--------|--------|-------|-------|
| 1.1 | Crear Reporte Happy Path | ⏳ Pendiente | | |
| 1.2 | Validación Razón Inválida | ⏳ Pendiente | | |
| ... | ... | ... | | |

**Leyenda:**
- ⏳ Pendiente
- ✅ Pasó
- ❌ Falló
- ⚠️ Parcial

---

## 🎯 Siguiente Fase (Opcional)

Una vez que todo funcione, considerar:

1. **Panel Admin para Revisar Reportes**
   - Vista de todos los reportes pendientes
   - Botones: Aprobar / Rechazar / Eliminar propiedad
   - Filtros por status, razón, fecha

2. **Notificaciones**
   - Email a admin cuando hay nuevo reporte
   - Email a dueño cuando su propiedad es reportada (opcional)
   - Notificación in-app

3. **Analytics**
   - Dashboard de reportes por categoría
   - Top propiedades reportadas
   - Usuarios con más reportes

4. **Auto-moderación**
   - Si propiedad tiene 3+ reportes → Ocultar automáticamente
   - Si propiedad tiene 5+ reportes → Eliminar automáticamente
