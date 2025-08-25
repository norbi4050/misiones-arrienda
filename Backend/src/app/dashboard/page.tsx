"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("propiedades")
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('authToken')
    const userDataStr = localStorage.getItem('userData')

    if (!token || !userDataStr) {
      toast.error("Debes iniciar sesión para acceder al dashboard")
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userDataStr)
      setUserData(user)
    } catch (error) {
      console.error('Error parsing user data:', error)
      toast.error("Error al cargar datos del usuario")
      router.push('/login')
      return
    }

    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    toast.success("Sesión cerrada exitosamente")
    router.push('/')
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

  // Datos del propietario (ahora usando datos reales del usuario)
  const propietario = {
    nombre: userData.name || "Usuario",
    email: userData.email || "",
    plan: "Básico", // Por defecto, se puede expandir más tarde
    propiedades: 0, // Se puede obtener de una API
    consultas: 0, // Se puede obtener de una API
    vencimiento: "2024-12-31"
  }

  const propiedades = [
    {
      id: 1,
      titulo: "Casa familiar en Eldorado",
      precio: 320000,
      plan: "Destacado",
      consultas: 8,
      estado: "Activa",
      destacada: true
    },
    {
      id: 2,
      titulo: "Departamento céntrico",
      precio: 180000,
      plan: "Básico",
      consultas: 3,
      estado: "Activa",
      destacada: false
    },
    {
      id: 3,
      titulo: "Casa con piscina",
      precio: 450000,
      plan: "Full",
      consultas: 15,
      estado: "Activa",
      destacada: true
    }
  ]

  const consultas = [
    {
      id: 1,
      propiedad: "Casa familiar en Eldorado",
      nombre: "María González",
      email: "maria@email.com",
      telefono: "+54 376 123456",
      mensaje: "Me interesa conocer más detalles sobre la propiedad",
      fecha: "2024-01-20"
    },
    {
      id: 2,
      propiedad: "Casa con piscina",
      nombre: "Carlos Rodríguez",
      email: "carlos@email.com",
      telefono: "+54 376 987654",
      mensaje: "¿Está disponible para visita este fin de semana?",
      fecha: "2024-01-19"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard de Propietario
              </h1>
              <p className="text-gray-600">
                Bienvenido, {propietario.nombre}
              </p>
              <p className="text-sm text-gray-500">
                Email: {propietario.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={propietario.plan === "Destacado" ? "destructive" : "secondary"}>
                  Plan {propietario.plan}
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
                Vence: {propietario.vencimiento}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Propiedades
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {propietario.propiedades}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Consultas Totales
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {propietario.consultas}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan Actual
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {propietario.plan}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Costo Mensual
            </h3>
            <p className="text-2xl font-bold text-red-600">
              ${propietario.plan === "Destacado" ? "5.000" : propietario.plan === "Full" ? "10.000" : "0"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("propiedades")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "propiedades"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Mis Propiedades
              </button>
              <button
                onClick={() => setActiveTab("consultas")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "consultas"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Consultas Recibidas
              </button>
              <button
                onClick={() => setActiveTab("planes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "planes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Cambiar Plan
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Propiedades */}
            {activeTab === "propiedades" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Mis Propiedades</h2>
                  <Button>
                    Publicar Nueva Propiedad
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {propiedades.map((propiedad) => (
                    <div key={propiedad.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{propiedad.titulo}</h3>
                            {propiedad.destacada && (
                              <Badge variant="destructive">Destacado</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">
                            Precio: ${propiedad.precio.toLocaleString()}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Plan: {propiedad.plan}</span>
                            <span>Consultas: {propiedad.consultas}</span>
                            <span>Estado: {propiedad.estado}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Consultas */}
            {activeTab === "consultas" && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Consultas Recibidas</h2>
                
                <div className="space-y-4">
                  {consultas.map((consulta) => (
                    <div key={consulta.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{consulta.nombre}</h3>
                          <p className="text-sm text-gray-600">{consulta.propiedad}</p>
                        </div>
                        <span className="text-sm text-gray-500">{consulta.fecha}</span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-700">{consulta.mensaje}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <p>Email: {consulta.email}</p>
                          <p>Teléfono: {consulta.telefono}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Responder
                          </Button>
                          <Button variant="outline" size="sm">
                            Marcar como Leída
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Planes */}
            {activeTab === "planes" && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Cambiar Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Plan Básico */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-2">Plan Básico</h3>
                    <p className="text-3xl font-bold text-green-600 mb-4">$0</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Publicación básica
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Hasta 5 fotos
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Descripción completa
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Plan Actual
                    </Button>
                  </div>

                  {/* Plan Destacado */}
                  <div className="border-2 border-red-500 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="destructive">Más Popular</Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Plan Destacado</h3>
                    <p className="text-3xl font-bold text-red-600 mb-4">$5.000/mes</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Todo del plan básico
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Badge "Destacado"
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Aparece primero
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Hasta 10 fotos
                      </li>
                    </ul>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Plan Actual
                    </Button>
                  </div>

                  {/* Plan Full */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-2">Plan Full</h3>
                    <p className="text-3xl font-bold text-purple-600 mb-4">$10.000/mes</p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Todo del plan destacado
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Video promocional
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Agente asignado
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Fotos ilimitadas
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Cambiar a Full
                    </Button>
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
