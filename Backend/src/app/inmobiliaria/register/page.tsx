"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Mail, Phone, MapPin, Globe, FileText, Star, Users, Zap, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function InmobiliariaRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",              // Nombre de contacto
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    companyName: "",       // Nombre de la empresa
    address: "",
    city: "",
    website: "",
    description: "",
    license: "",
    acceptTerms: false,
    planType: "PROFESSIONAL"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validaciones de campos obligatorios
    if (!formData.name.trim()) {
      newErrors.name = "El nombre de contacto es obligatorio"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de email inválido"
    }
    
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Debe confirmar la contraseña"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "El nombre de la empresa es obligatorio"
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debe aceptar los términos y condiciones"
    }
    
    setErrors(newErrors)
    
    // Scroll al primer error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]')
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      console.log('[INMOBILIARIA REGISTER] Enviando datos al backend...')
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          userType: 'inmobiliaria',
          companyName: formData.companyName,
          licenseNumber: formData.license || undefined,
          acceptTerms: formData.acceptTerms
        })
      })
      
      const data = await response.json()
      
      console.log('[INMOBILIARIA REGISTER] Respuesta del servidor:', data)
      
      if (!response.ok) {
        // Manejar errores de validación del backend
        if (data.error === 'VALIDATION_ERROR' && data.issues) {
          const validationErrors: Record<string, string> = {}
          data.issues.forEach((issue: any) => {
            validationErrors[issue.path] = issue.message
          })
          setErrors(validationErrors)
          toast.error('Por favor corrige los errores en el formulario')
          
          // Scroll al primer error
          setTimeout(() => {
            const firstError = document.querySelector('[data-error="true"]')
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        } else {
          // Otros errores
          setErrors({ general: data.details || data.error || 'Error en el registro' })
          toast.error(data.details || data.error || 'Error en el registro')
        }
        setIsSubmitting(false)
        return
      }
      
      // Éxito - usar nextRoute del backend
      console.log('[INMOBILIARIA REGISTER] Registro exitoso, redirigiendo a:', data.nextRoute)
      toast.success('¡Registro exitoso! Redirigiendo a tu panel de empresa...')
      
      setTimeout(() => {
        window.location.href = data.nextRoute || '/mi-empresa'
      }, 1500)
      
    } catch (error) {
      console.error('[INMOBILIARIA REGISTER] Error:', error)
      setErrors({ general: 'Error de conexión. Por favor intenta nuevamente.' })
      toast.error('Error de conexión. Por favor intenta nuevamente.')
      setIsSubmitting(false)
    }
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
              
              {/* Error General */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre de Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Contacto *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan Pérez"
                    required
                    className={errors.name ? 'border-red-500' : ''}
                    data-error={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Nombre de la Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Inmobiliaria *
                  </label>
                  <Input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Ej: Inmobiliaria Misiones Premium"
                    required
                    className={errors.companyName ? 'border-red-500' : ''}
                    data-error={!!errors.companyName}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
                  )}
                </div>

                {/* Email y Teléfono */}
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
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        data-error={!!errors.email}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
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
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        data-error={!!errors.phone}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Contraseñas */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 6 caracteres"
                        className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                        data-error={!!errors.password}
                        required
                        minLength={6}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repetir contraseña"
                        className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        data-error={!!errors.confirmPassword}
                        required
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Dirección y Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección de la Oficina
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Av. Corrientes 1234, Posadas"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                {/* Matrícula/Licencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula/Licencia
                    <span className="ml-2 text-sm text-gray-500">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      name="license"
                      value={formData.license}
                      onChange={handleInputChange}
                      placeholder="CUCICBA-12345"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Descripción */}
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

                {/* Términos y Condiciones */}
                <div className={`p-4 border rounded-md ${errors.acceptTerms ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`} data-error={!!errors.acceptTerms}>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      required
                    />
                    <label className="text-sm text-gray-700 flex-1">
                      Acepto los{" "}
                      <Link 
                        href="/legal/terms" 
                        className="text-blue-600 hover:underline font-medium" 
                        target="_blank"
                      >
                        términos y condiciones
                      </Link>
                      {" "}y la{" "}
                      <Link 
                        href="/legal/privacy" 
                        className="text-blue-600 hover:underline font-medium" 
                        target="_blank"
                      >
                        política de privacidad
                      </Link>
                      {" "}*
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-600 mt-2 ml-7">{errors.acceptTerms}</p>
                  )}
                </div>

                {/* Botón de Submit */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    "Registrar Inmobiliaria"
                  )}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  ¿Ya tienes cuenta? {" "}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
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
