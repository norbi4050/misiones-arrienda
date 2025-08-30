interface AuditLogEntry {
  timestamp: Date
  userId?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  ip?: string
  userAgent?: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class AuditLogger {
  private logs: AuditLogEntry[] = []
  private maxLogs = 10000 // Mantener últimos 10k logs en memoria

  log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    }

    this.logs.push(logEntry)

    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log críticos también van a console
    if (entry.severity === 'critical') {
      console.error('CRITICAL AUDIT LOG:', logEntry)
    }

    // En producción, aquí enviarías a un servicio de logging externo
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry)
    }
  }

  private async sendToExternalService(entry: AuditLogEntry) {
    // Implementar integración con servicios como:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    try {
      // Ejemplo de envío a webhook
      if (process.env.AUDIT_WEBHOOK_URL) {
        await fetch(process.env.AUDIT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      }
    } catch (error) {
      console.error('Failed to send audit log to external service:', error)
    }
  }

  // Métodos de conveniencia para diferentes tipos de eventos
  logAuth(action: string, userId?: string, userEmail?: string, ip?: string, details?: any) {
    this.log({
      action: `auth.${action}`,
      resource: 'authentication',
      userId,
      userEmail,
      ip,
      details,
      severity: action.includes('failed') ? 'high' : 'medium'
    })
  }

  logPropertyAction(action: string, propertyId: string, userId?: string, ip?: string, details?: any) {
    this.log({
      action: `property.${action}`,
      resource: 'property',
      resourceId: propertyId,
      userId,
      ip,
      details,
      severity: action.includes('delete') ? 'high' : 'low'
    })
  }

  logPayment(action: string, paymentId: string, userId?: string, amount?: number, details?: any) {
    this.log({
      action: `payment.${action}`,
      resource: 'payment',
      resourceId: paymentId,
      userId,
      details: { ...details, amount },
      severity: action.includes('failed') ? 'high' : 'medium'
    })
  }

  logSecurity(action: string, ip?: string, userAgent?: string, details?: any) {
    this.log({
      action: `security.${action}`,
      resource: 'security',
      ip,
      userAgent,
      details,
      severity: 'critical'
    })
  }

  logAdmin(action: string, adminId: string, targetResource?: string, targetId?: string, details?: any) {
    this.log({
      action: `admin.${action}`,
      resource: targetResource || 'admin',
      resourceId: targetId,
      userId: adminId,
      details,
      severity: 'high'
    })
  }

  // Obtener logs para dashboard de admin
  getLogs(filters?: {
    userId?: string
    action?: string
    resource?: string
    severity?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    let filteredLogs = [...this.logs]

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!))
      }
      if (filters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === filters.resource)
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity)
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!)
      }
    }

    // Ordenar por timestamp descendente
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Aplicar límite
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit)
    }

    return filteredLogs
  }

  // Obtener estadísticas de seguridad
  getSecurityStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const cutoff = new Date(now.getTime() - timeframeMs[timeframe])
    const recentLogs = this.logs.filter(log => log.timestamp >= cutoff)

    return {
      totalEvents: recentLogs.length,
      criticalEvents: recentLogs.filter(log => log.severity === 'critical').length,
      highSeverityEvents: recentLogs.filter(log => log.severity === 'high').length,
      authEvents: recentLogs.filter(log => log.action.startsWith('auth.')).length,
      failedLogins: recentLogs.filter(log => log.action === 'auth.login_failed').length,
      uniqueIPs: new Set(recentLogs.map(log => log.ip).filter(Boolean)).size,
      topActions: this.getTopActions(recentLogs),
      timeframe
    }
  }

  private getTopActions(logs: AuditLogEntry[]) {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Helper function para extraer información de request
export function getRequestInfo(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}

// Middleware helper para logging automático
export function withAuditLog(
  action: string,
  resource: string,
  severity: AuditLogEntry['severity'] = 'low'
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const request = args.find(arg => arg instanceof Request)
      const requestInfo = request ? getRequestInfo(request) : {}

      try {
        const result = await originalMethod.apply(this, args)
        
        auditLogger.log({
          action: `${action}.success`,
          resource,
          severity,
          ...requestInfo
        })

        return result
      } catch (error) {
        auditLogger.log({
          action: `${action}.error`,
          resource,
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          ...requestInfo
        })
        throw error
      }
    }

    return descriptor
  }
}
