import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Mis Conversaciones | Arrienda',
  description: 'Gestiona tus conversaciones con otros usuarios de la comunidad'
}

/**
 * REDIRECCIÓN A SISTEMA UNIFICADO DE MENSAJERÍA
 * 
 * Esta página ahora redirige a /messages?tab=community
 * para usar el sistema unificado de mensajería con tabs.
 * 
 * Mantiene backward compatibility con enlaces existentes.
 */
export default function MensajesPage() {
  // Redirigir a la interfaz unificada con tab de comunidad
  redirect('/messages?tab=community')
}
