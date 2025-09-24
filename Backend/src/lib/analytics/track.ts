"use client";

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

interface TrackEventData {
  eventName: string;
  page?: string;
  referrer?: string;
  utm?: UTMParams;
  payload?: Record<string, any>;
}

// Cache para evitar múltiples requests del mismo evento
const eventCache = new Set<string>();
const CACHE_TTL = 5000; // 5 segundos

// Queue para reintentos
const retryQueue: TrackEventData[] = [];
let isProcessingQueue = false;

/**
 * Extrae parámetros UTM de la URL actual
 */
function extractUTMParams(): UTMParams | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmTerm = urlParams.get('utm_term');
  const utmContent = urlParams.get('utm_content');
  
  if (utmSource) utm.source = utmSource;
  if (utmMedium) utm.medium = utmMedium;
  if (utmCampaign) utm.campaign = utmCampaign;
  if (utmTerm) utm.term = utmTerm;
  if (utmContent) utm.content = utmContent;
  
  return Object.keys(utm).length > 0 ? utm : undefined;
}

/**
 * Lee parámetros UTM guardados en cookie
 */
function getStoredUTM(): UTMParams | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const utmCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('ma_utm='));
    
  if (!utmCookie) return undefined;
  
  try {
    const utmData = JSON.parse(decodeURIComponent(utmCookie.split('=')[1]));
    return utmData;
  } catch {
    return undefined;
  }
}

/**
 * Guarda parámetros UTM en cookie por 24h
 */
function storeUTM(utm: UTMParams): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  document.cookie = `ma_utm=${encodeURIComponent(JSON.stringify(utm))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Envía evento al endpoint de ingesta
 */
async function sendEvent(eventData: TrackEventData): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    return false;
  }
}

/**
 * Procesa la cola de reintentos
 */
async function processRetryQueue(): Promise<void> {
  if (isProcessingQueue || retryQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (retryQueue.length > 0) {
    const eventData = retryQueue.shift()!;
    const success = await sendEvent(eventData);
    
    if (!success) {
      // Si falla, volver a encolar (máximo 3 reintentos)
      if (!eventData.payload?.retryCount || eventData.payload.retryCount < 3) {
        eventData.payload = { 
          ...eventData.payload, 
          retryCount: (eventData.payload?.retryCount || 0) + 1 
        };
        retryQueue.push(eventData);
      }
      break; // Parar si hay error para no saturar
    }
    
    // Pequeña pausa entre reintentos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  isProcessingQueue = false;
  
  // Si quedan elementos, programar siguiente procesamiento
  if (retryQueue.length > 0) {
    setTimeout(processRetryQueue, 5000);
  }
}

/**
 * Función principal de tracking
 */
export async function track(eventName: string, payload?: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Evitar eventos duplicados en corto tiempo
  const cacheKey = `${eventName}-${JSON.stringify(payload || {})}`;
  if (eventCache.has(cacheKey)) return;
  
  eventCache.add(cacheKey);
  setTimeout(() => eventCache.delete(cacheKey), CACHE_TTL);
  
  // Recopilar datos del evento
  const currentUTM = extractUTMParams();
  const storedUTM = getStoredUTM();
  
  // Si hay UTM en URL, guardarlos
  if (currentUTM) {
    storeUTM(currentUTM);
  }
  
  const eventData: TrackEventData = {
    eventName,
    page: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    utm: currentUTM || storedUTM,
    payload
  };
  
  // Intentar envío inmediato
  const success = await sendEvent(eventData);
  
  // Si falla, agregar a cola de reintentos
  if (!success) {
    retryQueue.push(eventData);
    processRetryQueue();
  }
}

/**
 * Tracking automático de page views
 */
export function trackPageView(): void {
  if (typeof window === 'undefined') return;
  
  track('page_view', {
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });
}

/**
 * Tracking de eventos específicos con helpers
 */
export const analytics = {
  // Navegación
  visitHome: () => track('visit_home'),
  visitProperties: (filters?: Record<string, any>) => track('visit_properties', { filters }),
  viewProperty: (propertyId: string, city?: string, price?: number, featured?: boolean) => 
    track('view_property', { propertyId, city, price, featured }),
  
  // Contacto
  contactClick: (propertyId: string, contactType: 'phone' | 'whatsapp' | 'message' = 'message') => 
    track('contact_click', { propertyId, contactType }),
  contactSubmit: (propertyId: string, contactType: string) => 
    track('contact_submit', { propertyId, contactType }),
  
  // Mensajería
  messageSent: (conversationId?: string, propertyId?: string) => 
    track('message_sent', { conversationId, propertyId }),
  
  // Publicación
  startPublish: () => track('start_publish'),
  completePublish: (propertyId: string, plan: string) => 
    track('complete_publish', { propertyId, plan }),
  
  // Monetización
  featureClick: (propertyId: string) => track('feature_click', { propertyId }),
  featurePrefCreated: (propertyId: string, amount: number) => 
    track('feature_pref_created', { propertyId, amount }),
  featurePaymentApproved: (propertyId: string, paymentId: string, amount: number) => 
    track('feature_payment_approved', { propertyId, paymentId, amount }),
  subscriptionClick: (plan: string) => track('subscription_click', { plan }),
  subscriptionActivated: (plan: string, amount: number) => 
    track('subscription_activated', { plan, amount }),
  
  // UX/Interacción
  carouselNext: (propertyId: string, imageIndex: number) => 
    track('carousel_next', { propertyId, imageIndex }),
  carouselZoom: (propertyId: string, imageIndex: number) => 
    track('carousel_zoom', { propertyId, imageIndex }),
  mapOpenGmaps: (propertyId: string, city: string) => 
    track('map_open_gmaps', { propertyId, city })
};

// Auto-track page view en navegación del lado cliente
if (typeof window !== 'undefined') {
  // Track inicial
  trackPageView();
  
  // Track en cambios de ruta (Next.js App Router)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(trackPageView, 100);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(trackPageView, 100);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(trackPageView, 100);
  });
}
