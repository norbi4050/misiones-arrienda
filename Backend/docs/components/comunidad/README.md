# Componentes UI - Módulo Comunidad

## Descripción General

Los componentes UI del módulo comunidad proporcionan una interfaz completa para la funcionalidad de matching y chat entre usuarios.

## Componentes Principales

### ProfileCard

Tarjeta que muestra la información básica de un perfil de usuario.

**Props:**
- `profile`: Objeto con información del perfil
- `isLiked`: Boolean indicando si el perfil tiene like
- `isMatched`: Boolean indicando si hay match
- `onLike`: Función callback para manejar likes
- `onMessage`: Función callback para enviar mensajes
- `showActions`: Boolean para mostrar/ocultar botones de acción

**Ejemplo de uso:**
```tsx
<ProfileCard
  profile={userProfile}
  isLiked={false}
  isMatched={true}
  onLike={handleLike}
  onMessage={handleMessage}
  showActions={true}
/>
```

### ChatInput

Componente de input para enviar mensajes en el chat.

**Props:**
- `onSendMessage`: Función callback que recibe el mensaje a enviar
- `placeholder`: Texto placeholder del input
- `disabled`: Boolean para deshabilitar el input

**Ejemplo de uso:**
```tsx
<ChatInput
  onSendMessage={handleSendMessage}
  placeholder="Escribe tu mensaje..."
  disabled={false}
/>
```

### ChatMessage

Componente que renderiza un mensaje individual en el chat.

**Props:**
- `message`: Objeto con información del mensaje
- `isOwn`: Boolean indicando si el mensaje es del usuario actual

### MatchCard

Tarjeta que muestra información de un match.

**Props:**
- `match`: Objeto con información del match
- `onMessage`: Función callback para iniciar conversación

### ConversationCard

Tarjeta que muestra información de una conversación.

**Props:**
- `conversation`: Objeto con información de la conversación
- `lastMessage`: Último mensaje de la conversación
- `onClick`: Función callback al hacer click

## Testing

Todos los componentes incluyen:
- Tests unitarios con Jest y React Testing Library
- Data-testids para testing automatizado
- Cobertura de casos de uso principales

Para ejecutar los tests:
```bash
npm test
```

## Storybook

Los componentes están documentados en Storybook con diferentes variantes y casos de uso.

Para ejecutar Storybook:
```bash
npm run storybook
```

## Accesibilidad

Todos los componentes incluyen:
- ARIA labels apropiados
- Roles semánticos
- Soporte para navegación por teclado
- Contraste de colores adecuado

## Performance

Los componentes están optimizados con:
- `useCallback` para funciones
- `useMemo` para cálculos costosos
- Lazy loading cuando es apropiado
- Minimización de re-renders
