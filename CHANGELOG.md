# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-01-xx] Fix Pack — Detalle de Propiedad & Filtros

### Added
- SEO avanzado en `/properties/[id]`: `openGraph`, `twitter` y JSON-LD dinámico.
- Fallback de imágenes: usa bucket `properties/{id}/**` cuando `property.images` está vacío (también en `generateMetadata`).
- Paginación completa en `/properties`: componente `Pagination` + sincronización `limit/offset` en URL.
- Guards ILIKE (mín. 2 chars) para `city` y `province`.
- Reportes y scripts de QA: `test-property-images-fallback.js`, suites de filtros/paginación.

### Changed
- Página de detalle migrada a Server Component con `notFound()` en 404 reales.
- `PropertyDetailClient`: handler `onError` oculta imágenes rotas (UI limpia).
- API `/api/properties/[id]`: filtros de seguridad (`status='PUBLISHED'` + `isActive`/`is_active`).

### Fixed
- Whitelist de ordenamiento: se agregó `id`, y se validan `createdAt|price|id`.
- Mapeo de filtros: `priceMin/priceMax`, `bedroomsMin`, `bathroomsMin` (frontend ↔ API).
- Tipos TS y manejadores de eventos en `properties-client.tsx`.

### Security
- **ID guard** en `/api/properties/[id]`: solo UUID o CUID válidos → resto 404.

### Performance
- Índices recomendados (SQL): trigram GIN para `city/province`, BTREE para `id`, `created_at`, `price`, `bedrooms`, `bathrooms`, `area`.
- ILIKE guards evitan consultas costosas con términos cortos.

### Breaking changes
- Ninguna.

### Migration notes
- Ejecutar `sql/2025-idx-properties.sql` en Supabase (idempotente).
