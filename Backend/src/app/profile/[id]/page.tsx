"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  bio?: string
  occupation?: string
  age?: number
  verified: boolean
  rating: number
  reviewCount: number
  createdAt: string
}

interface UserReview {
  id: string
  rating: number
  comment: string
  category: string
  verified: boolean
  createdAt: string
  reviewer: {
    name: string
    avatar?: string
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulamos datos del usuario por ahora
    const mockUser: UserProfile = {
      id: params.id as string,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@email.com",
      phone: "+54 376 456-7890",
      avatar: "/users/carlos-mendoza.jpg",
      bio: "Profesional de sistemas, trabajador responsable y cuidadoso con las propiedades. Vivo solo y mantengo todo en orden.",
      occupation: "Desarrollador de Software",
      age: 28,
      verified: true,
      rating: 4.8,
      reviewCount: 12,
      createdAt: "2023-01-15"
    }

    const mockReviews: UserReview[] = [
      {
        id: "1",
        rating: 5,
        comment: "Excelente inquilino. Carlos siempre pagó puntualmente, mantuvo la propiedad en perfectas condiciones y fue muy comunicativo. Lo recomiendo sin dudas.",
        category: "TENANT",
        verified: true,
        createdAt: "2024-01-15",
        reviewer: {
          name: "Laura Fernández",
          avatar: "/users/laura-fernandez.jpg"
        }
      },
      {
        id: "2",
        rating: 4,
        comment: "Buen inquilino en general. Responsable con los pagos y cuidadoso. Solo tuvo un pequeño retraso en un pago pero se comunicó previamente.",
        category: "TENANT",
        verified: true,
        createdAt: "2023-12-10",
        reviewer: {
          name: "Ana García",
          avatar: "/users/ana-garcia.jpg"
        }
      },
      {
        id: "3",
        rating: 5,
        comment: "Inquilino ejemplar. Muy profesional en el trato y cuidadoso con la propiedad. Recomendable 100%.",
        category: "TENANT",
        verified: false,
        createdAt: "2023-08-22",
        reviewer: {
          name: "Miguel Torres"
        }
      }
    ]

    setUser(mockUser)
    setReviews(mockReviews)
    setLoading(false)
  }, [params.id])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-lg">Cargando perfil...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h1>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header del perfil */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.verified && (
                <Badge className="bg-green-100 text-green-800">
                  ✓ Verificado
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center">
                {renderStars(Math.floor(user.rating))}
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {user.rating.toFixed(1)}
                </span>
                <span className="ml-1 text-gray-600">
                  ({user.reviewCount} reseñas)
                </span>
              </div>
            </div>
            
            <div className="space-y-1 text-gray-600">
              {user.occupation && (
                <p><strong>Ocupación:</strong> {user.occupation}</p>
              )}
              {user.age && (
                <p><strong>Edad:</strong> {user.age} años</p>
              )}
              <p><strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {user.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre mí</h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Sección de reseñas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Reseñas como Inquilino ({reviews.length})
        </h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Este usuario aún no tiene reseñas.
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {review.reviewer.avatar ? (
                        <img 
                          src={review.reviewer.avatar} 
                          alt={review.reviewer.name} 
                          className="w-12 h-12 rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-600">
                          {review.reviewer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {review.reviewer.name}
                      </h4>
                      {review.verified && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Alquiler Verificado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón para volver */}
      <div className="mt-6 text-center">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          ← Volver
        </Button>
      </div>
    </div>
  )
}
