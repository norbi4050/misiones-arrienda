/**
 * Sistema de logging centralizado con requestId y integración con servicios externos
 * Objetivo: Monitoreo y debugging mejorado
 */

import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

// Configuración de logging
export const LOGGING_CONFIG = {
  enableConsole: process.env.NODE_ENV === 'development',
  enableSentry: process.env.SENTRY_DSN !== undefined,
  enableLogflare: process.env.LOGFLARE_API_KEY !== undefined,
  logLevel: process.env.LOG_LEVEL || 'info'
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId: string
  method: string
  url: string
  userAgent?: string
  ip?: string
  userId?: string
  timestamp: string
  duration?: number
}

export interface LogData {
  level: LogLevel
  message: string
  context: LogContext
  data?: Record<string, any>
  error?: Error
}

class Logger {
  private static instance: Logger
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Genera un requestId único para tracking
   */
  generateRequestId(): string {
    return randomUUID()
  }

  /**
   * Extrae contexto de la request
   */
  extractContext(req: NextRequest, requestId?: string): LogContext {
    return {
      requestId: requestId || this.generateRequestId(),
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log a consola (desarrollo)
   */
  private logToConsole(logData: LogData) {
    if (!LOGGING_CONFIG.enableConsole) return

    const { level, message, context, data, error } = logData
    const prefix = `[${context.requestId.slice(0, 8)}] ${context.method} ${context.url}`
    
    const logMessage = `${prefix} - ${message}`
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, data)
        break
      case 'info':
        console.info(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      case 'error':
        console.error(logMessage, error || data)
        break
    }
  }

  /**
   * Envía logs a Sentry (errores)
   */
  private async logToSentry(logData: LogData) {
    if (!LOGGING_CONFIG.enableSentry || logData.level !== 'error') return

    try {
      // Importación dinámica para evitar errores si Sentry no está configurado
      const Sentry = await import('@sentry/nextjs').catch(() => null)
      if (!Sentry) return
      
      Sentry.withScope((scope: any) => {
        scope.setTag('requestId', logData.context.requestId)
        scope.setTag('method', logData.context.method)
        scope.setTag('url', logData.context.url)
        scope.setContext('request', logData.context)
        
        if (logData.data) {
          scope.setContext('data', this.sanitizeData(logData.data))
        }
        
        if (logData.error) {
          Sentry.captureException(logData.error)
        } else {
          Sentry.captureMessage(logData.message, 'error')
        }
      })
    } catch (error) {
      console.warn('Failed to log to Sentry:', error)
    }
  }

  /**
   * Envía logs a Logflare
   */
  private async logToLogflare(logData: LogData) {
    if (!LOGGING_CONFIG.enableLogflare) return

    try {
      const payload = {
        level: logData.level,
        message: logData.message,
        ...logData.context,
        data: logData.data ? this.sanitizeData(logData.data) : undefined,
        error: logData.error ? {
          name: logData.error.name,
          message: logData.error.message,
          stack: logData.error.stack
        } : undefined
      }

      await fetch('https://api.logflare.app/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.LOGFLARE_API_KEY!
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.warn('Failed to log to Logflare:', error)
    }
  }

  /**
   * Sanitiza datos sensibles antes de enviar a servicios externos
   */
  public sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'email']
    const sanitized = { ...data }

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      }

      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return sanitizeObject(sanitized)
  }

  /**
   * Método principal de logging
   */
  async log(logData: LogData) {
    // Log a consola
    this.logToConsole(logData)

    // Log a servicios externos (sin await para no bloquear)
    Promise.all([
      this.logToSentry(logData),
      this.logToLogflare(logData)
    ]).catch(error => {
      console.warn('Failed to log to external services:', error)
    })
  }

  /**
   * Métodos de conveniencia
   */
  async debug(message: string, context: LogContext, data?: Record<string, any>) {
    await this.log({ level: 'debug', message, context, data })
  }

  async info(message: string, context: LogContext, data?: Record<string, any>) {
    await this.log({ level: 'info', message, context, data })
  }

  async warn(message: string, context: LogContext, data?: Record<string, any>) {
    await this.log({ level: 'warn', message, context, data })
  }

  async error(message: string, context: LogContext, error?: Error, data?: Record<string, any>) {
    await this.log({ level: 'error', message, context, error, data })
  }
}

// Instancia singleton
export const logger = Logger.getInstance()

/**
 * Middleware para logging de requests
 */
export function withLogging<T>(
  handler: (req: NextRequest, context: LogContext) => Promise<T>
) {
  return async (req: NextRequest): Promise<T> => {
    const requestId = logger.generateRequestId()
    const context = logger.extractContext(req, requestId)
    const startTime = Date.now()

    try {
      await logger.info('Request started', context)
      
      const result = await handler(req, context)
      
      const duration = Date.now() - startTime
      await logger.info('Request completed', { ...context, duration })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      await logger.error(
        'Request failed', 
        { ...context, duration }, 
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }
}

/**
 * Utilidad para loggear filtros de búsqueda
 */
export async function logSearchFilters(
  context: LogContext, 
  filters: Record<string, any>,
  resultCount?: number,
  duration?: number
) {
  await logger.info('Search executed', context, {
    filters: logger.sanitizeData(filters),
    resultCount,
    duration
  })
}

/**
 * Utilidad para loggear operaciones de base de datos
 */
export async function logDatabaseOperation(
  context: LogContext,
  operation: string,
  table: string,
  duration?: number,
  affectedRows?: number
) {
  await logger.info('Database operation', context, {
    operation,
    table,
    duration,
    affectedRows
  })
}
