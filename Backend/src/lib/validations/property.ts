import { z } from 'zod';
import { PLAN_LIMITS } from '@/types/property';

// Validación de arrays JSON
const jsonArraySchema = z.array(z.string()).refine(
  (arr) => Array.isArray(arr),
  { message: 'Debe ser un array válido' }
);

// Schema unificado para propiedades - Sincronizado con Prisma
export const propertySchema = z.object({
  // Campos básicos requeridos
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000, 'La descripción es muy larga'),
  price: z.number().positive('El precio debe ser positivo').max(999999999, 'El precio es muy alto'),
  currency: z.string().default('ARS'),
  oldPrice: z.number().positive().optional(),
  
  // Tipo de propiedad - CORREGIDO: propertyType en lugar de type
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  
  // Características
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos').max(20, 'Demasiados dormitorios'),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos').max(20, 'Demasiados baños'),
  garages: z.number().min(0, 'Los garajes no pueden ser negativos').max(10, 'Demasiados garajes').default(0),
  
  // Área
  area: z.number().positive('El área debe ser positiva').max(100000, 'El área es muy grande'),
  lotArea: z.number().positive().optional(),
  
  // Ubicación - TODOS LOS CAMPOS SINCRONIZADOS CON PRISMA
  address: z.string().min(1, 'La dirección es requerida').max(300, 'La dirección es muy larga'),
  city: z.string().min(1, 'La ciudad es requerida').max(100, 'El nombre de la ciudad es muy largo'),
  province: z.string().default('Misiones'),
  postalCode: z.string().min(1, 'El código postal es requerido').max(10, 'Código postal inválido'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Contacto
  contact_name: z.string().max(100, 'El nombre es muy largo').optional(),
  contact_phone: z.string().min(1, 'El teléfono de contacto es requerido').max(20, 'Teléfono inválido'),
  contact_email: z.string().email('Email inválido').optional(),
  
  // Multimedia - VALIDACIÓN JSON ESTRUCTURADA
  images: jsonArraySchema.refine(
    (images) => images.length <= 20,
    { message: 'Máximo 20 imágenes permitidas' }
  ),
  virtualTourUrl: z.string().url('URL inválida').optional(),
  
  // Características adicionales - VALIDACIÓN JSON ESTRUCTURADA
  amenities: jsonArraySchema.default([]),
  features: jsonArraySchema.default([]),
  
  // Información adicional - CAMPOS FALTANTES AGREGADOS
  yearBuilt: z.number().min(1800, 'Año muy antiguo').max(new Date().getFullYear() + 5, 'Año futuro inválido').optional(),
  floor: z.number().min(0, 'Piso inválido').max(200, 'Piso muy alto').optional(),
  totalFloors: z.number().min(1, 'Total de pisos inválido').max(200, 'Demasiados pisos').optional(),
  
  // Estado - SINCRONIZADO CON PRISMA
  status: z.enum(['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED']).default('AVAILABLE'),
  featured: z.boolean().default(false),
  
  // Campos específicos del formulario (no en Prisma)
  mascotas: z.boolean().default(false),
  expensasIncl: z.boolean().default(false),
  servicios: jsonArraySchema.default([]),
  
  // Campos de sistema
  expiresAt: z.date().optional(),
  highlightedUntil: z.date().optional(),
  isPaid: z.boolean().default(false),
  userId: z.string().optional(),
  agentId: z.string().optional()
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// Schema para creación con validación de plan
export const createPropertySchema = propertySchema.extend({
  plan: z.enum(['basic', 'featured', 'premium']).default('basic')
}).refine(
  (data) => {
    const planLimits = PLAN_LIMITS[data.plan];
    return data.images.length <= planLimits.images;
  },
  {
    message: 'Excede el límite de imágenes para este plan',
    path: ['images']
  }
).refine(
  (data) => {
    const planLimits = PLAN_LIMITS[data.plan];
    if (data.featured && !planLimits.featured) {
      return false;
    }
    return true;
  },
  {
    message: 'Plan no permite propiedades destacadas',
    path: ['featured']
  }
);

// Schema para actualización
export const updatePropertySchema = propertySchema.partial().extend({
  id: z.string().cuid('ID inválido')
});

// Schema para filtros
export const propertyFiltersSchema = z.object({
  city: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minBedrooms: z.number().min(0).optional(),
  minBathrooms: z.number().min(0).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;

// Función de validación con autenticación
export function validatePropertyWithAuth(data: unknown, userId?: string) {
  const result = createPropertySchema.safeParse(data);
  
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

// Función para validar límites por plan
export function validatePlanLimits(data: PropertyFormData, plan: string) {
  const limits = PLAN_LIMITS[plan];
  const errors: string[] = [];
  
  if (data.images.length > limits.images) {
    errors.push(`Máximo ${limits.images} imágenes para el plan ${plan}`);
  }
  
  if (data.featured && !limits.featured) {
    errors.push(`El plan ${plan} no permite propiedades destacadas`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
