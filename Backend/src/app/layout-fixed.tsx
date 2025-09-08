import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { AIChatbot } from '@/components/ai-chatbot'
import WhatsAppButton from '@/components/whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth-provider-fixed'

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            {children}

            {/* WhatsApp Button Global - Siempre visible */}
            <WhatsAppButton type="fixed" />

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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
