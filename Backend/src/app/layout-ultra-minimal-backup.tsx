import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Misiones Arrienda',
  description: 'Test minimal layout',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div style={{ padding: '20px' }}>
          <h1>Layout Ultra Minimal - Test</h1>
          {children}
        </div>
      </body>
    </html>
  )
}
