"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, User, TrendingUp, Search, Home, HelpCircle } from "lucide-react"
import { trackChatInteraction, trackPageView, analyticsService } from "@/lib/analytics"

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface UserAnalytics {
  searchQueries: string[]
  clickedProperties: string[]
  timeOnPage: number
  strugglingWith: string[]
  preferredFilters: Record<string, string>
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics>({
    searchQueries: [],
    clickedProperties: [],
    timeOnPage: 0,
    strugglingWith: [],
    preferredFilters: {}
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      setUserAnalytics(prev => ({
        ...prev,
        timeOnPage: Date.now() - startTime.current
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Initialize bot with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "¡Hola! 👋 Soy **MisionesBot**, tu asistente inteligente. Estoy aquí para ayudarte a encontrar la propiedad perfecta en Misiones. ¿En qué puedo ayudarte?",
        timestamp: new Date(),
        suggestions: [
          "Buscar propiedades en Posadas",
          "¿Cómo funciona el sistema de perfiles?",
          "Quiero registrarme como dueño directo",
          "Ayuda con filtros de búsqueda"
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen])

  // Analyze user behavior and provide intelligent responses
  const analyzeUserIntent = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    // Track search queries
    if (lowerMessage.includes('buscar') || lowerMessage.includes('encontrar') || lowerMessage.includes('propiedad')) {
      setUserAnalytics(prev => ({
        ...prev,
        searchQueries: [...prev.searchQueries, message]
      }))
    }

    // Detect struggling patterns
    if (lowerMessage.includes('no encuentro') || lowerMessage.includes('ayuda') || lowerMessage.includes('problema')) {
      setUserAnalytics(prev => ({
        ...prev,
        strugglingWith: [...prev.strugglingWith, message]
      }))
    }

    // Intelligent responses based on content
    if (lowerMessage.includes('posadas')) {
      return "¡Perfecto! Posadas es nuestra ciudad con más propiedades. Tenemos **departamentos desde $120.000** y **casas desde $280.000**. \n\n🔍 **Tip inteligente**: Usa nuestra búsqueda inteligente escribiendo 'pos' y verás todas las opciones de Posadas automáticamente.\n\n¿Te interesa algún barrio específico como Villa Cabello o Centro?"
    }

    if (lowerMessage.includes('eldorado')) {
      return "¡Eldorado es una excelente opción! Tenemos propiedades familiares hermosas. \n\n🏠 **Destacado**: Casa de 3 dormitorios con jardín por $320.000 (antes $350.000).\n\n¿Buscas algo específico en Eldorado?"
    }

    if (lowerMessage.includes('dueño directo') || lowerMessage.includes('habitacion')) {
      return "¡El sistema de **Dueño Directo** es perfecto para ti! 🏠\n\n✅ **Es 100% legal** en Argentina\n✅ **Planes desde $2.000/mes**\n✅ **6 tipos de espacios**: habitaciones, estudios, cocheras, etc.\n\n¿Te gustaría que te guíe al registro? Solo toma 3 minutos."
    }

    if (lowerMessage.includes('inmobiliaria')) {
      return "¡Excelente! Nuestro sistema para inmobiliarias es **el más avanzado de Argentina**. 🏢\n\n💼 **Plan Profesional**: $25.000/mes (50 propiedades)\n🚀 **Plan Empresarial**: $45.000/mes (ilimitado)\n\n**Oferta de lanzamiento**: 50% descuento primer mes.\n\n¿Quieres ver los beneficios completos?"
    }

    if (lowerMessage.includes('filtro') || lowerMessage.includes('busqueda')) {
      return "¡Te ayudo con los filtros! Están organizados para que no te abrumes: 📊\n\n1️⃣ **Alquiler/Venta** (lo más importante primero)\n2️⃣ **Tipo de propiedad**\n3️⃣ **Rango de precio**\n4️⃣ **Ubicación**\n\n💡 **Tip**: Usa la búsqueda inteligente en el hero - escribe 'ob' y verás 'Oberá' automáticamente."
    }

    if (lowerMessage.includes('perfil') || lowerMessage.includes('calificacion')) {
      return "¡Los perfiles son únicos en Argentina! 🌟\n\n👤 **Sistema de Reviews**: Los propietarios califican inquilinos\n⭐ **Calificaciones 1-5 estrellas**\n📋 **Historial de alquileres**\n\n**Ventaja**: Con buen perfil, conseguís propiedades más rápido. ¿Quieres ver perfiles de ejemplo?"
    }

    if (lowerMessage.includes('precio') || lowerMessage.includes('costo')) {
      return "Te explico nuestros precios súper competitivos: 💰\n\n**Propietarios**:\n• Básico: $0 (gratis)\n• Destacado: $5.000/mes\n• Premium: $10.000/mes\n\n**Dueño Directo**:\n• Básico: $2.000/mes\n• Familiar: $5.000/mes\n\n¡Mucho más barato que la competencia!"
    }

    // Default intelligent response
    return `Entiendo que buscas información sobre "${message}". \n\n🤖 **Análisis**: He notado que los usuarios como tú suelen estar interesados en:\n\n• Propiedades en **Posadas** (más populares)\n• Sistema de **perfiles verificados**\n• **Dueño directo** (muy económico)\n\n¿Alguna de estas opciones te interesa? ¡Puedo guiarte paso a paso!`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Track user message with analytics
    trackChatInteraction('user', inputValue)

    const currentInput = inputValue
    setInputValue("")
    setIsTyping(true)

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = analyzeUserIntent(currentInput)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        suggestions: getBotSuggestions(currentInput)
      }

      setMessages(prev => [...prev, botMessage])

      // Track bot response with analytics
      trackChatInteraction('bot', botResponse)

      setIsTyping(false)
    }, 1500)
  }

  const getBotSuggestions = (userMessage: string): string[] => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('posadas')) {
      return [
        "Ver propiedades en Villa Cabello",
        "Departamentos céntricos",
        "Casas con piscina",
        "Filtrar por precio"
      ]
    }

    if (lowerMessage.includes('dueño directo')) {
      return [
        "Registrarme como dueño directo",
        "Ver tipos de espacios",
        "Calcular ganancias",
        "¿Es realmente legal?"
      ]
    }

    return [
      "Buscar en otra ciudad",
      "Ver perfiles verificados",
      "Contactar soporte",
      "Más información"
    ]
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Notification badge */}
        <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">AI</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <div>
            <h3 className="font-semibold">MisionesBot</h3>
            <p className="text-xs opacity-90">Asistente IA • Tiempo: {formatTime(userAnalytics.timeOnPage)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Analytics Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Search className="h-3 w-3" />
            <span>Búsquedas: {userAnalytics.searchQueries.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>Análisis: Activo</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && <span className="text-sm mt-0.5">🤖</span>}
                {message.type === 'user' && <User className="h-4 w-4 mt-0.5" />}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content.split('**').map((part, index) =>
                      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {message.suggestions && (
                <div className="mt-3 space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-xs p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <span className="text-sm">🤖</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Powered by MisionesBot AI</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Aprendiendo...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
