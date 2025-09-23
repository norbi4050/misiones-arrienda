import './globals.css'

export const metadata = {
  title: 'Misiones Arrienda',
  description: 'Plataforma de alquiler en Misiones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
