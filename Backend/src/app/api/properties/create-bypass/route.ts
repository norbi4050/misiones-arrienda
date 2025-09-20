import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== CREATE PROPERTY BYPASS REQUEST STARTED ===')
  
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
      featured,
      status,
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

    console.log('🔧 Usando función SQL bypass para crear propiedad...')

    // Usar función SQL que bypasea RLS completamente
    const { data: property, error: propertyError } = await supabaseAdmin.rpc('create_property_bypass', {
      p_title: title,
      p_description: description,
      p_price: numericPrice,
      p_user_id: authenticatedUser.id,
      p_city: city,
      p_property_type: propertyType || 'HOUSE',
      p_bedrooms: parseInt(bedrooms) || 1,
      p_bathrooms: parseInt(bathrooms) || 1,
      p_area: parseFloat(area) || 50
    })

    if (propertyError) {
      console.error('❌ Error con función bypass:', propertyError)
      
      // Fallback: Inserción directa con Service Role
      console.log('🔧 Fallback: Inserción directa con Service Role...')
      
      const propertyData = {
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

      const { data: fallbackProperty, error: fallbackError } = await supabaseAdmin
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

      if (fallbackError) {
        console.error('❌ Error en fallback también:', fallbackError)
        return NextResponse.json(
          { error: `Error al crear propiedad: ${fallbackError.message} (Code: ${fallbackError.code})` },
          { status: 500 }
        )
      }

      console.log('✅ Propiedad creada con fallback:', fallbackProperty.id)
      
      return NextResponse.json({
        success: true,
        method: 'fallback_direct',
        property: {
          id: fallbackProperty.id,
          title: fallbackProperty.title,
          price: fallbackProperty.price,
          city: fallbackProperty.city,
          userId: authenticatedUser.id
        },
        message: 'Propiedad creada exitosamente con método fallback'
      })
    }

    console.log('✅ Propiedad creada con función bypass:', property[0]?.id)

    return NextResponse.json({
      success: true,
      method: 'sql_function_bypass',
      property: {
        id: property[0]?.id,
        title: property[0]?.title,
        price: property[0]?.price,
        city: city,
        userId: authenticatedUser.id,
        owner: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email
        }
      },
      message: 'Propiedad creada exitosamente con función SQL bypass'
    })

  } catch (error) {
    console.error('Error creating property with bypass:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint alternativo para crear propiedades bypaseando RLS',
    method: 'POST',
    description: 'Usa función SQL con SECURITY DEFINER para bypasear RLS completamente',
    usage: 'POST /api/properties/create-bypass'
  })
}
