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
}

export default function WhatsAppButton({ 
  propertyId, 
  address, 
  price, 
  type = "inline",
  className = "",
  source = "web",
  campaign = "property_inquiry"
}: WhatsAppButtonProps) {
  
  const phoneNumber = "5493764123456" // Número de WhatsApp de la inmobiliaria
  
  const generateMessage = () => {
    const baseMessage = address && price 
      ? `¡Hola! Me interesa la propiedad en ${address} por $${price}. ¿Podemos coordinar una visita? 🏠`
      : propertyId 
        ? `¡Hola! Me interesa la propiedad ID: ${propertyId}. ¿Podemos hablar? 🏠`
        : `¡Hola! Me interesa conocer más sobre las propiedades disponibles en Misiones Arrienda 🏠`
    
    // Add UTM tracking info to message
    const utmInfo = `\n\n📊 Fuente: ${source} | Campaña: ${campaign}`
    return baseMessage + utmInfo
  }

  const generateWhatsAppUrl = () => {
    const message = generateMessage()
    const utmParams = new URLSearchParams({
      utm_source: source,
      utm_medium: 'whatsapp',
      utm_campaign: campaign,
      utm_content: propertyId || 'general_inquiry'
    })
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}&${utmParams.toString()}`
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
export function WhatsAppPropertyButton({ propertyId, address, price }: { 
  propertyId: string
  address: string 
  price: string 
}) {
  return (
    <WhatsAppButton 
      propertyId={propertyId}
      address={address}
      price={price}
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
