'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, LogIn, UserPlus, Search, Heart, MapPin } from "lucide-react"
import Link from "next/link"

interface AuthCTAProps {
  title?: string
  description?: string
  features?: string[]
  className?: string
}

/**
 * Componente CTA para usuarios no autenticados
 * Muestra beneficios sin redireccionar agresivamente
 */
export default function AuthCTA({
  title = "Crea tu perfil de inquilino",
  description = "Accede a todas las funciones para encontrar tu hogar ideal",
  features = [
    "Guarda tus propiedades favoritas",
    "Recibe alertas personalizadas",
    "Contacta directamente con propietarios",
    "Historial de búsquedas",
    "Perfil verificado"
  ],
  className = ""
}: AuthCTAProps) {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Beneficios */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              ¿Qué puedes hacer con tu perfil?
            </h3>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges de características */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <Search className="h-3 w-3 mr-1" />
              Búsqueda avanzada
            </Badge>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <Heart className="h-3 w-3 mr-1" />
              Favoritos
            </Badge>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700">
              <MapPin className="h-3 w-3 mr-1" />
              Alertas por zona
            </Badge>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link href="/register" className="block">
              <Button className="w-full" size="lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear cuenta gratis
              </Button>
            </Link>
            
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Ya tengo cuenta
              </Button>
            </Link>
          </div>

          {/* Mensaje adicional */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Es gratis y solo toma 2 minutos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * CTA específico para perfil de inquilino
 */
export function InquilinoAuthCTA() {
  return (
    <AuthCTA
      title="Perfil de Inquilino"
      description="Crea tu perfil para acceder a todas las funciones de búsqueda"
      features={[
        "Perfil personalizado de inquilino",
        "Preferencias de búsqueda guardadas",
        "Estadísticas de actividad",
        "Contacto directo con propietarios",
        "Historial de propiedades vistas"
      ]}
    />
  )
}
