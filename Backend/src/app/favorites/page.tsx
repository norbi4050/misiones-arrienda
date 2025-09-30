import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import FavoritesClient from './favorites-client'

interface Property {
  id: string
  title: string
  price: number
  currency: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  area: number
  address: string
  city: string
  latitude?: number
  longitude?: number
  images: string[]
  cover_url: string
  featured: boolean
  status: string
  created_at: string
  updated_at: string
  user_id: string
}

async function getFavoriteProperties(): Promise<Property[]> {
  const supabase = createServerSupabase()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  try {
    // Obtener favoritos directamente desde Supabase
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        property_id,
        properties!inner (
          id,
          title,
          price,
          currency,
          property_type,
          bedrooms,
          bathrooms,
          area,
          address,
          city,
          latitude,
          longitude,
          images,
          cover_url,
          featured,
          status,
          created_at,
          updated_at,
          user_id
        )
      `)
      .eq("user_id", user.id)
      .eq("properties.status", "PUBLISHED")

    if (error) {
      console.error('Error fetching favorites:', error)
      return []
    }

    // Formatear propiedades con cover_url resuelto
    const properties = (data ?? []).map((fav: any) => {
      const property = Array.isArray(fav.properties) ? fav.properties[0] : fav.properties
      
      // Aplicar regla de prioridad cover_url
      let imageUrls = []
      try {
        imageUrls = property.images && typeof property.images === 'string' 
          ? JSON.parse(property.images) 
          : Array.isArray(property.images) 
            ? property.images 
            : []
      } catch (e) {
        console.warn('Error parsing images for property:', property.id)
        imageUrls = []
      }

      const cover_url = property.cover_url ?? imageUrls?.[0] ?? '/placeholder-apartment-1.jpg'

      return {
        id: property.id,
        title: property.title,
        price: property.price,
        currency: property.currency || 'ARS',
        propertyType: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        address: property.address,
        city: property.city,
        latitude: property.latitude,
        longitude: property.longitude,
        images: imageUrls,
        cover_url: cover_url,
        featured: property.featured,
        status: property.status,
        created_at: property.created_at,
        updated_at: property.updated_at,
        user_id: property.user_id
      }
    })

    return properties
  } catch (error) {
    console.error('Error in getFavoriteProperties:', error)
    return []
  }
}

export default async function FavoritesPage() {
  const favorites = await getFavoriteProperties()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Favoritos
          </h1>
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
          </p>
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-gray-400 text-6xl mb-6 block">❤️</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no tenés favoritos
            </h3>
            <p className="text-gray-600 mb-6">
              Explorá propiedades y guardá las que más te gusten
            </p>
            <a
              href="/properties"
              className="inline-block bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition-colors font-medium"
            >
              Explorar Propiedades
            </a>
          </div>
        ) : (
          <FavoritesClient initialFavorites={favorites} />
        )}
      </div>
    </div>
  )
}
