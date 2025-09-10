'use client'

import { usePathname } from 'next/navigation'
import WhatsAppButton from './whatsapp-button'

export function ConditionalWhatsAppButton() {
  const pathname = usePathname()
  
  // No mostrar WhatsApp flotante en páginas de propiedades
  const isPropertyPage = pathname?.startsWith('/properties/')
  
  if (isPropertyPage) {
    return null
  }
  
  return <WhatsAppButton type="fixed" />
}
