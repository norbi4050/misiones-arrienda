import { z } from 'zod';

// Schema específico para el formulario de publicar - sin defaults que causen conflictos
export const propertySchema = z.object({
  // Campos básicos requeridos
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().positive('El precio debe ser positivo'),
  currency: z.string(),
  
  // Tipo de propiedad
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  
  // Características
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos'),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos'),
  garages: z.number().min(0, 'Los garajes no pueden ser negativos'),
  
  // Área
  area: z.number().positive('El área debe ser positiva'),
  
  // Ubicación
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string(),
  country: z.string(),
  
  // Contacto
  contact_phone: z.string().min(1, 'El teléfono de contacto es requerido'),
  
  // Multimedia
  images: z.array(z.string()),
  
  // Características adicionales
  amenities: z.array(z.string()),
  features: z.array(z.string()),
  
  // Campos específicos del formulario
  mascotas: z.boolean(),
  expensasIncl: z.boolean(),
  servicios: z.array(z.string()),
  
  // Información adicional
  yearBuilt: z.number().optional(),
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  
  // Estado y configuración - sin defaults para evitar conflictos
  status: z.enum(['active', 'inactive', 'sold', 'rented']),
  featured: z.boolean(),
  
  // Precios adicionales
  oldPrice: z.number().optional(),
  deposit: z.number().min(0).optional(),
  
  // Campos de sistema (opcionales para formularios)
  userId: z.string().optional(),
  agentId: z.string().optional(),
  expiresAt: z.date().optional(),
  highlightedUntil: z.date().optional(),
  isPaid: z.boolean().optional()
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// Schema específico para creación con defaults aplicados
export const createPropertySchema = z.object({
  // Campos básicos requeridos
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().positive('El precio debe ser positivo'),
  currency: z.string().default('ARS'),
  
  // Tipo de propiedad
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  
  // Características
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos'),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos'),
  garages: z.number().min(0, 'Los garajes no pueden ser negativos').default(0),
  
  // Área
  area: z.number().positive('El área debe ser positiva'),
  
  // Ubicación
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().default('Misiones'),
  country: z.string().default('Argentina'),
  
  // Contacto
  contact_phone: z.string().min(1, 'El teléfono de contacto es requerido'),
  
  // Multimedia
  images: z.array(z.string()).default([]),
  
  // Características adicionales
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  
  // Campos específicos del formulario
  mascotas: z.boolean().default(false),
  expensasIncl: z.boolean().default(false),
  servicios: z.array(z.string()).default([]),
  
  // Estado y configuración
  status: z.enum(['active', 'inactive', 'sold', 'rented']).default('active'),
  featured: z.boolean().default(false),
  
  // Precios adicionales
  deposit: z.number().min(0).optional(),
  
  // Campos de sistema
  isPaid: z.boolean().default(false)
});

// Schema para actualización (todos opcionales excepto ID)
export const updatePropertySchema = propertySchema.partial().extend({
  id: z.string()
});
