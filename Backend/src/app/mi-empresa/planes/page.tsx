// Página de planes para inmobiliarias
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanesClient from './planes-client'

export const metadata = {
  title: 'Planes y Precios - Misiones Arrienda',
  description: 'Planes y precios para inmobiliarias en Misiones Arrienda'
}

export const revalidate = 60

/**
 * Obtener información del usuario y su plan actual
 */
async function getUserPlanInfo(userId: string) {
  const supabase = createClient()

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, company_name, is_founder, founder_discount, plan_tier, plan_start_date, plan_end_date, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[planes/page] Error fetching user:', error)
      throw error
    }

    return user
  } catch (error) {
    console.error('[planes/page] Error in getUserPlanInfo:', error)
    throw error
  }
}

export default async function PlanesPage() {
  const supabase = createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Verificar que sea inmobiliaria
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError || userProfile?.user_type !== 'inmobiliaria') {
    redirect('/')
  }

  try {
    const userPlanInfo = await getUserPlanInfo(user.id)

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <PlanesClient userPlanInfo={userPlanInfo} />
      </Suspense>
    )
  } catch (error) {
    console.error('[PlanesPage] Error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar la información de planes</p>
          <a href="/mi-empresa" className="text-blue-600 hover:underline">
            Volver a Mi Empresa
          </a>
        </div>
      </div>
    )
  }
}
