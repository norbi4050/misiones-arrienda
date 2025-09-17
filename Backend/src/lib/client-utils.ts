// Utilidades para el lado del cliente que manejan diferencias entre entornos

/**
 * Verifica si estamos en el lado del cliente (browser)
 */
export const isClient = typeof window !== 'undefined'

/**
 * Verifica si estamos en desarrollo
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Verifica si estamos en producción
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Obtiene la URL base correcta según el entorno
 */
export const getBaseUrl = (): string => {
  if (isClient) {
    return window.location.origin
  }

  // En el servidor, usar las variables de entorno
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

/**
 * Manejo seguro de localStorage
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    if (!isClient) return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  removeItem: (key: string): void => {
    if (!isClient) return
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

/**
 * Manejo seguro de sessionStorage
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    if (!isClient) return
    try {
      sessionStorage.setItem(key, value)
    } catch {
      // Silently fail if sessionStorage is not available
    }
  },

  removeItem: (key: string): void => {
    if (!isClient) return
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Silently fail if sessionStorage is not available
    }
  }
}

/**
 * Navegación segura que funciona en ambos entornos
 */
export const safeNavigate = {
  push: (url: string): void => {
    if (!isClient) return
    window.location.href = url
  },

  replace: (url: string): void => {
    if (!isClient) return
    window.location.replace(url)
  },

  back: (): void => {
    if (!isClient) return
    window.history.back()
  }
}

/**
 * Manejo seguro de document
 */
export const safeDocument = {
  getElementById: (id: string): HTMLElement | null => {
    if (!isClient) return null
    return document.getElementById(id)
  },

  querySelector: (selector: string): Element | null => {
    if (!isClient) return null
    return document.querySelector(selector)
  },

  addEventListener: (event: string, handler: EventListener): void => {
    if (!isClient) return
    document.addEventListener(event, handler)
  },

  removeEventListener: (event: string, handler: EventListener): void => {
    if (!isClient) return
    document.removeEventListener(event, handler)
  }
}

/**
 * Manejo seguro de window
 */
export const safeWindow = {
  gtag: (...args: any[]): void => {
    if (!isClient || !window.gtag) return
    window.gtag(...args)
  },

  scrollTo: (options: ScrollToOptions): void => {
    if (!isClient) return
    window.scrollTo(options)
  },

  open: (url: string, target?: string): void => {
    if (!isClient) return
    window.open(url, target)
  }
}

/**
 * Copia texto al portapapeles de forma segura
 */
export const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  if (!isClient) return false

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch {
    return false
  }
}

/**
 * Obtiene parámetros de URL de forma segura
 */
export const getUrlParams = (): URLSearchParams => {
  if (!isClient) return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

/**
 * Actualiza parámetros de URL sin recargar la página
 */
export const updateUrlParams = (params: Record<string, string>): void => {
  if (!isClient) return

  const url = new URL(window.location.href)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
  })

  window.history.pushState({}, '', url.toString())
}

/**
 * Manejo seguro de timers (setTimeout, setInterval)
 */
export const safeTimers = {
  setTimeout: (callback: () => void, delay: number): number | null => {
    if (!isClient) return null
    return window.setTimeout(callback, delay)
  },

  setInterval: (callback: () => void, delay: number): number | null => {
    if (!isClient) return null
    return window.setInterval(callback, delay)
  },

  clearTimeout: (id: number | null): void => {
    if (!isClient || id === null) return
    window.clearTimeout(id)
  },

  clearInterval: (id: number | null): void => {
    if (!isClient || id === null) return
    window.clearInterval(id)
  }
}

/**
 * Manejo seguro de fechas y tiempo
 */
export const safeDates = {
  now: (): number => {
    if (!isClient) return 0
    return Date.now()
  },

  newDate: (value?: string | number | Date): Date => {
    return new Date(value || 0)
  },

  formatDate: (date: string | Date): string => {
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return 'Fecha inválida'
    }
  },

  formatDateTime: (date: string | Date): string => {
    try {
      return new Date(date).toLocaleString()
    } catch {
      return 'Fecha inválida'
    }
  },

  getTimeDifference: (date1: Date, date2: Date): number => {
    try {
      return Math.abs(date1.getTime() - date2.getTime())
    } catch {
      return 0
    }
  }
}

/**
 * Manejo seguro de console y debugging
 */
export const safeConsole = {
  log: (...args: any[]): void => {
    if (isDevelopment && isClient) {
      }
  },

  error: (...args: any[]): void => {
    if (isDevelopment && isClient) {
      console.error(...args)
    }
  },

  warn: (...args: any[]): void => {
    if (isDevelopment && isClient) {
      }
  }
}

/**
 * Manejo seguro de alerts y confirmaciones
 */
export const safeAlerts = {
  alert: (message: string): void => {
    if (!isClient) return
    alert(message)
  },

  confirm: (message: string): boolean => {
    if (!isClient) return false
    return confirm(message)
  },

  prompt: (message: string, defaultValue?: string): string | null => {
    if (!isClient) return null
    return prompt(message, defaultValue)
  }
}

/**
 * Manejo seguro de Next.js router
 */
export const safeRouter = {
  push: (url: string): void => {
    if (!isClient) return
    // Fallback a window.location si Next.js router no está disponible
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
  },

  replace: (url: string): void => {
    if (!isClient) return
    if (typeof window !== 'undefined') {
      window.location.replace(url)
    }
  },

  back: (): void => {
    if (!isClient) return
    if (typeof window !== 'undefined' && window.history) {
      window.history.back()
    }
  },

  getSearchParams: (): URLSearchParams => {
    if (!isClient) return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  },

  getPathname: (): string => {
    if (!isClient) return '/'
    return window.location.pathname
  }
}

/**
 * Manejo seguro de useEffect con cleanup
 */
export const safeUseEffect = {
  addEventListenerWithCleanup: (
    element: HTMLElement | Window | Document | null,
    event: string,
    handler: EventListener
  ): (() => void) => {
    if (!isClient || !element) return () => {}

    element.addEventListener(event, handler)
    return () => element.removeEventListener(event, handler)
  },

  setTimeoutWithCleanup: (callback: () => void, delay: number): (() => void) => {
    if (!isClient) return () => {}

    const id = window.setTimeout(callback, delay)
    return () => window.clearTimeout(id)
  },

  setIntervalWithCleanup: (callback: () => void, delay: number): (() => void) => {
    if (!isClient) return () => {}

    const id = window.setInterval(callback, delay)
    return () => window.clearInterval(id)
  }
}

/**
 * Generador de IDs únicos seguro
 */
export const safeIdGenerator = {
  timestamp: (): string => {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  uuid: (): string => {
    if (isClient && crypto && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

/**
 * Manejo seguro de fetch API
 */
export const safeFetch = async (url: string, options?: RequestInit): Promise<Response | null> => {
  if (!isClient) return null

  try {
    return await fetch(url, options)
  } catch (error) {
    safeConsole.error('Fetch error:', error)
    return null
  }
}

/**
 * Manejo seguro de navigator API
 */
export const safeNavigator = {
  share: async (data: ShareData): Promise<boolean> => {
    if (!isClient || !navigator.share) return false

    try {
      await navigator.share(data)
      return true
    } catch (error) {
      safeConsole.error('Share error:', error)
      return false
    }
  },

  clipboard: {
    writeText: async (text: string): Promise<boolean> => {
      if (!isClient) return false

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text)
          return true
        } else {
          // Fallback para navegadores más antiguos
          const textArea = document.createElement('textarea')
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          return true
        }
      } catch (error) {
        safeConsole.error('Clipboard error:', error)
        return false
      }
    }
  },

  userAgent: (): string => {
    if (!isClient) return ''
    return navigator.userAgent || ''
  }
}

/**
 * Manejo seguro de window.location
 */
export const safeLocation = {
  href: {
    get: (): string => {
      if (!isClient) return ''
      return window.location.href
    },

    set: (url: string): void => {
      if (!isClient) return
      window.location.href = url
    }
  },

  pathname: (): string => {
    if (!isClient) return '/'
    return window.location.pathname
  },

  search: (): string => {
    if (!isClient) return ''
    return window.location.search
  },

  origin: (): string => {
    if (!isClient) return ''
    return window.location.origin
  },

  reload: (): void => {
    if (!isClient) return
    window.location.reload()
  }
}

/**
 * Manejo seguro de window.history
 */
export const safeHistory = {
  back: (): void => {
    if (!isClient || !window.history) return
    window.history.back()
  },

  forward: (): void => {
    if (!isClient || !window.history) return
    window.history.forward()
  },

  pushState: (data: any, title: string, url?: string): void => {
    if (!isClient || !window.history) return
    window.history.pushState(data, title, url)
  },

  replaceState: (data: any, title: string, url?: string): void => {
    if (!isClient || !window.history) return
    window.history.replaceState(data, title, url)
  }
}

/**
 * Manejo seguro de URL API
 */
export const safeURL = {
  create: (url: string, base?: string): URL | null => {
    try {
      return new URL(url, base)
    } catch (error) {
      safeConsole.error('URL creation error:', error)
      return null
    }
  },

  createSearchParams: (init?: string | URLSearchParams | Record<string, string>): URLSearchParams => {
    try {
      return new URLSearchParams(init)
    } catch (error) {
      safeConsole.error('URLSearchParams creation error:', error)
      return new URLSearchParams()
    }
  }
}

/**
 * Manejo seguro de crypto API
 */
export const safeCrypto = {
  randomUUID: (): string => {
    if (isClient && crypto && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return safeIdGenerator.uuid()
  },

  getRandomValues: (array: Uint8Array): Uint8Array | null => {
    if (!isClient || !crypto) return null

    try {
      return crypto.getRandomValues(array)
    } catch (error) {
      safeConsole.error('Crypto error:', error)
      return null
    }
  }
}

/**
 * Manejo seguro de performance API
 */
export const safePerformance = {
  now: (): number => {
    if (!isClient || !performance) return 0
    return performance.now()
  },

  mark: (name: string): void => {
    if (!isClient || !performance || !performance.mark) return
    try {
      performance.mark(name)
    } catch (error) {
      safeConsole.error('Performance mark error:', error)
    }
  },

  measure: (name: string, startMark?: string, endMark?: string): void => {
    if (!isClient || !performance || !performance.measure) return
    try {
      performance.measure(name, startMark, endMark)
    } catch (error) {
      safeConsole.error('Performance measure error:', error)
    }
  }
}

/**
 * Manejo seguro de eventos del DOM
 */
export const safeDOMEvents = {
  addEventListener: (
    target: EventTarget | null,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): (() => void) => {
    if (!isClient || !target) return () => {}

    target.addEventListener(type, listener, options)
    return () => target.removeEventListener(type, listener, options)
  },

  removeEventListener: (
    target: EventTarget | null,
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void => {
    if (!isClient || !target) return
    target.removeEventListener(type, listener, options)
  }
}

/**
 * Manejo seguro de media queries
 */
export const safeMediaQuery = {
  matches: (query: string): boolean => {
    if (!isClient || !window.matchMedia) return false

    try {
      return window.matchMedia(query).matches
    } catch (error) {
      safeConsole.error('Media query error:', error)
      return false
    }
  },

  addListener: (query: string, callback: (e: MediaQueryListEvent) => void): (() => void) => {
    if (!isClient || !window.matchMedia) return () => {}

    try {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addListener(callback)
      return () => mediaQuery.removeListener(callback)
    } catch (error) {
      safeConsole.error('Media query listener error:', error)
      return () => {}
    }
  }
}
