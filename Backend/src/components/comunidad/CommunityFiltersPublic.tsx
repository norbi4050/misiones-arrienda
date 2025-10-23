"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search } from 'lucide-react'

export function CommunityFiltersPublic() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [city, setCity] = useState(searchParams.get('city') || '')
  const [role, setRole] = useState(searchParams.get('role') || '')
  const [budgetMin, setBudgetMin] = useState(searchParams.get('budgetMin') || '')
  const [budgetMax, setBudgetMax] = useState(searchParams.get('budgetMax') || '')

  const cities = [
    'Posadas',
    'Oberá',
    'Eldorado',
    'Puerto Iguazú',
    'Apóstoles',
    'Leandro N. Alem',
    'Jardín América',
    'San Vicente',
    'Aristóbulo del Valle',
    'Montecarlo'
  ]

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (city) params.append('city', city)
    if (role) params.append('role', role)
    if (budgetMin) params.append('min', budgetMin)  // API espera 'min', no 'budgetMin'
    if (budgetMax) params.append('max', budgetMax)  // API espera 'max', no 'budgetMax'

    router.push(`/comunidad?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setCity('')
    setRole('')
    setBudgetMin('')
    setBudgetMax('')
    router.push('/comunidad')
  }

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Filtrar Anuncios</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="BUSCO">Busco habitación</option>
              <option value="OFREZCO">Ofrezco habitación</option>
            </select>
          </div>

          {/* Presupuesto Mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto Mínimo
            </label>
            <input
              type="number"
              placeholder="Ej: 100000"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
            />
          </div>

          {/* Presupuesto Máximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto Máximo
            </label>
            <input
              type="number"
              placeholder="Ej: 200000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            onClick={handleSearch}
            className="bg-purple-600 hover:bg-purple-700 flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="border-gray-300"
          >
            Limpiar filtros
          </Button>
        </div>

        {/* Nota para usuarios no logueados */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          💡 <strong>Tip:</strong> Registrate gratis para guardar tus búsquedas y recibir alertas de nuevos anuncios
        </p>
      </CardContent>
    </Card>
  )
}
