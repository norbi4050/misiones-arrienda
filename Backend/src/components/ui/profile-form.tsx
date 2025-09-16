"use client"

import React from 'react'
import { Button } from './button'
import { Input } from './input'

interface ProfileFormProps {
  onSubmit?: (data: any) => void
  initialData?: any
  className?: string
}

export function ProfileForm({ onSubmit, initialData, className }: ProfileFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data: Record<string, string> = {}
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })
    onSubmit?.(data)
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={initialData?.firstName || ''}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={initialData?.lastName || ''}
                placeholder="Tu apellido"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData?.email || ''}
              placeholder="tu@email.com"
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
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Biografía
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={initialData?.bio || ''}
              placeholder="Cuéntanos sobre ti..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileForm
