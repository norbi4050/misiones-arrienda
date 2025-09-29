'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { toPublicUrl, normalizeImages } from '@/lib/images'
import { CitySelect } from '@/components/forms/city-select'
import PropertyImageUpload from '@/components/ui/property-image-upload'
import MapPicker from '@/components/property/MapPicker'

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
  const router = useRouter()

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
            <label className="block text-sm font-medium mb-1">Precio</label>
            <Input
              type="number"
              value={form.price ?? ''}
              onChange={e => update('price', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Superficie (m²)</label>
            <Input
              type="number"
              value={form.area ?? ''}
              onChange={e => update('area', e.target.value === '' ? null : Number(e.target.value))}
            />
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
          <PropertyImageUploadWrapper
            propertyId={form.id}
            value={form.images ?? []}
            onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
          />
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
  value,
  onChange,
}: {
  propertyId: string
  value: string[]
  onChange: (imgs: string[]) => void
}) {
  const [bucketImages, setBucketImages] = useState<string[]>([])

  // Cargar imágenes del bucket al montar
  useState(() => {
    const loadBucketImages = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/images`)
        if (response.ok) {
          const data = await response.json()
          setBucketImages(data.images || [])
        }
      } catch (error) {
        console.error('Error loading bucket images:', error)
      }
    }
    loadBucketImages()
  })

  return (
    <div className="space-y-4">
      {/* Nuevo sistema de upload */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📸 Gestor de Imágenes Mejorado
        </h4>
        <PropertyImageUpload
          propertyId={propertyId}
          value={bucketImages}
          onChange={setBucketImages}
          maxImages={8}
        />
      </div>

      {/* Sistema legacy (mantener por compatibilidad) */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          📁 Editor Legacy (URLs manuales)
        </h4>
        <ImagesEditor
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

function ImagesEditor({
  value,
  onChange,
}: { value: string[]; onChange: (imgs: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const url = input.trim()
    if (!url) return
    const next = [...value, toPublicUrl(url)]
    onChange(next)
    setInput('')
  }

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {value.length === 0 && (
          <div className="text-sm text-gray-500 col-span-2 sm:col-span-3">
            No hay imágenes aún.
          </div>
        )}
        {value.map((src, i) => (
          <div key={i} className="relative group border rounded-lg overflow-hidden">
            {/* thumb */}
            <div className="relative aspect-[4/3] bg-gray-100">
              {/* en edición no optimizamos para evitar 404 por URLs externas */}
              <Image src={src} alt={`img-${i}`} fill className="object-cover" unoptimized />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs bg-white/90 hover:bg-white shadow"
            >
              Quitar
            </button>
            <div className="px-2 py-1 text-[11px] truncate text-gray-500">{src}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pegá una URL (o una ruta de Storage)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={add}
          className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm">
          Agregar
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Tip: si usás Supabase Storage, pegá rutas o URLs públicas del bucket <code>property-images</code>.
      </p>
    </div>
  )
}
