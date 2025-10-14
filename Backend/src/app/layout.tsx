import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutClientWrapper } from './layout-client-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.misionesarrienda.com.ar'),
  title: 'MisionesArrienda',
  description: 'Casas, departamentos y locales en Misiones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "Misiones Arrienda",
              "description": "Portal inmobiliario especializado en propiedades de Misiones",
              "url": "https://misionesarrienda.com.ar",
              "areaServed": {
                "@type": "State",
                "name": "Misiones, Argentina"
              },
              "serviceType": ["Alquiler de propiedades", "Venta de propiedades"],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+54-376-4123456",
                "contactType": "customer service",
                "availableLanguage": "Spanish"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {/* PERF: Client wrapper para lazy loading condicional */}
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  )
}
