"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Mail, Phone, MapPin, User, Heart, Shield, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function DuenoDirectoRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    propertyType: "habitacion",
    description: "",
    planType: "BASICO"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 2000))

    alert("¡Registro exitoso! Te contactaremos pronto para activar tu cuenta de dueño directo.")
    setIsSubmitting(false)
  }

  const propertyTypes = [
    { id: "habitacion", name: "🛏️ Habitación en mi casa", desc: "Alquilo una habitación en mi hogar" },
    { id: "estudio", name: "🏢 Estudio/Monoambiente", desc: "Tengo un espacio independiente" },
    { id: "cochera", name: "🚗 Cochera/Garage", desc: "Espacio para estacionar" },
    { id: "oficina", name: "💼 Espacio de trabajo", desc: "Home office o coworking" },
    { id: "quinta", name: "🏕️ Quinta/Cabaña", desc: "Para fines de semana o vacaciones" },
    { id: "deposito", name: "📦 Depósito", desc: "Espacio de almacenamiento" }
  ]

  const plans = [
    {
      id: "BASICO",
      name: "Básico",
      price: "$2.000",
      period: "/mes",
      features: [
        "1-2 espacios",
        "Publicación básica",
        "Gestión de consultas",
        "Soporte por email"
      ],
      popular: false
    },
    {
      id: "FAMILIAR",
      name: "Familiar",
      price: "$5.000",
      period: "/mes",
      features: [
        "3-5 espacios",
        "Publicación destacada",
        "Calendario de disponibilidad",
        "Estadísticas básicas",
        "Soporte prioritario"
      ],
      popular: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-600 rounded-full">
              <Home className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dueño Directo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Alquila tu habitación, estudio o espacio directamente sin intermediarios.
            <strong> Es 100% legal en Argentina</strong> 🇦🇷
          </p>
        </div>

        {/* Legalidad */}
        <div className="max-w-4xl mx-auto mb-12 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">✅ Completamente Legal</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <strong>Marco Legal:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Código Civil y Comercial Argentino</li>
                <li>• Contratos de locación entre particulares</li>
                <li>• No requiere matrícula inmobiliaria</li>
              </ul>
            </div>
            <div>
              <strong>Obligaciones Simples:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Declarar ingresos (Monotributo)</li>
                <li>• Contrato simple (te ayudamos)</li>
                <li>• Condiciones habitables</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Intermediarios</h3>
            <p className="text-gray-600">Trato directo con inquilinos, sin comisiones extras</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingresos Extra</h3>
            <p className="text-gray-600">Monetiza espacios que no usas en tu propiedad</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Confianza</h3>
            <p className="text-gray-600">Sistema de perfiles verificados y calificaciones</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Registra tu Espacio</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ej: María González"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+54 376 123-4567"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección de tu Propiedad *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Av. Corrientes 1234, Posadas"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar ciudad</option>
                    <option value="Posadas">Posadas</option>
                    <option value="Oberá">Oberá</option>
                    <option value="Eldorado">Eldorado</option>
                    <option value="Puerto Iguazú">Puerto Iguazú</option>
                    <option value="Apóstoles">Apóstoles</option>
                    <option value="Leandro N. Alem">Leandro N. Alem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Qué tipo de espacio ofreces? *
                  </label>
                  <div className="grid gap-3">
                    {propertyTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.propertyType === type.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="propertyType"
                          value={type.id}
                          checked={formData.propertyType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-600">{type.desc}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.propertyType === type.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.propertyType === type.id && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe tu espacio
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Ej: Habitación amplia con baño privado, muy luminosa, en zona tranquila..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : "Registrar mi Espacio"}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  ¿Ya tienes cuenta? {" "}
                  <Link href="/login" className="text-green-600 hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </form>
            </div>

            {/* Planes */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Planes para Dueños Directos</h2>
              <div className="space-y-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.planType === plan.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, planType: plan.id }))}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-6">
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Más Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-green-600">{plan.price}</span>
                          <span className="text-gray-600 ml-1">{plan.period}</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        formData.planType === plan.id
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.planType === plan.id && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💡 ¿Sabías que...?</h3>
                <p className="text-blue-700 text-sm">
                  En Misiones, una habitación se alquila entre $15.000-$30.000/mes.
                  Con nuestro plan básico de $2.000/mes, recuperas la inversión con solo 4 días de alquiler.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
