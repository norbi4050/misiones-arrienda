# PLAN DETALLADO DE IMPLEMENTACIÓN MENSAJERÍA - ESPECIFICACIONES TÉCNICAS

## 🎯 OBJETIVO
Implementar UI completa de mensajería (Inbox/Thread/Composer), estado global y Realtime, sin romper funcionalidades existentes de comunidad ni perfil.

---

## A) ESTADO GLOBAL Y REALTIME

### **1. MessagesContext**
- **Ruta**: `Backend/src/contexts/MessagesContext.tsx`
- **Propósito**: Estado global centralizado de mensajería
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - No afecta código existente

#### **Estado del Context**:
```typescript
interface MessagesState {
  conversations: Conversation[]
  activeConversationId: string | null
  unreadCount: number
  isLoading: boolean
  error: string | null
}
```

#### **Acciones del Context**:
```typescript
interface MessagesActions {
  sendMessage: (conversationId: string, content: string) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  createOrOpenConversation: (recipientId: string, propertyId?: string) => Promise<string>
  refreshInbox: () => Promise<void>
  setActiveConversation: (id: string | null) => void
}
```

#### **Rollback**: Eliminar archivo
#### **Pruebas**:
- ✅ Context se inicializa sin errores
- ✅ Acciones no causan memory leaks
- ✅ Estado se actualiza correctamente

### **2. Hook de Realtime**
- **Ruta**: `Backend/src/hooks/useRealtimeMessages.ts`
- **Propósito**: Suscripción única al canal de mensajes
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ MEDIO - Depende de configuración Supabase

#### **Suscripción Única**:
```typescript
const useRealtimeMessages = (userId: string) => {
  // Canal único: `messages:${userId}`
  // Filtro: mensajes donde sender_id !== userId
  // Eventos: INSERT, UPDATE (read_at)
}
```

#### **Eventos Manejados**:
- **INSERT**: Nuevo mensaje recibido → actualizar conversación + unread count
- **UPDATE**: Mensaje marcado como leído → actualizar estado
- **Reordenamiento**: Conversación con nuevo mensaje → mover al top

#### **Prevención de Duplicados**:
- Una sola suscripción por usuario
- Cleanup automático al desmontar
- Debounce para actualizaciones múltiples

#### **Rollback**: Eliminar archivo
#### **Pruebas**:
- ✅ Abrir/cerrar threads no duplica mensajes
- ✅ Mensajes llegan en tiempo real
- ✅ No hay memory leaks en suscripciones

---

## B) RUTAS UI DE MENSAJERÍA

### **3. Página Inbox (/messages)**
- **Ruta**: `Backend/src/app/messages/page.tsx`
- **Propósito**: Lista de conversaciones
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta independiente

#### **Funcionalidades**:
- Lista de conversaciones ordenadas por `last_message_at`
- Avatar del otro usuario
- Nombre del otro usuario
- Último mensaje (truncado a 50 chars)
- Timestamp relativo (ej: "2h", "ayer")
- Contador de no leídos (badge rojo)
- Contexto de propiedad si aplica (ej: "Sobre: Casa en Posadas")

#### **Componentes Reutilizados**:
- `ConversationCard` existente (adaptado)
- `Avatar` existente
- `Badge` existente

#### **Rollback**: Eliminar archivo y carpeta
#### **Pruebas**:
- ✅ Lista se carga correctamente
- ✅ Navegación a threads funciona
- ✅ Contadores de no leídos son precisos

### **4. Página Thread (/messages/[conversationId])**
- **Ruta**: `Backend/src/app/messages/[conversationId]/page.tsx`
- **Propósito**: Vista de conversación específica
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta dinámica

#### **Funcionalidades**:
- Historial de mensajes A↔B
- Paginación (cargar más mensajes hacia arriba)
- Marca automática como leído al abrir
- Scroll automático al último mensaje
- Input para enviar nuevos mensajes

#### **Componentes Reutilizados**:
- `ChatMessage` existente
- `ChatInput` existente

#### **Rollback**: Eliminar archivo
#### **Pruebas**:
- ✅ Mensajes se cargan en orden cronológico
- ✅ Paginación funciona correctamente
- ✅ Marca como leído al abrir
- ✅ Envío de mensajes funciona

### **5. Página Composer (/messages/new)**
- **Ruta**: `Backend/src/app/messages/new/page.tsx`
- **Propósito**: Crear nuevo mensaje
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta independiente

#### **Parámetros URL**:
- `to`: ID del destinatario (requerido)
- `propertyId`: ID de propiedad (opcional)

#### **Funcionalidades**:
- Buscar conversación existente entre usuarios
- Si existe: navegar a `/messages/[conversationId]`
- Si no existe: crear nueva conversación y navegar
- Evitar duplicados de conversación

#### **Rollback**: Eliminar archivo
#### **Pruebas**:
- ✅ Detecta conversaciones existentes
- ✅ Crea nuevas conversaciones correctamente
- ✅ Navegación funciona en ambos casos

---

## C) INTEGRACIONES (ENTRY POINTS)

### **6. Desde Página de Propiedad**
- **Ruta**: `Backend/src/app/property/[id]/property-detail-client.tsx`
- **Propósito**: Conectar botón "Contactar"
- **Cambio**: Agregar handler de navegación (5 líneas)
- **Riesgo**: ⚠️ BAJO - Funcionalidad adicional

#### **Modificación**:
```typescript
// AGREGAR HANDLER
const handleSendMessage = () => {
  if (!user) {
    router.push('/login')
    return
  }
  router.push(`/messages/new?to=${property.agent?.id}&propertyId=${property.id}`)
}

// CONECTAR BOTÓN EXISTENTE
onClick={handleSendMessage}
```

#### **Rollback**: Remover handler agregado
#### **Pruebas**:
- ✅ Botón redirige correctamente
- ✅ Usuarios no autenticados van a login
- ✅ PropertyId se pasa correctamente

### **7. Desde Perfil/Comunidad**
- **Ruta**: `Backend/src/app/comunidad/[id]/profile-detail-client.tsx`
- **Propósito**: Conectar botón "Mensaje"
- **Cambio**: Modificar handler existente (2 líneas)
- **Riesgo**: ⚠️ BAJO - Ya existe funcionalidad similar

#### **Modificación**:
```typescript
// MODIFICAR HANDLER EXISTENTE
const handleMessage = () => {
  router.push(`/messages/new?to=${profile.user.id}`)
}
```

#### **Rollback**: Restaurar handler original
#### **Pruebas**:
- ✅ Botón funciona desde perfiles
- ✅ No rompe funcionalidad de comunidad existente

---

## D) INBOX: ÚLTIMO Y NO-LEÍDOS

### **8. Cálculo Único de Contadores**
- **Ruta**: `Backend/src/hooks/useMessages.ts`
- **Propósito**: Lógica centralizada para contadores
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Lógica independiente

#### **Definiciones**:
```typescript
// Último mensaje: MAX(created_at) por conversación
// No leídos: COUNT donde read_at IS NULL AND sender_id != current_user
```

#### **Optimización**:
- Una sola query para obtener conversaciones con contadores
- Cache local para evitar re-cálculos
- Actualización incremental con Realtime

#### **Rollback**: Eliminar archivo
#### **Pruebas**:
- ✅ 2+ conversaciones muestran contadores correctos
- ✅ Contadores se actualizan en tiempo real
- ✅ Performance es aceptable

---

## E) ALINEACIÓN DE TABLAS Y APIS

### **9. Estrategia de Tablas**
- **Decisión**: Usar `community_messages` y `community_conversations`
- **Justificación**: APIs ya implementadas y probadas
- **Cambio**: Ninguno en BD
- **Riesgo**: ⚠️ NINGUNO - Sin modificaciones

#### **Tablas Utilizadas**:
- `community_conversations`: Conversaciones entre usuarios
- `community_messages`: Mensajes individuales
- `community_matches`: Para contexto de comunidad (opcional)

#### **APIs Consumidas**:
- `GET /api/comunidad/messages` - Lista conversaciones
- `POST /api/comunidad/messages` - Enviar mensaje
- `GET /api/comunidad/messages/[id]` - Mensajes de conversación
- `PUT /api/comunidad/messages` - Marcar como leído

#### **Naming Consistency**:
- Frontend: `conversations`, `messages`
- Backend: `community_conversations`, `community_messages`
- Mapeo en hooks para consistencia

#### **Rollback**: No aplica
#### **Pruebas**:
- ✅ APIs responden correctamente
- ✅ Datos se mapean sin errores
- ✅ No hay conflictos con `user_messages`

---

## F) MANEJO DE ERRORES Y VACÍOS

### **10. Estados Vacíos**
- **Rutas**: Todas las páginas de mensajería
- **Propósito**: UX clara para estados sin datos
- **Cambio**: Componentes de estado vacío
- **Riesgo**: ⚠️ BAJO - Mejora de UX

#### **Inbox Vacío**:
```typescript
// Mostrar: "No tienes conversaciones aún"
// CTA: "Busca propiedades y contacta propietarios"
// Enlace: Ir a /properties
```

#### **Thread Vacío**:
```typescript
// Mostrar: "Inicia la conversación"
// Placeholder: Input habilitado para primer mensaje
```

#### **Rollback**: Remover componentes de estado vacío
#### **Pruebas**:
- ✅ Estados vacíos se muestran correctamente
- ✅ CTAs funcionan
- ✅ Transiciones son fluidas

### **11. Manejo de Errores**
- **Rutas**: Hooks y componentes
- **Propósito**: Recuperación de errores
- **Cambio**: Error boundaries y retry logic
- **Riesgo**: ⚠️ BAJO - Mejora de robustez

#### **Errores de Envío**:
```typescript
// Mostrar: "Error al enviar mensaje"
// Acción: Botón "Reintentar"
// Estado: Mensaje queda en "pendiente"
```

#### **Errores de Conexión**:
```typescript
// Mostrar: "Sin conexión"
// Acción: Auto-retry cada 30s
// Estado: Indicador de reconexión
```

#### **Rollback**: Remover error handling
#### **Pruebas**:
- ✅ Errores se manejan gracefully
- ✅ Retry funciona correctamente
- ✅ Estados pendientes se resuelven

### **12. Sincronización con Realtime**
- **Ruta**: `Backend/src/hooks/useRealtimeMessages.ts`
- **Propósito**: Cerrar estados pendientes
- **Cambio**: Lógica de sincronización
- **Riesgo**: ⚠️ MEDIO - Lógica compleja

#### **Estados Pendientes**:
```typescript
// Mensaje enviado → estado "sending"
// Confirmación API → estado "sent"
// Realtime recibe → estado "delivered"
```

#### **Resolución de Conflictos**:
- Timestamp como fuente de verdad
- Merge de estados locales y remotos
- Cleanup de mensajes duplicados

#### **Rollback**: Simplificar a estados básicos
#### **Pruebas**:
- ✅ Estados pendientes se resuelven
- ✅ No hay mensajes duplicados
- ✅ Sincronización es confiable

---

## 🔄 PLAN DE ROLLBACK DETALLADO

### **Rollback Completo**:
1. **Eliminar archivos nuevos**:
   - `Backend/src/contexts/MessagesContext.tsx`
   - `Backend/src/hooks/useMessages.ts`
   - `Backend/src/hooks/useRealtimeMessages.ts`
   - `Backend/src/app/messages/` (carpeta completa)

2. **Revertir modificaciones**:
   - `property-detail-client.tsx`: Remover handler
   - `profile-detail-client.tsx`: Restaurar handler original
   - `layout.tsx`: Remover MessagesProvider

3. **Verificar funcionalidad**:
   - Sistema de comunidad funciona
   - Perfiles cargan correctamente
   - APIs responden normalmente

### **Rollback por Componente**:
- Cada archivo puede eliminarse independientemente
- Sin dependencias críticas entre componentes
- Funcionalidad existente no se ve afectada

---

## 🧪 PLAN DE PRUEBAS ESPECÍFICO

### **Pruebas Unitarias**:
- ✅ MessagesContext inicializa correctamente
- ✅ useMessages hook maneja estados
- ✅ useRealtimeMessages se suscribe/desuscribe
- ✅ Componentes renderizan sin errores

### **Pruebas de Integración**:
- ✅ Navegación entre páginas funciona
- ✅ APIs se consumen correctamente
- ✅ Realtime actualiza estado
- ✅ Entry points redirigen bien

### **Pruebas de Regresión**:
- ✅ Sistema de comunidad sigue funcionando
- ✅ Perfiles de usuario no se afectan
- ✅ Autenticación funciona normalmente
- ✅ Performance no se degrada

### **Pruebas de Usuario**:
- ✅ Flujo completo: propiedad → mensaje → respuesta
- ✅ Contadores de no leídos son precisos
- ✅ Estados vacíos son claros
- ✅ Errores se manejan bien

---

## 📊 CRONOGRAMA DETALLADO

### **Día 1: Estado Global**
- **AM**: MessagesContext + useMessages
- **PM**: useRealtimeMessages + pruebas
- **Entregable**: Estado global funcional

### **Día 2: Páginas UI**
- **AM**: Inbox page + Thread page
- **PM**: Composer page + navegación
- **Entregable**: UI completa navegable

### **Día 3: Integraciones**
- **AM**: Entry points (propiedad, perfil)
- **PM**: Estados vacíos + error handling
- **Entregable**: Flujo completo funcional

### **Día 4: Pulimiento**
- **AM**: Optimizaciones + performance
- **PM**: Pruebas exhaustivas
- **Entregable**: Sistema robusto

### **Día 5: Validación**
- **AM**: Pruebas de regresión
- **PM**: Documentación + despliegue
- **Entregable**: Sistema listo para producción

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Pre-implementación**:
- [ ] APIs `/api/comunidad/messages/*` funcionan
- [ ] Tablas `community_*` existen en Supabase
- [ ] Supabase Realtime está habilitado
- [ ] UserContext funciona correctamente

### **Durante implementación**:
- [ ] Cada archivo se prueba individualmente
- [ ] No hay errores de TypeScript
- [ ] No hay memory leaks
- [ ] Performance es aceptable

### **Post-implementación**:
- [ ] Flujo completo funciona end-to-end
- [ ] Contadores son precisos
- [ ] Realtime funciona correctamente
- [ ] No hay regresiones en funcionalidad existente

---

## 🎯 RESULTADO ESPERADO

Al completar este plan específico:
- ✅ Sistema de mensajería 100% funcional
- ✅ Integración perfecta con infraestructura existente
- ✅ Cero impacto en comunidad y perfiles
- ✅ Realtime funcionando correctamente
- ✅ Manejo robusto de errores y estados vacíos
- ✅ Performance optimizada
- ✅ Rollback garantizado si es necesario

**Complejidad**: Media (por Realtime y sincronización)
**Riesgo**: Bajo (90% archivos nuevos)
**Tiempo**: 5 días de desarrollo
**Dependencias**: APIs existentes + Supabase Realtime
