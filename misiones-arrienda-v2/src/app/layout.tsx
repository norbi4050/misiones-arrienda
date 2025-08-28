import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Misiones Arrienda - Alquiler de Propiedades en Misiones',
  description: 'Encuentra tu hogar ideal en Misiones. Alquiler de casas, departamentos y propiedades en toda la provincia.',
  keywords: 'alquiler, propiedades, misiones, casas, departamentos, inmobiliaria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
