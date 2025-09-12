import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { AIChatbot } from '@/components/ai-chatbot'
import { ConditionalWhatsAppButton } from '@/components/conditional-whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { Toaster } from 'react-hot-toast'
// TEMPORAL: AuthProvider deshabilitado para resolver error 500
// import { AuthProvider } from '@/components/auth-provider'
// import { createServerSupabase } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Misiones Arrienda', template: '%s | Misiones Arrienda' },
  description: 'Casas, departamentos y locales en Misiones',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORAL: Sesión deshabilitada para resolver error 500
  // const supabase = await createServerSupabase()
  // const { data: { session } } = await supabase.auth.getSession()
  const session = null;

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
        {/* TEMPORAL: AuthProvider deshabilitado */}
        {/* <AuthProvider initialSession={session}> */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar initialSession={session} />
            {children}

            {/* WhatsApp Button Condicional - No en páginas de propiedades */}
            <ConditionalWhatsAppButton />

            {/* AI Chatbot */}
            <AIChatbot />

            {/* Build Badge para debugging */}
            <BuildBadge />

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
        {/* </AuthProvider> */}
      </body>
    </html>
  )
}
