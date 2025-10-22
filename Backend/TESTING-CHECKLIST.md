# ✅ CHECKLIST DE TESTING - Public Property Listing

**Feature:** Public Property Listing (FASE 1 MVP)
**Branch:** feature/public-property-listing
**Tester:** _______________
**Fecha:** _______________

---

## 🎯 OBJETIVO DEL TESTING

Verificar que:
1. Con feature flag **OFF**: todo funciona igual que antes (sin cambios)
2. Con feature flag **ON**: usuarios no autenticados pueden ver propiedades con datos limitados
3. Autenticación NO está comprometida
4. No hay breaking changes en funcionalidad existente

---

## ⚙️ SETUP INICIAL

### Pre-requisitos

- [ ] Proyecto compilado sin errores (`npm run build`)
- [ ] Base de datos accesible
- [ ] Variables de entorno configuradas
- [ ] Al menos 5-10 propiedades de prueba en la BD

### Verificar Feature Flag

```bash
# Verificar que existe en .env.local
grep NEXT_PUBLIC_ENABLE_PUBLIC_LISTING .env.local

# Debe mostrar:
# NEXT_PUBLIC_ENABLE_PUBLIC_LISTING=false  (default)
```

---

## 📋 TEST SUITE 1: Feature Flag OFF (Comportamiento actual)

**Objetivo:** Verificar que NADA cambió del comportamiento original

### 1.1 Setup
```bash
# Asegurar que flag está OFF
NEXT_PUBLIC_ENABLE_PUBLIC_LISTING=false

# Reiniciar servidor
npm run dev
```

### 1.2 Usuario NO autenticado

**Pasos:**
1. Abrir navegador en modo incógnito
2. Ir a `http://localhost:3000/properties`

**Verificar:**
- [ ] NO ve listado completo de propiedades
- [ ] Ve landing page con hero section
- [ ] Ve 6 propiedades demo
- [ ] Ve botón "Crear cuenta para ver más"
- [ ] Click en botón lleva a /register

### 1.3 Usuario autenticado

**Pasos:**
1. Login con usuario de prueba
2. Ir a `/properties`

**Verificar:**
- [ ] Ve listado completo de propiedades
- [ ] Puede usar filtros
- [ ] Puede ver detalles de propiedades
- [ ] Ve contactos completos
- [ ] Puede agregar favoritos

**✅ Si todo pasa:** Comportamiento original intacto

---

## 📋 TEST SUITE 2: Feature Flag ON (Nuevo comportamiento)

**Objetivo:** Verificar nueva funcionalidad de listado público

### 2.1 Setup
```bash
# Activar feature flag
# Editar .env.local:
NEXT_PUBLIC_ENABLE_PUBLIC_LISTING=true

# Reiniciar servidor
npm run dev
```

### 2.2 Usuario NO autenticado - Listado

**Pasos:**
1. Abrir navegador en modo incógnito
2. Ir a `http://localhost:3000/properties`

**Verificar:**
- [ ] Ve listado COMPLETO de propiedades (no landing)
- [ ] Ve PropertyCard para cada propiedad
- [ ] Puede usar filtros de búsqueda
- [ ] Filtros funcionan correctamente
- [ ] Paginación funciona

**PropertyCard verificaciones:**
- [ ] Muestra foto (cover_url)
- [ ] Muestra título
- [ ] Muestra precio
- [ ] Muestra ubicación
- [ ] Muestra bedrooms/bathrooms/area
- [ ] Al hacer hover, ve badge "Inicia sesión para contactar" (si requires_auth_for_contact=true)
- [ ] Click en card lleva a `/properties/[id]`

### 2.3 Usuario NO autenticado - Detalle de Propiedad

**Pasos:**
1. Click en una propiedad del listado
2. Verificar URL: `/properties/[id]` o `/property/[id]`

**Verificar datos visibles:**
- [ ] Ve título completo
- [ ] Ve descripción completa
- [ ] Ve precio
- [ ] Ve características (bedrooms, bathrooms, area, etc.)
- [ ] Ve ubicación en mapa
- [ ] Ve amenities/features

**Verificar datos OCULTOS:**
- [ ] Teléfono aparece como `+54 *** *** 7890` (enmascarado)
- [ ] Email NO aparece (null)
- [ ] Nombre de contacto NO aparece (null)
- [ ] Solo ve primeras 3 fotos (si hay más)

**ContactSection:**
- [ ] Ve sección con ícono de candado (Lock)
- [ ] Ve título "Inicia sesión para ver el contacto"
- [ ] Ve datos de contacto con blur effect
- [ ] Ve botón "Iniciar sesión / Registrarse"
- [ ] Ve lista de beneficios de registrarse

**Acciones:**
- [ ] Click en "Iniciar sesión" → Redirect a `/login?reason=contact_unlock`
- [ ] Click en "Agregar a favoritos" → Toast "Inicia sesión para guardar favoritos"

### 2.4 Usuario NO autenticado - API Responses

**Verificar con Network Inspector (F12 → Network):**

```bash
# Request a API de listado
GET /api/properties

# Verificar response:
{
  "properties": [{
    "contact_phone": "+54 *** *** 7890",  // ✅ Enmascarado
    "contact_email": null,                 // ✅ Oculto
    "contact_name": null,                  // ✅ Oculto
    "images": [img1, img2, img3],         // ✅ Solo 3
    "imagesCount": 8,                      // ✅ Count real
    "requires_auth_for_contact": true,     // ✅ Flag presente
    "requires_auth_for_full_images": true  // ✅ Flag presente
  }]
}
```

**Verificar:**
- [ ] `contact_phone` enmascarado correctamente
- [ ] `contact_email` es null
- [ ] `contact_name` es null
- [ ] `images` array tiene máximo 3 elementos
- [ ] `imagesCount` refleja total real
- [ ] `requires_auth_for_contact` es true
- [ ] `requires_auth_for_full_images` es true (si total > 3)

### 2.5 Usuario autenticado - Debe funcionar IGUAL que antes

**Pasos:**
1. Login con usuario de prueba
2. Ir a `/properties`
3. Click en una propiedad

**Verificar (TODO igual que antes):**
- [ ] Ve listado completo
- [ ] Puede usar filtros
- [ ] Ve detalle completo
- [ ] Teléfono completo visible (sin máscara)
- [ ] Email visible
- [ ] Nombre de contacto visible
- [ ] Ve TODAS las fotos (no limitadas)
- [ ] ContactSection muestra datos sin blur
- [ ] NO ve badges de "Inicia sesión"
- [ ] Puede agregar a favoritos sin problemas

**API Response con auth:**
```bash
GET /api/properties
# Con header: Authorization: Bearer <token>

# Verificar:
{
  "properties": [{
    "contact_phone": "+54 376 4567890",   // ✅ Completo
    "contact_email": "juan@gmail.com",     // ✅ Visible
    "contact_name": "Juan Pérez",          // ✅ Visible
    "images": [img1, img2, ..., img8],    // ✅ Todas
    "requires_auth_for_contact": false,    // ✅ False
    "requires_auth_for_full_images": false // ✅ False
  }]
}
```

### 2.6 Transición: No-auth → Auth

**Pasos:**
1. Modo incógnito, ir a una propiedad con datos ocultos
2. Copiar URL actual
3. Click en "Iniciar sesión"
4. Completar login
5. Verificar redirect

**Verificar:**
- [ ] Después del login, redirect a la propiedad original (URL copiada)
- [ ] Ahora ve datos completos (teléfono, email, nombre)
- [ ] No hay errores en consola JavaScript
- [ ] Session se mantiene (useAuth funciona)
- [ ] Refresh de página mantiene sesión

---

## 📋 TEST SUITE 3: APIs Protegidas (CRÍTICO)

**Objetivo:** Verificar que autenticación NO está comprometida

### 3.1 Setup
```bash
# Feature flag puede estar ON u OFF (da igual)
# Modo incógnito (sin auth)
```

### 3.2 Verificar bloqueo de APIs

**Con navegador en modo incógnito, abrir DevTools Console:**

```javascript
// TEST 1: Crear propiedad (debe fallar)
fetch('/api/properties/draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Test' })
}).then(r => r.json()).then(console.log)
// ✅ Debe retornar 401 Unauthorized

// TEST 2: Ver favoritos (debe fallar)
fetch('/api/favorites').then(r => r.json()).then(console.log)
// ✅ Debe retornar 401 Unauthorized

// TEST 3: Agregar favorito (debe fallar)
fetch('/api/favorites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ propertyId: '123' })
}).then(r => r.json()).then(console.log)
// ✅ Debe retornar 401 Unauthorized

// TEST 4: Ver mensajes (debe fallar)
fetch('/api/messages').then(r => r.json()).then(console.log)
// ✅ Debe retornar 401 Unauthorized
```

**Verificar:**
- [ ] POST /api/properties/draft → 401
- [ ] GET /api/favorites → 401
- [ ] POST /api/favorites → 401
- [ ] GET /api/messages → 401
- [ ] PATCH /api/properties/[id] → 401
- [ ] DELETE /api/properties/[id] → 401

**✅ Si todas retornan 401:** Autenticación intacta

---

## 📋 TEST SUITE 4: Middleware de Rutas Protegidas

**Objetivo:** Verificar que middleware NO fue afectado

### 4.1 Rutas protegidas

**Pasos (modo incógnito):**

1. Intentar acceder a `/profile`
   - [ ] Redirect a `/login?redirect=/profile`

2. Intentar acceder a `/publicar`
   - [ ] Redirect a `/login?redirect=/publicar`

3. Intentar acceder a `/favorites`
   - [ ] Redirect a `/login?redirect=/favorites`

4. Intentar acceder a `/messages`
   - [ ] Redirect a `/login?redirect=/messages`

5. Intentar acceder a `/mi-cuenta`
   - [ ] Redirect a `/login?redirect=/mi-cuenta`

**✅ Si todas redirectean a login:** Middleware intacto

---

## 📋 TEST SUITE 5: Casos Edge

**Objetivo:** Verificar manejo de errores y casos límite

### 5.1 Propiedad sin imágenes

**Pasos:**
1. Crear propiedad sin fotos en BD (o encontrar una)
2. Ver en modo no-auth

**Verificar:**
- [ ] No hay crash
- [ ] Muestra placeholder image
- [ ] `imagesCount` es 0
- [ ] No muestra badge "+X fotos más"

### 5.2 Propiedad sin contacto

**Pasos:**
1. Crear propiedad sin datos de contacto
2. Ver en modo no-auth

**Verificar:**
- [ ] No hay crash
- [ ] ContactSection muestra "Información no disponible"
- [ ] No intenta enmascarar null

### 5.3 Teléfono corto (< 4 dígitos)

**Pasos:**
1. Propiedad con teléfono "123"
2. Ver en modo no-auth

**Verificar:**
- [ ] No hay crash
- [ ] Muestra "*** ***" o similar
- [ ] No rompe maskPhone()

### 5.4 Error en detectAuth()

**Simulación:** Desconectar Supabase temporalmente

**Verificar:**
- [ ] API no crashea
- [ ] Asume usuario no autenticado (fail-safe)
- [ ] Enmascara datos
- [ ] Log de error en consola

---

## 📋 TEST SUITE 6: Performance y UX

**Objetivo:** Verificar que no hay regresiones de performance

### 6.1 Tiempos de carga

**Con Network throttling (F12 → Network → Fast 3G):**

- [ ] Listado carga en < 3 segundos
- [ ] Detalle de propiedad carga en < 2 segundos
- [ ] Imágenes lazy-load correctamente
- [ ] No hay waterfalls innecesarios

### 6.2 Experiencia de usuario

- [ ] Transiciones suaves
- [ ] Badges de auth aparecen al hover (no intrusivos)
- [ ] Blur effect en ContactSection es legible
- [ ] CTAs de "Inicia sesión" son claros
- [ ] No hay layout shifts molestos

---

## 📋 TEST SUITE 7: SEO y Metadatos

**Objetivo:** Verificar que SEO funciona correctamente

### 7.1 Verificar HTML renderizado (View Source)

**Pasos:**
1. Modo incógnito, ir a `/properties/[id]`
2. Click derecho → "View Page Source"

**Verificar que en el HTML hay:**
- [ ] Tags `<title>` con información de la propiedad
- [ ] Meta description
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] JSON-LD schema para RealEstateListing
- [ ] Datos de contacto NO están en el HTML source (seguridad)

### 7.2 Lighthouse Audit

**Pasos:**
1. F12 → Lighthouse tab
2. Run audit (Mobile)

**Verificar:**
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] SEO > 90

---

## 🐛 REGISTRO DE BUGS

| # | Descripción | Severidad | Pasos para reproducir | Status |
|---|-------------|-----------|----------------------|--------|
| 1 |             |           |                      |        |
| 2 |             |           |                      |        |
| 3 |             |           |                      |        |

**Severidades:**
- 🔴 Crítico: Bloquea el feature o rompe funcionalidad existente
- 🟡 Alto: Problema significativo pero tiene workaround
- 🟢 Medio: Problema menor, cosmético
- ⚪ Bajo: Nice to have

---

## ✅ APROBACIÓN FINAL

**Completar después de ejecutar TODOS los tests:**

### Resultados

- [ ] TEST SUITE 1: Feature Flag OFF → ✅ Pasa
- [ ] TEST SUITE 2: Feature Flag ON → ✅ Pasa
- [ ] TEST SUITE 3: APIs Protegidas → ✅ Pasa
- [ ] TEST SUITE 4: Middleware → ✅ Pasa
- [ ] TEST SUITE 5: Casos Edge → ✅ Pasa
- [ ] TEST SUITE 6: Performance → ✅ Pasa
- [ ] TEST SUITE 7: SEO → ✅ Pasa

### Decisión

- [ ] ✅ **APROBADO para producción** - Todos los tests pasaron
- [ ] ⚠️ **APROBADO con reservas** - Bugs menores documentados
- [ ] ❌ **RECHAZADO** - Bugs críticos encontrados

**Tester:** _______________
**Fecha:** _______________
**Firma:** _______________

### Próximos pasos

- [ ] Merge a `main`
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Deploy a producción con flag OFF
- [ ] Activar feature flag en producción
- [ ] Monitoreo 24-48h

---

**Notas adicionales:**

```
[Espacio para notas del tester]








```
