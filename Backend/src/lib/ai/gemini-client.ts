/**
 * Cliente de Google Gemini AI
 *
 * IMPORTANTE: Este cliente solo se inicializa si GEMINI_API_KEY está configurado
 * y FEATURE_AI_DESCRIPTION está en true. Si no, todas las funciones retornan null.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  private static instance: GoogleGenerativeAI | null = null;

  /**
   * Obtiene instancia singleton del cliente Gemini
   * @returns GoogleGenerativeAI instance o null si no está configurado
   */
  static getInstance(): GoogleGenerativeAI | null {
    // Verificar que API key existe
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY no está configurado en .env');
      return null;
    }

    // Crear instancia si no existe
    if (!this.instance) {
      try {
        this.instance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini client inicializado correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar Gemini client:', error);
        return null;
      }
    }

    return this.instance;
  }

  /**
   * Verifica si el servicio de IA está habilitado
   * @returns true si está habilitado, false si no
   */
  static isEnabled(): boolean {
    const featureEnabled = process.env.FEATURE_AI_DESCRIPTION === 'true';
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    if (!featureEnabled) {
      console.log('ℹ️ Feature AI_DESCRIPTION está deshabilitado');
    }

    if (!hasApiKey) {
      console.warn('⚠️ GEMINI_API_KEY no está configurado');
    }

    return featureEnabled && hasApiKey;
  }

  /**
   * Obtiene el modelo Gemini 2.5 Flash (recomendado para producción)
   * @returns Modelo o null si no está disponible
   */
  static getModel() {
    const genAI = this.getInstance();

    if (!genAI) {
      return null;
    }

    try {
      // Usar Gemini 2.5 Flash (más rápido, gratis, y suficientemente bueno)
      return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7, // Creatividad moderada
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024, // Suficiente para una descripción
        },
      });
    } catch (error) {
      console.error('❌ Error al obtener modelo Gemini:', error);
      return null;
    }
  }
}
