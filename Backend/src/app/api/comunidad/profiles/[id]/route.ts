import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findProfileById } from '@/lib/mock-community-profiles'

// Schema para actualizar perfil
const updateProfileSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO']).optional(),
  city: z.string().min(1).optional(),
  neighborhood: z.string().min(1).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  bio: z.string().max(500).optional(),
  photos: z.array(z.string()).max(5).optional(),
  age: z.number().min(18).max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  petPref: z.enum(['SI_PET', 'NO_PET', 'INDIFERENTE']).optional(),
  smokePref: z.enum(['FUMADOR', 'NO_FUMADOR', 'INDIFERENTE']).optional(),
  diet: z.enum(['NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO']).optional(),
  scheduleNotes: z.string().optional(),
  acceptsMessages: z.boolean().optional()
})

// GET /api/comunidad/profiles/[id] - Obtener perfil específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    
    // Buscar perfil en mock data compartido
    const profile = findProfileById(id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Error in profile GET:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/comunidad/profiles/[id] - Actualizar perfil (demo)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData = updateProfileSchema.parse(body)

    // Para demo, simular actualización exitosa
    const profile = findProfileById(id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Simular actualización
    const updatedProfile = {
      ...profile,
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Error in profile PUT:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/comunidad/profiles/[id] - Eliminar perfil (demo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    // Para demo, simular eliminación exitosa
    const profile = findProfileById(id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil eliminado correctamente'
    })

  } catch (error) {
    console.error('Error in profile DELETE:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
