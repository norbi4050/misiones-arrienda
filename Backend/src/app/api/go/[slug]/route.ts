// =====================================================
// B5 - SHORT-LINK REDIRECT: /go/{slug} endpoint
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getShortLinkMapping, incrementShortLinkClicks } from '@/lib/share/shortlinks';

export const runtime = 'edge';

// Helper para trackear en edge runtime (sin usar track.ts que es client-side)
async function trackShortLinkResolveEdge(payload: {
  slug: string;
  entity_id: string;
  referrer?: string;
}) {
  try {
    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.info('[Analytics Edge] shortlink_resolve', payload);
    }
    
    // Enviar a endpoint de analytics
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/analytics/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'shortlink_resolve',
        payload,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.warn('[Analytics Edge] Failed to track shortlink resolve:', error);
    // No bloquear el redirect si falla analytics
  }
}

/**
 * GET /api/go/{slug}
 * Redirige un short-link a su URL completa
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    // 1. Obtener mapping del slug
    const mapping = await getShortLinkMapping(slug);
    
    if (!mapping) {
      console.warn(`[ShortLink] Slug not found: ${slug}`);
      
      // Redirigir a 404
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/404`, { status: 302 });
    }
    
    // 2. Incrementar contador de clicks (async, no bloqueante)
    incrementShortLinkClicks(slug).catch(error => {
      console.error(`[ShortLink] Error incrementing clicks for ${slug}:`, error);
    });
    
    // 3. Log para analytics (opcional, se implementará en Prompt 6)
    const referrer = request.headers.get('referer') || request.headers.get('referrer');
    const userAgent = request.headers.get('user-agent');
    
    if (process.env.NODE_ENV === 'development') {
      console.info('[ShortLink] Resolve:', {
        slug,
        entity_id: mapping.entity_id,
        entity_type: mapping.entity_type,
        campaign: mapping.campaign,
        referrer,
        userAgent: userAgent?.substring(0, 50)
      });
    }
    
    // B5 Prompt 6: Track analytics (fire-and-forget)
    trackShortLinkResolveEdge({
      slug,
      entity_id: mapping.entity_id,
      referrer: referrer || undefined
    }).catch(err => 
      console.warn('Error tracking shortlink resolve:', err)
    );
    
    // 4. Redirigir a la URL completa (302 Temporary Redirect)
    return NextResponse.redirect(mapping.full_url, { 
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Short-Link-Slug': slug,
        'X-Short-Link-Entity': `${mapping.entity_type}:${mapping.entity_id}`
      }
    });
    
  } catch (error) {
    console.error('[ShortLink] Error resolving slug:', error);
    
    // En caso de error, redirigir a home
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(baseUrl, { status: 302 });
  }
}

/**
 * HEAD /api/go/{slug}
 * Permite verificar si un slug existe sin hacer redirect
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    const mapping = await getShortLinkMapping(slug);
    
    if (!mapping) {
      return new NextResponse(null, { status: 404 });
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Short-Link-Exists': 'true',
        'X-Short-Link-Entity': `${mapping.entity_type}:${mapping.entity_id}`,
        'X-Short-Link-Clicks': mapping.clicks.toString()
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
