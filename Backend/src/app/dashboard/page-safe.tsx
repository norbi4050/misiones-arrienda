"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import { SearchHistory } from "@/components/search-history"
import { safeRouter, safeLocalStorage, safeConsole, isClient } from "@/lib/client-utils"
import { Heart, Search, Clock, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"

interface FavoriteProperty {
  id: string;
  property: {
    id: string;
    title: string;
    price: number;
    images: string;
    city: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
  };
  createdAt: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("favoritos")
  const [userData, setUserData] = useState<any>(null)
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)

  useEffect(() => {
    // Verificar si el usuario está autenticado de forma segura
    if (!isClient) {
      setIsLoading(false)
      return
    }

    const token = safeLocalStorage.getItem('token')
    const userDataStr = safeLocalStorage.getItem('userData')

    if (!token || !userDataStr) {
      toast.error("Debes iniciar sesión para acceder al dashboard")
      safeRouter.push('/login')
      return
    }

    try {
      const user = JSON.parse(userDataStr)
      setUserData(user)
    } catch (error) {
      safeConsole.error('Error parsing user data:', error)
      toast.error("Error al cargar datos del usuario")
      safeRouter.push('/login')
      return
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (userData && activeTab === "favoritos") {
      loadFavorites()
    }
  }, [userData, activeTab])

  const loadFavorites = async () => {
    setIsLoadingFavorites(true)
    try {
      const token = safeLocalStorage.getItem('token')
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites)
      } else {
        throw new Error('Error al cargar favoritos')
      }
    } catch (error) {
      safeConsole.error('Error loading favorites:', error)
      toast.error('Error al cargar favoritos')
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  const handleLogout = () => {
    safeLocalStorage.removeItem('token')
    safeLocalStorage.removeItem('userData')
    toast.success("Sesión cerrada exitosamente")
    safeRouter.push('/')
  }

  const handleSearchSelect = (searchTerm: string, filters?: any) => {
    // Redirigir a la página principal con los parámetros de búsqueda
    const searchParams = new URLSearchParams()
    searchParams.set('search', searchTerm)
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          searchParams.set(key, filters[key])
        }
      })
    }
    
    safeRouter.push(`/?${searchParams.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  // Datos del usuario (usando datos reales del usuario)
  const usuario = {
    nombre: userData.name || "Usuario",
    email: userData.email || "",
    tipo: "Inquilino", // Por defecto, se puede expandir más tarde
    favoritos: favorites.length,
    busquedas: 0, // Se puede obtener de una API
    fechaRegistro: userData.createdAt || new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mi Dashboard
              </h1>
              <p className="text-gray-600">
                Bienvenido, {usuario.nombre}
              </p>
              <p className="text-sm text-gray-500">
                Email: {usuario.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary">
                  {usuario.tipo}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cerrar Sesión
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Miembro desde: {new Date(usuario.fechaRegistro).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Favoritos
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {usuario.favoritos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Búsquedas
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {usuario.busquedas}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Actividad
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  Activo
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Tendencias
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  +15%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("favoritos")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "favoritos"
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart size={16} />
                Mis Favoritos
              </button>
              <button
                onClick={() => setActiveTab("historial")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "historial"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Clock size={16} />
                Historial de Búsquedas
              </button>
              <button
                onClick={() => setActiveTab("propiedades")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "propiedades"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Explorar Propiedades
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Favoritos */}
            {activeTab === "favoritos" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Mis Propiedades Favoritas</h2>
                  <Button onClick={() => safeRouter.push('/')}>
                    Explorar Más Propiedades
                  </Button>
                </div>
                
                {isLoadingFavorites ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando favoritos...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes favoritos aún
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Explora propiedades y marca las que más te gusten como favoritas
                    </p>
                    <Button onClick={() => safeRouter.push('/')}>
                      Explorar Propiedades
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => {
                      const images = JSON.parse(favorite.property.images || '[]')
                      return (
                        <div key={favorite.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="relative">
                            <img
                              src={images[0] || '/placeholder-house-1.jpg'}
                              alt={favorite.property.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <FavoriteButton 
                                propertyId={favorite.property.id}
                                size="sm"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                              {favorite.property.title}
                            </h3>
                            <p className="text-2xl font-bold text-blue-600 mb-2">
                              ${favorite.property.price.toLocaleString()}
                            </p>
                            <p className="text-gray-600 mb-3">
                              {favorite.property.city}
                            </p>
                            <div className="flex justify-between text-sm text-gray-500 mb-4">
                              <span>{favorite.property.bedrooms} hab.</span>
                              <span>{favorite.property.bathrooms} baños</span>
                              <span>{favorite.property.area} m²</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => safeRouter.push(`/property/${favorite.property.id}`)}
                              >
                                Ver Detalles
                              </Button>
                              <Button variant="outline" size="sm">
                                Contactar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Historial */}
            {activeTab === "historial" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Historial de Búsquedas</h2>
                  <SearchHistory 
                    onSearchSelect={handleSearchSelect}
                    maxItems={20}
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Search size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tu historial de búsquedas aparecerá aquí
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Realiza búsquedas en la plataforma para ver tu historial y acceder rápidamente a búsquedas anteriores
                  </p>
                  <Button onClick={() => safeRouter.push('/')}>
                    Comenzar a Buscar
                  </Button>
                </div>
              </div>
            )}

            {/* Tab: Explorar Propiedades */}
            {activeTab === "propiedades" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Explorar Propiedades</h2>
                  <Button onClick={() => safeRouter.push('/')}>
                    Ver Todas las Propiedades
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Accesos rápidos a búsquedas populares */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?city=Posadas')}>
                    <h3 className="font-semibold text-lg mb-2">Propiedades en Posadas</h3>
                    <p className="text-gray-600">Explora las mejores opciones en la capital</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?city=Oberá')}>
                    <h3 className="font-semibold text-lg mb-2">Propiedades en Oberá</h3>
                    <p className="text-gray-600">Descubre opciones en la ciudad del bosque</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?propertyType=HOUSE')}>
                    <h3 className="font-semibold text-lg mb-2">Casas</h3>
                    <p className="text-gray-600">Encuentra la casa perfecta para tu familia</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?propertyType=APARTMENT')}>
                    <h3 className="font-semibold text-lg mb-2">Departamentos</h3>
                    <p className="text-gray-600">Departamentos modernos y cómodos</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?maxPrice=200000')}>
                    <h3 className="font-semibold text-lg mb-2">Hasta $200.000</h3>
                    <p className="text-gray-600">Opciones accesibles para tu presupuesto</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => safeRouter.push('/?featured=true')}>
                    <h3 className="font-semibold text-lg mb-2">Propiedades Destacadas</h3>
                    <p className="text-gray-600">Las mejores opciones seleccionadas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
