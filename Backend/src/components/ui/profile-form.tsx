"use client"

import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'

interface ProfileFormProps {
  onSubmit?: (data: any) => void
  initialData?: any
  className?: string
  isSubmitting?: boolean
}

export function ProfileForm({ onSubmit, initialData, className, isSubmitting = false }: ProfileFormProps) {
  const [isDirty, setIsDirty] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data: Record<string, string> = {}
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })
    onSubmit?.(data)
  }

  const handleInputChange = () => {
    setIsDirty(true)
  }

  // Extraer firstName y lastName del name completo si existe
  const fullName = initialData?.name || ''
  const nameParts = fullName.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={firstName}
                placeholder="Tu nombre"
                maxLength={60}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={lastName}
                placeholder="Tu apellido"
                maxLength={60}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-500 text-xs">(Solo lectura)</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={initialData?.email || ''}
              placeholder="tu@email.com"
              readOnly
              disabled
              className="bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initialData?.phone || ''}
              placeholder="+54 376 123456"
              maxLength={20}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Biografía
            </label>
            <div className="relative">
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={initialData?.bio || ''}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                {(initialData?.bio || '').length}/500
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!isDirty || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileForm
