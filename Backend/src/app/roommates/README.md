# Sistema de Roommates - Documentación del Módulo

## 📋 Descripción General

Sistema completo de búsqueda y publicación de roommates para la plataforma Misiones Arrienda. Permite a los usuarios crear posts para buscar compañeros de vivienda, con sistema de filtros avanzados, búsqueda full-text, interacciones sociales y manejo de imágenes.

## 🗂️ Estructura del Módulo

```
src/app/roommates/
├── page.tsx                    # Feed público con filtros
├── nuevo/page.tsx             # Crear nuevo post
├── [slug]/page.tsx            # Detalle con slug único
├── [id]/editar/page.tsx       # Editar post existente
└── README.md                  # Esta documentación

src/app/api/roommates/
├── route.ts                   # GET feed + POST crear
├── [slug]/route.ts           # GET detalle + PATCH editar
└── [id]/
    ├── publish/route.ts      # PATCH publicar
    ├── unpublish/route.ts    # PATCH despublicar
    ├── view/route.ts         # POST incrementar vistas
    ├── like/route.ts         # POST toggle like
    └── report/route.ts       # POST reportar

src/components/ui/
├── roommate-card.tsx         # Card para listings
├── roommate-filters.tsx      # Filtros avanzados
├── roommate-form.tsx         # Formulario RHF + Zod
├── roommate-image-uploader.tsx # Upload con drag & drop
└── roommate-detail.tsx       # Vista detalle completa

src/lib/
├── community-images.ts       # Helper URLs públicas
└── validations/roommate.ts   # Schemas Zod

src/types/roommate.ts         # Interfaces TypeScript
```

## 🖼️ Sistema de Imágenes Community-Images

### **Bucket Unificado**
- **Bucket**: `community-images` (público)
- **Estructura de keys**: `community-images/<user_id>/<post_id>/<filename>`
- **Sin signed URLs**: Solo URLs públicas directas

### **Helper URLs Públicas**
```typescript
// src/lib/community-images.ts
export const COMMUNITY_PUBLIC_BASE = 
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/community-images/`;

export const keyToPublicUrl = (k: string) =>
  k?.startsWith('http') ? k : `${COMMUNITY_PUBLIC_BASE}${k}`;

export const keysToPublicUrls = (keys: string[] = []) => 
  keys.map(keyToPublicUrl).filter(Boolean) as string[];
```

### **Patrón de Uso**
- **Guardar**: `images_urls: string[]` (keys de storage)
- **Mostrar**: `images = keysToPublicUrls(images_urls)` (URLs públicas)
- **Portada**: `images_urls[0]` siempre es la primera imagen
- **Sin placeholders**: "Sin imágenes disponibles aún" cuando array vacío

## 🔐 API Detalle Dual-Mode (MUY IMPORTANTE)

### **Lógica de Visibilidad**
```typescript
// GET /api/roommates/[slug-or-id]
if (isOwner) {
  return {
    ...baseFields,
    images_urls: [...], // Keys de storage (solo para owner)
    images: [...],      // URLs públicas
    canEdit: true
  }
} else {
  return {
    ...baseFields,
    // NO exponer images_urls
    images: [...],      // Solo URLs públicas
    canEdit: false
  }
}
```

### **Seguridad**
- **Owner**: Ve todos los campos + `images_urls` para gestión
- **Público**: Solo campos públicos + `images` (URLs), NO `images_urls`
- **RLS**: Solo posts `PUBLISHED` y `is_active=true` para visitantes

## 🔍 Sistema de Búsqueda y Filtros

### **Full-Text Search**
- **Idioma**: Español con `plainto_tsquery('spanish')`
- **Campos indexados**: 
  - `title` (peso A)
  - `description` (peso B) 
  - `city`, `province` (peso C)
  - `preferences` (peso D)
- **Fallback**: ILIKE si full-text no disponible

### **Filtros Disponibles**
- **q**: Búsqueda de texto libre
- **city**: Ciudad (ILIKE)
- **province**: Provincia (ILIKE)
- **room_type**: PRIVATE | SHARED
- **min_rent**, **max_rent**: Rango de precios
- **available_from**: Fecha disponible desde
- **order**: recent | trending

### **Algoritmo de Trending**
```sql
ORDER BY (likes_count * 3 + ln(1 + COALESCE(views_count, 0))) DESC
```
- Likes tienen **3x más peso** que views
- Función logarítmica evita dominancia de posts virales

## 📊 Sistema de Interacciones

### **Vistas (Views)**
- **Endpoint**: `POST /api/roommates/[id]/view`
- **Función RPC**: `roommate_increment_view(post_id)`
- **Uso**: Auto-llamada en `useEffect` del detalle (no bloquea render)

### **Likes**
- **Endpoint**: `POST /api/roommates/[id]/like`
- **Tabla**: `roommate_likes` con toggle automático
- **UI**: Update optimista con rollback en error

### **Reportes**
- **Endpoint**: `POST /api/roommates/[id]/report`
- **Tabla**: `roommate_reports`
- **Razones**: SPAM, INAPPROPRIATE, FAKE, OTHER

## 🎨 Componentes UI

### **RoommateCard**
```typescript
<RoommateCard 
  roommate={roommate}
  onLike={handleLike}
  onEdit={handleEdit} // Solo para owner
/>
```

### **RoommateImageUploader**
```typescript
<RoommateImageUploader
  postId={id}
  userId={userId}
  value={images_urls}        // Keys actuales
  onChange={setImagesUrls}   // Callback con nuevo orden
/>
```

### **RoommateFilters**
```typescript
<RoommateFilters
  filters={filters}
  onFiltersChange={setFilters}
  loading={loading}
/>
```

## 🔄 Flujos de Usuario

### **Crear Post**
1. `/roommates/nuevo` → Formulario RHF + Zod
2. Upload imágenes → `community-images/<user_id>/<post_id>/`
3. Guardar como DRAFT → Validación mínima
4. Publicar → Validación publish-ready completa

### **Editar Post**
1. `/roommates/[id]/editar` → Cargar datos existentes
2. Modificar campos + reordenar imágenes
3. Guardar cambios → PATCH con validación
4. Publicar/Despublicar según estado

### **Ver Detalle**
1. `/roommates/[slug]` → Resolver slug o ID
2. Auto-incremento vistas → POST /view asíncrono
3. Acciones: Like, Compartir, Reportar, Contactar
4. Dual-mode: owner ve controles adicionales

## 🛡️ Seguridad y RLS

### **Políticas Implementadas**
- **roommate_posts**: Público ve PUBLISHED & active, owner ve todos
- **roommate_likes**: Usuarios ven solo sus likes
- **roommate_reports**: Solo insert para autenticados
- **community-images**: Todos ven, solo owner puede subir/eliminar

### **Validaciones Server-Side**
- **Title**: 3-140 chars, sin `< >`, colapsar espacios
- **Room_type**: PRIVATE | SHARED (requerido)
- **Monthly_rent**: ≥ 0 si se envía, null → "A convenir"
- **Images_urls**: string[] (keys de storage)

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: 1 columna, filtros colapsables
- **Tablet**: 2-3 columnas, sidebar sticky
- **Desktop**: 4 columnas, filtros expandidos

### **Estados UI**
- **Loading**: Skeletons para cards y formularios
- **Empty**: "Sin imágenes disponibles aún" (cero placeholders)
- **Error**: Boundaries con retry actions

## 🚀 Deployment

### **Prerequisitos**
1. Ejecutar migración SQL:
   ```sql
   \i sql-migrations/setup-roommate-images-bucket-2025.sql
   ```

2. Variables de entorno:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### **Verificación Post-Deploy**
- [ ] Bucket `community-images` creado y público
- [ ] Políticas RLS activas en todas las tablas
- [ ] Función `roommate_increment_view()` disponible
- [ ] Índices de búsqueda creados
- [ ] Trigger `update_roommate_search_tsv` activo

## 🔧 Mantenimiento

### **Monitoreo**
- **Views**: Función RPC optimizada, no requiere mantenimiento
- **Likes**: Contador automático con consistencia eventual
- **Storage**: Limpieza manual de archivos huérfanos (no automática)

### **Performance**
- **Índices GIN**: Para búsqueda full-text
- **Índices compuestos**: Para filtros comunes
- **Paginación**: Límite 50 items por request

## 📊 Métricas Disponibles

### **Por Post**
- `views_count`: Vistas únicas (aproximadas)
- `likes_count`: Likes totales
- `created_at`, `published_at`: Timestamps

### **Trending Score**
```sql
score = likes_count * 3 + ln(1 + views_count)
```

## 🎯 Criterios de Aceptación QA

### **Flujo Completo**
1. ✅ Crear DRAFT con 2-3 fotos
2. ✅ Reordenar imágenes (drag & drop)
3. ✅ Publicar → aparece en feed con portada correcta
4. ✅ Detalle muestra galería
5. ✅ Views incrementan al refrescar
6. ✅ Like toggle funciona (optimista)
7. ✅ Report devuelve 200
8. ✅ Sin placeholders en ningún lado

### **Casos Edge**
- ✅ `monthly_rent = null` → "A convenir"
- ✅ Sin imágenes → "Sin imágenes disponibles aún"
- ✅ Usuario no autenticado → redirect a login
- ✅ Post no público → 404 para visitantes

---

**Sistema 100% funcional y ready for production** 🚀
