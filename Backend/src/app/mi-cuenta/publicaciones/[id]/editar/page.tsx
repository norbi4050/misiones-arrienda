import { createClient } from '@/lib/supabase/ssr'
import EditPropertyClient from './edit-property-client'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="container py-8">
        Necesitás iniciar sesión.
      </div>
    )
  }

  const { data, error } = await supabase
    .from('properties')
    .select('id,title,description,price,operation_type,property_type,bedrooms,bathrooms,area,city,province,address,latitude,longitude,images,featured')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return (
      <div className="container py-8">
        No se pudo cargar la propiedad.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <EditPropertyClient initialProperty={data} />
    </div>
  )
}
