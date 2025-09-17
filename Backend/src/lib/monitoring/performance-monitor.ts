import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetric {
  timestamp: Date
  route: string
  method: string
  duration: number
  statusCode: number
  userAgent?: string
  ip?: string
  userId?: string
  memoryUsage?: NodeJS.MemoryUsage
  cpuUsage?: number
  responseSize?: number
  queryCount?: number
  cacheHits?: number
  cacheMisses?: number
}

interface PerformanceAlert {
  type: 'slow_request' | 'high_memory' | 'high_cpu' | 'error_rate' | 'database_slow'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metric: PerformanceMetric
  threshold: number
  value: number
}

interface PerformanceStats {
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerMinute: number
  errorRate: number
  memoryUsage: {
    current: number
    peak: number
    average: number
  }
  slowestEndpoints: Array<{
    route: string
    averageTime: number
    requestCount: number
  }>
  errorsByEndpoint: Record<string, number>
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private alerts: PerformanceAlert[] = []
  private maxMetrics = 10000 // Mantener últimas 10k métricas
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = []

  // Thresholds configurables
  private thresholds = {
    slowRequestMs: 2000,
    verySlowRequestMs: 5000,
    highMemoryMB: 512,
    criticalMemoryMB: 1024,
    highErrorRate: 0.05, // 5%
    criticalErrorRate: 0.1, // 10%
    highCpuPercent: 80,
    criticalCpuPercent: 95
  }

  private constructor() {
    // Limpiar métricas antiguas cada 5 minutos
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 5 * 60 * 1000)

    // Generar alertas cada minuto
    setInterval(() => {
      this.checkAlerts()
    }, 60 * 1000)
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'memoryUsage'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
      memoryUsage: process.memoryUsage()
    }

    this.metrics.push(fullMetric)

    // Mantener solo las últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Verificar alertas inmediatas
    this.checkImmediateAlerts(fullMetric)
  }

  // Middleware para medir performance automáticamente
  createMiddleware() {
    return async (request: NextRequest, response: NextResponse) => {
      const startTime = Date.now()
      const route = request.nextUrl.pathname
      const method = request.method

      // Información de la request
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // En Next.js, es más complejo interceptar el response body
      // Por ahora, omitimos el tamaño de respuesta
      const responseSize = 0

      // Cuando la respuesta esté lista
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)

      const duration = Date.now() - startTime

      this.recordMetric({
        route,
        method,
        duration,
        statusCode: response.status,
        userAgent,
        ip,
        responseSize
      })

      return response
    }
  }

  // Función para medir performance de funciones específicas
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - startTime

      this.recordMetric({
        route: `function:${name}`,
        method: 'FUNCTION',
        duration,
        statusCode: 200,
        ...metadata
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      this.recordMetric({
        route: `function:${name}`,
        method: 'FUNCTION',
        duration,
        statusCode: 500,
        ...metadata
      })

      throw error
    }
  }

  // Medir performance de queries de base de datos
  async measureDatabaseQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.measureFunction(`db:${query.substring(0, 50)}`, fn, {
      queryType: 'database'
    })
  }

  private checkImmediateAlerts(metric: PerformanceMetric) {
    // Alert por request lenta
    if (metric.duration > this.thresholds.verySlowRequestMs) {
      this.createAlert({
        type: 'slow_request',
        severity: 'critical',
        message: `Very slow request: ${metric.route} took ${metric.duration}ms`,
        metric,
        threshold: this.thresholds.verySlowRequestMs,
        value: metric.duration
      })
    } else if (metric.duration > this.thresholds.slowRequestMs) {
      this.createAlert({
        type: 'slow_request',
        severity: 'medium',
        message: `Slow request: ${metric.route} took ${metric.duration}ms`,
        metric,
        threshold: this.thresholds.slowRequestMs,
        value: metric.duration
      })
    }

    // Alert por uso de memoria
    if (metric.memoryUsage) {
      const memoryMB = metric.memoryUsage.heapUsed / 1024 / 1024

      if (memoryMB > this.thresholds.criticalMemoryMB) {
        this.createAlert({
          type: 'high_memory',
          severity: 'critical',
          message: `Critical memory usage: ${memoryMB.toFixed(2)}MB`,
          metric,
          threshold: this.thresholds.criticalMemoryMB,
          value: memoryMB
        })
      } else if (memoryMB > this.thresholds.highMemoryMB) {
        this.createAlert({
          type: 'high_memory',
          severity: 'medium',
          message: `High memory usage: ${memoryMB.toFixed(2)}MB`,
          metric,
          threshold: this.thresholds.highMemoryMB,
          value: memoryMB
        })
      }
    }
  }

  private checkAlerts() {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneMinuteAgo)

    if (recentMetrics.length === 0) return

    // Verificar error rate
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = errorCount / recentMetrics.length

    if (errorRate > this.thresholds.criticalErrorRate) {
      this.createAlert({
        type: 'error_rate',
        severity: 'critical',
        message: `Critical error rate: ${(errorRate * 100).toFixed(2)}%`,
        metric: recentMetrics[0], // Usar la primera métrica como referencia
        threshold: this.thresholds.criticalErrorRate,
        value: errorRate
      })
    } else if (errorRate > this.thresholds.highErrorRate) {
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        metric: recentMetrics[0],
        threshold: this.thresholds.highErrorRate,
        value: errorRate
      })
    }
  }

  private createAlert(alert: PerformanceAlert) {
    this.alerts.push(alert)

    // Mantener solo las últimas 1000 alertas
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    // Notificar a los callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })

    // Log crítico
    if (alert.severity === 'critical') {
      console.error('CRITICAL PERFORMANCE ALERT:', alert)
    }
  }

  private cleanupOldMetrics() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp >= oneHourAgo)

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(a => a.metric.timestamp >= oneDayAgo)
  }

  // Obtener estadísticas de performance
  getStats(timeframe: 'hour' | 'day' = 'hour'): PerformanceStats {
    const now = new Date()
    const cutoff = new Date(now.getTime() - (timeframe === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff)

    if (relevantMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        memoryUsage: { current: 0, peak: 0, average: 0 },
        slowestEndpoints: [],
        errorsByEndpoint: {}
      }
    }

    // Calcular estadísticas
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b)
    const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length
    const p95ResponseTime = durations[Math.floor(durations.length * 0.95)]
    const p99ResponseTime = durations[Math.floor(durations.length * 0.99)]

    const timeframeMinutes = timeframe === 'hour' ? 60 : 24 * 60
    const requestsPerMinute = relevantMetrics.length / timeframeMinutes

    const errorCount = relevantMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = errorCount / relevantMetrics.length

    // Memoria
    const memoryUsages = relevantMetrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!.heapUsed / 1024 / 1024)

    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0
    const averageMemory = memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0

    // Endpoints más lentos
    const endpointStats = new Map<string, { totalTime: number; count: number }>()
    relevantMetrics.forEach(m => {
      const key = `${m.method} ${m.route}`
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 }
      endpointStats.set(key, {
        totalTime: existing.totalTime + m.duration,
        count: existing.count + 1
      })
    })

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([route, stats]) => ({
        route,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)

    // Errores por endpoint
    const errorsByEndpoint: Record<string, number> = {}
    relevantMetrics
      .filter(m => m.statusCode >= 400)
      .forEach(m => {
        const key = `${m.method} ${m.route}`
        errorsByEndpoint[key] = (errorsByEndpoint[key] || 0) + 1
      })

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerMinute,
      errorRate,
      memoryUsage: {
        current: currentMemory,
        peak: peakMemory,
        average: averageMemory
      },
      slowestEndpoints,
      errorsByEndpoint
    }
  }

  // Obtener alertas recientes
  getRecentAlerts(hours = 24): PerformanceAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.alerts
      .filter(a => a.metric.timestamp >= cutoff)
      .sort((a, b) => b.metric.timestamp.getTime() - a.metric.timestamp.getTime())
  }

  // Registrar callback para alertas
  onAlert(callback: (alert: PerformanceAlert) => void) {
    this.alertCallbacks.push(callback)
  }

  // Configurar thresholds
  setThresholds(newThresholds: Partial<typeof this.thresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  // Obtener métricas raw para análisis personalizado
  getMetrics(filters?: {
    route?: string
    method?: string
    statusCode?: number
    minDuration?: number
    maxDuration?: number
    since?: Date
  }): PerformanceMetric[] {
    let filtered = [...this.metrics]

    if (filters) {
      if (filters.route) {
        filtered = filtered.filter(m => m.route.includes(filters.route!))
      }
      if (filters.method) {
        filtered = filtered.filter(m => m.method === filters.method)
      }
      if (filters.statusCode) {
        filtered = filtered.filter(m => m.statusCode === filters.statusCode)
      }
      if (filters.minDuration) {
        filtered = filtered.filter(m => m.duration >= filters.minDuration!)
      }
      if (filters.maxDuration) {
        filtered = filtered.filter(m => m.duration <= filters.maxDuration!)
      }
      if (filters.since) {
        filtered = filtered.filter(m => m.timestamp >= filters.since!)
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Generar reporte de performance
  generateReport(timeframe: 'hour' | 'day' = 'day'): string {
    const stats = this.getStats(timeframe)
    const alerts = this.getRecentAlerts(timeframe === 'hour' ? 1 : 24)

    return `
# Performance Report (${timeframe})

## Overview
- Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms
- P95 Response Time: ${stats.p95ResponseTime.toFixed(2)}ms
- P99 Response Time: ${stats.p99ResponseTime.toFixed(2)}ms
- Requests per Minute: ${stats.requestsPerMinute.toFixed(2)}
- Error Rate: ${(stats.errorRate * 100).toFixed(2)}%

## Memory Usage
- Current: ${stats.memoryUsage.current.toFixed(2)}MB
- Peak: ${stats.memoryUsage.peak.toFixed(2)}MB
- Average: ${stats.memoryUsage.average.toFixed(2)}MB

## Slowest Endpoints
${stats.slowestEndpoints.map(ep =>
  `- ${ep.route}: ${ep.averageTime.toFixed(2)}ms avg (${ep.requestCount} requests)`
).join('\n')}

## Errors by Endpoint
${Object.entries(stats.errorsByEndpoint).map(([endpoint, count]) =>
  `- ${endpoint}: ${count} errors`
).join('\n')}

## Recent Alerts (${alerts.length})
${alerts.slice(0, 10).map(alert =>
  `- [${alert.severity.toUpperCase()}] ${alert.message} (${alert.metric.timestamp.toISOString()})`
).join('\n')}
    `.trim()
  }
}

// Instancia singleton
export const performanceMonitor = PerformanceMonitor.getInstance()

// Funciones de conveniencia
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureFunction(name, fn)
}

export function measureSync<T>(name: string, fn: () => T): T {
  const startTime = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - startTime

    performanceMonitor.recordMetric({
      route: `sync:${name}`,
      method: 'SYNC',
      duration,
      statusCode: 200
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    performanceMonitor.recordMetric({
      route: `sync:${name}`,
      method: 'SYNC',
      duration,
      statusCode: 500
    })

    throw error
  }
}

export function measureDatabaseQuery<T>(query: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureDatabaseQuery(query, fn)
}

// Decorator para medir métodos de clase
export function Measure(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return measureAsync(methodName, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}
