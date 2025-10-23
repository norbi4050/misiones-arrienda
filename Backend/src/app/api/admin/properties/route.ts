/**
 * /api/admin/properties - Endpoint para gestión de propiedades
 *
 * GET: Lista todas las propiedades con filtros y paginación
 * PATCH: Actualiza estado de propiedad (suspender/activar/eliminar)
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ACCESS_DENIED = {
  error: 'Access denied',
  message: 'Only administrators can access this resource'
}

/**
 * GET /api/admin/properties
 * Lista todas las propiedades con estadísticas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos de admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Parámetros de filtrado y paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const city = searchParams.get('city') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Construir query base - usando solo columnas que sabemos que existen
    let query = supabase
      .from('Property')
      .select(`
        id,
        title,
        description,
        price,
        currency,
        status,
        rooms,
        bathrooms,
        area,
        address,
        city,
        province,
        images,
        userId,
        createdAt,
        updatedAt,
        User:userId (
          name,
          email
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (city !== 'all') {
      query = query.eq('city', city)
    }

    // Aplicar ordenamiento
    const orderColumn = sortBy === 'createdAt' ? 'createdAt' :
                       sortBy === 'price' ? 'price' :
                       sortBy === 'title' ? 'title' :
                       sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt'

    query = query.order(orderColumn, { ascending: sortOrder === 'asc' })

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: properties, error, count } = await query

    if (error) {
      console.error('[API /admin/properties GET] Error fetching properties:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Error fetching properties', details: error.message },
        { status: 500 }
      )
    }

    // Obtener conteo de reportes para cada propiedad
    const propertiesWithReports = await Promise.all(
      (properties || []).map(async (property) => {
        const { count: reportsCount } = await supabase
          .from('property_reports')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', property.id)

        return {
          ...property,
          user: property.User,
          reportsCount: reportsCount || 0
        }
      })
    )

    // Estadísticas generales
    const { count: totalProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })

    const { count: availableProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'AVAILABLE')

    const { count: rentedProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'RENTED')

    const { count: suspendedProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUSPENDED')

    const { count: pendingProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING')

    return NextResponse.json({
      properties: propertiesWithReports,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        total: totalProperties || 0,
        available: availableProperties || 0,
        rented: rentedProperties || 0,
        suspended: suspendedProperties || 0,
        pending: pendingProperties || 0
      }
    })

  } catch (error: any) {
    console.error('[API /admin/properties GET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/properties
 * Actualiza estado de una propiedad (suspender/activar/eliminar)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verificar permisos de admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 })
    }

    const body = await request.json()
    const { propertyId, action } = body

    if (!propertyId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, action' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Acciones permitidas: suspend, activate, delete
    if (action === 'delete') {
      // Eliminar propiedad
      const { error } = await supabase
        .from('Property')
        .delete()
        .eq('id', propertyId)

      if (error) {
        console.error('[API /admin/properties PATCH] Error deleting property:', error)
        return NextResponse.json(
          { error: 'Error deleting property', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Property deleted successfully'
      })
    }

    let updateData: any = {}

    switch (action) {
      case 'suspend':
        updateData = { status: 'SUSPENDED' }
        break
      case 'activate':
        updateData = { status: 'AVAILABLE' }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from('Property')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (error) {
      console.error('[API /admin/properties PATCH] Error updating property:', error)
      return NextResponse.json(
        { error: 'Error updating property', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      property: data,
      message: `Property ${action}ed successfully`
    })

  } catch (error: any) {
    console.error('[API /admin/properties PATCH] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
