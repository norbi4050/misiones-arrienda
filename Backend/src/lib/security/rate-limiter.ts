import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message: string
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    
    // Limpiar entradas expiradas
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
    
    const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + config.windowMs }
    
    if (current.resetTime < now) {
      current.count = 1
      current.resetTime = now + config.windowMs
    } else {
      current.count++
    }
    
    rateLimitStore.set(ip, current)
    
    if (current.count > config.maxRequests) {
      return new Response(JSON.stringify({ 
        error: config.message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
        }
      })
    }
    
    return null // Continuar con la request
  }
}

// Configuraciones específicas por tipo de endpoint
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  message: 'Demasiadas solicitudes a la API. Intenta de nuevo en 15 minutos.'
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10,
  message: 'Demasiadas subidas de archivos. Intenta de nuevo en 1 minuto.'
})

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30,
  message: 'Demasiadas búsquedas. Intenta de nuevo en 1 minuto.'
})
