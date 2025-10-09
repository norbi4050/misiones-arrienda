import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { key } = await req.json()
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const BUCKET = 'property-images'
    
    console.log('[DELETE IMAGE] Deleting:', { propertyId: params.id, key, BUCKET })

    // Eliminar archivo del storage
    const { error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .remove([key])

    if (error) {
      console.error('[DELETE IMAGE] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[DELETE IMAGE] Success:', { key })
    return NextResponse.json({ success: true, deletedKey: key })

  } catch (e: any) {
    console.error('[DELETE IMAGE] Exception:', e)
    return NextResponse.json({ 
      error: e?.message ?? 'Delete error' 
    }, { status: 500 })
  }
}
