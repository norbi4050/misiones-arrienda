import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">
                  Misiones Arrienda
                </span>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
