import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting simple en memoria (por IP + minuto)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 60; // 60 requests por minuto por IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto en ms

interface IngestRequest {
  eventName: string;
  page?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  payload?: Record<string, any>;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Nueva ventana o primera request
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  current.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  // Intentar obtener IP real desde headers de proxy
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || '127.0.0.1';
}

function getOrCreateSessionId(request: NextRequest): { sessionId: string; setCookie?: string } {
  const existingSession = request.cookies.get('ma_session')?.value;
  
  if (existingSession) {
    return { sessionId: existingSession };
  }
  
  // Crear nueva sesión
  const newSessionId = uuidv4();
  const expires = new Date();
  expires.setDate(expires.getDate() + 90); // 90 días
  
  const setCookie = `ma_session=${newSessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`;
  
  return { sessionId: newSessionId, setCookie };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return new NextResponse(null, { 
        status: 429,
        statusText: 'Too Many Requests'
      });
    }

    // Parsear body
    const body: IngestRequest = await request.json();
    
    // Validación básica
    if (!body.eventName || typeof body.eventName !== 'string') {
      return new NextResponse(null, { status: 400 });
    }

    // Obtener o crear session_id
    const { sessionId, setCookie } = getOrCreateSessionId(request);
    
    // Obtener user_id si está logueado
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Preparar datos del evento
    const eventData = {
      user_id: user?.id || null,
      session_id: sessionId,
      event_name: body.eventName,
      page: body.page || null,
      referrer: body.referrer || null,
      utm: body.utm ? JSON.stringify(body.utm) : null,
      payload: body.payload ? JSON.stringify(body.payload) : null,
      ip: clientIP,
      ua: request.headers.get('user-agent') || null
    };

    // Insertar en base de datos
    const { error } = await supabase
      .from('analytics_events')
      .insert([eventData]);

    if (error) {
      console.error('Error inserting analytics event:', error);
      return new NextResponse(null, { status: 500 });
    }

    // Respuesta exitosa con cookie de sesión si es nueva
    const response = new NextResponse(null, { status: 204 });
    
    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie);
    }
    
    return response;

  } catch (error) {
    console.error('Analytics ingest error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// Limpiar rate limit map periódicamente (cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
