# PLAN DE IMPLEMENTACIÓN MENSAJERÍA - CAMBIOS MÍNIMOS

## 🎯 OBJETIVO
Montar la UI completa de mensajería (Inbox/Thread/Composer), estado global y Realtime, aprovechando la infraestructura existente sin romper funcionalidades actuales.

## 📋 ESTRATEGIA DE CAMBIOS LOCALIZADOS

### **Principios de Implementación**:
- ✅ **Reutilizar**: Aprovechar componentes y APIs existentes
- ✅ **Aislar**: Nuevos archivos sin modificar existentes
- ✅ **Reversible**: Cambios que se pueden deshacer fácilmente
- ✅ **Incremental**: Implementación por fases

---

## 📁 ARCHIVOS A CREAR (NUEVOS)

### **FASE 1: Estado Global y Hooks**

#### 1. **MessagesContext** 
- **Ruta**: `Backend/src/contexts/MessagesContext.tsx`
- **Propósito**: Estado global de mensajería
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - No afecta código existente
- **Rollback**: Eliminar archivo
- **Dependencias**: UserContext existente

#### 2. **Hook de Mensajes**
- **Ruta**: `Backend/src/hooks/useMessages.ts`
- **Propósito**: Gestión de mensajes y conversaciones
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - No afecta código existente
- **Rollback**: Eliminar archivo
- **Dependencias**: APIs existentes `/api/comunidad/messages/*`

#### 3. **Hook de Realtime**
- **Ruta**: `Backend/src/hooks/useRealtimeMessages.ts`
- **Propósito**: Suscripciones en tiempo real
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ MEDIO - Depende de configuración Supabase
- **Rollback**: Eliminar archivo
- **Dependencias**: Supabase client existente

### **FASE 2: Componentes de Mensajería**

#### 4. **Inbox Component**
- **Ruta**: `Backend/src/components/messages/Inbox.tsx`
- **Propósito**: Lista de conversaciones
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Reutiliza ConversationCard existente
- **Rollback**: Eliminar archivo
- **Dependencias**: `ConversationCard` existente

#### 5. **Thread Component**
- **Ruta**: `Backend/src/components/messages/Thread.tsx`
- **Propósito**: Vista de conversación
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Reutiliza ChatMessage y ChatInput existentes
- **Rollback**: Eliminar archivo
- **Dependencias**: `ChatMessage`, `ChatInput` existentes

#### 6. **Composer Component**
- **Ruta**: `Backend/src/components/messages/Composer.tsx`
- **Propósito**: Nuevo mensaje
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Componente independiente
- **Rollback**: Eliminar archivo
- **Dependencias**: Ninguna crítica

### **FASE 3: Páginas de Mensajería**

#### 7. **Página Inbox**
- **Ruta**: `Backend/src/app/messages/page.tsx`
- **Propósito**: Página principal de mensajes
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta, no afecta existentes
- **Rollback**: Eliminar archivo y carpeta
- **Dependencias**: Inbox component

#### 8. **Página Thread**
- **Ruta**: `Backend/src/app/messages/[conversationId]/page.tsx`
- **Propósito**: Vista de conversación específica
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta dinámica
- **Rollback**: Eliminar archivo
- **Dependencias**: Thread component

#### 9. **Página Composer**
- **Ruta**: `Backend/src/app/messages/new/page.tsx`
- **Propósito**: Crear nuevo mensaje
- **Cambio**: Archivo completamente nuevo
- **Riesgo**: ⚠️ BAJO - Nueva ruta
- **Rollback**: Eliminar archivo
- **Dependencias**: Composer component

---

## 🔧 ARCHIVOS A MODIFICAR (EXISTENTES)

### **MODIFICACIONES MÍNIMAS**

#### 10. **Layout Principal**
- **Ruta**: `Backend/src/app/layout.tsx`
- **Propósito**: Agregar MessagesProvider
- **Cambio**: Agregar wrapper de contexto
- **Riesgo**: ⚠️ MEDIO - Archivo crítico
- **Rollback**: Remover líneas agregadas
- **Modificación**:
```tsx
// AGREGAR IMPORT
import { MessagesProvider } from '@/contexts/MessagesContext'

// ENVOLVER CHILDREN
<MessagesProvider>
  {children}
</MessagesProvider>
```

#### 11. **Navbar**
- **Ruta**: `Backend/src/components/navbar.tsx`
- **Propósito**: Agregar enlace a mensajes
- **Cambio**: Agregar item de navegación
- **Riesgo**: ⚠️ BAJO - Cambio cosmético
- **Rollback**: Remover líneas agregadas
- **Modificación**:
```tsx
// AGREGAR ENLACE
<Link href="/messages" className="nav-link">
  <MessageCircle className="w-5 h-5" />
  Mensajes
</Link>
```

#### 12. **Property Detail**
- **Ruta**: `Backend/src/app/property/[id]/property-detail-client.tsx`
- **Propósito**: Conectar botón "Enviar mensaje"
- **Cambio**: Agregar handler de navegación
- **Riesgo**: ⚠️ BAJO - Funcionalidad adicional
- **Rollback**: Remover handler agregado
- **Modificación**:
```tsx
// AGREGAR HANDLER
const handleSendMessage = () => {
  router.push(`/messages/new?to=${property.agent?.id}&propertyId=${property.id}`)
}

// CONECTAR BOTÓN EXISTENTE
onClick={handleSendMessage}
```

#### 13. **Dashboard**
- **Ruta**: `Backend/src/app/dashboard/page.tsx`
- **Propósito**: Agregar acceso rápido a mensajes
- **Cambio**: Agregar card de mensajes
- **Riesgo**: ⚠️ BAJO - Funcionalidad adicional
- **Rollback**: Remover card agregada
- **Modificación**:
```tsx
// AGREGAR CARD
<Card>
  <CardHeader>
    <CardTitle>Mensajes</CardTitle>
  </CardHeader>
  <CardContent>
    <Link href="/messages">Ver conversaciones</Link>
  </CardContent>
</Card>
```

---

## 🔄 PLAN DE ROLLBACK

### **Rollback Completo**:
1. **Eliminar archivos nuevos**: Carpeta `Backend/src/components/messages/`
2. **Eliminar páginas**: Carpeta `Backend/src/app/messages/`
3. **Eliminar contexto**: `Backend/src/contexts/MessagesContext.tsx`
4. **Eliminar hooks**: `Backend/src/hooks/useMessages.ts`, `useRealtimeMessages.ts`
5. **Revertir modificaciones**: Git checkout de archivos modificados

### **Rollback Parcial por Fase**:
- **Fase 1**: Eliminar contexto y hooks
- **Fase 2**: Eliminar componentes
- **Fase 3**: Eliminar páginas

---

## 🧪 PLAN DE PRUEBAS

### **Pruebas por Fase**:

#### **Fase 1 - Estado Global**:
- ✅ MessagesContext se inicializa sin errores
- ✅ useMessages hook funciona correctamente
- ✅ Realtime se conecta a Supabase

#### **Fase 2 - Componentes**:
- ✅ Inbox renderiza lista de conversaciones
- ✅ Thread muestra mensajes correctamente
- ✅ Composer envía mensajes

#### **Fase 3 - Páginas**:
- ✅ Navegación entre páginas funciona
- ✅ URLs dinámicas se resuelven
- ✅ Integración completa funcional

### **Pruebas de Regresión**:
- ✅ Sistema de comunidad sigue funcionando
- ✅ Perfiles de usuario no se afectan
- ✅ APIs existentes responden correctamente
- ✅ Autenticación funciona normalmente

---

## 📊 ANÁLISIS DE RIESGOS

### **Riesgos BAJOS** (90% de cambios):
- Archivos nuevos completamente independientes
- Reutilización de componentes existentes
- APIs ya probadas y funcionales

### **Riesgos MEDIOS** (10% de cambios):
- Modificación de layout.tsx (archivo crítico)
- Configuración de Supabase Realtime
- Integración con sistema de autenticación

### **Mitigación de Riesgos**:
- Implementación incremental por fases
- Testing exhaustivo antes de cada fase
- Rollback plan detallado
- Backup de archivos críticos

---

## 🚀 CRONOGRAMA DE IMPLEMENTACIÓN

### **Día 1: Fundación**
- ✅ MessagesContext
- ✅ useMessages hook
- ✅ Pruebas de estado global

### **Día 2: Componentes**
- ✅ Inbox, Thread, Composer
- ✅ Integración con componentes existentes
- ✅ Pruebas de renderizado

### **Día 3: Páginas y Navegación**
- ✅ Páginas de mensajería
- ✅ Modificaciones mínimas a archivos existentes
- ✅ Pruebas de navegación

### **Día 4: Realtime y Pulimiento**
- ✅ Configuración Supabase Realtime
- ✅ Optimizaciones de rendimiento
- ✅ Pruebas exhaustivas

### **Día 5: Testing y Despliegue**
- ✅ Pruebas de regresión completas
- ✅ Documentación final
- ✅ Preparación para producción

---

## 📝 CHECKLIST DE VALIDACIÓN

### **Pre-implementación**:
- [ ] Backup de archivos críticos
- [ ] Verificación de APIs existentes
- [ ] Confirmación de estructura de BD

### **Durante implementación**:
- [ ] Testing incremental por fase
- [ ] Verificación de no-regresión
- [ ] Documentación de cambios

### **Post-implementación**:
- [ ] Pruebas exhaustivas de funcionalidad
- [ ] Verificación de rendimiento
- [ ] Validación de experiencia de usuario

---

## 🎯 RESULTADO ESPERADO

Al completar este plan, tendrás:
- ✅ Sistema de mensajería completamente funcional
- ✅ Integración perfecta con infraestructura existente
- ✅ Cero impacto en funcionalidades actuales
- ✅ Capacidad de rollback completo si es necesario
- ✅ Base sólida para futuras mejoras

**Esfuerzo estimado**: 4-5 días de desarrollo
**Riesgo general**: BAJO (cambios mayormente aditivos)
**Compatibilidad**: 100% con sistema existente
