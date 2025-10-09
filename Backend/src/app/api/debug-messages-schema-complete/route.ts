// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de diagnóstico completo para sistema de mensajería
 * GET /api/debug-messages-schema-complete
 * 
 * Verifica:
 * 1. Existencia de tablas (conversations vs Conversation)
 * 2. Estructura de columnas
 * 3. Foreign keys y relaciones
 * 4. Datos de ejemplo
 */
export async function GET() {
  try {
    const supabase = createClient()

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // ============================================
    // 1. VERIFICAR TABLAS EXISTENTES
    // ============================================
    
    // Método: intentar SELECT en cada tabla
    const tableChecks: Record<string, boolean> = {
      conversations: false,
      Conversation: false,
      messages: false,
      Message: false,
      user_profiles: false,
      UserProfile: false,
      properties: false,
      Property: false
    }

    for (const tableName of Object.keys(tableChecks)) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)
        
        tableChecks[tableName] = !error
      } catch {
        tableChecks[tableName] = false
      }
    }

    diagnostics.checks.tables = {
      available: tableChecks,
      summary: {
        conversations_lowercase: tableChecks.conversations,
        Conversation_PascalCase: tableChecks.Conversation,
        messages_lowercase: tableChecks.messages,
        Message_PascalCase: tableChecks.Message
      }
    }

    // ============================================
    // 2. VERIFICAR ESTRUCTURA DE CONVERSATIONS
    // ============================================
    let conversationStructure = null
    let conversationTableName = null

    // Intentar con 'conversations' (minúscula)
    if (tableChecks.conversations) {
      conversationTableName = 'conversations'
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(1)
      
      if (!error && data) {
        conversationStructure = data[0] ? Object.keys(data[0]) : []
      }
    }

    // Intentar con 'Conversation' (PascalCase)
    if (!conversationStructure && tableChecks.Conversation) {
      conversationTableName = 'Conversation'
      const { data, error } = await supabase
        .from('Conversation')
        .select('*')
        .limit(1)
      
      if (!error && data) {
        conversationStructure = data[0] ? Object.keys(data[0]) : []
      }
    }

    diagnostics.checks.conversation_structure = {
      table_name: conversationTableName,
      columns: conversationStructure,
      has_property_id: conversationStructure?.includes('property_id') || conversationStructure?.includes('propertyId'),
      has_sender_receiver: (
        conversationStructure?.includes('sender_id') && 
        conversationStructure?.includes('receiver_id')
      ),
      has_a_b: (
        conversationStructure?.includes('aId') && 
        conversationStructure?.includes('bId')
      )
    }

    // ============================================
    // 3. VERIFICAR RELACIONES CON USER_PROFILES
    // ============================================
    let userProfilesExists = false
    let userProfilesStructure = null

    if (tableChecks.user_profiles) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      
      if (!error) {
        userProfilesExists = true
        userProfilesStructure = data?.[0] ? Object.keys(data[0]) : []
      }
    } else if (tableChecks.UserProfile) {
      const { data, error } = await supabase
        .from('UserProfile')
        .select('*')
        .limit(1)
      
      if (!error) {
        userProfilesExists = true
        userProfilesStructure = data?.[0] ? Object.keys(data[0]) : []
      }
    }

    diagnostics.checks.user_profiles = {
      exists: userProfilesExists,
      columns: userProfilesStructure,
      has_user_id: userProfilesStructure?.includes('userId') || userProfilesStructure?.includes('user_id')
    }

    // ============================================
    // 4. VERIFICAR DATOS DE EJEMPLO
    // ============================================
    if (conversationTableName) {
      const { data: sampleConversations, error } = await supabase
        .from(conversationTableName)
        .select('*')
        .limit(3)
      
      diagnostics.checks.sample_data = {
        conversations_count: sampleConversations?.length || 0,
        sample: sampleConversations || [],
        error: error?.message
      }
    }

    // ============================================
    // 5. VERIFICAR USUARIO ACTUAL
    // ============================================
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    diagnostics.checks.current_user = {
      authenticated: !!user,
      user_id: user?.id,
      email: user?.email,
      error: authError?.message
    }

    // Si hay usuario, verificar si tiene UserProfile
    if (user && userProfilesExists) {
      const profileTableName = tableChecks.user_profiles ? 'user_profiles' : 'UserProfile'
      const { data: profile, error: profileError } = await supabase
        .from(profileTableName)
        .select('*')
        .eq('userId', user.id)
        .single()
      
      diagnostics.checks.current_user.has_profile = !!profile
      diagnostics.checks.current_user.profile_id = profile?.id
      diagnostics.checks.current_user.profile_error = profileError?.message
    }

    // ============================================
    // 6. ANÁLISIS Y RECOMENDACIONES
    // ============================================
    const analysis = {
      status: 'unknown',
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // Verificar si existe alguna tabla de conversaciones
    if (!tableChecks.conversations && !tableChecks.Conversation) {
      analysis.status = 'critical'
      analysis.issues.push('❌ No existe ninguna tabla de conversaciones (ni conversations ni Conversation)')
      analysis.recommendations.push('Ejecutar migración de Prisma o crear tabla manualmente')
    } else {
      analysis.status = 'warning'
    }

    // Verificar estructura de la tabla
    if (conversationStructure) {
      const hasPropertyId = conversationStructure.includes('property_id') || conversationStructure.includes('propertyId')
      const hasSenderReceiver = conversationStructure.includes('sender_id') && conversationStructure.includes('receiver_id')
      const hasAB = conversationStructure.includes('aId') && conversationStructure.includes('bId')

      if (!hasPropertyId) {
        analysis.issues.push('⚠️ Tabla de conversaciones NO tiene campo property_id')
        analysis.recommendations.push('Agregar campo property_id a la tabla o usar sistema de comunidad')
      }

      if (!hasSenderReceiver && !hasAB) {
        analysis.issues.push('❌ Tabla NO tiene campos para participantes (ni sender_id/receiver_id ni aId/bId)')
        analysis.recommendations.push('Verificar estructura de la tabla en Supabase')
      } else if (hasAB && !hasSenderReceiver) {
        analysis.issues.push('⚠️ Tabla usa aId/bId (comunidad) pero API espera sender_id/receiver_id (propiedades)')
        analysis.recommendations.push('Adaptar API para usar aId/bId o crear tabla separada para propiedades')
      }
    }

    // Verificar relación con users
    if (!userProfilesExists) {
      analysis.issues.push('⚠️ No existe tabla user_profiles/UserProfile')
      analysis.recommendations.push('Si la tabla usa aId/bId, necesita user_profiles para funcionar')
    }

    diagnostics.analysis = analysis

    return NextResponse.json(diagnostics, { status: 200 })

  } catch (error: any) {
    console.error('Error in debug-messages-schema-complete:', error)
    return NextResponse.json({
      error: 'Error en diagnóstico',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
