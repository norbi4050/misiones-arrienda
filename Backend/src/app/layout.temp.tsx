import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Misiones Arrienda', template: '%s | Misiones Arrienda' },
  description: 'Casas, departamentos y locales en Misiones',
  metadataBase: new URL('http://localhost:3000'),
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <div style={{padding: 20}}>
          <h1>Layout mínimo funcionando</h1>
          {children}
        </div>
      </body>
    </html>
  )
}
