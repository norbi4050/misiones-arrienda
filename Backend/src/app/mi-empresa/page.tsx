// PERF: Server Component - Fase 3B refactor híbrido
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_BUSINESS_HOURS, parseBusinessHours } from '@/types/inmobiliaria'
import MiEmpresaClient from './mi-empresa-client'
import { AlertCircle } from 'lucide-react'

// PERF: Revalidar cada 60 segundos para balance entre freshness y performance
export const revalidate = 60

/**
 * Fetch del perfil de inmobiliaria en el servidor
 * PERF: Reduce JS cliente y mejora LCP al tener datos antes de hidratación
 */
async function getInmobiliariaProfile(userId: string) {
  const supabase = createClient()
  
  try {
    // Fetch perfil de inmobiliaria
    const { data: profile, error: profileError } = await supabase
      .from('inmobiliarias')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (profileError) {
      console.error('[Server] Error fetching inmobiliaria profile:', profileError)
      throw profileError
    }
    
    // Fetch equipo
    const { data: team, error: teamError } = await supabase
      .from('inmobiliaria_team')
      .select('*')
      .eq('inmobiliaria_id', profile.id)
      .order('display_order', { ascending: true })
    
    if (teamError) {
      console.error('[Server] Error fetching team:', teamError)
    }
    
    // Parsear business_hours desde JSONB
    let businessHours = DEFAULT_BUSINESS_HOURS
    if (profile.business_hours) {
      const parsed = parseBusinessHours(profile.business_hours)
      if (parsed) {
        businessHours = parsed
      }
    }
    
    // Transformar a formato esperado por el cliente
    const transformedProfile = {
      id: profile.id,
      user_id: profile.user_id,
      company_name: profile.company_name || '',
      phone: profile.phone || '',
      commercial_phone: profile.commercial_phone || null,
      address: profile.address || '',
      cuit: profile.cuit || null,
      website: profile.website || null,
      facebook: profile.facebook || null,
      instagram: profile.instagram || null,
      tiktok: profile.tiktok || null,
      description: profile.description || null,
      license_number: profile.license_number || null,
      logo_url: profile.logo_url || null,
      verified: profile.verified || false,
      verified_at: profile.verified_at || null,
      business_hours: businessHours,
      show_team_public: profile.show_team_public ?? true,
      show_hours_public: profile.show_hours_public ?? true,
      show_map_public: profile.show_map_public ?? true,
      show_stats_public: profile.show_stats_public ?? true
    }
    
    return { 
      profile: transformedProfile, 
      team: team || [] 
    }
  } catch (error) {
    console.error('[Server] Error in getInmobiliariaProfile:', error)
    throw error
  }
}

/**
 * Loading skeleton para Suspense boundary
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando perfil de empresa...</p>
      </div>
    </div>
  )
}

/**
 * Error fallback
 */
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error al cargar el perfil
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        <a 
          href="/mi-empresa" 
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </a>
      </div>
    </div>
  )
}

/**
 * Página principal de Mi Empresa
 * PERF: Server Component que hace fetch de datos y los pasa al cliente
 */
export default async function MiEmpresaPage() {
  const supabase = createClient()
  
  // PERF: Auth check en servidor
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  // Verificar tipo de usuario en servidor
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()
  
  if (profileError || userProfile?.user_type !== 'inmobiliaria') {
    redirect('/')
  }
  
  try {
    // PERF: Fetch data en servidor
    const { profile, team } = await getInmobiliariaProfile(user.id)
    
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        {/* PERF: Client component recibe data como props */}
        <MiEmpresaClient 
          initialProfile={profile}
          initialTeam={team}
          userId={user.id}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('[Page] Error loading profile:', error)
    return <ErrorFallback error={error as Error} />
  }
}
