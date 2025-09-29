import { z } from 'zod'

export const communityRoleSchema = z.enum(['BUSCO', 'OFREZCO'])
export const petPreferenceSchema = z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE'])
export const smokePreferenceSchema = z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE'])
export const dietTypeSchema = z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO'])
export const roomTypeSchema = z.enum(['INDIVIDUAL', 'COMPARTIDA', 'ESTUDIO', 'CASA_COMPLETA'])
export const sortTypeSchema = z.enum(['recent', 'highlight'])

export const createCommunityPostSchema = z.object({
  role: communityRoleSchema,
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  neighborhood: z.string().optional(),
  price: z.number().min(0).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  availableFrom: z.string().optional(),
  leaseTerm: z.string().optional(),
  roomType: roomTypeSchema,
  occupants: z.number().min(1).max(10).optional(),
  petPref: petPreferenceSchema,
  smokePref: smokePreferenceSchema,
  diet: dietTypeSchema,
  amenities: z.array(z.string()).default([]),
  tags: z.array(z.string()).max(10, 'Máximo 10 tags permitidos').default([]),
  images: z.array(z.string().url('URL de imagen inválida')).max(5, 'Máximo 5 imágenes permitidas').default([])
}).refine((data) => {
  // Si es OFREZCO, debe tener price
  if (data.role === 'OFREZCO' && !data.price) {
    return false
  }
  // Si es BUSCO, debe tener budgetMin y budgetMax
  if (data.role === 'BUSCO' && (!data.budgetMin || !data.budgetMax)) {
    return false
  }
  // budgetMax debe ser mayor que budgetMin
  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    return false
  }
  return true
}, {
  message: "Datos de presupuesto inválidos según el rol seleccionado"
})

export const communityPostFiltersSchema = z.object({
  city: z.string().optional(),
  role: communityRoleSchema.optional(),
  q: z.string().optional(),
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  roomType: roomTypeSchema.optional(),
  petPref: petPreferenceSchema.optional(),
  smokePref: smokePreferenceSchema.optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  sort: sortTypeSchema.default('recent')
})

export type CreateCommunityPostInput = z.infer<typeof createCommunityPostSchema>
export type CommunityPostFilters = z.infer<typeof communityPostFiltersSchema>
