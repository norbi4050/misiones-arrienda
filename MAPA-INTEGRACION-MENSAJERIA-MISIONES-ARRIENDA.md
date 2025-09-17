# MAPA COMPLETO DE INTEGRACIÓN DE MENSAJERÍA - MISIONES ARRIENDA

## 📋 INFORMACIÓN RECOPILADA

### Arquitectura Actual Identificada:
- **Framework**: Next.js 14 con App Router
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estado Global**: Context API (UserContext)
- **UI**: Tailwind CSS + shadcn/ui components
- **Tiempo Real**: Supabase Realtime (disponible pero no implementado)

### Sistema de Mensajería Existente:
✅ **YA IMPLEMENTADO**:
- Tablas de base de datos: `community_conversations`, `community_messages`, `community_matches`
- APIs completas: `/api/comunidad/messages/*`
- Componentes básicos: `ChatMessage`, `ChatInput`, `ConversationCard`
- Sistema de matches y likes en comunidad

## 🗺️ RUTAS UI PREVISTAS

### 1. **Rutas Principales de Mensajería**
```
/messages                    - Inbox principal (lista de conversaciones)
/messages/[conversationId]   - Vista de conversación específica
/messages/new               - Composer para nuevo mensaje
/comunidad                  - Sistema de matches existente
/comunidad/[id]            - Perfil con botón "Enviar mensaje"
```

### 2. **Rutas de Integración Existentes**
```
/property/[id]              - Página de propiedad (punto de contacto)
/profile/inquilino          - Perfil de usuario (estadísticas de mensajes)
/dashboard                  - Dashboard con acceso rápido a mensajes
```

## 🧩 COMPONENTES CANDIDATOS

### **A. Componentes Principales (A CREAR)**

#### 1. **Inbox Component**
```typescript
// Backend/src/components/messages/Inbox.tsx
interface InboxProps {
  conversations: Conversation[]
  currentUserId: string
  onSelectConversation: (id: string) => void
  unreadCount: number
}
```

#### 2. **Thread Component**
```typescript
// Backend/src/components/messages/Thread.tsx
interface ThreadProps {
  conversationId: string
  messages: Message[]
  otherUser: User
  onSendMessage: (content: string) => void
  isLoading: boolean
}
```

#### 3. **Composer Component**
```typescript
// Backend/src/components/messages/Composer.tsx
interface ComposerProps {
  recipientId?: string
  propertyId?: string
  initialMessage?: string
  onSend: (message: MessageData) => void
  onCancel: () => void
}
```

### **B. Componentes Existentes (REUTILIZAR)**

#### 1. **ChatMessage** ✅
- **Ubicación**: `Backend/src/components/comunidad/ChatMessage.tsx`
- **Props**: `message`, `isFromCurrentUser`, `senderName`, `showAvatar`
- **Estado**: Completamente funcional

#### 2. **ChatInput** ✅
- **Ubicación**: `Backend/src/components/comunidad/ChatInput.tsx`
- **Props**: `onSendMessage`, `disabled`
- **Estado**: Funcional, necesita adaptación

#### 3. **ConversationCard** ✅
- **Ubicación**: `Backend/src/components/comunidad/ConversationCard.tsx`
- **Props**: `conversation`, `currentUserId`, `onClick`
- **Estado**: Funcional para inbox

## 📍 LUGARES QUE DISPARAN "ENVIAR MENSAJE"

### **1. Página de Propiedad** ✅
- **Archivo**: `Backend/src/app/property/[id]/property-detail-client.tsx`
- **Ubicación**: Sidebar del agente inmobiliario
- **Implementación Sugerida**:
```typescript
const handleSendMessage = () => {
  router.push(`/messages/new?to=${property.agent?.id}&propertyId=${property.id}`)
}
```

### **2. Perfil de Usuario en Comunidad** ✅
- **Archivo**: `Backend/src/app/comunidad/[id]/profile-detail-client.tsx`
- **Ubicación**: Botón "Mensaje" en perfil
- **Estado**: Ya implementado con lógica de conversación

### **3. Tarjetas de Propiedades** (A IMPLEMENTAR)
- **Archivos**: `Backend/src/components/property-card.tsx`
- **Ubicación**: Botón de contacto rápido
- **Props Necesarios**: `propertyId`, `agentId`, `propertyTitle`

### **4. Dashboard de Usuario** (A IMPLEMENTAR)
- **Archivo**: `Backend/src/app/dashboard/page.tsx`
- **Ubicación**: Quick actions grid
- **Estado**: Estructura existente, necesita integración

### **5. Resultados de Búsqueda** (A IMPLEMENTAR)
- **Archivos**: `Backend/src/components/property-grid.tsx`
- **Ubicación**: Hover actions en cada propiedad

## 🔐 ESTADOS GLOBALES (AUTH/USUARIO)

### **UserContext Existente** ✅
- **Archivo**: `Backend/src/contexts/UserContext.tsx`
- **Funcionalidades**:
  - ✅ Autenticación completa
  - ✅ Gestión de perfil
  - ✅ Cache local
  - ✅ Hooks: `useUser()`, `useAuth()`

### **Estados Adicionales Necesarios**:

#### 1. **MessagesContext** (A CREAR)
```typescript
// Backend/src/contexts/MessagesContext.tsx
interface MessagesContextType {
  conversations: Conversation[]
  unreadCount: number
  activeConversation: string | null
  sendMessage: (conversationId: string, content: string) => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  createConversation: (recipientId: string, propertyId?: string) => Promise<string>
}
```

#### 2. **Realtime Subscriptions** (A IMPLEMENTAR)
```typescript
// Backend/src/hooks/useRealtimeMessages.ts
const useRealtimeMessages = (userId: string) => {
  // Suscripción a nuevos mensajes
  // Actualización de estado en tiempo real
  // Notificaciones push
}
```

## 🔌 DEPENDENCIAS TÉCNICAS

### **1. Supabase Client** ✅
- **Browser**: `Backend/src/lib/supabase/browser.ts`
- **Server**: `Backend/src/lib/supabase/server.ts`
- **Estado**: Configurado y funcional

### **2. APIs Existentes** ✅
- **Messages**: `Backend/src/app/api/comunidad/messages/route.ts`
- **Conversations**: `Backend/src/app/api/comunidad/messages/[conversationId]/route.ts`
- **Matches**: `Backend/src/app/api/comunidad/matches/route.ts`
- **Estado**: Completamente implementadas

### **3. Supabase Realtime** (A CONFIGURAR)
```typescript
// Configuración necesaria en cliente
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_messages'
  }, handleNewMessage)
  .subscribe()
```

### **4. Base de Datos** ✅
**Tablas Existentes**:
- `community_conversations` - Conversaciones
- `community_messages` - Mensajes individuales
- `community_matches` - Sistema de matches
- `user_messages` - Mensajes de consultas (inquiries)

## 📁 ARCHIVOS EXACTOS Y PROPS ESPERADOS

### **Nuevos Archivos a Crear**:

#### 1. **Páginas**
```
Backend/src/app/messages/page.tsx                    - Inbox principal
Backend/src/app/messages/[conversationId]/page.tsx  - Vista de conversación
Backend/src/app/messages/new/page.tsx               - Composer
```

#### 2. **Componentes**
```
Backend/src/components/messages/
├── Inbox.tsx                 - Lista de conversaciones
├── Thread.tsx               - Vista de mensajes
├── Composer.tsx             - Nuevo mensaje
├── MessageNotification.tsx  - Notificaciones
├── QuickMessage.tsx         - Mensaje rápido desde propiedades
└── MessageStats.tsx         - Estadísticas de mensajes
```

#### 3. **Hooks**
```
Backend/src/hooks/
├── useMessages.ts           - Gestión de mensajes
├── useConversations.ts      - Gestión de conversaciones
├── useRealtimeMessages.ts   - Tiempo real
└── useMessageNotifications.ts - Notificaciones
```

#### 4. **Context**
```
Backend/src/contexts/MessagesContext.tsx - Estado global de mensajes
```

### **Props Esperados por Componente**:

#### **Inbox Component**
```typescript
interface InboxProps {
  conversations: Conversation[]
  currentUserId: string
  onSelectConversation: (id: string) => void
  unreadCount: number
  isLoading: boolean
  onMarkAllRead: () => void
}
```

#### **Thread Component**
```typescript
interface ThreadProps {
  conversationId: string
  messages: Message[]
  otherUser: {
    id: string
    name: string
    avatar?: string
  }
  onSendMessage: (content: string) => Promise<void>
  onMarkAsRead: () => void
  isLoading: boolean
  canSendMessages: boolean
}
```

#### **Composer Component**
```typescript
interface ComposerProps {
  recipientId?: string
  propertyId?: string
  initialMessage?: string
  placeholder?: string
  onSend: (data: {
    content: string
    recipientId: string
    propertyId?: string
  }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}
```

## 🚨 HUECOS IDENTIFICADOS

### **1. Integración Faltante**
- ❌ **Realtime**: Supabase Realtime no configurado
- ❌ **Notificaciones**: Sistema de notificaciones push
- ❌ **Páginas UI**: Rutas de mensajería no creadas
- ❌ **Context**: Estado global de mensajes faltante

### **2. Funcionalidades Pendientes**
- ❌ **Búsqueda**: Buscar en conversaciones y mensajes
- ❌ **Archivado**: Archivar conversaciones
- ❌ **Multimedia**: Envío de imágenes/archivos
- ❌ **Typing Indicators**: Indicadores de escritura
- ❌ **Message Status**: Estados de entrega/lectura

### **3. Integraciones de Negocio**
- ❌ **Property Context**: Mensajes vinculados a propiedades específicas
- ❌ **Agent Routing**: Enrutamiento automático a agentes
- ❌ **Inquiry Integration**: Integrar con sistema de consultas existente
- ❌ **Analytics**: Métricas de mensajería

### **4. Seguridad y Permisos**
- ❌ **RLS Policies**: Políticas de seguridad para mensajes
- ❌ **Rate Limiting**: Límites de envío de mensajes
- ❌ **Spam Protection**: Protección contra spam
- ❌ **Block/Report**: Sistema de bloqueo y reportes

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **Fase 1: Fundación** (1-2 días)
1. Crear `MessagesContext` y hooks básicos
2. Configurar Supabase Realtime
3. Implementar páginas básicas de mensajería

### **Fase 2: Integración** (2-3 días)
1. Conectar botones "Enviar mensaje" existentes
2. Integrar con sistema de propiedades
3. Implementar notificaciones básicas

### **Fase 3: Mejoras** (3-5 días)
1. Funcionalidades avanzadas (búsqueda, archivado)
2. Multimedia y typing indicators
3. Analytics y métricas

## 📊 RESUMEN EJECUTIVO

### **Estado Actual**:
- ✅ **70% de la infraestructura** ya está implementada
- ✅ **APIs completas** para mensajería
- ✅ **Componentes base** funcionales
- ✅ **Sistema de autenticación** robusto

### **Trabajo Restante**:
- ❌ **30% faltante**: Principalmente UI y integraciones
- ❌ **Páginas de mensajería**: 3 rutas principales
- ❌ **Context global**: Estado de mensajes
- ❌ **Realtime**: Configuración de tiempo real

### **Esfuerzo Estimado**: 5-7 días de desarrollo

Este mapa proporciona una visión completa de cómo integrar el sistema de mensajería en tu plataforma, aprovechando la infraestructura existente y identificando claramente qué necesita ser desarrollado.
