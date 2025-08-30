import { z } from 'zod';

export const propertySchema = z.object({
  // Campos básicos requeridos
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  price: z.number().positive('El precio debe ser positivo'),
  currency: z.string().default('ARS'),
  
  // Tipo de propiedad
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  propertyType: z.string().optional(), // Para compatibilidad con Prisma
  
  // Características - Hacer consistente con Prisma (requeridos)
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos'),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos'),
  garages: z.number().min(0, 'Los garajes no pueden ser negativos').default(0),
  
  // Área
  area: z.number().positive('El área debe ser positiva'),
  lotArea: z.number().positive().optional(),
  
  // Ubicación
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  province: z.string().default('Misiones'),
  state: z.string().default('Misiones'), // Para formularios - cambiar a default
  country: z.string().default('Argentina'),
  postalCode: z.string().optional(),
  
  // Coordenadas
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Contacto - Agregar campos faltantes
  contact_phone: z.string().min(1, 'El teléfono de contacto es requerido'),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  
  // Multimedia
  images: z.array(z.string()).default([]),
  virtualTourUrl: z.string().url().optional(),
  
  // Características adicionales
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  
  // Campos específicos del formulario
  mascotas: z.boolean().default(false),
  expensasIncl: z.boolean().default(false),
  servicios: z.array(z.string()).default([]),
  
  // Información adicional
  yearBuilt: z.number().optional(),
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  
  // Estado y configuración
  status: z.enum(['active', 'inactive', 'sold', 'rented']).default('active'),
  featured: z.boolean().default(false),
  
  // Precios adicionales
  oldPrice: z.number().optional(),
  deposit: z.number().optional(),
  
  // Campos de sistema (opcionales para formularios)
  userId: z.string().optional(),
  agentId: z.string().optional(),
  expiresAt: z.date().optional(),
  highlightedUntil: z.date().optional(),
  isPaid: z.boolean().default(false)
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// Schema específico para creación (campos mínimos requeridos)
export const createPropertySchema = propertySchema.pick({
  title: true,
  description: true,
  price: true,
  currency: true,
  type: true,
  bedrooms: true,
  bathrooms: true,
  area: true,
  address: true,
  city: true,
  contact_phone: true,
  images: true,
  amenities: true
});

// Schema para actualización (todos opcionales excepto ID)
export const updatePropertySchema = propertySchema.partial().extend({
  id: z.string()
});
