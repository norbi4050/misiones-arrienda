/**
 * Prompts para el modelo Gemini AI
 *
 * Estos prompts están optimizados para generar descripciones de propiedades
 * en español de Argentina, específicamente para la provincia de Misiones.
 */

export const PROPERTY_ANALYSIS_SYSTEM_PROMPT = `Eres un experto agente inmobiliario de Misiones, Argentina, especializado en crear descripciones atractivas y profesionales de propiedades.

Tu tarea es analizar información de propiedades y generar:
1. Títulos persuasivos y concisos (máximo 80 caracteres)
2. Descripciones vendedoras en español argentino (100-150 palabras)
3. Listas de amenidades relevantes
4. Características destacables

ESTILO DE ESCRITURA:
- Profesional pero cálido y cercano
- Usa lenguaje argentino natural (ej: "depto" en vez de "departamento" en título)
- Enfócate en BENEFICIOS, no solo características
- Sé honesto, no exageres
- Menciona la ubicación cuando sea relevante
- Usa emojis sutiles si mejora la legibilidad (máximo 2)

CONTEXTO REGIONAL:
- Misiones es una provincia del noreste argentino
- Ciudades principales: Posadas, Oberá, Eldorado, Puerto Iguazú
- Clima subtropical, mucha vegetación
- Cercano a cataratas del Iguazú (punto turístico)

NO INCLUYAS:
- Información de contacto
- Precios específicos (ya están en otros campos)
- Frases cliché como "excelente oportunidad" sin contexto
- Promesas que no puedas verificar`;

export function generatePropertyAnalysisPrompt(data: {
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  area?: number;
  price: number;
  currency?: string;
  city?: string;
  operationType?: string;
}) {
  const propertyTypeSpanish = translatePropertyType(data.propertyType);
  const operationTypeSpanish = translateOperationType(data.operationType || 'RENT');

  return `${PROPERTY_ANALYSIS_SYSTEM_PROMPT}

DATOS DE LA PROPIEDAD:
- Tipo: ${propertyTypeSpanish}
- Operación: ${operationTypeSpanish}
- Dormitorios: ${data.bedrooms || 'No especificado'}
- Baños: ${data.bathrooms || 'No especificado'}
- Cocheras: ${data.garages || 'No especificado'}
- Área: ${data.area ? `${data.area}m²` : 'No especificado'}
- Precio: ${data.currency || 'ARS'} $${data.price.toLocaleString('es-AR')}
- Ciudad: ${data.city || 'Misiones'}

INSTRUCCIONES ESPECÍFICAS:
1. Genera un título atractivo de máximo 80 caracteres
2. Escribe una descripción de 100-150 palabras que destaque:
   - Tipo de propiedad y características principales
   - Espacios y distribución
   - Ubicación y cercanía a servicios
   - Ideal para qué tipo de persona/familia
3. Lista 8-10 amenidades relevantes para este tipo de propiedad
4. Lista 5-7 características destacables
5. Crea un highlight de 1 línea (máximo 100 caracteres) que resuma lo mejor

FORMATO DE RESPUESTA (JSON válido, sin markdown):
{
  "title": "Título atractivo aquí",
  "description": "Descripción completa aquí...",
  "amenities": ["Amenidad 1", "Amenidad 2", ...],
  "features": ["Característica 1", "Característica 2", ...],
  "highlights": "Resumen de 1 línea aquí"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después.`;
}

/**
 * Traduce tipos de propiedad de inglés a español argentino
 */
function translatePropertyType(type: string): string {
  const translations: Record<string, string> = {
    APARTMENT: 'Departamento',
    HOUSE: 'Casa',
    PH: 'PH (Propiedad Horizontal)',
    COMMERCIAL: 'Local Comercial',
    OFFICE: 'Oficina',
    WAREHOUSE: 'Depósito',
    LAND: 'Terreno',
    STUDIO: 'Estudio',
    ROOM: 'Habitación',
  };

  return translations[type] || type;
}

/**
 * Traduce tipos de operación de inglés a español
 */
function translateOperationType(type: string): string {
  const translations: Record<string, string> = {
    RENT: 'Alquiler',
    SALE: 'Venta',
    BOTH: 'Alquiler o Venta',
  };

  return translations[type] || type;
}

/**
 * Prompt para regenerar descripciones (cuando el usuario no está conforme)
 */
export function generateRegeneratePrompt(
  originalData: any,
  userFeedback?: string
): string {
  let additionalInstructions = '';

  if (userFeedback) {
    additionalInstructions = `\n\nFEEDBACK DEL USUARIO:
"${userFeedback}"

Por favor, ajusta la descripción considerando este feedback.`;
  } else {
    additionalInstructions = `\n\nGenera una VARIACIÓN diferente de la descripción anterior:
- Usa sinónimos y estructura diferente
- Enfoca en otros aspectos positivos
- Mantén el mismo tono profesional`;
  }

  return generatePropertyAnalysisPrompt(originalData) + additionalInstructions;
}
