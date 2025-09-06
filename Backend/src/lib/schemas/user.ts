import { z } from 'zod';

// Campos válidos del modelo users según el esquema real de Supabase (snake_case)
export const validUserFields = [
  'name',
  'email',
  'phone',
  'avatar',
  'bio',
  'occupation',
  'age',
  'user_type',
  'company_name',
  'license_number',
  'property_count',
  'full_name',
  'location',
  'search_type',
  'budget_range',
  'profile_image',
  'preferred_areas',
  'family_size',
  'pet_friendly',
  'move_in_date',
  'employment_status',
  'monthly_income'
];

// Campos que deben ser INTEGER en la base de datos
const integerFields = ['age', 'family_size', 'review_count'];

// Campos que deben ser NUMERIC en la base de datos
const numericFields = ['monthly_income', 'rating'];

// Campos que deben ser BOOLEAN en la base de datos
const booleanFields = ['pet_friendly', 'verified', 'email_verified'];

// Campos que deben ser DATE en la base de datos
const dateFields = ['move_in_date'];

// Schema para actualizar usuario
export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255).optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().min(1, 'El teléfono es requerido').max(20).optional(),
  avatar: z.string().url('URL de avatar inválida').optional(),
  bio: z.string().max(1000, 'La bio no puede exceder 1000 caracteres').optional(),
  occupation: z.string().min(1, 'La ocupación es requerida').max(255).optional(),
  age: z.number().int().min(18, 'Debe ser mayor de 18 años').max(120).optional(),
  user_type: z.enum(['inquilino', 'propietario', 'agente']).optional(),
  company_name: z.string().max(255).optional(),
  license_number: z.string().max(50).optional(),
  property_count: z.number().int().min(0).optional(),
  full_name: z.string().min(1, 'El nombre completo es requerido').max(255).optional(),
  location: z.string().min(1, 'La ubicación es requerida').max(255).optional(),
  search_type: z.enum(['alquiler', 'compra']).optional(),
  budget_range: z.string().max(100).optional(),
  profile_image: z.string().url('URL de imagen inválida').optional(),
  preferred_areas: z.string().max(500).optional(),
  family_size: z.number().int().min(1).max(20).optional(),
  pet_friendly: z.boolean().optional(),
  move_in_date: z.string().refine((date: string) => !isNaN(Date.parse(date)), 'Fecha inválida').optional(),
  employment_status: z.enum(['employed', 'self-employed', 'unemployed', 'student', 'retired']).optional(),
  monthly_income: z.number().min(0).optional(),
  verified: z.boolean().optional(),
  email_verified: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().min(0).optional()
}).strict();

// Función para validar y convertir tipos de datos
export function validateAndConvertData(data: any): any {
  const convertedData: any = {}

  Object.keys(data).forEach(key => {
    // Solo procesar campos válidos
    if (!validUserFields.includes(key)) {
      throw new Error(`Campo no válido: ${key}`);
    }

    const value = data[key]

    // Campos INTEGER
    if (integerFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        const numValue = parseInt(value, 10)
        convertedData[key] = isNaN(numValue) ? null : numValue
      } else if (typeof value === 'number') {
        convertedData[key] = value
      } else {
        convertedData[key] = null
      }
    }
    // Campos NUMERIC
    else if (numericFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value)
        convertedData[key] = isNaN(numValue) ? null : numValue
      } else if (typeof value === 'number') {
        convertedData[key] = value
      } else {
        convertedData[key] = null
      }
    }
    // Campos BOOLEAN
    else if (booleanFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'boolean') {
        convertedData[key] = value
      } else if (typeof value === 'string') {
        convertedData[key] = value.toLowerCase() === 'true'
      } else {
        convertedData[key] = Boolean(value)
      }
    }
    // Campos DATE
    else if (dateFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        // Validar formato de fecha
        const dateValue = new Date(value)
        convertedData[key] = isNaN(dateValue.getTime()) ? null : value
      } else {
        convertedData[key] = value
      }
    }
    // Campos TEXT (string)
    else {
      // Para campos de texto, mantener el valor original (pero no vacío)
      if (value !== '' && value !== null && value !== undefined) {
        convertedData[key] = String(value)
      }
    }
  })

  return convertedData
}

// Función wrapper para validar con Zod
export function validateUserData(data: any, schema: z.ZodSchema) {
  try {
    const result = schema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? null : result.error.errors
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ message: 'Error de validación interno' }]
    };
  }
}
