import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Mis Conversaciones | Arrienda',
  description: 'Gestiona tus conversaciones con otros usuarios de la comunidad'
}

// FIX 304: Deshabilitar caché para esta página de redirección
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * REDIRECCIÓN A SISTEMA UNIFICADO DE MENSAJERÍA
 * 
 * Esta página ahora redirige a /messages?tab=community
 * para usar el sistema unificado de mensajería con tabs.
 * 
 * Mantiene backward compatibility con enlaces existentes.
 * 
 * FIX 304: Se agregaron route segment config para evitar caché:
 * - dynamic = 'force-dynamic': Fuerza renderizado dinámico
 * - revalidate = 0: Sin revalidación/caché
 */
export default function MensajesPage() {
  // Redirigir a la interfaz unificada con tab de comunidad
  redirect('/messages?tab=community')
}
