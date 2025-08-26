import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { AIChatbot } from '@/components/ai-chatbot'
import WhatsAppButton from '@/components/whatsapp-button'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

// FORCE DYNAMIC RENDERING FOR ENTIRE APP - SOLUCIÓN RADICAL
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://misiones-arrienda.vercel.app'),
  title: 'Misiones Arrienda - Propiedades en Misiones',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones. Casas, departamentos, locales comerciales y más.',
  keywords: 'arriendo, venta, propiedades, Misiones, Posadas, casas, departamentos, locales, inmobiliaria',
  authors: [{ name: 'Misiones Arrienda' }],
  openGraph: {
    title: 'Misiones Arrienda - Propiedades en Misiones',
    description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Misiones Arrienda',
    url: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Agregar código real
  },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          
          {/* WhatsApp Button Global - Siempre visible */}
          <WhatsAppButton type="fixed" />
          
          {/* AI Chatbot */}
          <AIChatbot />
          
          {/* Toast Notifications Mejoradas */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                maxWidth: '400px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#3b82f6',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
