# API Properties con BBOX - Documentación

## Endpoint: GET /api/properties

### Descripción
Endpoint para obtener propiedades con soporte para filtros geográficos (BBOX), filtros tradicionales, paginación y ordenamiento.

### URL
```
GET /api/properties
```

### Parámetros de Query

#### Filtros Geográficos
- **bbox** (string, opcional): Bounding box en formato `minLng,minLat,maxLng,maxLat`
  - Ejemplo: `bbox=-56,-28,-54,-26` (área que cubre gran parte de Misiones)

#### Filtros Tradicionales
- **city** (string, opcional): Filtrar por ciudad (búsqueda parcial)
- **type** (string, opcional): Tipo de propiedad (`HOUSE`, `APARTMENT`, `COMMERCIAL`, `LAND`, `OFFICE`, `WAREHOUSE`, `PH`, `STUDIO`)
- **minPrice** (number, opcional): Precio mínimo
- **maxPrice** (number, opcional): Precio máximo
- **bedrooms** (number, opcional): Número exacto de dormitorios
- **bathrooms** (number, opcional): Número exacto de baños
- **minArea** (number, opcional): Área mínima en m²
- **maxArea** (number, opcional): Área máxima en m²
- **amenities** (string, opcional): Amenidades separadas por comas
- **featured** (boolean, opcional): Solo propiedades destacadas (`true`)

#### Paginación y Ordenamiento
- **page** (number, opcional): Número de página (default: 1)
- **limit** (number, opcional): Elementos por página (default: 12, max: 100)
- **sortBy** (string, opcional): Campo de ordenamiento (default: `createdAt`)
- **sortOrder** (string, opcional): Orden `asc` o `desc` (default: `desc`)

### Ejemplos de Uso

#### 1. Búsqueda básica con BBOX
```bash
GET /api/properties?bbox=-56,-28,-54,-26&limit=10
```

#### 2. Filtros combinados: ubicación + precio + tipo
```bash
GET /api/properties?bbox=-55.9,-27.4,-55.8,-27.3&minPrice=100000&maxPrice=200000&type=HOUSE
```

#### 3. Propiedades destacadas en área específica
```bash
GET /api/properties?bbox=-55.9,-27.4,-55.8,-27.3&featured=true
```

#### 4. Búsqueda por ciudad con paginación
```bash
GET /api/properties?city=Posadas&page=2&limit=20&sortBy=price&sortOrder=asc
```

#### 5. Filtros avanzados
```bash
GET /api/properties?bedrooms=3&bathrooms=2&minArea=100&amenities=garage,garden&sortBy=price
```

### Respuesta

#### Estructura de Respuesta Exitosa (200)
```json
{
  "properties": [
    {
      "id": "1",
      "title": "Casa en Posadas Centro",
      "description": "Hermosa casa de 3 dormitorios...",
      "price": 150000,
      "currency": "ARS",
      "propertyType": "HOUSE",
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 120,
      "address": "Av. Mitre 1234",
      "city": "Posadas",
      "province": "Misiones",
      "country": "Argentina",
      "lat": -27.3676,
      "lng": -55.8961,
      "featured": true,
      "images": ["/placeholder-house-1.jpg"],
      "amenities": ["garage", "garden"],
      "contact_name": "Juan Pérez",
      "contact_phone": "+54 376 123456",
      "contact_email": "juan@example.com",
      "status": "AVAILABLE",
      "createdAt": "2025-01-03T15:00:00.000Z",
      "updatedAt": "2025-01-03T15:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 25,
    "totalPages": 3
  },
  "meta": {
    "dataSource": "supabase",
    "filters": {
      "city": null,
      "type": null,
      "minPrice": null,
      "maxPrice": null,
      "bedrooms": null,
      "bathrooms": null,
      "minArea": null,
      "maxArea": null,
      "amenities": null,
      "featured": null,
      "bbox": {
        "minLng": -56,
        "minLat": -28,
        "maxLng": -54,
        "maxLat": -26
      }
    },
    "sorting": {
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

#### Respuesta de Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "BBOX must be in format: minLng,minLat,maxLng,maxLat"
    }
  ],
  "timestamp": "2025-01-03T15:00:00.000Z"
}
```

#### Respuesta de Error (500)
```json
{
  "error": "Internal server error",
  "details": "Database connection failed",
  "timestamp": "2025-01-03T15:00:00.000Z"
}
```

### Coordenadas de Referencia - Misiones

#### Ciudades Principales
- **Posadas**: lat: -27.3676, lng: -55.8961
- **Puerto Iguazú**: lat: -25.5947, lng: -54.5734
- **Oberá**: lat: -27.4878, lng: -55.1199
- **Eldorado**: lat: -26.4009, lng: -54.6156
- **Leandro N. Alem**: lat: -27.6011, lng: -55.3206

#### BBOX de Ejemplo para Misiones Completa
```
bbox=-56.5,-28.5,-53.5,-25.0
```

### Optimización y Performance

#### Índices Requeridos
Para óptimo rendimiento, ejecutar:
```sql
-- Ver sql-audit/CREATE-INDEXES-GEO.sql
CREATE INDEX idx_properties_geo_coords ON properties (lat, lng) WHERE status = 'AVAILABLE';
CREATE INDEX idx_properties_geo_price ON properties (lat, lng, price) WHERE status = 'AVAILABLE';
```

#### Límites Recomendados
- **limit**: Máximo 100 elementos por página
- **BBOX**: Área no mayor a 5° x 5° para evitar timeouts
- **Filtros combinados**: Máximo 5 filtros simultáneos

### Casos de Uso Típicos

#### Para Mapa Interactivo
1. **Carga inicial**: `GET /api/properties?bbox=<viewport>&limit=50`
2. **Zoom/Pan**: `GET /api/properties?bbox=<new_viewport>&limit=50`
3. **Filtro precio**: `GET /api/properties?bbox=<viewport>&minPrice=X&maxPrice=Y`

#### Para Listado con Filtros
1. **Página inicial**: `GET /api/properties?limit=12`
2. **Filtro ciudad**: `GET /api/properties?city=Posadas&limit=12`
3. **Paginación**: `GET /api/properties?city=Posadas&page=2&limit=12`

### Notas Técnicas

- **Fallback**: Si Supabase falla, usa datos mock con coordenadas predefinidas
- **Validación**: BBOX debe tener exactamente 4 coordenadas válidas
- **Ordenamiento**: Soporta ordenamiento por cualquier campo de la propiedad
- **Filtros**: Todos los filtros son opcionales y se pueden combinar
- **Coordenadas**: lat/lng son decimales con precisión de 8 dígitos
