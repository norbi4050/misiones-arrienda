'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { toPublicUrl, normalizeImages } from '@/lib/images'
import { CitySelect } from '@/components/forms/city-select'
import PropertyImageUpload from '@/components/ui/property-image-upload'
import MapPicker from '@/components/property/MapPicker'
import { createBrowserSupabase } from '@/lib/supabase/browser'

type Property = {
  id: string
  title: string
  description: string | null
  price: number | null
  operation_type: string | null
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  city: string | null
  province: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  images: string[] | null
  featured: boolean | null
}

export default function EditPropertyClient({ initialProperty }: { initialProperty: Property }) {
  const [form, setForm] = useState<Property>(initialProperty)
  const [pending, startTransition] = useTransition()
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // Obtener userId al montar el componente
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createBrowserSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }
    getUserId()
  }, [])

  const update = (k: keyof Property, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch(`/api/properties/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok || data?.ok === false) throw new Error(data?.error || 'No se pudo guardar')
        toast.success('Cambios guardados')
        router.push('/mi-cuenta/publicaciones')
      } catch (err: any) {
        toast.error(err?.message || 'Error al guardar')
      }
    })
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <Input value={form.title || ''} onChange={e => update('title', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de operación</label>
            <select
              value={form.operation_type || 'alquiler'}
              onChange={e => update('operation_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="alquiler">Alquiler</option>
              <option value="venta">Venta</option>
              <option value="ambos">Alquiler y Venta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio</label>
            <Input
              type="number"
              value={form.price ?? ''}
              onChange={e => update('price', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Superficie (m²)</label>
            <Input
              type="number"
              value={form.area ?? ''}
              onChange={e => update('area', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div>
            {/* Espacio vacío para mantener el grid */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dormitorios</label>
            <Input
              type="number"
              value={form.bedrooms ?? ''}
              onChange={e => update('bedrooms', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Baños</label>
            <Input
              type="number"
              value={form.bathrooms ?? ''}
              onChange={e => update('bathrooms', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CitySelect
            value={form.city ?? ''}
            onChange={(v) => setForm(f => ({ ...f, city: v }))}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <Input value={form.province || ''} onChange={e => update('province', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <Input value={form.address || ''} onChange={e => update('address', e.target.value)} />
        </div>

        {/* Bloque Ubicación con MapPicker */}
        <fieldset className="space-y-4 border rounded-lg p-4 bg-blue-50">
          <legend className="text-sm font-medium text-blue-900 px-2">📍 Ubicación en el Mapa</legend>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                Seleccioná la ubicación exacta de tu propiedad arrastrando el marcador o haciendo click en el mapa.
              </p>
              
              {/* Botón de geocodificación */}
              <GeocodeButton
                address={form.address}
                city={form.city}
                province={form.province}
                onLocationFound={(location) => {
                  update('latitude', location.lat);
                  update('longitude', location.lng);
                }}
              />
            </div>
            
            <MapPicker
              value={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
              onChange={(location) => {
                update('latitude', location.lat);
                update('longitude', location.lng);
              }}
            />
            
            {/* Coordenadas manuales (backup) */}
            <details className="mt-4">
              <summary className="text-sm text-blue-700 cursor-pointer hover:text-blue-800">
                ⚙️ Editar coordenadas manualmente
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitud</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude ?? ''}
                    onChange={e => update('latitude', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="-27.3676"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitud</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude ?? ''}
                    onChange={e => update('longitude', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="-55.8961"
                  />
                </div>
              </div>
            </details>
          </div>
        </fieldset>

        {/* Editor de Imágenes Mejorado */}
        <fieldset className="space-y-2">
          <label className="block text-sm font-medium">Imágenes de la Propiedad</label>
          {userId ? (
            <PropertyImageUploadWrapper
              propertyId={form.id}
              userId={userId}
              value={form.images ?? []}
              onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
            />
          ) : (
            <div className="text-sm text-gray-500">Cargando editor de imágenes...</div>
          )}
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
          >
            {pending ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// Componente para geocodificación automática
function GeocodeButton({
  address,
  city,
  province,
  onLocationFound,
}: {
  address: string | null;
  city: string | null;
  province: string | null;
  onLocationFound: (location: { lat: number; lng: number }) => void;
}) {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!address || !city) {
      toast.error('Completá la dirección y ciudad primero');
      return;
    }

    setIsGeocoding(true);
    
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          city,
          province: province || 'Misiones',
          country: 'Argentina'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLocationFound(data.coordinates);
        toast.success('Coordenadas encontradas automáticamente');
      } else {
        toast.error(data.error || 'No se pudieron encontrar las coordenadas');
      }
    } catch (error) {
      console.error('Error geocoding:', error);
      toast.error('Error al buscar coordenadas');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGeocode}
      disabled={isGeocoding || !address || !city}
      className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGeocoding ? (
        <>
          <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full mr-1" />
          Buscando...
        </>
      ) : (
        <>
          🔍 Buscar coordenadas
        </>
      )}
    </button>
  );
}

// Wrapper para integrar PropertyImageUpload con el estado del formulario
function PropertyImageUploadWrapper({
  propertyId,
  userId,
  value,
  onChange,
}: {
  propertyId: string
  userId: string
  value: string[]
  onChange: (imgs: string[]) => void
}) {
  const [bucketImages, setBucketImages] = useState<string[]>([])

  // Cargar imágenes del bucket al montar
  useEffect(() => {
    const loadBucketImages = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/images/list?ownerId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          const urls = data.items?.map((item: any) => item.url) || []
          setBucketImages(urls)
        }
      } catch (error) {
        console.error('Error loading bucket images:', error)
      }
    }
    if (propertyId && userId) {
      loadBucketImages()
    }
  }, [propertyId, userId])

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <h4 className="text-sm font-medium text-blue-900 mb-3">
        📸 Imágenes de la Propiedad
      </h4>
      <p className="text-xs text-blue-700 mb-3">
        Plan Básico: Máximo 3 imágenes. Hacé hover sobre una imagen para eliminarla.
      </p>
      {/* TODO: En el futuro, adaptar maxImages según el plan del usuario */}
      <PropertyImageUpload
        propertyId={propertyId}
        userId={userId}
        value={bucketImages}
        onChange={setBucketImages}
        maxImages={3}
      />
    </div>
  )
}
