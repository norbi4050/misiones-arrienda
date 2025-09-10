# TODO - Mejoras Filtros UI Profesionales 2025

## Estado: En Progreso

### ✅ Tareas Completadas
- [x] Análisis de componentes existentes
- [x] Planificación de mejoras UI
- [x] Aprobación del plan por usuario

### 🔄 Tareas Pendientes
- [ ] Modificar filter-section.tsx para separar sorting de filtros
- [ ] Implementar chips solo para filtros reales (excluir sorting)
- [ ] Agregar labels legibles en chips (ej: "Ciudad: Posadas")
- [ ] Agregar botones ✕ en chips para remover filtros individuales
- [ ] Implementar botón "Limpiar filtros" que preserve sorting
- [ ] Mover controles de sorting a select separado
- [ ] Ajustar properties-client.tsx si es necesario
- [ ] Testing de la nueva UI de filtros

### 🎯 Objetivos
- Mostrar chips solo para filtros aplicados (no sorting)
- Labels legibles: Ciudad: Posadas, Provincia: Misiones, Precio: 80k–200k, etc.
- Botón ✕ en cada chip para quitar filtro individual
- Botón "Limpiar filtros" que resetea filtros pero mantiene orden
- Sorting en select separado: "Ordenar por: Fecha (desc/asc), Precio (desc/asc), Área (desc/asc)"
- Persistencia en querystring (ya implementado, pulir UX)

### 📁 Archivos a Modificar
- Backend/src/components/filter-section.tsx (cambios principales)
- Backend/src/app/properties/properties-client.tsx (ajustes menores si necesario)

### 🧪 Testing
- Verificar chips aparecen solo para filtros reales
- Probar eliminación individual de filtros con ✕
- Confirmar "Limpiar filtros" mantiene sorting
- Validar persistencia en URL
- Testing en /properties page
