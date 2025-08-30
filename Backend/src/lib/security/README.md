# Sistema de Seguridad Integral - Misiones Arrienda

Este directorio contiene un sistema de seguridad completo e integrado para la plataforma Misiones Arrienda, diseñado para proteger contra múltiples tipos de amenazas y vulnerabilidades.

## 📋 Componentes del Sistema

### 1. Rate Limiter (`rate-limiter.ts`)
**Propósito**: Prevenir ataques de fuerza bruta y abuso de recursos mediante limitación de velocidad.

**Características**:
- Límites configurables por IP y endpoint
- Ventanas de tiempo deslizantes
- Diferentes límites para diferentes tipos de operaciones
- Almacenamiento en memoria con limpieza automática
- Headers estándar de rate limiting

**Uso**:
```typescript
import { rateLimit } from './rate-limiter'

// Aplicar rate limiting a una ruta
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5 // máximo 5 requests por ventana
  })(request)
  
  if (rateLimitResponse) {
    return rateLimitResponse // Rate limit excedido
  }
  
  // Continuar con la lógica normal
}
```

### 2. Audit Logger (`audit-logger.ts`)
**Propósito**: Registro completo de actividades para auditoría y detección de amenazas.

**Características**:
- Logging estructurado con niveles de severidad
- Registro de eventos de seguridad específicos
- Información detallada de requests (IP, User-Agent, etc.)
- Rotación automática de logs
- Búsqueda y filtrado de eventos

**Uso**:
```typescript
import { auditLogger } from './audit-logger'

// Registrar evento de seguridad
auditLogger.logSecurity('failed_login', ip, userAgent, {
  email: 'user@example.com',
  reason: 'Invalid password'
})

// Registrar actividad general
auditLogger.log({
  action: 'property.create',
  resource: 'properties',
  ip,
  userAgent,
  details: { propertyId: '123' },
  severity: 'low'
})
```

### 3. File Validator (`file-validator.ts`)
**Propósito**: Validación segura de archivos subidos para prevenir malware y ataques.

**Características**:
- Validación de tipos MIME reales (no solo extensiones)
- Detección de archivos maliciosos
- Límites de tamaño configurables
- Sanitización de nombres de archivo
- Validación de imágenes con análisis de contenido

**Uso**:
```typescript
import { validateFile, validateImage } from './file-validator'

// Validar archivo general
const fileValidation = await validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
})

if (!fileValidation.isValid) {
  return new Response(JSON.stringify({ 
    error: fileValidation.errors 
  }), { status: 400 })
}

// Validar imagen específicamente
const imageValidation = await validateImage(imageFile, {
  maxWidth: 2000,
  maxHeight: 2000,
  minWidth: 100,
  minHeight: 100
})
```

### 4. Security Headers (`security-headers.ts`)
**Propósito**: Aplicar headers de seguridad HTTP para proteger contra ataques web comunes.

**Características**:
- Content Security Policy (CSP) configurable
- Strict Transport Security (HSTS)
- Protección contra clickjacking (X-Frame-Options)
- Prevención de MIME sniffing
- Políticas de permisos y referrer
- Configuraciones predefinidas para diferentes entornos

**Uso**:
```typescript
import { applySecurityHeaders, SecurityHeaders } from './security-headers'

// Aplicar headers por defecto
const response = NextResponse.json({ data: 'example' })
applySecurityHeaders(response)

// Configuración personalizada
const securityHeaders = new SecurityHeaders({
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"]
    }
  }
})

securityHeaders.applyToResponse(response)
```

### 5. Performance Monitor (`../monitoring/performance-monitor.ts`)
**Propósito**: Monitoreo de rendimiento y detección de anomalías.

**Características**:
- Medición automática de tiempo de respuesta
- Monitoreo de uso de memoria
- Alertas configurables por rendimiento
- Estadísticas detalladas (P95, P99, etc.)
- Identificación de endpoints lentos

**Uso**:
```typescript
import { performanceMonitor, measureAsync } from '../monitoring/performance-monitor'

// Medir función automáticamente
const result = await measureAsync('database-query', async () => {
  return await db.property.findMany()
})

// Obtener estadísticas
const stats = performanceMonitor.getStats('hour')
console.log(`Tiempo promedio: ${stats.averageResponseTime}ms`)
```

### 6. Security Middleware (`security-middleware.ts`)
**Propósito**: Middleware integrado que combina todos los sistemas de seguridad.

**Características**:
- Integración de todos los componentes de seguridad
- Configuración centralizada
- Presets para diferentes entornos
- Bloqueo automático de IPs sospechosas
- Protección de rutas sensibles

**Uso**:
```typescript
// En middleware.ts de Next.js
import { createSecurityMiddleware, SECURITY_PRESETS } from './lib/security/security-middleware'

const securityMiddleware = createSecurityMiddleware(SECURITY_PRESETS.production)

export async function middleware(request: NextRequest) {
  return await securityMiddleware(request)
}
```

## 🚀 Configuración Rápida

### 1. Configuración Básica
```typescript
// middleware.ts
import { createSecurityMiddleware } from './src/lib/security/security-middleware'

export async function middleware(request: NextRequest) {
  const security = createSecurityMiddleware({
    rateLimiting: { enabled: true, maxRequests: 100 },
    auditLogging: { enabled: true },
    securityHeaders: { enabled: true },
    performanceMonitoring: { enabled: true }
  })
  
  return await security(request)
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 2. Configuración por Entorno
```typescript
// Desarrollo
const devSecurity = createSecurityMiddleware(SECURITY_PRESETS.development)

// Producción
const prodSecurity = createSecurityMiddleware(SECURITY_PRESETS.production)

// Estricto (máxima seguridad)
const strictSecurity = createSecurityMiddleware(SECURITY_PRESETS.strict)
```

### 3. Configuración de API Routes
```typescript
// app/api/properties/route.ts
import { rateLimit } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'

export async function POST(request: NextRequest) {
  // Rate limiting específico para creación de propiedades
  const rateLimitResponse = await rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5 // máximo 5 propiedades por minuto
  })(request)
  
  if (rateLimitResponse) return rateLimitResponse
  
  try {
    // Lógica de creación
    const property = await createProperty(data)
    
    // Auditoría exitosa
    auditLogger.log({
      action: 'property.create',
      resource: 'properties',
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      details: { propertyId: property.id },
      severity: 'low'
    })
    
    return NextResponse.json(property)
  } catch (error) {
    // Auditoría de error
    auditLogger.logSecurity('property_creation_failed', 
      getClientIP(request), 
      request.headers.get('user-agent'), 
      { error: error.message }
    )
    
    throw error
  }
}
```

## 🔧 Configuraciones Avanzadas

### Content Security Policy Personalizada
```typescript
const customCSP = new SecurityHeaders({
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Solo para desarrollo
        'https://sdk.mercadopago.com',
        'https://js.stripe.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https://images.unsplash.com',
        'https://res.cloudinary.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.mercadopago.com',
        process.env.NEXT_PUBLIC_SUPABASE_URL
      ]
    }
  }
})
```

### Rate Limiting Granular
```typescript
// Diferentes límites por tipo de operación
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5 // máximo 5 intentos de login
})

const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 60 // 60 requests por minuto para API general
})

const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10 // máximo 10 uploads por minuto
})
```

### Monitoreo y Alertas
```typescript
import { performanceMonitor } from './monitoring/performance-monitor'

// Configurar alertas personalizadas
performanceMonitor.onAlert((alert) => {
  if (alert.severity === 'critical') {
    // Enviar notificación inmediata
    sendSlackAlert(alert)
    sendEmailAlert(alert)
  }
})

// Configurar thresholds personalizados
performanceMonitor.setThresholds({
  slowRequestMs: 1000, // Alertar si request > 1s
  verySlowRequestMs: 3000, // Crítico si request > 3s
  highMemoryMB: 256, // Alertar si memoria > 256MB
  criticalMemoryMB: 512 // Crítico si memoria > 512MB
})
```

## 📊 Monitoreo y Métricas

### Dashboard de Seguridad
```typescript
// app/admin/security/page.tsx
import { auditLogger } from '@/lib/security/audit-logger'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { securityMiddleware } from '@/lib/security/security-middleware'

export default async function SecurityDashboard() {
  const securityEvents = auditLogger.getRecentEvents(24) // Últimas 24 horas
  const performanceStats = performanceMonitor.getStats('day')
  const securityStats = securityMiddleware.getSecurityStats()
  
  return (
    <div>
      <h1>Dashboard de Seguridad</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2>Eventos de Seguridad</h2>
          <p>Eventos críticos: {securityEvents.filter(e => e.severity === 'critical').length}</p>
          <p>IPs bloqueadas: {securityStats.blockedIPs}</p>
        </div>
        
        <div>
          <h2>Performance</h2>
          <p>Tiempo promedio: {performanceStats.averageResponseTime}ms</p>
          <p>Rate limit hits: {securityStats.rateLimitHits}</p>
        </div>
        
        <div>
          <h2>Actividad Sospechosa</h2>
          <p>IPs sospechosas: {securityStats.suspiciousActivity}</p>
        </div>
      </div>
    </div>
  )
}
```

## 🛡️ Mejores Prácticas

### 1. Configuración por Entorno
- **Desarrollo**: Logging habilitado, rate limiting relajado
- **Staging**: Configuración similar a producción pero menos estricta
- **Producción**: Máxima seguridad, logging completo, rate limiting estricto

### 2. Monitoreo Continuo
- Revisar logs de seguridad diariamente
- Configurar alertas para eventos críticos
- Monitorear métricas de performance regularmente

### 3. Actualizaciones Regulares
- Revisar y actualizar CSP según nuevos recursos
- Ajustar rate limits según patrones de uso
- Actualizar listas de User-Agents sospechosos

### 4. Respuesta a Incidentes
- Procedimientos claros para bloqueo de IPs
- Escalación automática para eventos críticos
- Backup y recuperación de logs de auditoría

## 🔍 Troubleshooting

### Problemas Comunes

**1. CSP bloqueando recursos legítimos**
```typescript
// Agregar dominios necesarios a CSP
'script-src': [
  "'self'",
  'https://nuevo-dominio-confiable.com'
]
```

**2. Rate limiting muy agresivo**
```typescript
// Ajustar límites según uso real
rateLimiting: {
  enabled: true,
  maxRequests: 200, // Incrementar límite
  windowMs: 15 * 60 * 1000
}
```

**3. Logs ocupando mucho espacio**
```typescript
// Configurar rotación más frecuente
auditLogger.setMaxEvents(5000) // Reducir eventos almacenados
```

## 📈 Métricas de Éxito

- **Reducción de ataques**: Monitorear intentos de fuerza bruta bloqueados
- **Performance**: Mantener tiempo de respuesta < 200ms para 95% de requests
- **Disponibilidad**: Uptime > 99.9%
- **Detección**: Tiempo de detección de amenazas < 5 minutos

## 🔄 Roadmap Futuro

1. **Integración con WAF externo** (Cloudflare, AWS WAF)
2. **Machine Learning para detección de anomalías**
3. **Integración con SIEM** (Security Information and Event Management)
4. **Autenticación multifactor obligatoria**
5. **Análisis de comportamiento de usuarios**

---

Este sistema de seguridad proporciona una base sólida para proteger la plataforma Misiones Arrienda contra las amenazas más comunes, mientras mantiene la flexibilidad para adaptarse a nuevos requisitos de seguridad.
