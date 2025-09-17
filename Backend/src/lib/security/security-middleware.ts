import { NextRequest, NextResponse } from 'next/server'
import { auditLogger, getRequestInfo } from './audit-logger'
import { applySecurityHeaders } from './security-headers'
import { performanceMonitor } from '../monitoring/performance-monitor'

interface SecurityConfig {
  rateLimiting: {
    enabled: boolean
    windowMs?: number
    maxRequests?: number
    skipSuccessfulRequests?: boolean
  }
  auditLogging: {
    enabled: boolean
    logAllRequests?: boolean
    logFailedOnly?: boolean
  }
  securityHeaders: {
    enabled: boolean
    strictMode?: boolean
  }
  performanceMonitoring: {
    enabled: boolean
    alertThresholds?: {
      slowRequestMs?: number
      errorRate?: number
    }
  }
  ipWhitelist?: string[]
  ipBlacklist?: string[]
  userAgentBlacklist?: RegExp[]
  pathProtection?: {
    adminPaths?: string[]
    apiPaths?: string[]
    requireAuth?: boolean
  }
}

const DEFAULT_CONFIG: SecurityConfig = {
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    skipSuccessfulRequests: false
  },
  auditLogging: {
    enabled: true,
    logAllRequests: true,
    logFailedOnly: false
  },
  securityHeaders: {
    enabled: true,
    strictMode: false
  },
  performanceMonitoring: {
    enabled: true,
    alertThresholds: {
      slowRequestMs: 2000,
      errorRate: 0.05
    }
  },
  userAgentBlacklist: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ],
  pathProtection: {
    adminPaths: ['/admin', '/api/admin'],
    apiPaths: ['/api'],
    requireAuth: false
  }
}

export class SecurityMiddleware {
  private config: SecurityConfig
  private blockedIPs: Set<string> = new Set()
  private suspiciousActivity: Map<string, number> = new Map()
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Limpiar actividad sospechosa cada hora
    setInterval(() => {
      this.suspiciousActivity.clear()
      this.cleanupRequestCounts()
    }, 60 * 60 * 1000)
  }

  async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const { ip, userAgent } = getRequestInfo(request)
    const path = request.nextUrl.pathname
    const method = request.method

    try {
      // 1. Verificar IP bloqueada
      if (this.isIPBlocked(ip)) {
        auditLogger.logSecurity('blocked_ip_access', ip, userAgent, {
          path,
          method,
          reason: 'IP in blocklist'
        })
        return this.createBlockedResponse('IP blocked')
      }

      // 2. Verificar User-Agent sospechoso
      if (this.isSuspiciousUserAgent(userAgent)) {
        this.recordSuspiciousActivity(ip)
        auditLogger.logSecurity('suspicious_user_agent', ip, userAgent, {
          path,
          method,
          userAgent
        })

        if (this.shouldBlockIP(ip)) {
          this.blockIP(ip)
          return this.createBlockedResponse('Suspicious activity detected')
        }
      }

      // 3. Rate Limiting simple
      if (this.config.rateLimiting.enabled) {
        const rateLimitResult = this.checkRateLimit(ip)

        if (!rateLimitResult.allowed) {
          auditLogger.logSecurity('rate_limit_exceeded', ip, userAgent, {
            path,
            method,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          })

          return this.createRateLimitResponse(rateLimitResult)
        }
      }

      // 4. Protección de rutas
      const pathProtectionResult = this.checkPathProtection(request)
      if (!pathProtectionResult.allowed) {
        auditLogger.logSecurity('unauthorized_path_access', ip, userAgent, {
          path,
          method,
          reason: pathProtectionResult.reason
        })
        return this.createUnauthorizedResponse(pathProtectionResult.reason || 'Unauthorized')
      }

      // 5. Continuar con la request
      const response = NextResponse.next()

      // 6. Aplicar headers de seguridad
      if (this.config.securityHeaders.enabled) {
        applySecurityHeaders(response, {
          strictTransportSecurity: { enabled: this.config.securityHeaders.strictMode || false }
        })
      }

      // 7. Logging de auditoría
      if (this.config.auditLogging.enabled) {
        const duration = Date.now() - startTime

        if (this.config.auditLogging.logAllRequests ||
            (this.config.auditLogging.logFailedOnly && response.status >= 400)) {

          auditLogger.log({
            action: `${method.toLowerCase()}.${path.replace(/\//g, '_')}`,
            resource: this.getResourceFromPath(path),
            ip,
            userAgent,
            details: {
              path,
              method,
              statusCode: response.status,
              duration,
              responseSize: response.headers.get('content-length') || 'unknown'
            },
            severity: response.status >= 400 ? 'medium' : 'low'
          })
        }
      }

      // 8. Monitoreo de performance
      if (this.config.performanceMonitoring.enabled) {
        performanceMonitor.recordMetric({
          route: path,
          method,
          duration: Date.now() - startTime,
          statusCode: response.status,
          userAgent,
          ip
        })
      }

      return response

    } catch (error) {
      // Log error crítico
      auditLogger.logSecurity('middleware_error', ip || 'unknown', userAgent || 'unknown', {
        path,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      // En caso de error, permitir la request pero logear
      console.error('Security middleware error:', error)
      return NextResponse.next()
    }
  }

  private checkRateLimit(ip: string): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now()
    const windowMs = this.config.rateLimiting.windowMs || 15 * 60 * 1000
    const maxRequests = this.config.rateLimiting.maxRequests || 100

    const key = ip
    const current = this.requestCounts.get(key)

    if (!current || now > current.resetTime) {
      // Nueva ventana de tiempo
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      })

      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: current.resetTime
      }
    }

    current.count++

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    }
  }

  private cleanupRequestCounts(): void {
    const now = Date.now()
    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key)
      }
    }
  }

  private isIPBlocked(ip: string): boolean {
    if (this.blockedIPs.has(ip)) return true
    if (this.config.ipBlacklist?.includes(ip)) return true
    if (this.config.ipWhitelist && !this.config.ipWhitelist.includes(ip)) return true
    return false
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    if (!this.config.userAgentBlacklist) return false
    return this.config.userAgentBlacklist.some(pattern => pattern.test(userAgent))
  }

  private recordSuspiciousActivity(ip: string): void {
    const current = this.suspiciousActivity.get(ip) || 0
    this.suspiciousActivity.set(ip, current + 1)
  }

  private shouldBlockIP(ip: string): boolean {
    const suspiciousCount = this.suspiciousActivity.get(ip) || 0
    return suspiciousCount >= 5 // Bloquear después de 5 actividades sospechosas
  }

  private blockIP(ip: string): void {
    this.blockedIPs.add(ip)

    // Auto-desbloquear después de 24 horas
    setTimeout(() => {
      this.blockedIPs.delete(ip)
      this.suspiciousActivity.delete(ip)
    }, 24 * 60 * 60 * 1000)
  }

  private checkPathProtection(request: NextRequest): { allowed: boolean; reason?: string } {
    const path = request.nextUrl.pathname
    const { pathProtection } = this.config

    if (!pathProtection) return { allowed: true }

    // Verificar rutas de admin
    if (pathProtection.adminPaths?.some(adminPath => path.startsWith(adminPath))) {
      // Aquí podrías verificar autenticación de admin
      if (pathProtection.requireAuth === true && !this.isAuthenticated(request)) {
        return { allowed: false, reason: 'Admin authentication required' }
      }
    }

    // Verificar rutas de API
    if (pathProtection.apiPaths?.some(apiPath => path.startsWith(apiPath))) {
      // Verificaciones adicionales para APIs
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        // Verificar CSRF token, API key, etc.
        if (!this.hasValidAPIAccess(request)) {
          return { allowed: false, reason: 'Invalid API access' }
        }
      }
    }

    return { allowed: true }
  }

  private isAuthenticated(request: NextRequest): boolean {
    // Implementar lógica de verificación de autenticación
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('session')

    return !!(authHeader || sessionCookie)
  }

  private hasValidAPIAccess(request: NextRequest): boolean {
    // Implementar lógica de verificación de acceso a API
    const apiKey = request.headers.get('x-api-key')
    const csrfToken = request.headers.get('x-csrf-token')

    // Por ahora, permitir si tiene algún tipo de token
    return !!(apiKey || csrfToken)
  }

  private getResourceFromPath(path: string): string {
    if (path.startsWith('/api/')) return 'api'
    if (path.startsWith('/admin/')) return 'admin'
    if (path.startsWith('/auth/')) return 'auth'
    if (path.startsWith('/properties/')) return 'properties'
    if (path.startsWith('/comunidad/')) return 'community'
    return 'web'
  }

  private createBlockedResponse(reason: string): NextResponse {
    return new NextResponse(
      JSON.stringify({
        error: 'Access Denied',
        message: reason,
        timestamp: new Date().toISOString()
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  private createRateLimitResponse(rateLimitResult: any): NextResponse {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    )

    // Headers estándar de rate limiting
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())

    return response
  }

  private createUnauthorizedResponse(reason: string): NextResponse {
    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: reason,
        timestamp: new Date().toISOString()
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Métodos públicos para configuración dinámica
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  addBlockedIP(ip: string): void {
    this.blockedIPs.add(ip)
  }

  removeBlockedIP(ip: string): void {
    this.blockedIPs.delete(ip)
    this.suspiciousActivity.delete(ip)
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs)
  }

  getSuspiciousActivity(): Array<{ ip: string; count: number }> {
    return Array.from(this.suspiciousActivity.entries()).map(([ip, count]) => ({ ip, count }))
  }

  // Método para obtener estadísticas de seguridad
  getSecurityStats(): {
    blockedIPs: number
    suspiciousActivity: number
    rateLimitHits: number
    totalRequests: number
  } {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, data) => sum + data.count, 0)
    const rateLimitHits = Array.from(this.requestCounts.values()).filter(data => data.count >= (this.config.rateLimiting.maxRequests || 100)).length

    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousActivity: this.suspiciousActivity.size,
      rateLimitHits,
      totalRequests
    }
  }
}

// Instancia por defecto
export const securityMiddleware = new SecurityMiddleware()

// Función helper para usar en middleware.ts de Next.js
export function createSecurityMiddleware(config?: Partial<SecurityConfig>) {
  const middleware = new SecurityMiddleware(config)

  return async (request: NextRequest) => {
    return middleware.handle(request)
  }
}

// Configuraciones predefinidas
export const SECURITY_PRESETS = {
  development: {
    rateLimiting: { enabled: false },
    auditLogging: { enabled: true, logAllRequests: false },
    securityHeaders: { enabled: true, strictMode: false },
    performanceMonitoring: { enabled: true }
  },

  production: {
    rateLimiting: { enabled: true, maxRequests: 60, windowMs: 15 * 60 * 1000 },
    auditLogging: { enabled: true, logAllRequests: true },
    securityHeaders: { enabled: true, strictMode: true },
    performanceMonitoring: { enabled: true },
    pathProtection: { requireAuth: true }
  },

  strict: {
    rateLimiting: { enabled: true, maxRequests: 30, windowMs: 15 * 60 * 1000 },
    auditLogging: { enabled: true, logAllRequests: true },
    securityHeaders: { enabled: true, strictMode: true },
    performanceMonitoring: { enabled: true },
    pathProtection: { requireAuth: true },
    userAgentBlacklist: [
      /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i
    ] as RegExp[]
  }
} as const

// Función para aplicar preset
export function createSecurityMiddlewareWithPreset(
  preset: keyof typeof SECURITY_PRESETS,
  overrides?: Partial<SecurityConfig>
) {
  const config = { ...SECURITY_PRESETS[preset], ...overrides }
  return new SecurityMiddleware(config)
}
