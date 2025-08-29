import { z } from 'zod'

export const propertySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().min(1, 'La descripción es requerida').max(2000, 'La descripción es muy larga'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  currency: z.string().default('ARS'),
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND'], {
    errorMap: () => ({ message: 'Tipo de propiedad inválido' })
  }),
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos').optional(),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos').optional(),
  area: z.number().min(1, 'El área debe ser mayor a 0'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().default('Misiones'),
  country: z.string().default('Argentina'),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  deposit: z.number().min(0, 'El depósito no puede ser negativo').optional(),
  mascotas: z.boolean().default(false),
  expensasIncl: z.boolean().default(false),
  servicios: z.array(z.string()).default([])
})

export type PropertyFormData = z.infer<typeof propertySchema>
