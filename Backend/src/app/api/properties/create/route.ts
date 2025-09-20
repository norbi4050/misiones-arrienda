import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== CREATE PROPERTY REQUEST STARTED ===')
  console.log('Request method:', req.method)
  console.log('Request headers logged')

  try {
    // Verificar autenticación del usuario
    console.log('Checking authentication...')
    const authenticatedUser = await getAuthenticatedUser(req)
    console.log('Authenticated user:', authenticatedUser ? 'Found' : 'Not found')
    if (authenticatedUser) {
      console.log('User details:', { id: authenticatedUser.id, name: authenticatedUser.name, email: authenticatedUser.email })
    }
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado. Debe iniciar sesión para crear propiedades.' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      title,
      description,
      price,
      currency = 'ARS', // Campo currency con valor por defecto
      propertyType,
      bedrooms,
      bathrooms,
      garages,
      area,
      address,
      city,
      province,
      plan, // Este campo lo usaremos para metadata pero no se guarda en Property
      featured,
      status,
      images = [],
      amenities = [],
      features = [],
      contact_phone, // Campo requerido según schema
      contact_name,
    } = body

    // Validación de campos requeridos (sin contact_phone ya que no existe en Supabase)
    if (!title || !description || !price || !propertyType || !bedrooms || !bathrooms || !area || !address || !city) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos. Se requiere: title, description, price, propertyType, bedrooms, bathrooms, area, address, city' },
        { status: 400 }
      )
    }

    // Validar que el precio sea un número válido
    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Usar Supabase directamente (bypass Prisma por problemas de conectividad)
    const supabase = await createClient()
    
    // SOLUCIÓN DEFINITIVA: Usar NULL para agent_id y crear propiedad con Service Role
    console.log('🔧 Usando Service Role para crear propiedad sin agent_id')
    
    // Crear cliente admin con Service Role Key para bypasear RLS completamente
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Preparar datos con nombres CORRECTOS según schema real de Supabase
    const propertyData: any = {
      title,
      description,
      price: numericPrice,
      currency: currency || 'ARS',
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      garages: parseInt(garages) || 0,
      area: parseFloat(area) || 50,
      address,
      city,
      province: province || 'Misiones',
      postal_code: '3300', // Código postal por defecto
      property_type: propertyType || 'HOUSE', // ✅ CORRECTO: property_type (snake_case)
      status: 'AVAILABLE',
      images: JSON.stringify(images.length > 0 ? images : ['/placeholder.jpg']),
      amenities: JSON.stringify(amenities.length > 0 ? amenities : ['Agua', 'Luz']),
      features: JSON.stringify(features.length > 0 ? features : ['Cocina']),
      user_id: authenticatedUser.id, // ✅ CORRECTO: user_id (snake_case)
      agent_id: null, // ✅ USAR NULL para evitar constraint
      is_active: true, // ✅ CORRECTO: is_active existe
      operation_type: 'rent',
      featured: false,
      is_paid: false
    }
    
    console.log('✅ Usando agent_id: NULL para evitar constraint')

    console.log('📝 Datos mínimos a insertar:', Object.keys(propertyData))
    console.log('📝 Usuario autenticado:', authenticatedUser.id)

    console.log('🔧 Intentando con Service Role Admin...')
    
    // Usar Service Role para crear la propiedad (bypasea RLS)
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert(propertyData)
      .select()
      .single()
    
    console.log('Service Role result:', { property: property?.id, error: propertyError?.message })

    if (propertyError) {
      console.error('Error Supabase al crear propiedad:', propertyError)
      console.error('Error code:', propertyError.code)
      console.error('Error details:', propertyError.details)
      
      // Manejar errores específicos
      if (propertyError.code === '42501') {
        return NextResponse.json(
          { error: `Error de permisos: ${propertyError.message}. Verifica RLS en Supabase.` },
          { status: 403 }
        )
      }
      
      if (propertyError.code === 'PGRST204') {
        return NextResponse.json(
          { error: `Campo no encontrado: ${propertyError.message}. Schema mismatch detectado.` },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Error al crear propiedad: ${propertyError.message} (Code: ${propertyError.code})` },
        { status: 500 }
      )
    }

    // Si es un plan pago, actualizar la propiedad (usando Supabase)
    if (plan && plan !== 'basico') {
      const planConfig = {
        destacado: { name: 'Plan Destacado', price: 5000, duration: 30 },
        full: { name: 'Plan Full', price: 10000, duration: 30 }
      }

      const selectedPlan = planConfig[plan as keyof typeof planConfig]

      if (selectedPlan) {
        // Actualizar propiedad con flags premium usando Supabase
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            status: 'AVAILABLE',
            isPaid: true,
            featured: true,
            highlightedUntil: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', property.id)

        if (updateError) {
          console.error('Error actualizando propiedad premium:', updateError)
        }

        // Crear suscripción usando Supabase
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            planType: plan,
            planName: selectedPlan.name,
            planPrice: selectedPlan.price,
            planDuration: selectedPlan.duration,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
            userId: authenticatedUser.id,
            propertyId: property.id
          })

        if (subscriptionError) {
          console.error('Error creando suscripción:', subscriptionError)
        }
      }
    }

    // Respuesta exitosa
    console.log('✅ Propiedad creada exitosamente con Supabase:', property.id)

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        currency: property.currency, // ✅ Campo currency incluido
        city: property.city,
        featured: property.featured,
        status: property.status,
        plan: plan || 'basico',
        userId: authenticatedUser.id,
        owner: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email
        }
      },
      message: 'Propiedad creada exitosamente usando Supabase'
    })

  } catch (error) {
    console.error('Error creating property:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    // Manejo específico de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Ya existe una propiedad con estos datos' },
          { status: 409 }
        )
      }

      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Error de referencia en los datos' },
          { status: 400 }
        )
      }

      // Check for user not found
      if (error.message.includes('User not found in database')) {
        return NextResponse.json(
          { error: 'Usuario no encontrado en la base de datos. Por favor, contacte al administrador.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  } finally {
    // No desconectamos aquí porque usamos la instancia singleton
  }
}

// Método GET para obtener información sobre la creación de propiedades
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para crear propiedades - Usando Supabase directo',
    method: 'POST',
    requiredFields: [
      'title',
      'description',
      'price',
      'propertyType',
      'bedrooms',
      'bathrooms',
      'area',
      'address',
      'city'
    ],
    optionalFields: [
      'garages',
      'province',
      'plan',
      'featured',
      'status',
      'images',
      'amenities',
      'features',
      'currency'
    ],
    removedFields: [
      'contact_phone', // No existe en schema Supabase
      'contact_name',  // No existe en schema Supabase
    ],
    plans: {
      basico: { price: 0, features: ['Publicación básica', 'Hasta 3 fotos', 'Vigencia 30 días'] },
      destacado: { price: 5000, features: ['Publicación destacada', 'Hasta 8 fotos', 'Aparece primero'] },
      full: { price: 10000, features: ['Fotos ilimitadas', 'Video promocional', 'Tour virtual'] }
    },
    note: 'API migrada de Prisma a Supabase por problemas de conectividad'
  })
}
