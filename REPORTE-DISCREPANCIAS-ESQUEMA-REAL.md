# REPORTE DE DISCREPANCIAS - ESQUEMA REAL vs IMPLEMENTACIÓN

## 🚨 DISCREPANCIAS IDENTIFICADAS

### **Esquema Real de Base de Datos**
- ✅ **Tablas**: `public.conversations` y `public.messages` (NO `community_*`)
- ✅ **Campo de lectura**: `is_read` (boolean) (NO `read_at` timestamp)
- ✅ **RLS**: Activado en ambas tablas
- ✅ **Realtime**: Activado en ambas tablas

### **Implementación Actual**
- ❌ **APIs**: Apuntan a `/api/comunidad/messages/*` 
- ❌ **Hooks**: Esperan estructura `community_*`
- ❌ **Realtime**: Suscrito a tablas `community_*`
- ❌ **Mapeo**: Usa `read_at` en lugar de `is_read`

## 🔧 CORRECCIONES NECESARIAS

### **1. APIs a Utilizar**
Necesito confirmar qué APIs existen para el esquema real:
- ¿Existe `/api/messages/*` para `public.conversations` y `public.messages`?
- ¿O debo crear nuevas APIs que apunten al esquema correcto?

### **2. Estructura de Datos Real**
```typescript
// Conversations (public.conversations)
{
  id: string
  user1_id: string
  user2_id: string
  last_message_content: string
  last_message_at: string
  created_at: string
  updated_at: string
}

// Messages (public.messages)
{
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image'
  is_read: boolean  // ← BOOLEAN, no timestamp
  created_at: string
}
```

### **3. Contadores de No Leídos**
```sql
-- Lógica correcta para contadores
SELECT COUNT(*) FROM messages 
WHERE conversation_id = ? 
AND sender_id != current_user_id 
AND is_read = false
```

## 📋 PLAN DE CORRECCIÓN

### **Opción A: Usar APIs Existentes del Esquema Real**
Si existen APIs para `public.conversations/messages`:
1. Actualizar todas las URLs de fetch
2. Mapear `is_read` boolean a lógica de UI
3. Actualizar suscripciones Realtime

### **Opción B: Crear APIs Nuevas**
Si no existen APIs para el esquema real:
1. Crear `/api/messages/*` que apunten a `public.*`
2. Implementar lógica `is_read` boolean
3. Configurar RLS y permisos

## ❓ INFORMACIÓN REQUERIDA

Para proceder con la corrección necesito confirmar:

1. **¿Existen APIs para `public.conversations` y `public.messages`?**
   - Si SÍ: ¿Cuáles son las rutas exactas?
   - Si NO: ¿Debo crearlas?

2. **¿Cómo se manejan los contadores de no leídos?**
   - ¿Hay campo separado o se calcula dinámicamente?

3. **¿Qué estructura tienen las respuestas de las APIs reales?**
   - Ejemplo de GET conversations
   - Ejemplo de GET messages

## 🎯 PRÓXIMO PASO

Una vez confirmada la información, procederé a:
1. Actualizar todos los archivos con el esquema correcto
2. Corregir mapeo de `read_at` → `is_read`
3. Actualizar suscripciones Realtime
4. Validar compatibilidad total

**Estado**: ⚠️ **PENDIENTE DE INFORMACIÓN** para alineación con esquema real
