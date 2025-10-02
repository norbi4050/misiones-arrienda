import { NextResponse, NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"
import { validateCUIT } from "@/lib/validations/cuit"

// Schema para perfil de inmobiliaria
const InmobiliariaProfileSchema = z.object({
  company_name: z.string().min(1, "Nombre de empresa requerido"),
  phone: z.string().min(1, "Teléfono requerido"),
  address: z.string().min(1, "Dirección requerida"),
  cuit: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
})

function getServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )
}

export async function GET(_req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Obtener datos de la tabla users
    const { data: profile, error } = await supabase
      .from('users')
      .select('company_name, phone, address, cuit, website, facebook, instagram, tiktok, description, license_number, logo_url, verified, verified_at, user_type')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching inmobiliaria profile:', error)
      return NextResponse.json({ error: "Error fetching profile" }, { status: 500 })
    }

    // Verificar que sea inmobiliaria
    if (profile.user_type !== 'inmobiliaria') {
      return NextResponse.json({ error: "User is not an inmobiliaria" }, { status: 403 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    let body: any = {}
    try { 
      body = await req.json() 
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Validar con Zod
    const validation = InmobiliariaProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const validatedData = validation.data

    // Preparar payload para DB
    const dbPayload: any = {
      company_name: validatedData.company_name,
      phone: validatedData.phone,
      address: validatedData.address,
      license_number: validatedData.license_number || null,
      website: validatedData.website || null,
      facebook: validatedData.facebook || null,
      instagram: validatedData.instagram || null,
      tiktok: validatedData.tiktok || null,
      description: validatedData.description || null,
      updated_at: new Date().toISOString()
    }

    // Validar CUIT si se proporciona
    if (validatedData.cuit) {
      const cuitValidation = validateCUIT(validatedData.cuit)
      
      if (cuitValidation.valid) {
        // CUIT válido → setear verified = true
        dbPayload.cuit = cuitValidation.formatted
        dbPayload.verified = true
        dbPayload.verified_at = new Date().toISOString()
      } else {
        // CUIT inválido → setear verified = false
        dbPayload.cuit = validatedData.cuit
        dbPayload.verified = false
        dbPayload.verified_at = null
        
        // Retornar error de validación
        return NextResponse.json({
          error: "CUIT inválido",
          details: cuitValidation.error
        }, { status: 400 })
      }
    } else {
      // Sin CUIT → setear verified = false
      dbPayload.cuit = null
      dbPayload.verified = false
      dbPayload.verified_at = null
    }

    // Actualizar en tabla users
    const { data, error } = await supabase
      .from('users')
      .update(dbPayload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      profile: data,
      message: "Perfil actualizado exitosamente"
    }, { status: 200 })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
