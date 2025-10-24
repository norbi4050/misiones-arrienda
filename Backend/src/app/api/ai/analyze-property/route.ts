/**
 * API Endpoint: POST /api/ai/analyze-property
 *
 * Genera descripciones automáticas de propiedades usando Google Gemini AI
 *
 * IMPORTANTE:
 * - Solo funciona si FEATURE_AI_DESCRIPTION=true y GEMINI_API_KEY está configurado
 * - Si falla, retorna { fallback: true } para que el frontend use formulario manual
 * - Timeout de 30 segundos para evitar requests colgados
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/ai/gemini-client';
import { generatePropertyAnalysisPrompt } from '@/lib/ai/prompts';
import type {
  PropertyAnalysisRequest,
  PropertyAnalysisResponse,
  AIAnalysisAPIResponse,
} from '@/lib/ai/types';

// Configuración
const REQUEST_TIMEOUT_MS = 30000; // 30 segundos
const MAX_RETRIES = 2; // Reintentar hasta 2 veces si falla

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verificar que feature esté habilitado
    if (!GeminiClient.isEnabled()) {
      console.warn('❌ AI feature not enabled');
      return NextResponse.json<AIAnalysisAPIResponse>(
        {
          success: false,
          error: 'AI feature not enabled',
          message:
            'La funcionalidad de IA está deshabilitada. Por favor, completa el formulario manualmente.',
          fallback: true,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // 2. Parsear y validar request body
    const body: PropertyAnalysisRequest = await request.json();

    // Validación de campos requeridos
    if (!body.propertyType || !body.price) {
      return NextResponse.json<AIAnalysisAPIResponse>(
        {
          success: false,
          error: 'Missing required fields',
          message:
            'Faltan campos obligatorios: propertyType y price son requeridos',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 3. Generar prompt
    const prompt = generatePropertyAnalysisPrompt({
      propertyType: body.propertyType,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      garages: body.garages,
      area: body.area,
      price: body.price,
      currency: body.currency || 'ARS',
      city: body.city || 'Misiones',
      operationType: body.operationType || 'RENT',
    });

    console.log('📝 Generando descripción con IA para:', {
      propertyType: body.propertyType,
      price: body.price,
      city: body.city,
    });

    // 4. Llamar a Gemini con timeout y retries
    let aiResponse: PropertyAnalysisResponse | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        aiResponse = await generateWithTimeout(prompt, REQUEST_TIMEOUT_MS);

        if (aiResponse) {
          console.log(`✅ Descripción generada exitosamente (intento ${attempt})`);
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ Intento ${attempt} falló:`, lastError.message);

        // Si no es el último intento, esperar un poco antes de reintentar
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // 5. Si falló todos los intentos, retornar error con fallback
    if (!aiResponse || !isValidResponse(aiResponse)) {
      console.error('❌ Error al generar descripción después de todos los intentos');

      return NextResponse.json<AIAnalysisAPIResponse>(
        {
          success: false,
          error: 'AI generation failed',
          message:
            lastError?.message ||
            'No se pudo generar la descripción. Por favor, completa el formulario manualmente.',
          fallback: true,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // 6. Calcular latencia y retornar respuesta exitosa
    const latencyMs = Date.now() - startTime;

    console.log(`⚡ Generación completada en ${latencyMs}ms`);

    return NextResponse.json<AIAnalysisAPIResponse>({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error crítico en /api/ai/analyze-property:', error);

    return NextResponse.json<AIAnalysisAPIResponse>(
      {
        success: false,
        error: 'Internal server error',
        message:
          error instanceof Error
            ? error.message
            : 'Error inesperado. Por favor, intenta nuevamente.',
        fallback: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Genera descripción con timeout
 */
async function generateWithTimeout(
  prompt: string,
  timeoutMs: number
): Promise<PropertyAnalysisResponse | null> {
  return new Promise(async (resolve, reject) => {
    // Timer de timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      // Obtener modelo
      const model = GeminiClient.getModel();

      if (!model) {
        clearTimeout(timeoutId);
        reject(new Error('Gemini model not available'));
        return;
      }

      // Generar contenido
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      clearTimeout(timeoutId);

      // Parsear JSON
      const parsed = parseAIResponse(text);

      if (!parsed) {
        reject(new Error('Failed to parse AI response'));
        return;
      }

      resolve(parsed);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Parsea la respuesta de la IA (puede venir con o sin markdown)
 */
function parseAIResponse(text: string): PropertyAnalysisResponse | null {
  try {
    // Remover bloques de markdown si existen (```json ... ```)
    let cleanText = text.trim();

    // Buscar JSON entre ```json y ```
    const jsonMatch = cleanText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1];
    }

    // Intentar parsear
    const parsed = JSON.parse(cleanText);

    // Validar estructura
    if (
      !parsed.title ||
      !parsed.description ||
      !Array.isArray(parsed.amenities) ||
      !Array.isArray(parsed.features)
    ) {
      console.error('❌ Respuesta de IA con estructura inválida:', parsed);
      return null;
    }

    return parsed as PropertyAnalysisResponse;
  } catch (error) {
    console.error('❌ Error al parsear respuesta de IA:', error);
    console.error('Texto recibido:', text);
    return null;
  }
}

/**
 * Valida que la respuesta tenga datos útiles
 */
function isValidResponse(response: PropertyAnalysisResponse): boolean {
  return (
    response.title.length > 10 &&
    response.title.length <= 100 &&
    response.description.length > 50 &&
    response.description.length <= 1000 &&
    response.amenities.length > 0 &&
    response.features.length > 0
  );
}
