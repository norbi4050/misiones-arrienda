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
  // B7: Nuevos campos
  actorRole?: string;
  targetType?: string;
  targetId?: string;
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
 * Verificar si el tracking está habilitado
 */
function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // En desarrollo, siempre trackear para testing
  if (process.env.NODE_ENV === 'development') return true;
  
  // En producción, verificar consentimiento del usuario
  const consent = localStorage.getItem('analytics-consent');
  return consent === 'true';
}

/**
 * B7: Obtener rol del usuario actual
 */
function getUserRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'anonymous';
    
    const user = JSON.parse(userStr);
    return user?.role || 'authenticated';
  } catch {
    return 'anonymous';
  }
}

/**
 * Función principal de tracking (B7: Mejorada con nuevos campos)
 */
export async function track(
  eventName: string, 
  payload?: Record<string, any>,
  options?: {
    targetType?: string;
    targetId?: string;
    actorRole?: string;
  }
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Verificar consentimiento antes de trackear
  if (!isTrackingEnabled()) return;
  
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
  
  // B7: Determinar actor_role
  const actorRole = options?.actorRole || getUserRole();
  
  const eventData: TrackEventData = {
    eventName,
    page: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    utm: currentUTM || storedUTM,
    payload,
    // B7: Nuevos campos
    actorRole,
    targetType: options?.targetType,
    targetId: options?.targetId
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
    track('view_property', { propertyId, city, price, featured }, { targetType: 'property', targetId: propertyId }),
  
  // B7: Vista de perfil inmobiliaria
  profileView: (profileId: string, profileName?: string) =>
    track('profile_view', { profileId, profileName }, { targetType: 'agency', targetId: profileId }),
  
  // Contacto
  contactClick: (propertyId: string, contactType: 'phone' | 'whatsapp' | 'message' = 'message') => 
    track('contact_click', { propertyId, contactType }, { targetType: 'property', targetId: propertyId }),
  contactSubmit: (propertyId: string, contactType: string) => 
    track('contact_submit', { propertyId, contactType }, { targetType: 'property', targetId: propertyId }),
  
  // Mensajería
  messageSent: (conversationId?: string, propertyId?: string) => 
    track('message_sent', { conversationId, propertyId }, { targetType: 'conversation', targetId: conversationId }),
  
  // Publicación
  startPublish: () => track('start_publish'),
  completePublish: (propertyId: string, plan: string) => 
    track('complete_publish', { propertyId, plan }, { targetType: 'property', targetId: propertyId }),
  publishCompleted: (propertyId: string, plan: string) => 
    track('publish_completed', { propertyId, plan }, { targetType: 'property', targetId: propertyId }),
  
  // B7: Auth events
  signupCompleted: (role: 'inmobiliaria' | 'inquilino', plan: string = 'free') =>
    track('signup_completed', { role, plan }, { actorRole: role }),
  loginCompleted: (role: string, method: 'email' | 'google' = 'email') =>
    track('login_completed', { role, method }, { actorRole: role }),
  
  // Monetización
  featureClick: (propertyId: string) => 
    track('feature_click', { propertyId }, { targetType: 'property', targetId: propertyId }),
  featurePrefCreated: (propertyId: string, amount: number) => 
    track('feature_pref_created', { propertyId, amount }, { targetType: 'property', targetId: propertyId }),
  featurePaymentApproved: (propertyId: string, paymentId: string, amount: number) => 
    track('feature_payment_approved', { propertyId, paymentId, amount }, { targetType: 'property', targetId: propertyId }),
  subscriptionClick: (plan: string) => track('subscription_click', { plan }),
  subscriptionActivated: (plan: string, amount: number) => 
    track('subscription_activated', { plan, amount }),
  
  // B7: Plan upgrade
  planUpgrade: (fromPlan: string, toPlan: string, amount: number) =>
    track('plan_upgrade', { from_plan: fromPlan, to_plan: toPlan, amount }),
  
  // UX/Interacción
  carouselNext: (propertyId: string, imageIndex: number) => 
    track('carousel_next', { propertyId, imageIndex }, { targetType: 'property', targetId: propertyId }),
  carouselZoom: (propertyId: string, imageIndex: number) => 
    track('carousel_zoom', { propertyId, imageIndex }, { targetType: 'property', targetId: propertyId }),
  mapOpenGmaps: (propertyId: string, city: string) => 
    track('map_open_gmaps', { propertyId, city }, { targetType: 'property', targetId: propertyId }),
  
  // B7: Favoritos
  propertyFavorite: (propertyId: string) =>
    track('property_favorite', { propertyId }, { targetType: 'property', targetId: propertyId }),
  propertyUnfavorite: (propertyId: string) =>
    track('property_unfavorite', { propertyId }, { targetType: 'property', targetId: propertyId }),
  
  // B7: Búsqueda
  searchPerformed: (query: string, filters?: Record<string, any>) =>
    track('search_performed', { query, filters }),
  filterApplied: (filterType: string, filterValue: any) =>
    track('filter_applied', { filter_type: filterType, filter_value: filterValue }),
  
  // B5: Compartir en redes sociales (Prompt 6)
  shareClick: (channel: string, entity: string, entityId: string, context: string, planTier?: string, userId?: string) =>
    track('share_click', { channel, entity, entity_id: entityId, context, plan_tier: planTier, user_id: userId }, 
      { targetType: entity, targetId: entityId }),
  
  shortlinkResolve: (slug: string, entityId: string, referrer?: string) =>
    track('shortlink_resolve', { slug, entity_id: entityId, referrer }),
  
  // B6: Adjuntos en mensajes (Prompt 8)
  attachmentUpload: (data: {
    threadId: string
    messageId?: string
    mime: string
    sizeBytes: number
    planTier: string
    result: 'success' | 'error'
    errorCode?: string
  }) => track('attachment_uploaded', data, { targetType: 'thread', targetId: data.threadId }),
  
  attachmentPreview: (data: {
    attachmentId: string
    mime: string
    source?: 'lightbox' | 'inline'
  }) => track('attachment_preview', data, { targetType: 'attachment', targetId: data.attachmentId }),
  
  attachmentDownload: (data: {
    attachmentId: string
    mime: string
    sizeBytes?: number
  }) => track('attachment_download', data, { targetType: 'attachment', targetId: data.attachmentId }),
  
  attachmentDelete: (data: {
    attachmentId: string
    mime: string
    sizeBytes?: number
  }) => track('attachment_delete', data, { targetType: 'attachment', targetId: data.attachmentId }),
  
  attachmentRateLimited: (data: {
    userId: string
    planTier: string
    limit: number
    resetIn: number
  }) => track('attachment_rate_limited', data),
  
  // B7: Comunidad
  communityPostView: (postId: string) =>
    track('community_post_view', { postId }, { targetType: 'post', targetId: postId }),
  communityPostLike: (postId: string) =>
    track('community_post_like', { postId }, { targetType: 'post', targetId: postId }),
  communityProfileView: (profileId: string) =>
    track('community_profile_view', { profileId }, { targetType: 'profile', targetId: profileId })
};

/**
 * B5 PROMPT 6: Tracking específico de shares
 * Función helper para trackear clicks de compartir
 */
export async function trackShareClick(payload: {
  channel: string;
  entity: 'property' | 'agency';
  entity_id: string;
  context: string;
  plan_tier?: string;
  user_id?: string;
}): Promise<void> {
  // 1. Log en consola (development)
  if (process.env.NODE_ENV === 'development') {
    console.info('[Analytics] share_click', payload);
  }
  
  // 2. Enviar a dataLayer si existe (Google Analytics)
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'share_click',
      ...payload,
      timestamp: new Date().toISOString()
    });
  }
  
  // 3. Usar función track existente
  await track('share_click', payload);
}

/**
 * B5 PROMPT 6: Tracking de resolución de short-links
 */
export async function trackShortLinkResolve(payload: {
  slug: string;
  entity_id: string;
  referrer?: string;
}): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.info('[Analytics] shortlink_resolve', payload);
  }
  
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'shortlink_resolve',
      ...payload,
      timestamp: new Date().toISOString()
    });
  }
  
  await track('shortlink_resolve', payload);
}

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
