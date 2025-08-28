import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comunidad - Encuentra tu compañero de casa ideal | MisionesArrienda',
  description: 'Conecta con personas que buscan compartir vivienda en Misiones. Sistema de matches, mensajes y perfiles verificados para encontrar el roommate perfecto.',
  keywords: 'roommates Misiones, compañeros casa, alquiler compartido, comunidad alquiler, buscar roommate, compartir vivienda, Posadas, Puerto Iguazú',
  openGraph: {
    title: 'Comunidad - Encuentra tu compañero de casa ideal',
    description: 'Conecta con personas que buscan compartir vivienda en Misiones. Sistema de matches y mensajes para encontrar el roommate perfecto.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'MisionesArrienda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidad - Encuentra tu compañero de casa ideal',
    description: 'Conecta con personas que buscan compartir vivienda en Misiones.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/comunidad',
  },
}

export default function ComunidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
