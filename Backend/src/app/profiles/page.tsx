mimport { Metadata } from 'next'
import { ProfilesPageClient } from './profiles-client'

export const metadata: Metadata = {
  title: 'Perfiles de Usuarios Verificados - Misiones | MisionesArrienda',
  description: 'Conoce a nuestra comunidad de inquilinos verificados en Misiones. Cada perfil incluye calificaciones y comentarios de propietarios anteriores para ayudarte a tomar la mejor decisión.',
  keywords: 'perfiles usuarios verificados, inquilinos confiables Misiones, calificaciones inquilinos, sistema reputación alquiler',
  openGraph: {
    title: 'Perfiles de Usuarios Verificados - Misiones',
    description: 'Sistema de calificaciones para inquilinos verificados. Construye tu reputación y accede a mejores propiedades.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    url: 'https://www.misionesarrienda.com.ar/profiles',
    images: [
      {
        url: '/placeholder-apartment-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Perfiles de Usuarios Verificados en Misiones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Perfiles de Usuarios Verificados - Misiones',
    description: 'Sistema de calificaciones para inquilinos verificados. Construye tu reputación y accede a mejores propiedades.',
    images: ['/placeholder-apartment-1.jpg'],
  },
  alternates: {
    canonical: 'https://www.misionesarrienda.com.ar/profiles',
  },
}

export default function ProfilesPage() {
  return <ProfilesPageClient />
}
