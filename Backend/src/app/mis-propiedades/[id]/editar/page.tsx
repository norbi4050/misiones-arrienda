'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  city: string
  province: string
  propertyType: string
  operationType: string
  bedrooms: number
  bathrooms: number
  area: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  images: string[]
  coverUrl?: string
}

export default function EditarPropiedadPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useUser()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos de la propiedad
  useEffect(() => {
    if (!isAuthenticated || !params.id) return

    const loadProperty = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/properties/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Propiedad no encontrada')
          }
          if (response.status === 403) {
            throw new Error('No tienes permisos para editar esta propiedad')
          }
          throw new Error('Error al cargar la propiedad')
        }

        const data = await response.json()
        setProperty(data.property)

      } catch (error) {
        console.error('Error loading property:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [isAuthenticated, params.id])

  // Manejar guardado
  const handleSave = async (formData: any) => {
    if (!property) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la propiedad')
      }

      const data = await response.json()
      setProperty(data.property)
      
      toast.success('Propiedad actualizada correctamente')
      
      // Redirigir a mis propiedades después de 1 segundo
      setTimeout(() => {
        router.push('/mis-propiedades')
      }, 1000)

    } catch (error) {
      console.error('Error saving property:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast.error(`Error al guardar: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Editar Propiedad</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para editar propiedades.</p>
          <Link href="/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Cargando propiedad...</span>
        </div>
      </div>
    )
  }

  // Error
  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800">{error || 'Propiedad no encontrada'}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Link href="/mis-propiedades">
                <Button variant="outline" size="sm">
                  Volver a Mis Propiedades
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/mis-propiedades">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Propiedad</h1>
          <p className="text-gray-600 mt-1">
            Modifica los detalles de tu propiedad
          </p>
        </div>
      </div>

      {/* Formulario de edición */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const data = {
              title: formData.get('title'),
              description: formData.get('description'),
              price: Number(formData.get('price')),
              currency: formData.get('currency'),
              city: formData.get('city'),
              province: formData.get('province'),
              propertyType: formData.get('propertyType'),
              operationType: formData.get('operationType'),
              bedrooms: Number(formData.get('bedrooms')),
              bathrooms: Number(formData.get('bathrooms')),
              area: Number(formData.get('area')),
            }
            handleSave(data)
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Título</label>
                <input
                  name="title"
                  type="text"
                  defaultValue={property.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={property.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium mb-2">Precio</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={property.price}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium mb-2">Moneda</label>
                <select
                  name="currency"
                  defaultValue={property.currency}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ARS">Pesos Argentinos (ARS)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad</label>
                <input
                  name="city"
                  type="text"
                  defaultValue={property.city}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-medium mb-2">Provincia</label>
                <input
                  name="province"
                  type="text"
                  defaultValue={property.province}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Tipo de propiedad */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Propiedad</label>
                <select
                  name="propertyType"
                  defaultValue={property.propertyType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HOUSE">Casa</option>
                  <option value="APARTMENT">Departamento</option>
                  <option value="ROOM">Habitación</option>
                  <option value="STUDIO">Estudio</option>
                </select>
              </div>

              {/* Tipo de operación */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Operación</label>
                <select
                  name="operationType"
                  defaultValue={property.operationType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RENT">Alquiler</option>
                  <option value="SALE">Venta</option>
                </select>
              </div>

              {/* Dormitorios */}
              <div>
                <label className="block text-sm font-medium mb-2">Dormitorios</label>
                <input
                  name="bedrooms"
                  type="number"
                  min="0"
                  defaultValue={property.bedrooms}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Baños */}
              <div>
                <label className="block text-sm font-medium mb-2">Baños</label>
                <input
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue={property.bathrooms}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium mb-2">Área (m²)</label>
                <input
                  name="area"
                  type="number"
                  min="0"
                  defaultValue={property.area}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 mt-6">
              <Link href="/mis-propiedades" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
