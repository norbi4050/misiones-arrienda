// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDisplayName } from '@/lib/messages/display-name-helper'

/**
 * TESTING ENDPOINT: Verificar resolución de displayName
 * 
 * Casos de prueba:
 * 1. Usuario con User.name → debe retornar User.name
 * 2. Usuario con solo companyName → debe retornar companyName
 * 3. Usuario con solo full_name → debe retornar full_name
 * 4. Usuario con solo email → debe retornar parte local del email
 * 5. Usuario sin datos → debe retornar "Usuario"
 * 6. Inmobiliaria con companyName y full_name → debe priorizar companyName
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autenticado',
        details: authError?.message 
      }, { status: 401 })
    }

    // Obtener todos los UserProfiles para testing
    const { data: profiles, error: profilesError } = await supabase
      .from('UserProfile')
      .select('id, userId, full_name, companyName')
      .limit(10)

    if (profilesError) {
      return NextResponse.json({ 
        error: 'Error obteniendo perfiles',
        details: profilesError.message 
      }, { status: 500 })
    }

    // Para cada perfil, obtener User y calcular displayName
    const testResults = []
    
    for (const profile of profiles || []) {
      // Obtener datos del User
      const { data: userData } = await supabase
        .from('User')
        .select('id, name, email, avatar')
        .eq('id', profile.userId)
        .single()

      // Calcular displayName con el helper
      const displayName = getDisplayName(
        userData || { email: profile.userId },
        profile ? {
          full_name: profile.full_name,
          company_name: profile.companyName
        } : null
      )

      testResults.push({
        profileId: profile.id,
        userId: profile.userId,
        userData: {
          name: userData?.name || null,
          email: userData?.email || null
        },
        profileData: {
          full_name: profile.full_name || null,
          companyName: profile.companyName || null
        },
        resolvedDisplayName: displayName,
        priorityUsed: getPriorityUsed(userData, profile)
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        totalTested: testResults.length,
        withUserName: testResults.filter(r => r.priorityUsed === 'User.name').length,
        withCompanyName: testResults.filter(r => r.priorityUsed === 'companyName').length,
        withFullName: testResults.filter(r => r.priorityUsed === 'full_name').length,
        withEmailLocal: testResults.filter(r => r.priorityUsed === 'email_local').length,
        withFallback: testResults.filter(r => r.priorityUsed === 'fallback').length
      }
    })

  } catch (error: any) {
    console.error('[TEST DISPLAYNAME] Error:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message 
    }, { status: 500 })
  }
}

function getPriorityUsed(userData: any, profileData: any): string {
  if (userData?.name && userData.name.trim()) {
    return 'User.name'
  }
  
  if (profileData) {
    const companyName = profileData.companyName || profileData.company_name
    if (companyName && companyName.trim()) {
      return 'companyName'
    }
    
    const fullName = profileData.full_name
    if (fullName && fullName.trim()) {
      return 'full_name'
    }
  }
  
  if (userData?.email) {
    const emailLocal = userData.email.split('@')[0]
    if (emailLocal && emailLocal.trim()) {
      return 'email_local'
    }
  }
  
  return 'fallback'
}
