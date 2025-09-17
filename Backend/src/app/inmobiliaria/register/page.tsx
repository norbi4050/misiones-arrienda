"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Mail, Phone, MapPin, Globe, FileText, Star, Users, Zap } from "lucide-react"
import Link from "next/link"

export default function InmobiliariaRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    website: "",
    description: "",
    license: "",
    planType: "PROFESSIONAL"
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

    alert("¡Registro exitoso! Te contactaremos pronto para verificar tu inmobiliaria.")
    setIsSubmitting(false)
  }

  const plans = [
    {
      id: "PROFESSIONAL",
      name: "Profesional",
      price: "$25.000",
      period: "/mes",
      features: [
        "Hasta 50 propiedades",
        "Perfil destacado",
        "3 agentes incluidos",
        "Estadísticas básicas",
        "Soporte por email"
      ],
      popular: true
    },
    {
      id: "ENTERPRISE",
      name: "Empresarial",
      price: "$45.000",
      period: "/mes",
      features: [
        "Propiedades ilimitadas",
        "Perfil premium",
        "Agentes ilimitados",
        "Estadísticas avanzadas",
        "Soporte prioritario",
        "API personalizada"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Registra tu Inmobiliaria
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Únete a la plataforma inmobiliaria líder de Misiones y lleva tu negocio al siguiente nivel
          </p>
        </div>

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Más Clientes</h3>
            <p className="text-gray-600">Accede a miles de usuarios buscando propiedades en Misiones</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gestión Eficiente</h3>
            <p className="text-gray-600">Herramientas avanzadas para gestionar propiedades y consultas</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reputación</h3>
            <p className="text-gray-600">Construye tu reputación con reviews y calificaciones</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Información de la Inmobiliaria</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Inmobiliaria *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Inmobiliaria Misiones Premium"
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contacto@inmobiliaria.com"
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
                    Dirección de la Oficina *
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      Sitio Web
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="www.inmobiliaria.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula/Licencia *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      name="license"
                      value={formData.license}
                      onChange={handleInputChange}
                      placeholder="CUCICBA-12345"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Cuéntanos sobre tu inmobiliaria, experiencia, especialidades..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Procesando..." : "Registrar Inmobiliaria"}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  ¿Ya tienes cuenta? {" "}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </form>
            </div>

            {/* Planes */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Elige tu Plan</h2>
              <div className="space-y-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.planType === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, planType: plan.id }))}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-6">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Más Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                          <span className="text-gray-600 ml-1">{plan.period}</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        formData.planType === plan.id
                          ? 'border-blue-500 bg-blue-500'
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

              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🎉 Oferta de Lanzamiento</h3>
                <p className="text-yellow-700 text-sm">
                  <strong>50% de descuento</strong> en tu primer mes. Además, configuración gratuita
                  y migración de tus propiedades existentes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
