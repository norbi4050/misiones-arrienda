import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { NavbarSafe as Navbar } from '@/components/navbar-safe'
import { AIChatbot } from '@/components/ai-chatbot'
import { ConditionalWhatsAppButton } from '@/components/conditional-whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/auth-provider'
import { UserProvider } from '@/contexts/UserContext'

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
  const session = null;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider initialSession={session}>
          <UserProvider>
            {/* REMOVIDO MessagesProvider temporalmente */}
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <Navbar initialSession={session} />
              {children}

              <ConditionalWhatsAppButton />
              <AIChatbot />
              <BuildBadge />

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
                }}
              />
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
