import { NextResponse } from 'next/server'

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    enabled: boolean
    directives?: Record<string, string[]>
    reportOnly?: boolean
  }
  strictTransportSecurity?: {
    enabled: boolean
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  xFrameOptions?: {
    enabled: boolean
    value?: 'DENY' | 'SAMEORIGIN' | string
  }
  xContentTypeOptions?: {
    enabled: boolean
  }
  referrerPolicy?: {
    enabled: boolean
    value?: string
  }
  permissionsPolicy?: {
    enabled: boolean
    directives?: Record<string, string[]>
  }
  crossOriginEmbedderPolicy?: {
    enabled: boolean
    value?: 'unsafe-none' | 'require-corp'
  }
  crossOriginOpenerPolicy?: {
    enabled: boolean
    value?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin'
  }
  crossOriginResourcePolicy?: {
    enabled: boolean
    value?: 'same-site' | 'same-origin' | 'cross-origin'
  }
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://sdk.mercadopago.com',
        'https://www.mercadopago.com',
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://maps.googleapis.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://connect.facebook.net',
        'https://www.facebook.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'http:',
        'https://images.unsplash.com',
        'https://res.cloudinary.com',
        'https://www.facebook.com',
        'https://www.google-analytics.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      'connect-src': [
        "'self'",
        'https://api.mercadopago.com',
        'https://api.stripe.com',
        'https://maps.googleapis.com',
        'https://www.google-analytics.com',
        'https://vitals.vercel-insights.com',
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_API_URL || ''
      ].filter(Boolean),
      'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://www.mercadopago.com',
        'https://www.facebook.com'
      ],
      'worker-src': ["'self'", 'blob:'],
      'child-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: {
    enabled: true,
    value: 'DENY'
  },
  xContentTypeOptions: {
    enabled: true
  },
  referrerPolicy: {
    enabled: true,
    value: 'strict-origin-when-cross-origin'
  },
  permissionsPolicy: {
    enabled: true,
    directives: {
      'camera': [],
      'microphone': [],
      'geolocation': ["'self'"],
      'payment': ["'self'", 'https://js.stripe.com', 'https://www.mercadopago.com'],
      'fullscreen': ["'self'"],
      'display-capture': [],
      'web-share': ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: {
    enabled: false, // Puede causar problemas con algunos recursos externos
    value: 'unsafe-none'
  },
  crossOriginOpenerPolicy: {
    enabled: true,
    value: 'same-origin-allow-popups'
  },
  crossOriginResourcePolicy: {
    enabled: true,
    value: 'cross-origin'
  }
}

export class SecurityHeaders {
  private config: SecurityHeadersConfig

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config)
  }

  private mergeConfig(defaultConfig: SecurityHeadersConfig, userConfig: Partial<SecurityHeadersConfig>): SecurityHeadersConfig {
    const merged = { ...defaultConfig }
    
    for (const [key, value] of Object.entries(userConfig)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof SecurityHeadersConfig] = {
          ...defaultConfig[key as keyof SecurityHeadersConfig],
          ...value
        } as any
      } else {
        merged[key as keyof SecurityHeadersConfig] = value as any
      }
    }
    
    return merged
  }

  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // Content Security Policy
    if (this.config.contentSecurityPolicy?.enabled) {
      const csp = this.buildCSP(this.config.contentSecurityPolicy.directives || {})
      const headerName = this.config.contentSecurityPolicy.reportOnly 
        ? 'Content-Security-Policy-Report-Only' 
        : 'Content-Security-Policy'
      headers[headerName] = csp
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity?.enabled) {
      const hsts = this.buildHSTS(this.config.strictTransportSecurity)
      headers['Strict-Transport-Security'] = hsts
    }

    // X-Frame-Options
    if (this.config.xFrameOptions?.enabled) {
      headers['X-Frame-Options'] = this.config.xFrameOptions.value || 'DENY'
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions?.enabled) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // Referrer Policy
    if (this.config.referrerPolicy?.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.value || 'strict-origin-when-cross-origin'
    }

    // Permissions Policy
    if (this.config.permissionsPolicy?.enabled) {
      const permissionsPolicy = this.buildPermissionsPolicy(this.config.permissionsPolicy.directives || {})
      if (permissionsPolicy) {
        headers['Permissions-Policy'] = permissionsPolicy
      }
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy?.enabled) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy.value || 'unsafe-none'
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy?.enabled) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy.value || 'same-origin-allow-popups'
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy?.enabled) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy.value || 'cross-origin'
    }

    // Adicionales para seguridad
    headers['X-DNS-Prefetch-Control'] = 'off'
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'

    return headers
  }

  private buildCSP(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive
        }
        return `${directive} ${sources.join(' ')}`
      })
      .join('; ')
  }

  private buildHSTS(config: NonNullable<SecurityHeadersConfig['strictTransportSecurity']>): string {
    let hsts = `max-age=${config.maxAge || 31536000}`
    
    if (config.includeSubDomains) {
      hsts += '; includeSubDomains'
    }
    
    if (config.preload) {
      hsts += '; preload'
    }
    
    return hsts
  }

  private buildPermissionsPolicy(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([directive, allowlist]) => {
        if (allowlist.length === 0) {
          return `${directive}=()`
        }
        return `${directive}=(${allowlist.join(' ')})`
      })
      .join(', ')
  }

  applyToResponse(response: NextResponse): NextResponse {
    const headers = this.generateHeaders()
    
    for (const [name, value] of Object.entries(headers)) {
      response.headers.set(name, value)
    }
    
    return response
  }

  // Método para crear headers específicos para diferentes tipos de contenido
  static forAPI(): SecurityHeaders {
    return new SecurityHeaders({
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'none'"],
          'frame-ancestors': ["'none'"]
        }
      },
      xFrameOptions: {
        enabled: true,
        value: 'DENY'
      }
    })
  }

  static forStaticAssets(): SecurityHeaders {
    return new SecurityHeaders({
      contentSecurityPolicy: {
        enabled: false // Los assets estáticos no necesitan CSP
      },
      crossOriginResourcePolicy: {
        enabled: true,
        value: 'cross-origin'
      }
    })
  }

  static forUpload(): SecurityHeaders {
    return new SecurityHeaders({
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'none'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"]
        }
      }
    })
  }

  // Método para validar la configuración
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar CSP
    if (this.config.contentSecurityPolicy?.enabled) {
      const directives = this.config.contentSecurityPolicy.directives || {}
      
      if (!directives['default-src'] || directives['default-src'].length === 0) {
        errors.push('CSP debe incluir default-src')
      }
      
      if (directives['script-src']?.includes("'unsafe-eval'") && process.env.NODE_ENV === 'production') {
        errors.push("'unsafe-eval' no debería usarse en producción")
      }
    }

    // Validar HSTS
    if (this.config.strictTransportSecurity?.enabled) {
      const maxAge = this.config.strictTransportSecurity.maxAge || 0
      if (maxAge < 31536000) { // 1 año mínimo recomendado
        errors.push('HSTS max-age debería ser al menos 31536000 (1 año)')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Instancia por defecto
export const defaultSecurityHeaders = new SecurityHeaders()

// Función helper para middleware
export function applySecurityHeaders(response: NextResponse, config?: Partial<SecurityHeadersConfig>): NextResponse {
  const securityHeaders = config ? new SecurityHeaders(config) : defaultSecurityHeaders
  return securityHeaders.applyToResponse(response)
}

// Función para generar nonce para CSP
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// Función para crear CSP con nonce
export function createCSPWithNonce(nonce: string): Partial<SecurityHeadersConfig> {
  return {
    contentSecurityPolicy: {
      enabled: true,
      directives: {
        ...DEFAULT_CONFIG.contentSecurityPolicy?.directives,
        'script-src': [
          "'self'",
          `'nonce-${nonce}'`,
          'https://sdk.mercadopago.com',
          'https://www.mercadopago.com',
          'https://js.stripe.com',
          'https://checkout.stripe.com'
        ]
      }
    }
  }
}
