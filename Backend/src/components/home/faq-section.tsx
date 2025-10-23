"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: '¿Es realmente gratis publicar?',
      answer: 'Sí, 100% gratis. No cobramos comisión por publicar propiedades ni perfiles de roommate. Nuestro plan gratuito te permite publicar hasta 5 propiedades con hasta 10 imágenes cada una, además de acceso completo a la mensajería y búsqueda.'
    },
    {
      question: '¿Qué incluye el sitio web para inmobiliarias?',
      answer: 'Tu página web personalizada en misionesarrienda.com.ar/inmobiliaria/tu-marca incluye: perfil de empresa editable, galería de todas tus propiedades, tracking de visitas en tiempo real, sistema de mensajería integrado, posibilidad de destacar propiedades y mucho más. Todo sin costos de desarrollo.'
    },
    {
      question: '¿Cómo funciona la comunidad de roommates?',
      answer: 'Publicás tu perfil indicando si buscás habitación o si tenés una disponible. Podés filtrar por ciudad, presupuesto y preferencias de estilo de vida (mascotas, fumador, horarios, etc.). Cuando encontrás un match potencial, chateas directamente con la persona para coordinar.'
    },
    {
      question: '¿Cuál es la diferencia entre el plan Free y Profesional?',
      answer: 'El plan Free permite hasta 5 propiedades activas con funcionalidades básicas. El plan Profesional incluye hasta 20 propiedades, tu sitio web personalizado, destacados ilimitados, tracking de visitas, soporte prioritario y acceso anticipado a nuevas funciones. Además, tenemos una oferta fundadora de 12 meses gratis + 50% de descuento permanente.'
    },
    {
      question: '¿Cómo me contacto con los propietarios?',
      answer: 'Una vez registrado, podés usar nuestro sistema de mensajería interna para contactar directamente con propietarios, inmobiliarias o roommates. Todo es privado, seguro y sin intermediarios. No compartimos tu información de contacto hasta que vos decidas hacerlo.'
    },
    {
      question: '¿En qué ciudades de Misiones están disponibles?',
      answer: 'Estamos en toda la provincia de Misiones: Posadas, Oberá, Eldorado, Puerto Iguazú, Apóstoles, Leandro N. Alem, Jardín América, San Vicente, Aristóbulo del Valle, Montecarlo y todas las demás localidades. Podés buscar por cualquier ciudad o barrio específico.'
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-all"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
