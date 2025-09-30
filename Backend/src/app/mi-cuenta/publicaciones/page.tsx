// src/app/mi-cuenta/publicaciones/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  // Setup for cover_url generation
  const BUCKET = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images';
  const PLACEHOLDER = '/placeholder-apartment-1.jpg';
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  function toCoverUrl(coverPath?: string) {
    if (!coverPath) return PLACEHOLDER;
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(coverPath);
    return data.publicUrl || PLACEHOLDER;
  }

  // Traemos SOLO campos necesarios; RLS ya restringe a tus propias filas.
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id,title,price,status,is_active,expires_at,created_at,updated_at,city,province,images,cover_path'
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

  // Map properties to include cover_url
  const items = (data || []).map(p => ({
    ...p,
    cover_url: toCoverUrl(p.cover_path),
  }));

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Mis publicaciones</h1>
      <p className="mt-2 text-gray-600">
        Gestioná tu inventario: publicadas, borradores y archivadas.
      </p>

      {/* Aviso de anuncios de comunidad */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-purple-900">
              ¿Buscás tus anuncios de comunidad?
            </h3>
            <p className="mt-1 text-sm text-purple-700">
              Los anuncios de búsqueda de compañeros de casa se gestionan en una sección separada.
            </p>
            <a 
              href="/comunidad/mis-publicaciones" 
              className="mt-2 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 underline"
            >
              Ver mis anuncios de comunidad →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <MisPublicacionesClient initialItems={items} />
      </div>
    </main>
  )
}
