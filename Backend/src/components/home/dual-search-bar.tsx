"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Search, Home as HomeIcon, Users } from 'lucide-react'

export function DualSearchBar() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('propiedades')

  // Estados para búsqueda de propiedades
  const [propertyCity, setPropertyCity] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [propertyPriceMin, setPropertyPriceMin] = useState('')
  const [propertyPriceMax, setPropertyPriceMax] = useState('')

  // Estados para búsqueda de roommates
  const [roommateCity, setRoommateCity] = useState('')
  const [roommateBudgetMin, setRoommateBudgetMin] = useState('')
  const [roommateBudgetMax, setRoommateBudgetMax] = useState('')

  const handlePropertySearch = () => {
    const params = new URLSearchParams()
    if (propertyCity) params.append('city', propertyCity)
    if (propertyType) params.append('type', propertyType)
    if (propertyPriceMin) params.append('priceMin', propertyPriceMin)
    if (propertyPriceMax) params.append('priceMax', propertyPriceMax)

    router.push(`/properties?${params.toString()}`)
  }

  const handleRoommateSearch = () => {
    const params = new URLSearchParams()
    if (roommateCity) params.append('city', roommateCity)
    if (roommateBudgetMin) params.append('budgetMin', roommateBudgetMin)
    if (roommateBudgetMax) params.append('budgetMax', roommateBudgetMax)

    router.push(`/comunidad?${params.toString()}`)
  }

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

  const propertyTypes = [
    { value: 'casa', label: 'Casa' },
    { value: 'departamento', label: 'Departamento' },
    { value: 'local', label: 'Local Comercial' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'oficina', label: 'Oficina' }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-100">
          <TabsTrigger
            value="propiedades"
            className="flex items-center gap-2 text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <HomeIcon className="w-4 h-4" />
            Propiedades
          </TabsTrigger>
          <TabsTrigger
            value="roommates"
            className="flex items-center gap-2 text-base data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            Roommates
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Propiedades */}
        <TabsContent value="propiedades">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <select
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las ciudades</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de propiedad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de propiedad
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rango de precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de precio (por mes)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Precio mínimo"
                  value={propertyPriceMin}
                  onChange={(e) => setPropertyPriceMin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Precio máximo"
                  value={propertyPriceMax}
                  onChange={(e) => setPropertyPriceMax(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Botón buscar */}
            <Button
              onClick={handlePropertySearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar Propiedades
            </Button>
          </div>
        </TabsContent>

        {/* Tab Content: Roommates */}
        <TabsContent value="roommates">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <select
                  value={roommateCity}
                  onChange={(e) => setRoommateCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todas las ciudades</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Presupuesto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto mensual
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={roommateBudgetMin}
                    onChange={(e) => setRoommateBudgetMin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={roommateBudgetMax}
                    onChange={(e) => setRoommateBudgetMax(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Botón buscar */}
            <Button
              onClick={handleRoommateSearch}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Buscar Roommates
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Trust badges */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">⭐</span>
            <span>Lanzamiento 2025</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Gratis publicar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-600 font-bold">🤝</span>
            <span>Comunidad verificada</span>
          </div>
        </div>
      </div>
    </div>
  )
}
