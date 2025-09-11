import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    // Parse filters
    const city = params.get('city') || ''
    const province = params.get('province') || ''
    const propertyType = params.get('propertyType') || ''
    const priceMin = params.get('priceMin') ? Number(params.get('priceMin')) : null
    const priceMax = params.get('priceMax') ? Number(params.get('priceMax')) : null
    const bedrooms = params.get('bedrooms') ? Number(params.get('bedrooms')) : null
    const bedroomsMin = params.get('bedroomsMin') ? Number(params.get('bedroomsMin')) : null
    const bathroomsMin = params.get('bathroomsMin') ? Number(params.get('bathroomsMin')) : null
    const minArea = params.get('minArea') ? Number(params.get('minArea')) : null
    const maxArea = params.get('maxArea') ? Number(params.get('maxArea')) : null
    const amenitiesCsv = params.get('amenities') || ''
    const amenities = amenitiesCsv ? amenitiesCsv.split(',').map(a => a.trim()) : []

    // Sorting and pagination
    const orderBy = params.get('orderBy') || 'createdAt'
    const order = params.get('order') || 'desc'
    const limit = params.get('limit') ? Number(params.get('limit')) : 10
    const offset = params.get('offset') ? Number(params.get('offset')) : 0

    // Create server-side Supabase client
    const supabase = createServerSupabase()

    let query = supabase
      .from('properties')
      .select('id, user_id, title, city, province, price, property_type, images, created_at, updated_at', { count: 'exact' })
      .eq('status', 'AVAILABLE')

    if (city) {
      query = query.ilike('city', `%${city}%`)
    }
    if (province) {
      query = query.ilike('province', `%${province}%`)
    }
  if (propertyType) {
    query = query.eq('property_type', propertyType)
  }
    if (priceMin !== null) {
      query = query.gte('price', priceMin)
    }
    if (priceMax !== null) {
      query = query.lte('price', priceMax)
    }
    if (bedrooms !== null) {
      query = query.eq('bedrooms', bedrooms)
    }
    if (bedroomsMin !== null) {
      query = query.gte('bedrooms', bedroomsMin)
    }
    if (bathroomsMin !== null) {
      query = query.gte('bathrooms', bathroomsMin)
    }
    if (minArea !== null) {
      query = query.gte('area', minArea)
    }
    if (maxArea !== null) {
      query = query.lte('area', maxArea)
    }

    // Handle amenities filtering
    if (amenities.length > 0) {
      // Assuming amenities column is JSON text, fetch all and filter in memory
      // For performance, if amenities column is array, use contains
      // Here we do fallback in memory filtering
      const { data: allProperties, error: fetchError } = await supabase
        .from('properties')
        .select('id, user_id, title, city, province, price, property_type, images, created_at, updated_at, amenities')
        .eq('status', 'AVAILABLE')

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      const filtered = allProperties?.filter((prop: any) => {
        if (!prop.amenities) return false
        let propAmenities = []
        try {
          propAmenities = typeof prop.amenities === 'string' ? JSON.parse(prop.amenities) : prop.amenities
        } catch {
          propAmenities = []
        }
        return amenities.every((a: string) => propAmenities.includes(a))
      }) || []

      // Apply sorting and pagination manually
      const sorted = filtered.sort((a: any, b: any) => {
        let aVal = a[orderBy]
        let bVal = b[orderBy]
        if (aVal < bVal) return order === 'asc' ? -1 : 1
        if (aVal > bVal) return order === 'asc' ? 1 : -1
        return 0
      })

      const paged = sorted.slice(offset, offset + limit)

      return NextResponse.json({
        items: paged,
        count: filtered.length,
        meta: {
          dataSource: 'supabase',
          filters: { city, province, propertyType, priceMin, priceMax, bedrooms, bedroomsMin, bathroomsMin, minArea, maxArea, amenities },
          sorting: { orderBy, order },
          pagination: { limit, offset }
        }
      })
    }

  // If no amenities filter, apply orderBy, order, limit, offset in query
  const dbOrderBy = orderBy === 'createdAt' ? 'created_at' : orderBy === 'updatedAt' ? 'updated_at' : orderBy === 'propertyType' ? 'property_type' : orderBy
  query = query.order(dbOrderBy, { ascending: order === 'asc' }).range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('Supabase query error in /properties route:', {
        message: error.message,
        code: error.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data || [],
      count: count || 0,
      meta: {
        dataSource: 'supabase',
        filters: { city, province, propertyType, priceMin, priceMax, bedrooms, bedroomsMin, bathroomsMin, minArea, maxArea, amenities },
        sorting: { orderBy, order },
        pagination: { limit, offset }
      }
    })
  } catch (error) {
    console.error('Error in /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
