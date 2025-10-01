import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de debug para verificar el esquema real de la tabla conversations
 */
export async function GET() {
  try {
    const supabase = createClient()

    const result: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: []
    }

    // 1. Verificar tabla Conversation (Prisma - singular, PascalCase)
    try {
      const { data: prismaData, error: prismaError } = await supabase
        .from('Conversation')
        .select('*')
        .limit(1)
        .maybeSingle()

      result.tables.Conversation = {
        exists: !prismaError,
        error: prismaError?.message || null,
        sampleRow: prismaData,
        columns: prismaData ? Object.keys(prismaData) : []
      }
    } catch (err: any) {
      result.tables.Conversation = {
        exists: false,
        error: err.message,
        columns: []
      }
    }

    // 2. Verificar tabla conversations (Supabase - plural, snake_case)
    try {
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1)
        .maybeSingle()

      result.tables.conversations = {
        exists: !supabaseError,
        error: supabaseError?.message || null,
        sampleRow: supabaseData,
        columns: supabaseData ? Object.keys(supabaseData) : []
      }
    } catch (err: any) {
      result.tables.conversations = {
        exists: false,
        error: err.message,
        columns: []
      }
    }

    // 3. Análisis de esquema
    const conversationColumns = result.tables.Conversation?.columns || []
    const conversationsColumns = result.tables.conversations?.columns || []

    result.analysis = {
      Conversation: {
        hasPrismaStyle: conversationColumns.includes('aId') || conversationColumns.includes('bId'),
        hasSupabaseStyle: conversationColumns.includes('sender_id') || conversationColumns.includes('receiver_id'),
        recommendedBranch: null
      },
      conversations: {
        hasPrismaStyle: conversationsColumns.includes('aId') || conversationsColumns.includes('bId'),
        hasSupabaseStyle: conversationsColumns.includes('sender_id') || conversationsColumns.includes('receiver_id'),
        recommendedBranch: null
      }
    }

    // Determinar rama recomendada
    if (result.tables.Conversation?.exists) {
      if (result.analysis.Conversation.hasPrismaStyle) {
        result.analysis.Conversation.recommendedBranch = 'PRISMA'
      } else if (result.analysis.Conversation.hasSupabaseStyle) {
        result.analysis.Conversation.recommendedBranch = 'SUPABASE'
      }
    }

    if (result.tables.conversations?.exists) {
      if (result.analysis.conversations.hasPrismaStyle) {
        result.analysis.conversations.recommendedBranch = 'PRISMA'
      } else if (result.analysis.conversations.hasSupabaseStyle) {
        result.analysis.conversations.recommendedBranch = 'SUPABASE'
      }
    }

    // Recomendación final
    result.recommendation = {
      message: '',
      suggestedFix: ''
    }

    if (result.tables.Conversation?.exists && result.analysis.Conversation.hasPrismaStyle) {
      result.recommendation.message = 'Usar rama PRISMA - tabla Conversation tiene columnas aId/bId'
      result.recommendation.suggestedFix = 'La detección debe priorizar tabla Conversation (singular)'
    } else if (result.tables.conversations?.exists && result.analysis.conversations.hasSupabaseStyle) {
      result.recommendation.message = 'Usar rama SUPABASE - tabla conversations tiene columnas sender_id/receiver_id'
      result.recommendation.suggestedFix = 'OK - detección correcta'
    } else if (result.tables.conversations?.exists && result.analysis.conversations.hasPrismaStyle) {
      result.recommendation.message = '⚠️ PROBLEMA: tabla conversations (plural) tiene columnas Prisma (aId/bId)'
      result.recommendation.suggestedFix = 'Renombrar tabla a Conversation (singular) o usar rama PRISMA con tabla conversations'
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    console.error('[DEBUG CONVERSATIONS SCHEMA] Error:', error)
    return NextResponse.json({ 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, { status: 500 })
  }
}
