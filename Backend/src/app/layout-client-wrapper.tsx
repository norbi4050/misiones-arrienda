'use client'

import { usePathname } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import WhatsAppButton from '@/components/whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { AuthProvider } from '@/components/auth-provider'
import ToasterProvider from '@/components/toaster-provider'
import dynamic from 'next/dynamic'

// PERF: Lazy load componentes pesados con dynamic() + ssr:false
const AIChatbot = dynamic(
  () => import('@/components/ai-chatbot').then(m => ({ default: m.AIChatbot })),
  { 
    ssr: false,
    loading: () => null
  }
)

const MessagesProvider = dynamic(
  () => import('@/contexts/MessagesContext').then(m => ({ default: m.MessagesProvider })),
  { 
    ssr: false,
    loading: () => null
  }
)

const PresenceTracker = dynamic(
  () => import('@/components/presence/PresenceTracker').then(m => ({ default: m.PresenceTracker })),
  { 
    ssr: false,
    loading: () => null
  }
)

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useSupabaseAuth()
  
  // PERF: Detectar si necesita MessagesProvider (solo en rutas de mensajes)
  const needsMessages = pathname?.startsWith('/messages') || 
                        pathname?.startsWith('/comunidad/mensajes')
  
  return (
    <AuthProvider>
      {/* PERF: Condicional por pathname - MessagesProvider (~18 KB) */}
      {needsMessages ? (
        <MessagesProvider>
          <LayoutContent user={user}>
            {children}
          </LayoutContent>
        </MessagesProvider>
      ) : (
        <LayoutContent user={user}>
          {children}
        </LayoutContent>
      )}
    </AuthProvider>
  )
}

function LayoutContent({ 
  children, 
  user 
}: { 
  children: React.ReactNode
  user: any
}) {
  return (
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

      {/* PERF: Lazy load AIChatbot (~25 KB) - dynamic import con ssr:false */}
      <AIChatbot />

      {/* Build Badge para debugging */}
      <BuildBadge />

      {/* Toast Notifications Sonner */}
      <ToasterProvider />

      {/* PERF: Condicional por auth - PresenceTracker (~8 KB) solo si usuario logueado */}
      {user && <PresenceTracker />}
    </ThemeProvider>
  )
}
