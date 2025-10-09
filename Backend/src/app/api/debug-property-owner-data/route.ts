import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ 
        error: 'propertyId query param required' 
      }, { status: 400 })
    }

    const supabase = createClient()
    
    // 1. Obtener propiedad
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return NextResponse.json({
        error: 'Property not found',
        details: propError
      }, { status: 404 })
    }

    // 2. Obtener datos del owner desde auth.users (raw_user_meta_data)
    let ownerFromAuth = null
    if (property.user_id) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(property.user_id);
        
        if (authUser?.user) {
          const metadata = authUser.user.user_metadata || {};
          ownerFromAuth = {
            data: {
              id: authUser.user.id,
              email: authUser.user.email,
              user_type: metadata.userType || null,
              company_name: metadata.companyName || null,
              raw_metadata: metadata
            },
            error: null
          };
        } else {
          ownerFromAuth = {
            data: null,
            error: 'User not found in auth.users'
          };
        }
      } catch (error: any) {
        ownerFromAuth = {
          data: null,
          error: error.message
        };
      }
    }

    // 3. Obtener datos del owner desde user_profiles (usando id en lugar de user_id)
    let ownerFromProfiles = null
    if (property.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', property.user_id)
        .maybeSingle()
      
      ownerFromProfiles = {
        data: profile,
        error: profileError?.message || null
      }
    }

    // 4. Simular el enriquecimiento que hace el API
    const enrichedProperty = {
      ...property,
      owner_id: ownerFromAuth?.data?.id || null,
      owner_type: ownerFromAuth?.data?.user_type || null,
      owner_company_name: ownerFromAuth?.data?.company_name || null,
    }

    return NextResponse.json({
      ok: true,
      propertyId,
      property: {
        id: property.id,
        title: property.title,
        user_id: property.user_id,
      },
      ownerFromAuth,
      ownerFromProfiles,
      enrichedProperty: {
        owner_id: enrichedProperty.owner_id,
        owner_type: enrichedProperty.owner_type,
        owner_company_name: enrichedProperty.owner_company_name,
      },
      bannerWillShow: !!(
        enrichedProperty.owner_type === 'inmobiliaria' && 
        enrichedProperty.owner_id
      ),
      diagnosis: {
        hasUserId: !!property.user_id,
        hasOwnerData: !!ownerFromAuth?.data,
        hasUserType: !!ownerFromAuth?.data?.user_type,
        hasCompanyName: !!ownerFromAuth?.data?.company_name,
        userTypeValue: ownerFromAuth?.data?.user_type || 'NOT_SET',
        companyNameValue: ownerFromAuth?.data?.company_name || 'NOT_SET',
      }
    })

  } catch (error: any) {
    console.error('Error in debug-property-owner-data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
