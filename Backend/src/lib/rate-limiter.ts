/**
 * Rate Limiter para APIs de Misiones Arrienda
 * Implementa límites de velocidad para prevenir abuso
 */

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo número de requests por ventana
  keyGenerator?: (request: Request) => string; // Función para generar clave única
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en memoria para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Limpia entradas expiradas del store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Genera clave por defecto basada en IP
 */
function defaultKeyGenerator(request: Request): string {
  // En desarrollo, usar un identificador fijo
  if (process.env.NODE_ENV === 'development') {
    return 'dev-user';
  }
  
  // Intentar obtener IP real
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Middleware de rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator } = config;

  return function rateLimiter(request: Request): {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    error?: string;
  } {
    // Limpiar entradas expiradas periódicamente
    if (Math.random() < 0.1) { // 10% de probabilidad
      cleanupExpiredEntries();
    }

    const key = keyGenerator(request);
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Nueva ventana de tiempo
      entry = {
        count: 1,
        resetTime
      };
      rateLimitStore.set(key, entry);

      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime
      };
    }

    // Incrementar contador
    entry.count++;

    if (entry.count > maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        error: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`
      };
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  };
}

/**
 * Rate limiter específico para uploads de avatares
 * Límite: 5 uploads por minuto por usuario
 */
export const avatarUploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 5,
  keyGenerator: (request: Request) => {
    // Usar user ID si está disponible en headers
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return `avatar-upload:${userId}`;
    }
    return `avatar-upload:${defaultKeyGenerator(request)}`;
  }
});

/**
 * Rate limiter para requests generales de avatar
 * Límite: 30 requests por minuto por usuario
 */
export const avatarRequestLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30,
  keyGenerator: (request: Request) => {
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return `avatar-request:${userId}`;
    }
    return `avatar-request:${defaultKeyGenerator(request)}`;
  }
});

/**
 * Utility para agregar headers de rate limit a respuestas
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: ReturnType<ReturnType<typeof createRateLimiter>>
): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Middleware helper para Next.js API routes
 */
export function withRateLimit<T extends any[]>(
  rateLimiter: ReturnType<typeof createRateLimiter>,
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as Request;
    const rateLimitResult = rateLimiter(request);

    if (!rateLimitResult.success) {
      const errorResponse = new Response(
        JSON.stringify({
          error: rateLimitResult.error,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );

      return addRateLimitHeaders(errorResponse, rateLimitResult);
    }

    const response = await handler(...args);
    return addRateLimitHeaders(response, rateLimitResult);
  };
}
