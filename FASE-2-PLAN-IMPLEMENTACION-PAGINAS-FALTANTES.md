# FASE 2: PLAN IMPLEMENTACIÓN PÁGINAS FALTANTES

## 🎯 OBJETIVO
Implementar todas las páginas faltantes del módulo Comunidad para completar la funcionalidad social.

## 📋 PÁGINAS A IMPLEMENTAR

### 1. **Página de Perfil Individual** (`/comunidad/[id]/page.tsx`)
**Funcionalidad:**
- Ver perfil completo de otro usuario
- Botón de like/unlike
- Información detallada del perfil
- Estado de match si existe
- Botón para iniciar conversación

### 2. **Página de Matches** (`/comunidad/matches/page.tsx`)
**Funcionalidad:**
- Lista de todos los matches del usuario
- Información de cada match
- Acceso directo al chat
- Estado de la conversación
- Filtros por estado

### 3. **Página de Mensajes** (`/comunidad/mensajes/page.tsx`)
**Funcionalidad:**
- Lista de conversaciones activas
- Último mensaje de cada conversación
- Contador de mensajes no leídos
- Acceso directo a cada chat
- Búsqueda de conversaciones

### 4. **Página de Chat Individual** (`/comunidad/mensajes/[conversationId]/page.tsx`)
**Funcionalidad:**
- Chat en tiempo real
- Historial de mensajes
- Envío de mensajes
- Marcado como leído automático
- Información del match

## 🔧 COMPONENTES NECESARIOS

### **Componentes UI Adicionales:**
- `ProfileCard` - Tarjeta de perfil
- `MatchCard` - Tarjeta de match
- `ConversationCard` - Tarjeta de conversación
- `ChatMessage` - Mensaje individual
- `ChatInput` - Input para enviar mensajes
- `LikeButton` - Botón de like/unlike

### **Hooks Personalizados:**
- `useProfile` - Gestión de perfiles
- `useMatches` - Gestión de matches
- `useMessages` - Gestión de mensajes
- `useChat` - Chat en tiempo real

## 📊 ORDEN DE IMPLEMENTACIÓN

1. **Componentes UI Base** (15 min)
2. **Hooks Personalizados** (20 min)
3. **Página de Perfil Individual** (25 min)
4. **Página de Matches** (20 min)
5. **Página de Mensajes** (20 min)
6. **Página de Chat Individual** (30 min)
7. **Testing y Ajustes** (20 min)

**TIEMPO ESTIMADO TOTAL: ~2.5 horas**

## 🚀 INICIANDO IMPLEMENTACIÓN

Comenzando con los componentes UI base...
