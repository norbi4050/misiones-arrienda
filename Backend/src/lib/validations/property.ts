import { z } from 'zod'

export const propertySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().min(1, 'La descripción es requerida').max(2000, 'La descripción es muy larga'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  currency: z.string().min(1, 'La moneda es requerida'),
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND'], {
    errorMap: () => ({ message: 'Tipo de propiedad inválido' })
  }),
  bedrooms: z.number().min(0, 'Los dormitorios no pueden ser negativos').optional(),
  bathrooms: z.number().min(0, 'Los baños no pueden ser negativos').optional(),
  area: z.number().min(1, 'El área debe ser mayor a 0'),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().optional(),
  country: z.string().optional(),
  contact_phone: z.string().min(1, 'El teléfono de contacto es requerido'),
  images: z.array(z.string()),
  amenities: z.array(z.string()),
  features: z.array(z.string()),
  deposit: z.number().min(0, 'El depósito no puede ser negativo').optional(),
  mascotas: z.boolean().optional(),
  expensasIncl: z.boolean().optional(),
  servicios: z.array(z.string()).optional()
})

export type PropertyFormData = z.infer<typeof propertySchema>
