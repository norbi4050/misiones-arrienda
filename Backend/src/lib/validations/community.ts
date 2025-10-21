import { z } from 'zod'

// Helpers de normalización
const norm = (v: unknown) =>
  typeof v === 'string' ? v.trim().toUpperCase().replace(/\s+/g, '_') : v

const coercePosNum = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().positive().optional()
)

// Schemas base (mantener para compatibilidad)
export const communityRoleSchema = z.enum(['BUSCO', 'OFREZCO'])
export const petPreferenceSchema = z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE'])
export const smokePreferenceSchema = z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE'])
export const dietTypeSchema = z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO'])
export const roomTypeSchema = z.enum(['PRIVADA', 'COMPARTIDA', 'ESTUDIO', 'CASA_COMPLETA'])
export const sortTypeSchema = z.enum(['recent', 'highlight'])

// Unions con normalización
const Role = z.union([z.literal('BUSCO'), z.literal('OFREZCO')])
const RoomType = z.union([
  z.literal('PRIVADA'),
  z.literal('COMPARTIDA'),
  z.literal('ESTUDIO'),
  z.literal('CASA_COMPLETA')
])
const PetPref = z.union([z.literal('SI_PET'), z.literal('NO_PET'), z.literal('INDIFERENTE')])
const SmokePref = z.union([z.literal('FUMADOR'), z.literal('NO_FUMADOR'), z.literal('INDIFERENTE')])
const Diet = z.union([
  z.literal('NINGUNA'),
  z.literal('VEGETARIANO'),
  z.literal('VEGANO'),
  z.literal('CELIACO'),
  z.literal('OTRO')
])

export const createCommunityPostSchema = z.object({
  role: z.preprocess(norm, Role),
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  neighborhood: z.string().optional(),
  price: z.preprocess((v) => (v === '' ? undefined : v), coercePosNum),
  budgetMin: z.preprocess((v) => (v === '' ? undefined : v), coercePosNum),
  budgetMax: z.preprocess((v) => (v === '' ? undefined : v), coercePosNum),
  availableFrom: z.string().optional(),
  leaseTerm: z.string().optional(),
  roomType: z.preprocess(norm, RoomType),
  occupants: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().min(1).optional()),
  petPref: z.preprocess(norm, PetPref),
  smokePref: z.preprocess(norm, SmokePref),
  diet: z.preprocess(norm, Diet),
  amenities: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).max(10, 'Máximo 10 tags permitidos').optional().default([]),
  images: z.array(z.string()).max(5, 'Máximo 5 imágenes permitidas').optional().default([])
}).superRefine((data, ctx) => {
  // Validar price para OFREZCO
  if (data.role === 'OFREZCO' && !data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'El precio es obligatorio cuando ofreces habitación'
    })
  }

  // Validar budgetMin para BUSCO
  if (data.role === 'BUSCO' && !data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['budgetMin'],
      message: 'El presupuesto mínimo es obligatorio cuando buscas habitación'
    })
  }

  // Validar budgetMax para BUSCO
  if (data.role === 'BUSCO' && !data.budgetMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['budgetMax'],
      message: 'El presupuesto máximo es obligatorio cuando buscas habitación'
    })
  }

  // Validar que budgetMax > budgetMin
  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['budgetMax'],
      message: 'El presupuesto máximo debe ser mayor al mínimo'
    })
  }
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

// Schema para actualizar posts (sin validaciones de refine, todos opcionales)
export const updateCommunityPostSchema = z.object({
  role: communityRoleSchema.optional(),
  title: z.string().min(10).max(100).optional(),
  description: z.string().min(50).max(1000).optional(),
  city: z.string().min(1).optional(),
  neighborhood: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  availableFrom: z.string().optional(),
  leaseTerm: z.string().optional(),
  roomType: roomTypeSchema.optional(),
  occupants: z.coerce.number().int().min(1).optional(),
  petPref: petPreferenceSchema.optional(),
  smokePref: smokePreferenceSchema.optional(),
  diet: dietTypeSchema.optional(),
  amenities: z.array(z.string()).optional(),
  tags: z.array(z.string()).max(10).optional(),
  images: z.array(z.string().url()).max(5).optional()
})

export type CreateCommunityPostInput = z.infer<typeof createCommunityPostSchema>
export type UpdateCommunityPostInput = z.infer<typeof updateCommunityPostSchema>
export type CommunityPostFilters = z.infer<typeof communityPostFiltersSchema>
