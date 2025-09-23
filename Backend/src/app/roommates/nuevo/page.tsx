'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import RoommateForm from '@/components/ui/roommate-form'
import { RoommateFormData } from '@/types/roommate'

export default function NuevoRoommatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manejar envío del formulario (guardar)
  const handleSubmit = async (data: RoommateFormData) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Enviando datos del roommate:', data)

      const response = await fetch('/api/roommates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()
      console.log('Roommate creado:', result)

      // Redirigir a la página de edición para continuar
      router.push(`/roommates/${result.id}/editar?created=true`)

    } catch (err) {
      console.error('Error creando roommate:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Manejar guardar como borrador
  const handleSaveDraft = async (data: RoommateFormData) => {
    await handleSubmit({ ...data, status: 'DRAFT' })
  }

  // Manejar publicar directamente
  const handlePublish = async (data: RoommateFormData) => {
    setLoading(true)
    setError(null)

    try {
      // Primero crear el post
      const createResponse = await fetch('/api/roommates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, status: 'DRAFT' }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || `Error ${createResponse.status}`)
      }

      const createResult = await createResponse.json()
      console.log('Roommate creado para publicar:', createResult)

      // Luego publicarlo
      const publishResponse = await fetch(`/api/roommates/${createResult.id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json()
        throw new Error(errorData.error || `Error ${publishResponse.status}`)
      }

      const publishResult = await publishResponse.json()
      console.log('Roommate publicado:', publishResult)

      // Redirigir al detalle del post publicado
      router.push(`/roommates/${publishResult.slug || publishResult.id}?published=true`)

    } catch (err) {
      console.error('Error publicando roommate:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              href="/roommates"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Volver al feed
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="w-7 h-7 mr-3 text-blue-600" />
                Crear Post de Roommate
              </h1>
              <p className="text-gray-600 mt-1">
                Completa la información para encontrar tu roommate ideal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-600 font-medium">Error al crear el post</div>
            </div>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <RoommateForm
              mode="create"
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              loading={loading}
            />
          </div>

          {/* Sidebar con información */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Guía rápida */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Guía Rápida
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Información básica</div>
                      <div>Título descriptivo y ubicación clara</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Detalles del lugar</div>
                      <div>Tipo de habitación y precio mensual</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Preferencias</div>
                      <div>Estilo de vida y expectativas</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Publicar</div>
                      <div>Revisar y hacer público tu anuncio</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consejos */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  💡 Consejos para un mejor post
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Sé específico sobre la ubicación y transporte</li>
                  <li>• Menciona qué está incluido en el precio</li>
                  <li>• Describe el ambiente y tipo de convivencia</li>
                  <li>• Agrega fotos de la habitación y espacios comunes</li>
                  <li>• Sé honesto sobre tus horarios y estilo de vida</li>
                </ul>
              </div>

              {/* Información de seguridad */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                  🔒 Seguridad
                </h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• Nunca compartas información personal sensible</li>
                  <li>• Conoce a los candidatos en persona antes de decidir</li>
                  <li>• Verifica referencias y antecedentes</li>
                  <li>• Usa nuestro sistema de mensajes interno</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
