import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/debug-attachments-tables
 * Verifica qué tablas de adjuntos existen y su estructura
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const results: any = {
      tables: {},
      storageFiles: null,
      recommendation: ''
    }

    // 1. Probar tabla MessageAttachment (Prisma PascalCase)
    try {
      const { data, error } = await supabase
        .from('MessageAttachment')
        .select('*')
        .limit(1)
      
      results.tables.MessageAttachment = {
        exists: !error,
        error: error?.message || null,
        sampleData: data || null,
        rowCount: data?.length || 0
      }
    } catch (e) {
      results.tables.MessageAttachment = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 2. Probar tabla message_attachments (snake_case plural)
    try {
      const { data, error, count } = await supabase
        .from('message_attachments')
        .select('*', { count: 'exact' })
        .limit(5)
      
      results.tables.message_attachments = {
        exists: !error,
        error: error?.message || null,
        sampleData: data || null,
        rowCount: count || 0,
        columns: data && data.length > 0 ? Object.keys(data[0]) : []
      }
    } catch (e) {
      results.tables.message_attachments = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 3. Probar tabla message_attachment (snake_case singular)
    try {
      const { data, error, count } = await supabase
        .from('message_attachment')
        .select('*', { count: 'exact' })
        .limit(5)
      
      results.tables.message_attachment = {
        exists: !error,
        error: error?.message || null,
        sampleData: data || null,
        rowCount: count || 0,
        columns: data && data.length > 0 ? Object.keys(data[0]) : []
      }
    } catch (e) {
      results.tables.message_attachment = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 4. Listar archivos en Storage
    try {
      const { data: files, error: storageError } = await supabase.storage
        .from('message-attachments')
        .list('', {
          limit: 10,
          offset: 0
        })
      
      results.storageFiles = {
        exists: !storageError,
        error: storageError?.message || null,
        fileCount: files?.length || 0,
        sampleFiles: files?.slice(0, 5).map(f => ({
          name: f.name,
          id: f.id,
          created_at: f.created_at
        })) || []
      }
    } catch (e) {
      results.storageFiles = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 5. Determinar recomendación
    if (results.tables.message_attachments?.exists) {
      results.recommendation = 'Usar tabla: message_attachments (snake_case plural)'
      results.correctTableName = 'message_attachments'
    } else if (results.tables.message_attachment?.exists) {
      results.recommendation = 'Usar tabla: message_attachment (snake_case singular)'
      results.correctTableName = 'message_attachment'
    } else if (results.tables.MessageAttachment?.exists) {
      results.recommendation = 'Usar tabla: MessageAttachment (PascalCase)'
      results.correctTableName = 'MessageAttachment'
    } else {
      results.recommendation = 'NINGUNA TABLA EXISTE - Necesitas crear la tabla'
      results.correctTableName = null
      results.createTableSQL = `
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_name TEXT,
  bucket TEXT DEFAULT 'message-attachments',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `
    }

    // 6. Análisis de archivos huérfanos
    const storageFileCount = results.storageFiles?.fileCount || 0
    const dbRecordCount = results.tables.message_attachments?.rowCount || 
                          results.tables.message_attachment?.rowCount || 
                          results.tables.MessageAttachment?.rowCount || 0

    results.orphanedFilesAnalysis = {
      filesInStorage: storageFileCount,
      recordsInDB: dbRecordCount,
      potentialOrphans: storageFileCount - dbRecordCount,
      issue: storageFileCount > dbRecordCount ? 
        'HAY ARCHIVOS EN STORAGE SIN REGISTRO EN DB' : 
        'OK - Todos los archivos tienen registro'
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
