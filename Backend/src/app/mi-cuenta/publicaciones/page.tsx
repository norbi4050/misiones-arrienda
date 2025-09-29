// src/app/mi-cuenta/publicaciones/page.tsx
import { createClient } from '@/lib/supabase/server'
import MisPublicacionesClient from './mis-publicaciones-client'

export const dynamic = 'force-dynamic' // siempre coherente con cookies de sesión

export default async function Page() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">Mis publicaciones</h1>
        <p className="mt-4 text-gray-600">
          Necesitás iniciar sesión para ver tus propiedades.
        </p>
      </main>
    )
  }

  // Traemos SOLO campos necesarios; RLS ya restringe a tus propias filas.
  const { data: props, error } = await supabase
    .from('properties')
    .select(
      'id,title,price,status,is_active,expires_at,created_at,updated_at,city,province,images'
    )
    .order('updated_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">Mis publicaciones</h1>
        <p className="mt-4 text-red-600">Error cargando propiedades.</p>
        <pre className="mt-4 text-xs text-gray-500 whitespace-pre-wrap">
          {error.message}
        </pre>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Mis publicaciones</h1>
      <p className="mt-2 text-gray-600">
        Gestioná tu inventario: publicadas, borradores y archivadas.
      </p>

      <div className="mt-8">
        <MisPublicacionesClient initialItems={props ?? []} />
      </div>
    </main>
  )
}
