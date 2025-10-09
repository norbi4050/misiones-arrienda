import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AIChatbot } from '@/components/ai-chatbot'
import WhatsAppButton from '@/components/whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { AuthProvider } from '@/components/auth-provider'
import { MessagesProvider } from '@/contexts/MessagesContext'
import ToasterProvider from '@/components/toaster-provider'
import { PresenceTracker } from '@/components/presence/PresenceTracker'

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
        <AuthProvider>
          <MessagesProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>

              {/* WhatsApp Button Global - Siempre visible */}
              <WhatsAppButton type="fixed" />

              {/* AI Chatbot */}
              <AIChatbot />

              {/* Build Badge para debugging */}
              <BuildBadge />

              {/* Toast Notifications Sonner */}
              <ToasterProvider />

              {/* Presence Tracker - Sistema de tracking de estado online/offline */}
              <PresenceTracker />
            </ThemeProvider>
          </MessagesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
