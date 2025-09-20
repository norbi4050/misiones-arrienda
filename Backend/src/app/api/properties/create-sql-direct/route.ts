import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== CREATE PROPERTY SQL DIRECT REQUEST ===')
  
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
      plan,
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

    console.log('🔧 Usando SQL directo para bypasear RLS completamente...')

    // Preparar valores para SQL
    const sqlValues = {
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
      postal_code: '3300',
      property_type: propertyType || 'HOUSE',
      status: 'AVAILABLE',
      images: JSON.stringify(images.length > 0 ? images : ['/placeholder.jpg']),
      amenities: JSON.stringify(amenities.length > 0 ? amenities : ['Agua', 'Luz']),
      features: JSON.stringify(features.length > 0 ? features : ['Cocina']),
      user_id: authenticatedUser.id,
      agent_id: null,
      is_active: true,
      operation_type: 'rent',
      featured: false,
      is_paid: false
    }

    console.log('🔧 Usando inserción directa con Service Role (bypasea RLS)...')

    // Usar inserción directa con Service Role - bypasea RLS completamente
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert(sqlValues)
      .select('id, title, price, city')
      .single()

    if (propertyError) {
      console.error('❌ Error con inserción directa:', propertyError)
      return NextResponse.json(
        { error: `Error al crear propiedad: ${propertyError.message} (Code: ${propertyError.code})` },
        { status: 500 }
      )
    }

    console.log('✅ Propiedad creada con inserción directa Service Role:', property.id)

    return NextResponse.json({
      success: true,
      method: 'service_role_direct',
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        city: property.city,
        userId: authenticatedUser.id,
        owner: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email
        }
      },
      message: 'Propiedad creada exitosamente con Service Role directo'
    })

  } catch (error) {
    console.error('Error creating property with SQL direct:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint SQL directo para crear propiedades bypaseando RLS',
    method: 'POST',
    description: 'Usa SQL directo con rpc exec_sql para bypasear RLS completamente',
    usage: 'POST /api/properties/create-sql-direct'
  })
}
