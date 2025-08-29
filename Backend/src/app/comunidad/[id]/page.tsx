import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProfileDetailClient from './profile-detail-client'

interface PageProps {
  params: {
    id: string
  }
}

// Función para obtener el perfil del servidor
async function getProfile(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/comunidad/profiles/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfile(params.id)
  
  if (!profile) {
    return {
      title: 'Perfil no encontrado - Misiones Arrienda'
    }
  }

  return {
    title: `${profile.user.name} - Perfil Comunidad | Misiones Arrienda`,
    description: profile.bio || `Perfil de ${profile.user.name} en la comunidad de Misiones Arrienda`,
  }
}

export default async function ProfileDetailPage({ params }: PageProps) {
  const profile = await getProfile(params.id)
  
  if (!profile) {
    notFound()
  }

  return <ProfileDetailClient profile={profile} />
}
