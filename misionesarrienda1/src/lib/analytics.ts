// Analytics system for AI Chatbot learning
export interface UserBehavior {
  sessionId: string
  userId?: string
  timestamp: Date
  action: string
  data: Record<string, any>
  page: string
  userAgent: string
}

export interface ChatAnalytics {
  sessionId: string
  messages: Array<{
    type: 'user' | 'bot'
    content: string
    timestamp: Date
    intent?: string
    satisfaction?: number
  }>
  userStruggles: string[]
  searchQueries: string[]
  timeOnPage: number
  pagesVisited: string[]
  conversionEvents: string[]
}

export interface PlatformInsights {
  commonQuestions: Array<{ question: string; frequency: number }>
  userStruggles: Array<{ issue: string; frequency: number }>
  popularSearches: Array<{ query: string; frequency: number }>
  conversionFunnels: Array<{ step: string; dropOffRate: number }>
  pagePerformance: Array<{ page: string; avgTimeOnPage: number; bounceRate: number }>
}

class AnalyticsService {
  private behaviors: UserBehavior[] = []
  private chatSessions: Map<string, ChatAnalytics> = new Map()
  private insights: PlatformInsights = {
    commonQuestions: [],
    userStruggles: [],
    popularSearches: [],
    conversionFunnels: [],
    pagePerformance: []
  }

  // Track user behavior
  trackBehavior(behavior: Omit<UserBehavior, 'timestamp'>) {
    const fullBehavior: UserBehavior = {
      ...behavior,
      timestamp: new Date()
    }
    
    this.behaviors.push(fullBehavior)
    this.updateInsights()
    
    // In production, send to analytics service
    if (typeof window !== 'undefined') {
      console.log('📊 Analytics:', fullBehavior)
    }
  }

  // Track chat interactions
  trackChatMessage(sessionId: string, type: 'user' | 'bot', content: string, intent?: string) {
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, {
        sessionId,
        messages: [],
        userStruggles: [],
        searchQueries: [],
        timeOnPage: 0,
        pagesVisited: [],
        conversionEvents: []
      })
    }

    const session = this.chatSessions.get(sessionId)!
    session.messages.push({
      type,
      content,
      timestamp: new Date(),
      intent
    })

    // Analyze user struggles
    if (type === 'user') {
      this.analyzeUserStruggle(sessionId, content)
      this.analyzeSearchIntent(sessionId, content)
    }

    this.updateInsights()
  }

  // Analyze if user is struggling
  private analyzeUserStruggle(sessionId: string, message: string) {
    const session = this.chatSessions.get(sessionId)!
    const lowerMessage = message.toLowerCase()
    
    const struggleKeywords = [
      'no encuentro', 'no funciona', 'problema', 'error', 'ayuda',
      'no entiendo', 'confuso', 'difícil', 'complicado', 'no puedo'
    ]

    const hasStruggle = struggleKeywords.some(keyword => lowerMessage.includes(keyword))
    if (hasStruggle) {
      session.userStruggles.push(message)
    }
  }

  // Analyze search intent
  private analyzeSearchIntent(sessionId: string, message: string) {
    const session = this.chatSessions.get(sessionId)!
    const lowerMessage = message.toLowerCase()
    
    const searchKeywords = [
      'buscar', 'encontrar', 'quiero', 'necesito', 'propiedad',
      'casa', 'departamento', 'alquiler', 'venta'
    ]

    const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword))
    if (hasSearchIntent) {
      session.searchQueries.push(message)
    }
  }

  // Update platform insights
  private updateInsights() {
    this.updateCommonQuestions()
    this.updateUserStruggles()
    this.updatePopularSearches()
  }

  private updateCommonQuestions() {
    const questionMap = new Map<string, number>()
    
    this.chatSessions.forEach(session => {
      session.messages
        .filter(msg => msg.type === 'user')
        .forEach(msg => {
          const normalized = this.normalizeQuestion(msg.content)
          questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1)
        })
    })

    this.insights.commonQuestions = Array.from(questionMap.entries())
      .map(([question, frequency]) => ({ question, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  private updateUserStruggles() {
    const struggleMap = new Map<string, number>()
    
    this.chatSessions.forEach(session => {
      session.userStruggles.forEach(struggle => {
        const normalized = this.normalizeStruggle(struggle)
        struggleMap.set(normalized, (struggleMap.get(normalized) || 0) + 1)
      })
    })

    this.insights.userStruggles = Array.from(struggleMap.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  private updatePopularSearches() {
    const searchMap = new Map<string, number>()
    
    this.chatSessions.forEach(session => {
      session.searchQueries.forEach(query => {
        const normalized = this.normalizeSearch(query)
        searchMap.set(normalized, (searchMap.get(normalized) || 0) + 1)
      })
    })

    this.insights.popularSearches = Array.from(searchMap.entries())
      .map(([query, frequency]) => ({ query, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  // Normalize text for better analysis
  private normalizeQuestion(question: string): string {
    return question.toLowerCase()
      .replace(/[¿?¡!]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private normalizeStruggle(struggle: string): string {
    const lowerStruggle = struggle.toLowerCase()
    
    if (lowerStruggle.includes('no encuentro')) return 'Dificultad para encontrar propiedades'
    if (lowerStruggle.includes('no funciona')) return 'Problemas técnicos'
    if (lowerStruggle.includes('confuso')) return 'Interfaz confusa'
    if (lowerStruggle.includes('filtro')) return 'Problemas con filtros'
    if (lowerStruggle.includes('busqueda')) return 'Problemas con búsqueda'
    
    return 'Otros problemas'
  }

  private normalizeSearch(search: string): string {
    const lowerSearch = search.toLowerCase()
    
    if (lowerSearch.includes('posadas')) return 'Búsquedas en Posadas'
    if (lowerSearch.includes('eldorado')) return 'Búsquedas en Eldorado'
    if (lowerSearch.includes('casa')) return 'Búsquedas de casas'
    if (lowerSearch.includes('departamento')) return 'Búsquedas de departamentos'
    if (lowerSearch.includes('alquiler')) return 'Búsquedas de alquiler'
    if (lowerSearch.includes('venta')) return 'Búsquedas de venta'
    
    return 'Búsquedas generales'
  }

  // Get insights for dashboard
  getInsights(): PlatformInsights {
    return { ...this.insights }
  }

  // Get recommendations for platform improvements
  getRecommendations(): string[] {
    const recommendations: string[] = []
    
    // Analyze common struggles
    const topStruggles = this.insights.userStruggles.slice(0, 3)
    topStruggles.forEach(struggle => {
      if (struggle.issue.includes('filtros')) {
        recommendations.push('Mejorar la interfaz de filtros - muchos usuarios tienen problemas')
      }
      if (struggle.issue.includes('búsqueda')) {
        recommendations.push('Optimizar el sistema de búsqueda - usuarios reportan dificultades')
      }
      if (struggle.issue.includes('confusa')) {
        recommendations.push('Simplificar la navegación - la interfaz puede ser confusa')
      }
    })

    // Analyze popular searches
    const topSearches = this.insights.popularSearches.slice(0, 3)
    topSearches.forEach(search => {
      if (search.query.includes('Posadas') && search.frequency > 10) {
        recommendations.push('Crear sección destacada para Posadas - es muy buscada')
      }
      if (search.query.includes('casas') && search.frequency > 5) {
        recommendations.push('Mejorar filtros de casas - alta demanda')
      }
    })

    return recommendations
  }

  // Generate AI training data
  getTrainingData() {
    const trainingData = {
      intents: this.extractIntents(),
      responses: this.extractSuccessfulResponses(),
      patterns: this.extractConversationPatterns()
    }
    
    return trainingData
  }

  private extractIntents(): Array<{ intent: string; examples: string[] }> {
    const intentMap = new Map<string, string[]>()
    
    this.chatSessions.forEach(session => {
      session.messages
        .filter(msg => msg.type === 'user')
        .forEach(msg => {
          const intent = this.classifyIntent(msg.content)
          if (!intentMap.has(intent)) {
            intentMap.set(intent, [])
          }
          intentMap.get(intent)!.push(msg.content)
        })
    })

    return Array.from(intentMap.entries()).map(([intent, examples]) => ({
      intent,
      examples: examples.slice(0, 10) // Limit examples
    }))
  }

  private classifyIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('buscar') || lowerMessage.includes('encontrar')) return 'search'
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo')) return 'pricing'
    if (lowerMessage.includes('dueño directo')) return 'owner_direct'
    if (lowerMessage.includes('inmobiliaria')) return 'real_estate'
    if (lowerMessage.includes('perfil')) return 'profile'
    if (lowerMessage.includes('ayuda')) return 'help'
    
    return 'general'
  }

  private extractSuccessfulResponses(): Array<{ question: string; response: string; satisfaction: number }> {
    const successfulResponses: Array<{ question: string; response: string; satisfaction: number }> = []
    
    this.chatSessions.forEach(session => {
      for (let i = 0; i < session.messages.length - 1; i++) {
        const userMsg = session.messages[i]
        const botMsg = session.messages[i + 1]
        
        if (userMsg.type === 'user' && botMsg.type === 'bot') {
          // Assume satisfaction based on conversation continuation
          const satisfaction = this.calculateSatisfaction(session, i)
          successfulResponses.push({
            question: userMsg.content,
            response: botMsg.content,
            satisfaction
          })
        }
      }
    })
    
    return successfulResponses.filter(r => r.satisfaction > 0.7)
  }

  private calculateSatisfaction(session: ChatAnalytics, messageIndex: number): number {
    // Simple heuristic: if user continues conversation, they're satisfied
    const remainingMessages = session.messages.length - messageIndex - 2
    const hasFollowUp = remainingMessages > 0
    const hasPositiveKeywords = session.messages
      .slice(messageIndex + 2, messageIndex + 4)
      .some(msg => msg.type === 'user' && 
        ['gracias', 'perfecto', 'excelente', 'genial'].some(keyword => 
          msg.content.toLowerCase().includes(keyword)
        )
      )
    
    if (hasPositiveKeywords) return 0.9
    if (hasFollowUp) return 0.8
    return 0.6
  }

  private extractConversationPatterns(): Array<{ pattern: string; frequency: number }> {
    const patterns = new Map<string, number>()
    
    this.chatSessions.forEach(session => {
      for (let i = 0; i < session.messages.length - 2; i++) {
        const pattern = session.messages.slice(i, i + 3)
          .map(msg => `${msg.type}:${this.classifyIntent(msg.content)}`)
          .join(' -> ')
        
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1)
      }
    })
    
    return Array.from(patterns.entries())
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService()

// Helper functions for tracking
export const trackPageView = (page: string) => {
  analyticsService.trackBehavior({
    sessionId: getSessionId(),
    action: 'page_view',
    data: { page },
    page,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  })
}

export const trackSearch = (query: string, results: number) => {
  analyticsService.trackBehavior({
    sessionId: getSessionId(),
    action: 'search',
    data: { query, results },
    page: window.location.pathname,
    userAgent: window.navigator.userAgent
  })
}

export const trackPropertyClick = (propertyId: string, position: number) => {
  analyticsService.trackBehavior({
    sessionId: getSessionId(),
    action: 'property_click',
    data: { propertyId, position },
    page: window.location.pathname,
    userAgent: window.navigator.userAgent
  })
}

export const trackChatInteraction = (type: 'user' | 'bot', content: string, intent?: string) => {
  analyticsService.trackChatMessage(getSessionId(), type, content, intent)
}

// Generate session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session'
  
  let sessionId = sessionStorage.getItem('misiones-session-id')
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('misiones-session-id', sessionId)
  }
  return sessionId
}
