# TODO - CONTINUACIÓN PERFIL DE USUARIO
## Pasos Exactos para Mañana - Enero 2025

### 🚀 INICIO RÁPIDO (5 min)
1. Abrir proyecto en VSCode
2. Iniciar servidor: `cd Backend && npm run dev`
3. Revisar este TODO y el reporte de auditoría

### 📋 CHECKLIST DE IMPLEMENTACIÓN

#### ✅ FASE 1: MIGRACIÓN SQL (30-45 min)
- [ ] **Paso 1.1:** Crear `Backend/sql-migrations/profile-system-complete-2025.sql`
- [ ] **Paso 1.2:** Ejecutar migración en Supabase
- [ ] **Paso 1.3:** Verificar tablas creadas correctamente
- [ ] **Paso 1.4:** Configurar RLS policies
- [ ] **Paso 1.5:** Crear índices de performance

**Archivos a crear:**
```
Backend/sql-migrations/profile-system-complete-2025.sql
```

#### ✅ FASE 2: APIS CON DATOS REALES (45-60 min)
- [ ] **Paso 2.1:** Modificar `Backend/src/app/api/users/stats/route.ts`
- [ ] **Paso 2.2:** Crear API de vistas de perfil
- [ ] **Paso 2.3:** Implementar contadores reales
- [ ] **Paso 2.4:** Testing de APIs

**Archivos a modificar/crear:**
```
Backend/src/app/api/users/stats/route.ts (modificar)
Backend/src/app/api/users/profile-views/route.ts (crear)
Backend/src/hooks/useUserStats.ts (modificar)
```

#### ✅ FASE 3: MEJORAS VISUALES (60-90 min)
- [ ] **Paso 3.1:** Rediseñar `ProfileStats` component
- [ ] **Paso 3.2:** Corregir alineación de tabla
- [ ] **Paso 3.3:** Implementar responsive design
- [ ] **Paso 3.4:** Agregar sistema de achievements
- [ ] **Paso 3.5:** Estados de carga mejorados

**Archivos a modificar/crear:**
```
Backend/src/components/ui/profile-stats.tsx (modificar)
Backend/src/components/ui/profile-stats-enhanced.tsx (crear)
Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx (modificar)
```

#### ✅ FASE 4: SISTEMA DE FOTOS AVANZADO (45-60 min)
- [ ] **Paso 4.1:** Crear componente con drag & drop
- [ ] **Paso 4.2:** Implementar preview de imágenes
- [ ] **Paso 4.3:** Validación de archivos
- [ ] **Paso 4.4:** Manejo de errores robusto
- [ ] **Paso 4.5:** Testing de upload

**Archivos a crear:**
```
Backend/src/components/ui/profile-avatar-advanced.tsx
```

### 🔧 COMANDOS ÚTILES

#### Iniciar desarrollo:
```bash
cd Backend
npm run dev
```

#### Testing APIs:
```bash
# Test stats API
curl -X GET http://localhost:3000/api/users/stats

# Test profile views
curl -X POST http://localhost:3000/api/users/profile-views \
  -H "Content-Type: application/json" \
  -d '{"viewedUserId": "user-id"}'
```

#### Verificar Supabase:
```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%profile%';

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM profile_views) as profile_views,
  (SELECT COUNT(*) FROM user_searches) as searches,
  (SELECT COUNT(*) FROM user_messages) as messages;
```

### 🎯 OBJETIVOS ESPECÍFICOS

#### **Funcionalidad Crítica:**
1. ❌ **Eliminar completamente Math.random()** de estadísticas
2. ✅ **Implementar contadores reales** de vistas, favoritos, mensajes
3. ✅ **Sistema de vistas de perfil** funcional
4. ✅ **Upload de fotos** con drag & drop

#### **Mejoras Visuales:**
1. ✅ **Tabla perfectamente alineada** - elementos dentro de contenedores
2. ✅ **Responsive design** completo para móvil/tablet
3. ✅ **Estados de carga** en todos los componentes
4. ✅ **Sistema de achievements** visual

### 🧪 TESTING PLAN

#### **Testing Manual:**
1. **Login:** cgonzalezarchilla@gmail.com / Gera302472!
2. **Navegar a perfil:** /profile/inquilino
3. **Verificar estadísticas reales** (no números aleatorios)
4. **Probar upload de foto**
5. **Verificar responsive design**

#### **Testing Técnico:**
1. **Verificar APIs** devuelven datos reales
2. **Comprobar consultas SQL** son eficientes
3. **Validar RLS policies** funcionan correctamente
4. **Performance testing** de componentes

### 📊 MÉTRICAS DE ÉXITO

#### **Antes (Estado Actual):**
- ❌ Estadísticas: 100% simuladas (Math.random)
- ❌ Vistas de perfil: No funcional
- ❌ Tabla: Elementos desalineados
- ❌ Fotos: Sistema básico

#### **Después (Objetivo):**
- ✅ Estadísticas: 100% reales de base de datos
- ✅ Vistas de perfil: Completamente funcional
- ✅ Tabla: Perfectamente alineada
- ✅ Fotos: Sistema profesional con drag & drop

### ⚠️ PUNTOS CRÍTICOS A RECORDAR

1. **Backup antes de migración SQL**
2. **Verificar tipos de datos** (UUID vs TEXT)
3. **RLS policies** para seguridad
4. **Testing exhaustivo** antes de commit
5. **Responsive design** en todos los breakpoints

### 🎉 RESULTADO FINAL ESPERADO

Al terminar mañana tendremos:
- ✅ Perfil de usuario 100% funcional
- ✅ Datos reales sincronizados
- ✅ Interfaz visual perfecta
- ✅ Sistema de fotos profesional
- ✅ Performance optimizada

---
**⏰ Tiempo Total Estimado:** 4-5 horas
**🎯 Prioridad:** Alta - Funcionalidad crítica del usuario
**📅 Deadline:** Completar en 1 día
