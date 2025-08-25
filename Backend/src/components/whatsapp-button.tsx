"use client"

import { MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WhatsAppButtonProps {
  propertyId?: string
  address?: string
  price?: string
  type?: "fixed" | "inline"
  className?: string
}

export default function WhatsAppButton({ 
  propertyId, 
  address, 
  price, 
  type = "inline",
  className = "" 
}: WhatsAppButtonProps) {
  
  const phoneNumber = "5493764123456" // Número de WhatsApp de la inmobiliaria
  
  const generateMessage = () => {
    if (address && price) {
      return `¡Hola! Me interesa la propiedad en ${address} por $${price}. ¿Podemos coordinar una visita? 🏠`
    } else if (propertyId) {
      return `¡Hola! Me interesa la propiedad ID: ${propertyId}. ¿Podemos hablar? 🏠`
    } else {
      return `¡Hola! Me interesa conocer más sobre las propiedades disponibles en Misiones Arrienda 🏠`
    }
  }

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(generateMessage())}`

  if (type === "fixed") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 animate-pulse hover:animate-none ${className}`}
        title="Contactar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    )
  }

  return (
    <Button
      asChild
      className={`bg-green-500 hover:bg-green-600 text-white transition-all duration-300 ${className}`}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Contactar por WhatsApp
      </a>
    </Button>
  )
}

// Componente para el hero section
export function WhatsAppHeroButton() {
  return (
    <WhatsAppButton 
      type="inline"
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
      className="w-full"
    />
  )
}
