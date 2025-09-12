# TODO - Plan de Mejoras para Perfil de Usuario

## Información Recopilada

Después de analizar los archivos del proyecto, he identificado los siguientes problemas en la página de perfil del inquilino:

### Problemas Identificados:

1. **Campos que no se ven bien**: Las 6 tarjetas del dashboard muestran datos en 0 o vacíos
2. **Actividad Reciente**: Muestra datos hardcodeados/mock en lugar de datos reales de la base de datos
3. **4 tablas del lado izquierdo**: Las tarjetas (Mis Favoritos, Mensajes, Búsquedas Guardadas, Dashboard, Notificaciones, Seguridad) no lucen bien y muestran datos vacíos

### Archivos Analizados:

- **InquilinoProfilePage.tsx**: Página principal del perfil
- **quick-actions-grid.tsx**: Componente de las 6 tarjetas del dashboard
- **profile-stats.tsx**: Componente de estadísticas del lado derecho
- **useUserStats.ts**: Hook para obtener estadísticas del usuario
- **useUserFavorites.ts**: Hook para obtener favoritos del usuario
- **route.ts (stats API)**: API que obtiene estadísticas reales de la base de datos

## Plan Detallado de Correcciones

### Fase 1: Mejorar la Sección de Actividad Reciente

**Problema**: La sección "Actividad Reciente" muestra datos hardcodeados:
```jsx
<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
  <Heart className="w-5 h-5 text-red-500" />
  <div>
    <p className="text-sm font-medium">Agregaste una propiedad a favoritos</p>
    <p className="text-xs text-gray-500">Hace 2 horas</p>
  </div>
</div>
```

**Solución**:
1. Crear un nuevo hook `useUserActivity` para obtener actividad real
2. Crear una nueva API `/api/users/activity` que consulte la tabla `user_activity_log`
3. Reemplazar los datos hardcodeados con datos reales

### Fase 2: Mejorar las Tarjetas del Dashboard (Quick Actions Grid)

**Problema**: Las tarjetas muestran datos en 0 o vacíos porque:
- Los hooks `useUserStats` y `useUserFavorites` no están cargando datos correctamente
- La API `/api/users/stats` tiene fallbacks pero puede estar fallando
- Falta manejo de estados de carga y error en las tarjetas

**Solución**:
1. Mejorar el manejo de errores en `useUserStats` y `useUserFavorites`
2. Agregar indicadores de carga en las tarjetas
3. Implementar datos de prueba realistas cuando no hay datos reales
4. Mejorar el diseño visual de las tarjetas

### Fase 3: Mejorar las Estadísticas del Lado Derecho

**Problema**: El componente `ProfileStats` muestra datos en 0 porque depende de los mismos hooks que fallan.

**Solución**:
1. Mejorar la integración con la API de estadísticas
2. Agregar fallbacks más inteligentes
3. Mejorar el diseño visual de las estadísticas

### Fase 4: Verificar y Corregir las APIs

**Problema**: Las APIs pueden estar fallando silenciosamente.

**Solución**:
1. Verificar que las tablas de la base de datos existan (`profile_views`, `user_messages`, `favorites`, etc.)
2. Agregar mejor logging y manejo de errores
3. Crear datos de prueba si es necesario

## Archivos a Editar

### Archivos Principales:
1. `Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx` - Reemplazar actividad hardcodeada
2. `Backend/src/components/ui/quick-actions-grid.tsx` - Mejorar manejo de datos y diseño
3. `Backend/src/components/ui/profile-stats.tsx` - Mejorar integración con datos reales
4. `Backend/src/hooks/useUserStats.ts` - Mejorar manejo de errores
5. `Backend/src/hooks/useUserFavorites.ts` - Mejorar manejo de errores

### Archivos Nuevos a Crear:
1. `Backend/src/hooks/useUserActivity.ts` - Hook para actividad reciente
2. `Backend/src/app/api/users/activity/route.ts` - API para actividad reciente
3. `Backend/src/components/ui/recent-activity.tsx` - Componente para actividad reciente

### Archivos de Soporte:
1. `Backend/sql-migrations/create-activity-data.sql` - Datos de prueba para actividad
2. `Backend/test-profile-improvements.js` - Tests para verificar las mejoras

## Pasos de Implementación

### Paso 1: Crear el Sistema de Actividad Reciente ✅ COMPLETADO
- [x] Crear hook `useUserActivity`
- [x] Crear API `/api/users/activity`
- [x] Crear componente `RecentActivity`
- [x] Integrar en `InquilinoProfilePage`

### Paso 2: Mejorar las Tarjetas del Dashboard ✅ COMPLETADO
- [x] Agregar estados de carga en `QuickActionsGrid`
- [x] Mejorar manejo de errores en hooks
- [x] Agregar datos de fallback más realistas
- [x] Mejorar diseño visual

### Paso 3: Mejorar las Estadísticas
- [ ] Mejorar integración con API en `ProfileStats`
- [ ] Agregar indicadores de carga
- [ ] Mejorar diseño visual

### Paso 4: Testing y Verificación
- [x] Crear script de testing (`test-profile-improvements-2025.js`)
- [ ] Crear datos de prueba en la base de datos
- [ ] Verificar que todas las APIs funcionen
- [ ] Probar la página completa
- [ ] Verificar que no se afecten otras partes del proyecto

## Archivos Dependientes a Verificar

Para asegurar que no afectemos otras partes del proyecto, debemos verificar:

1. `Backend/src/components/navbar.tsx` - Usa enlaces al perfil
2. `Backend/src/components/user-menu.tsx` - Usa enlaces al perfil
3. `Backend/src/app/dashboard/page.tsx` - Puede usar componentes similares

## Pasos de Seguimiento

1. **Implementar las mejoras paso a paso**
2. **Probar cada cambio individualmente**
3. **Verificar que no se rompan otras funcionalidades**
4. **Crear datos de prueba realistas**
5. **Documentar los cambios realizados**

## Estado Actual del Proyecto

### ✅ COMPLETADO (Fases 1 y 2)

**Fase 1: Sistema de Actividad Reciente**
- ✅ Hook `useUserActivity` creado con manejo de datos reales y fallbacks
- ✅ API `/api/users/activity` implementada con consultas a base de datos
- ✅ Componente `RecentActivity` con diseño mejorado y estados de carga
- ✅ Integración completa en la página de perfil

**Fase 2: Mejoras en Dashboard**
- ✅ Estados de carga agregados a `QuickActionsGrid`
- ✅ Manejo de errores mejorado en hooks
- ✅ Datos de demostración realistas cuando no hay datos reales
- ✅ Indicador visual cuando se muestran datos de demo

### 🔄 PENDIENTE (Fases 3 y 4)

**Fase 3: Estadísticas del Lado Derecho**
- Mejorar integración con API en `ProfileStats`
- Agregar indicadores de carga
- Mejorar diseño visual

**Fase 4: Testing y Verificación Final**
- Crear datos de prueba en la base de datos
- Verificar que todas las APIs funcionen
- Probar la página completa
- Verificar que no se afecten otras partes del proyecto

### 📁 Archivos Creados/Modificados

**Archivos Nuevos:**
- `Backend/src/hooks/useUserActivity.ts`
- `Backend/src/app/api/users/activity/route.ts`
- `Backend/src/components/ui/recent-activity.tsx`
- `Backend/test-profile-improvements-2025.js`

**Archivos Modificados:**
- `Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx`
- `Backend/src/components/ui/quick-actions-grid.tsx`

### 🎯 Resultados Esperados

Con las mejoras implementadas, la página de perfil ahora debería mostrar:

1. **Actividad Reciente Real**: En lugar de datos hardcodeados, muestra actividad real del usuario o datos de demostración realistas
2. **Tarjetas Mejoradas**: Las 6 tarjetas del dashboard ahora manejan estados de carga y muestran datos más realistas
3. **Mejor UX**: Indicadores de carga, manejo de errores, y feedback visual cuando se usan datos de demostración

---

**Nota**: Este plan se enfoca en mejorar la experiencia del usuario sin afectar la funcionalidad existente del proyecto. Las Fases 1 y 2 están completadas y listas para testing.
