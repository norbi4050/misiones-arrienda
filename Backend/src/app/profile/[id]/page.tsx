"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, User, Mail, Phone, Calendar, Briefcase } from "lucide-react"
import toast from "react-hot-toast"

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  bio?: string
  occupation?: string
  age?: number
  verified: boolean
  rating: number
  reviewCount: number
  createdAt: string
  userType?: string
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
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    occupation: '',
    age: '',
    phone: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [params.id])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const currentUserData = localStorage.getItem('userData')

      if (!token || !currentUserData) {
        toast.error("Debes iniciar sesión para ver perfiles")
        router.push('/login')
        return
      }

      const currentUser = JSON.parse(currentUserData)
      const isOwnProfile = currentUser.id === params.id || params.id === 'me'
      setIsCurrentUser(isOwnProfile)

      if (isOwnProfile) {
        // Mostrar perfil del usuario actual
        const userProfile: UserProfile = {
          id: currentUser.id,
          name: currentUser.name || "Usuario",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          bio: currentUser.bio || "",
          occupation: currentUser.occupation || "",
          age: currentUser.age || undefined,
          verified: currentUser.verified || false,
          rating: 0,
          reviewCount: 0,
          createdAt: currentUser.createdAt || new Date().toISOString(),
          userType: currentUser.userType || "inquilino"
        }

        setUser(userProfile)
        setEditForm({
          name: userProfile.name,
          bio: userProfile.bio || '',
          occupation: userProfile.occupation || '',
          age: userProfile.age?.toString() || '',
          phone: userProfile.phone || ''
        })
        setReviews([]) // Por ahora no hay reseñas reales
      } else {
        // Intentar cargar perfil de otro usuario desde API
        try {
          const response = await fetch(`/api/users/${params.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
            setReviews(userData.reviews || [])
          } else {
            throw new Error('Usuario no encontrado')
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
          toast.error('Usuario no encontrado')
          router.push('/profiles')
          return
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          bio: editForm.bio,
          occupation: editForm.occupation,
          age: editForm.age ? parseInt(editForm.age) : null,
          phone: editForm.phone
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()

        // Actualizar localStorage
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}')
        const newUserData = { ...currentUserData, ...updatedUser.user }
        localStorage.setItem('userData', JSON.stringify(newUserData))

        // Actualizar estado local
        setUser(prev => prev ? { ...prev, ...updatedUser.user } : null)
        setIsEditing(false)
        toast.success('Perfil actualizado exitosamente')
      } else {
        throw new Error('Error al actualizar perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
    }
  }

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        name: user.name,
        bio: user.bio || '',
        occupation: user.occupation || '',
        age: user.age?.toString() || '',
        phone: user.phone || ''
      })
    }
    setIsEditing(false)
  }

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
        <div className="flex items-start justify-between mb-6">
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
                {user.userType && (
                  <Badge variant="secondary">
                    {user.userType}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Mail size={16} className="text-gray-500" />
                <span className="text-gray-600">{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center space-x-2 mb-3">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-gray-600">{user.phone}</span>
                </div>
              )}

              <div className="space-y-1 text-gray-600">
                {user.occupation && (
                  <div className="flex items-center space-x-2">
                    <Briefcase size={16} className="text-gray-500" />
                    <span>{user.occupation}</span>
                  </div>
                )}
                {user.age && (
                  <p><strong>Edad:</strong> {user.age} años</p>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span>Miembro desde: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de editar perfil */}
          {isCurrentUser && (
            <Button
              onClick={handleEditProfile}
              className="flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Editar Perfil</span>
            </Button>
          )}
        </div>

        {/* Formulario de edición */}
        {isEditing && isCurrentUser && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ocupación
                </label>
                <input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, occupation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}

        {/* Sección "Sobre mí" */}
        {!isEditing && user.bio && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre mí</h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}

        {/* Mensaje si no hay biografía */}
        {!isEditing && !user.bio && isCurrentUser && (
          <div className="border-t border-gray-200 pt-6">
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Completa tu perfil
              </h3>
              <p className="text-gray-600 mb-4">
                Agrega una biografía para que otros usuarios puedan conocerte mejor
              </p>
              <Button onClick={handleEditProfile}>
                Completar Perfil
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sección de reseñas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Reseñas como {user.userType || 'Usuario'} ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isCurrentUser ? 'Aún no tienes reseñas' : 'Este usuario aún no tiene reseñas'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isCurrentUser
                ? 'Las reseñas aparecerán aquí cuando otros usuarios evalúen tu servicio'
                : 'Las reseñas de otros usuarios aparecerán aquí'
              }
            </p>
            {isCurrentUser && (
              <Button onClick={() => router.push('/')}>
                Explorar Propiedades
              </Button>
            )}
          </div>
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

      {/* Botones de navegación */}
      <div className="mt-6 flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          ← Volver
        </Button>
        {isCurrentUser && (
          <Button onClick={() => router.push('/dashboard')}>
            Ir al Dashboard
          </Button>
        )}
      </div>
    </div>
  )
}
