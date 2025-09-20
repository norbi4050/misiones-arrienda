import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== CREATE PROPERTY SIMPLE - SIN AGENT_ID ===')
  
  try {
    // Verificar autenticación del usuario
    const authenticatedUser = await getAuthenticatedUser(req)
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
      currency = 'ARS',
      propertyType,
      bedrooms,
      bathrooms,
      garages,
      area,
      address,
      city,
      province,
      images = [],
      amenities = [],
      features = []
    } = body

    // Validación de campos requeridos
    if (!title || !description || !price || !propertyType || !bedrooms || !bathrooms || !area || !address || !city) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Crear cliente admin con Service Role Key
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔧 Insertando propiedad SIN agent_id (evita FK constraint)...')

    // Preparar datos usando NOMBRES EXACTOS de la auditoría (snake_case) - SIN AGENT_ID
    const propertyData = {
      // Campos básicos (snake_case exacto)
      title,
      description,
      price: numericPrice,
      currency: currency || 'ARS',
      
      // Características (snake_case exacto)
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      garages: parseInt(garages) || 0,
      area: parseFloat(area) || 50,
      property_type: propertyType || 'HOUSE',
      
      // Ubicación (snake_case exacto)
      address,
      city,
      province: province || 'Misiones',
      postal_code: '3300',
      
      // Usuario (snake_case exacto) - SIN AGENT_ID
      user_id: authenticatedUser.id,
      
      // Estado (snake_case exacto)
      status: 'AVAILABLE',
      is_active: true,
      is_paid: false,
      featured: false,
      
      // Multimedia (snake_case exacto)
      images: JSON.stringify(images.length > 0 ? images : ['/placeholder.jpg']),
      amenities: JSON.stringify(amenities.length > 0 ? amenities : ['Agua', 'Luz']),
      features: JSON.stringify(features.length > 0 ? features : ['Cocina']),
      
      // Otros campos de la auditoría
      operation_type: 'rent'
    }

    console.log('🔧 Insertando con Service Role...')

    // Insertar propiedad con nombres exactos - SIN AGENT_ID
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert(propertyData)
      .select('id, title, price, city')
      .single()

    if (propertyError) {
      console.error('❌ Error insertando propiedad:', propertyError)
      return NextResponse.json(
        { error: `Error al crear propiedad: ${propertyError.message} (Code: ${propertyError.code})` },
        { status: 500 }
      )
    }

    console.log('✅ Propiedad creada exitosamente:', property.id)

    return NextResponse.json({
      success: true,
      method: 'simple_sin_agent',
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        city: property.city,
        user_id: authenticatedUser.id,
        owner: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email
        }
      },
      message: 'Propiedad creada exitosamente sin agent_id'
    })

  } catch (error) {
    console.error('Error creating property:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint simple para crear propiedades - Sin agent_id',
    method: 'POST',
    description: 'Evita problemas de FK constraint con agent_id',
    usage: 'POST /api/properties/create-simple'
  })
}
