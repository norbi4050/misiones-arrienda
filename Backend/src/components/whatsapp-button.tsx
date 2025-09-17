"use client"

import { MessageCircle, Phone, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

interface WhatsAppButtonProps {
  propertyId?: string
  address?: string
  price?: string
  type?: "fixed" | "inline"
  className?: string
  source?: string
  campaign?: string
  agentPhone?: string
  agentName?: string
  propertyTitle?: string
}

// Función para normalizar números de teléfono argentinos a formato WhatsApp
function normalizeArgentinePhone(phone: string): string {
  if (!phone) return "5493764567890" // Fallback al número de Misiones Arrienda

  // Remover todos los caracteres no numéricos
  const digits = phone.replace(/\D/g, '')

  // Si ya está en formato internacional correcto (549...)
  if (digits.startsWith('549')) {
    return digits
  }

  // Si empieza con 54 pero no 549 (teléfono móvil sin el 9)
  if (digits.startsWith('54') && !digits.startsWith('549')) {
    return '549' + digits.slice(2)
  }

  // Si empieza con 0 (formato nacional argentino)
  if (digits.startsWith('0')) {
    // Remover el 0 inicial y agregar 549
    return '549' + digits.slice(1)
  }

  // Si es un número local (sin código de país)
  if (digits.length >= 10) {
    // Asumir que es un número móvil argentino y agregar 549
    return '549' + digits
  }

  // Si no se puede normalizar, usar el número de fallback
  return "5493764567890"
}

export default function WhatsAppButton({
  propertyId,
  address,
  price,
  type = "inline",
  className = "",
  source = "web",
  campaign = "property_inquiry",
  agentPhone,
  agentName,
  propertyTitle
}: WhatsAppButtonProps) {

  const phoneNumber = normalizeArgentinePhone(agentPhone || "")

  const generateMessage = () => {
    // Usar el título de la propiedad y nombre del agente si están disponibles
    const agentGreeting = agentName ? `Hola ${agentName}, ` : '¡Hola! '

    let baseMessage = ''

    if (propertyTitle && address && price) {
      baseMessage = `${agentGreeting}me interesa la propiedad "${propertyTitle}" en ${address} por $${price}. ¿Podemos coordinar una visita? 🏠`
    } else if (address && price) {
      baseMessage = `${agentGreeting}me interesa la propiedad en ${address} por $${price}. ¿Podemos coordinar una visita? 🏠`
    } else if (propertyId) {
      baseMessage = `${agentGreeting}me interesa la propiedad ID: ${propertyId}. ¿Podemos hablar? 🏠`
    } else {
      baseMessage = `${agentGreeting}me interesa conocer más sobre las propiedades disponibles en Misiones Arrienda 🏠`
    }

    return baseMessage
  }

  const generateWhatsAppUrl = () => {
    const message = generateMessage()
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  }

  const handleClick = () => {
    // Track analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: propertyId || 'general',
        property_id: propertyId,
        source: source,
        campaign: campaign
      })
    }

    // Track custom analytics
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'whatsapp_click',
            propertyId,
            source,
            campaign,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error)
      } catch (error) {
        console.error('Analytics tracking error:', error)
      }
    }
  }

  if (type === "fixed") {
    return (
      <a
        href={generateWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 animate-pulse hover:animate-none group ${className}`}
        title="Contactar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
          !
        </div>
      </a>
    )
  }

  return (
    <Button
      asChild
      className={`bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${className}`}
    >
      <a
        href={generateWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Contactar por WhatsApp
        <TrendingUp className="w-3 h-3 opacity-70" />
      </a>
    </Button>
  )
}

// Componente para el hero section
export function WhatsAppHeroButton() {
  return (
    <WhatsAppButton
      type="inline"
      source="hero"
      campaign="hero_cta"
      className="bg-green-500 hover:bg-green-600 text-lg px-8 py-3 font-semibold"
    />
  )
}

// Componente para tarjetas de propiedades
export function WhatsAppPropertyButton({
  propertyId,
  address,
  price,
  agentPhone,
  agentName,
  propertyTitle
}: {
  propertyId: string
  address: string
  price: string
  agentPhone?: string
  agentName?: string
  propertyTitle?: string
}) {
  return (
    <WhatsAppButton
      propertyId={propertyId}
      address={address}
      price={price}
      agentPhone={agentPhone}
      agentName={agentName}
      propertyTitle={propertyTitle}
      type="inline"
      source="property_detail"
      campaign="property_inquiry"
      className="w-full"
    />
  )
}

// Componente para tarjetas de propiedades en grid
export function WhatsAppCardButton({ propertyId }: { propertyId: string }) {
  return (
    <WhatsAppButton
      propertyId={propertyId}
      type="inline"
      source="property_card"
      campaign="quick_inquiry"
      className="w-full text-sm py-2"
    />
  )
}

// Componente flotante mejorado
export function WhatsAppFloatingButton() {
  useEffect(() => {
    // Show floating button after 3 seconds
    const timer = setTimeout(() => {
      const button = document.getElementById('whatsapp-floating')
      if (button) {
        button.classList.remove('opacity-0')
        button.classList.add('opacity-100')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div id="whatsapp-floating" className="opacity-0 transition-opacity duration-500">
      <WhatsAppButton
        type="fixed"
        source="floating"
        campaign="persistent_cta"
      />
    </div>
  )
}
