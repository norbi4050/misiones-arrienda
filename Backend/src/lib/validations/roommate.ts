import { z } from 'zod';
import { ROOMMATE_CONSTANTS } from '@/types/roommate';

// =====================================================
// VALIDACIONES ZOD PARA SISTEMA DE ROOMMATES - 2025
// =====================================================

// Validación de arrays JSON para imágenes
const jsonArraySchema = z.array(z.string()).refine(
  (arr) => Array.isArray(arr),
  { message: 'Debe ser un array válido' }
);

// Schema principal para roommate posts
export const roommateSchema = z.object({
  // Campos básicos requeridos
  title: z.string()
    .min(ROOMMATE_CONSTANTS.TITLE_MIN_LENGTH, `El título debe tener al menos ${ROOMMATE_CONSTANTS.TITLE_MIN_LENGTH} caracteres`)
    .max(ROOMMATE_CONSTANTS.TITLE_MAX_LENGTH, `El título no puede exceder ${ROOMMATE_CONSTANTS.TITLE_MAX_LENGTH} caracteres`)
    .transform(str => str.trim().replace(/\s+/g, ' ')) // Colapsar espacios
    .refine(str => !str.includes('<') && !str.includes('>'), {
      message: 'El título no puede contener caracteres < o >'
    }),

  description: z.string()
    .min(ROOMMATE_CONSTANTS.DESCRIPTION_MIN_LENGTH, `La descripción debe tener al menos ${ROOMMATE_CONSTANTS.DESCRIPTION_MIN_LENGTH} caracteres`)
    .max(ROOMMATE_CONSTANTS.DESCRIPTION_MAX_LENGTH, `La descripción no puede exceder ${ROOMMATE_CONSTANTS.DESCRIPTION_MAX_LENGTH} caracteres`)
    .transform(str => str.trim()),

  // Ubicación
  city: z.string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'El nombre de la ciudad es muy largo')
    .transform(str => str.trim()),

  province: z.string()
    .default('Misiones')
    .transform(str => str.trim()),

  // Tipo de habitación - REQUERIDO
  roomType: z.enum(['PRIVATE', 'SHARED'], {
    errorMap: () => ({ message: 'Debe seleccionar PRIVATE o SHARED' })
  }),

  // Renta mensual
  monthlyRent: z.number()
    .min(ROOMMATE_CONSTANTS.MIN_RENT, `La renta debe ser mayor o igual a ${ROOMMATE_CONSTANTS.MIN_RENT}`)
    .max(ROOMMATE_CONSTANTS.MAX_RENT, `La renta no puede exceder ${ROOMMATE_CONSTANTS.MAX_RENT}`)
    .int('La renta debe ser un número entero'),

  // Fecha disponible desde
  availableFrom: z.string()
    .min(1, 'La fecha de disponibilidad es requerida')
    .refine(dateStr => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }, { message: 'Fecha inválida' })
    .refine(dateStr => {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: 'La fecha debe ser hoy o en el futuro' }),

  // Preferencias opcionales
  preferences: z.string()
    .max(ROOMMATE_CONSTANTS.PREFERENCES_MAX_LENGTH, `Las preferencias no pueden exceder ${ROOMMATE_CONSTANTS.PREFERENCES_MAX_LENGTH} caracteres`)
    .optional()
    .transform(str => str?.trim()),

  // Imágenes - VALIDACIÓN ESTRUCTURADA
  images: jsonArraySchema
    .refine(images => images.length <= ROOMMATE_CONSTANTS.MAX_IMAGES, {
      message: `Máximo ${ROOMMATE_CONSTANTS.MAX_IMAGES} imágenes permitidas`
    })
    .default([]),

  imagesUrls: jsonArraySchema
    .refine(images => images.length <= ROOMMATE_CONSTANTS.MAX_IMAGES, {
      message: `Máximo ${ROOMMATE_CONSTANTS.MAX_IMAGES} imágenes permitidas`
    })
    .default([]),

  // Estado
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  isActive: z.boolean().default(true),

  // Campos de sistema opcionales
  userId: z.string().optional(),
  slug: z.string().optional(),
});

// Schema específico para formularios
export const roommateFormSchema = z.object({
  title: z.string()
    .min(ROOMMATE_CONSTANTS.TITLE_MIN_LENGTH, `El título debe tener al menos ${ROOMMATE_CONSTANTS.TITLE_MIN_LENGTH} caracteres`)
    .max(ROOMMATE_CONSTANTS.TITLE_MAX_LENGTH, `El título no puede exceder ${ROOMMATE_CONSTANTS.TITLE_MAX_LENGTH} caracteres`)
    .transform(str => str.trim().replace(/\s+/g, ' ')),

  description: z.string()
    .min(ROOMMATE_CONSTANTS.DESCRIPTION_MIN_LENGTH, `La descripción debe tener al menos ${ROOMMATE_CONSTANTS.DESCRIPTION_MIN_LENGTH} caracteres`)
    .max(ROOMMATE_CONSTANTS.DESCRIPTION_MAX_LENGTH, `La descripción no puede exceder ${ROOMMATE_CONSTANTS.DESCRIPTION_MAX_LENGTH} caracteres`)
    .transform(str => str.trim()),

  city: z.string().min(1, 'La ciudad es requerida').transform(str => str.trim()),
  province: z.string().default('Misiones').transform(str => str.trim()),
  roomType: z.enum(['PRIVATE', 'SHARED']),
  monthlyRent: z.number().min(0, 'La renta debe ser mayor o igual a 0'),
  availableFrom: z.string().min(1, 'La fecha de disponibilidad es requerida'),
  preferences: z.string().optional().transform(str => str?.trim()),
  images: jsonArraySchema.default([]),
  imagesUrls: jsonArraySchema.default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

// Schema para creación (POST)
export const createRoommateSchema = roommateFormSchema.extend({
  // Validaciones adicionales para creación
}).refine(data => {
  // Validar que al menos uno de los campos de imagen esté presente
  return data.images.length > 0 || data.imagesUrls.length > 0 || true; // Permitir sin imágenes inicialmente
}, {
  message: 'Se recomienda agregar al menos una imagen',
  path: ['images']
});

// Schema para actualización (PATCH)
export const updateRoommateSchema = roommateSchema.partial().extend({
  id: z.string().min(1, 'ID requerido')
});

// Schema para filtros de búsqueda
export const roommateFiltersSchema = z.object({
  q: z.string().optional(), // Búsqueda de texto
  city: z.string().optional(),
  province: z.string().optional(),
  roomType: z.enum(['PRIVATE', 'SHARED']).optional(),
  minRent: z.number().min(0).optional(),
  maxRent: z.number().min(0).optional(),
  availableFrom: z.string().optional(), // ISO date string
  order: z.enum(['recent', 'trending']).default('recent'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12)
}).refine(data => {
  // Validar que minRent <= maxRent si ambos están presentes
  if (data.minRent !== undefined && data.maxRent !== undefined) {
    return data.minRent <= data.maxRent;
  }
  return true;
}, {
  message: 'El precio mínimo debe ser menor o igual al precio máximo',
  path: ['minRent']
});

// Schema para acciones de like
export const roommateLikeSchema = z.object({
  roommatePostId: z.string().min(1, 'ID del post requerido'),
});

// Schema para reportes
export const roommateReportSchema = z.object({
  roommatePostId: z.string().min(1, 'ID del post requerido'),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'FAKE', 'OTHER'], {
    errorMap: () => ({ message: 'Razón de reporte inválida' })
  }),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .transform(str => str?.trim()),
});

// Schema para slug generation
export const roommateSlugSchema = z.object({
  title: z.string().min(1, 'Título requerido para generar slug'),
  id: z.string().min(1, 'ID requerido para generar slug'),
});

// Tipos exportados
export type RoommateFormData = z.infer<typeof roommateFormSchema>;
export type CreateRoommateData = z.infer<typeof createRoommateSchema>;
export type UpdateRoommateData = z.infer<typeof updateRoommateSchema>;
export type RoommateFilters = z.infer<typeof roommateFiltersSchema>;
export type RoommateLikeData = z.infer<typeof roommateLikeSchema>;
export type RoommateReportData = z.infer<typeof roommateReportSchema>;
export type RoommateSlugData = z.infer<typeof roommateSlugSchema>;

// Función de validación con autenticación
export function validateRoommateWithAuth(data: unknown, userId?: string) {
  const result = createRoommateSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Validar autenticación
  if (!userId) {
    return {
      success: false,
      error: { message: 'Usuario no autenticado' }
    };
  }

  // Agregar userId a los datos validados
  const validatedData = {
    ...result.data,
    userId
  };

  return { success: true, data: validatedData };
}

// Función para validar publish-ready
export function validatePublishReady(data: RoommateFormData): {
  isReady: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Campos obligatorios para publicar
  if (!data.title || data.title.trim().length < ROOMMATE_CONSTANTS.TITLE_MIN_LENGTH) {
    missingFields.push('título');
  }

  if (!data.description || data.description.trim().length < ROOMMATE_CONSTANTS.DESCRIPTION_MIN_LENGTH) {
    missingFields.push('descripción');
  }

  if (!data.city || data.city.trim().length === 0) {
    missingFields.push('ciudad');
  }

  if (!data.roomType) {
    missingFields.push('tipo de habitación');
  }

  if (!data.monthlyRent || data.monthlyRent <= 0) {
    missingFields.push('renta mensual');
  }

  if (!data.availableFrom) {
    missingFields.push('fecha de disponibilidad');
  }

  // Advertencias (no bloquean publicación)
  if (!data.images || data.images.length === 0) {
    warnings.push('Se recomienda agregar al menos una imagen');
  }

  if (!data.preferences || data.preferences.trim().length === 0) {
    warnings.push('Agregar preferencias ayuda a encontrar mejores matches');
  }

  return {
    isReady: missingFields.length === 0,
    missingFields,
    warnings
  };
}

// Función para generar slug único
export function generateRoommateSlug(title: string, id: string): string {
  // Limpiar título para slug
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 50); // Limitar longitud

  // Agregar ID corto al final para unicidad
  const shortId = id.substring(0, 8);
  return `${baseSlug}-${shortId}`;
}

// Función para validar imágenes
export function validateRoommateImages(images: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (images.length > ROOMMATE_CONSTANTS.MAX_IMAGES) {
    errors.push(`Máximo ${ROOMMATE_CONSTANTS.MAX_IMAGES} imágenes permitidas`);
  }

  // Validar que no sean data URIs (demasiado grandes)
  const dataUris = images.filter(img => img.startsWith('data:'));
  if (dataUris.length > 0) {
    errors.push('No se permiten imágenes en formato base64. Use el uploader de archivos.');
  }

  // Validar URLs válidas o keys de storage
  const invalidImages = images.filter(img => {
    if (img.startsWith('http')) {
      try {
        new URL(img);
        return false;
      } catch {
        return true;
      }
    }
    // Validar formato de key de storage: user_id/post_id/filename
    return !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.+-]+$/.test(img);
  });

  if (invalidImages.length > 0) {
    errors.push('Algunas imágenes tienen formato inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Función para sanitizar datos de entrada
export function sanitizeRoommateInput(data: any): any {
  return {
    ...data,
    title: data.title?.trim().replace(/\s+/g, ' '),
    description: data.description?.trim(),
    city: data.city?.trim(),
    province: data.province?.trim() || 'Misiones',
    preferences: data.preferences?.trim(),
  };
}
