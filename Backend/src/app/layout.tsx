import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { AIChatbot } from '@/components/ai-chatbot'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Misiones Arrienda - Propiedades en Misiones',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones. Casas, departamentos, locales comerciales y más.',
  keywords: 'arriendo, venta, propiedades, Misiones, casas, departamentos, locales',
  authors: [{ name: 'Misiones Arrienda' }],
  openGraph: {
    title: 'Misiones Arrienda - Propiedades en Misiones',
    description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones',
    type: 'website',
    locale: 'es_AR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <AIChatbot />
        </ThemeProvider>
      </body>
    </html>
  )
}
