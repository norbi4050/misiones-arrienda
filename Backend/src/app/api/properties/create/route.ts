import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '@/lib/auth-middleware'

const prisma = new PrismaClient()

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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
      contact_email
    } = body

    // Validación de campos requeridos
    if (!title || !description || !price || !propertyType || !bedrooms || !bathrooms || !area || !address || !city || !contact_phone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos. Se requiere: title, description, price, propertyType, bedrooms, bathrooms, area, address, city, contact_phone' },
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

    // Buscar o crear un agente por defecto
    let defaultAgent = await prisma.agent.findFirst({
      where: { email: 'admin@misionesarrienda.com' }
    })

    if (!defaultAgent) {
      defaultAgent = await prisma.agent.create({
        data: {
          name: 'Misiones Arrienda',
          email: 'admin@misionesarrienda.com',
          phone: '+54 3764 123456',
          license: 'MA-DEFAULT-001',
          bio: 'Agente por defecto del sistema'
        }
      })
    }

    // Crear la propiedad en la base de datos con el userId del usuario autenticado
    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: numericPrice,
        currency: currency || 'ARS', // Agregar el campo currency
        propertyType: propertyType || 'HOUSE',
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        garages: parseInt(garages) || 0,
        area: parseFloat(area) || 0,
        address,
        city,
        province: province || 'Misiones',
        postalCode: '3300', // Código postal por defecto para Misiones
        status: 'PUBLISHED',
        images: JSON.stringify(images.length > 0 ? images : [
          '/images/properties/default-1.jpg',
          '/images/properties/default-2.jpg',
          '/images/properties/default-3.jpg'
        ]),
        amenities: JSON.stringify(amenities.length > 0 ? amenities : [
          'Agua corriente',
          'Electricidad',
          'Gas natural'
        ]),
        features: JSON.stringify(features.length > 0 ? features : [
          'Cocina equipada',
          'Baño completo',
          'Patio'
        ]),
        // Campos de contacto requeridos
        contact_phone: contact_phone,
        contact_name: contact_name || authenticatedUser.name,
        contact_email: contact_email || authenticatedUser.email,
        userId: authenticatedUser.id, // Guardar automáticamente el ID del usuario autenticado
        agentId: defaultAgent.id,
        isPaid: false,
        featured: false
      }
    })

    // Si es un plan pago, crear una suscripción
    if (plan && plan !== 'basico') {
      const planConfig = {
        destacado: { name: 'Plan Destacado', price: 5000, duration: 30 },
        full: { name: 'Plan Full', price: 10000, duration: 30 }
      }

      const selectedPlan = planConfig[plan as keyof typeof planConfig]

      if (selectedPlan) {
        // Actualizar propiedad con flags premium
        await prisma.property.update({
          where: { id: property.id },
          data: {
            status: 'PUBLISHED',
            isPaid: true,
            featured: true,
            highlightedUntil: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000),
            expiresAt: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000)
          }
        })

        // Crear suscripción con el userId del usuario autenticado
        await prisma.subscription.create({
          data: {
            planType: plan,
            planName: selectedPlan.name,
            planPrice: selectedPlan.price,
            planDuration: selectedPlan.duration,
            startDate: new Date(),
            endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000),
            userId: authenticatedUser.id, // Usar el ID del usuario autenticado
            propertyId: property.id
          }
        })
      }
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title,
        price: property.price,
        city: property.city,
        featured: property.featured,
        status: property.status,
        plan: plan || 'basico', // Devolvemos el plan aunque no se guarde en Property
        userId: authenticatedUser.id, // Incluir el userId en la respuesta
        owner: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email
        }
      },
      message: 'Propiedad creada exitosamente'
    })

  } catch (error) {
    console.error('Error creating property:', error)

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
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear la propiedad' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Método GET para obtener información sobre la creación de propiedades
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para crear propiedades',
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
      'city',
      'contact_phone'
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
      'contact_name',
      'contact_email',
      'currency'
    ],
    plans: {
      basico: { price: 0, features: ['Publicación básica', 'Hasta 3 fotos', 'Vigencia 30 días'] },
      destacado: { price: 5000, features: ['Publicación destacada', 'Hasta 8 fotos', 'Aparece primero'] },
      full: { price: 10000, features: ['Fotos ilimitadas', 'Video promocional', 'Tour virtual'] }
    }
  })
}
