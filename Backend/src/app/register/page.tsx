"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, User, Mail, Phone, Lock, Loader2, CheckCircle, Building, Home, UserCheck } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "", // "inquilino", "dueno_directo", "inmobiliaria"
    // Campos adicionales para inmobiliarias
    companyName: "",
    licenseNumber: "",
    // Campos adicionales para dueños directos
    propertyCount: ""
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value,
      // Limpiar campos específicos cuando cambia el tipo
      companyName: "",
      licenseNumber: "",
      propertyCount: ""
    })
  }

  const validateForm = () => {
    // Validación de nombre
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido")
      return false
    }
    if (formData.name.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres")
      return false
    }

    // Validación de email
    if (!formData.email) {
      toast.error("El email es requerido")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor ingresa un email válido")
      return false
    }

    // Validación de teléfono
    if (!formData.phone) {
      toast.error("El teléfono es requerido")
      return false
    }
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Por favor ingresa un teléfono válido")
      return false
    }

    // Validación de tipo de usuario
    if (!formData.userType) {
      toast.error("Debes seleccionar el tipo de usuario")
      return false
    }

    // Validaciones específicas por tipo de usuario
    if (formData.userType === "inmobiliaria") {
      if (!formData.companyName.trim()) {
        toast.error("El nombre de la empresa es requerido")
        return false
      }
      if (!formData.licenseNumber.trim()) {
        toast.error("El número de matrícula es requerido")
        return false
      }
    }

    if (formData.userType === "dueno_directo") {
      if (!formData.propertyCount) {
        toast.error("Debes indicar cuántas propiedades tienes")
        return false
      }
    }

    // Validación de contraseña
    if (!formData.password) {
      toast.error("La contraseña es requerida")
      return false
    }
    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      toast.error("La contraseña debe tener al menos una mayúscula y una minúscula")
      return false
    }

    // Validación de confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return false
    }

    // Validación de términos
    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      toast.loading("Creando tu cuenta...")
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: formData.userType,
          // Campos adicionales según el tipo
          ...(formData.userType === "inmobiliaria" && {
            companyName: formData.companyName,
            licenseNumber: formData.licenseNumber
          }),
          ...(formData.userType === "dueno_directo" && {
            propertyCount: parseInt(formData.propertyCount)
          })
        })
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || "Error al crear la cuenta")
        return
      }

      toast.success("¡Cuenta creada exitosamente! 🎉")
      
      if (data.emailSent) {
        toast("📧 Revisa tu email para verificar tu cuenta", { 
          duration: 5000,
          icon: "📧" 
        })
      }
      
      // Redirigir al login
      setTimeout(() => {
        toast("Redirigiendo al login...", { icon: "🚀" })
        setTimeout(() => {
          window.location.href = "/login?registered=true"
        }, 1000)
      }, 2000)

    } catch (error) {
      toast.dismiss()
      toast.error("Error al crear la cuenta. Intenta nuevamente.")
      console.error('Error en registro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return { strength: 0, text: "", color: "" }
    
    let strength = 0
    if (password.length >= 6) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const levels = [
      { text: "Muy débil", color: "bg-red-500" },
      { text: "Débil", color: "bg-orange-500" },
      { text: "Regular", color: "bg-yellow-500" },
      { text: "Buena", color: "bg-blue-500" },
      { text: "Excelente", color: "bg-green-500" }
    ]

    return { strength, ...levels[Math.min(strength, 4)] }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a Misiones Arrienda y encuentra tu propiedad ideal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 transition-all duration-300 hover:shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Tipo de Usuario */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cómo vas a usar Misiones Arrienda?
              </label>
              <Select onValueChange={handleUserTypeChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu tipo de usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquilino">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Inquilino / Comprador</div>
                        <div className="text-xs text-gray-500">Busco propiedades para alquilar o comprar</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="dueno_directo">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Dueño Directo</div>
                        <div className="text-xs text-gray-500">Tengo propiedades para alquilar o vender</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="inmobiliaria">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Inmobiliaria</div>
                        <div className="text-xs text-gray-500">Represento una empresa inmobiliaria</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {formData.userType === "inmobiliaria" ? "Nombre del responsable" : "Nombre completo"}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campos específicos para Inmobiliaria */}
            {formData.userType === "inmobiliaria" && (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Nombre de la Inmobiliaria
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Inmobiliaria San Martín"
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    Número de Matrícula
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="MAT-12345"
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos para Dueño Directo */}
            {formData.userType === "dueno_directo" && (
              <div>
                <label htmlFor="propertyCount" className="block text-sm font-medium text-gray-700">
                  ¿Cuántas propiedades tienes para publicar?
                </label>
                <div className="mt-1">
                  <Select onValueChange={(value) => setFormData({...formData, propertyCount: value})} disabled={isLoading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona la cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 propiedad</SelectItem>
                      <SelectItem value="2-3">2-3 propiedades</SelectItem>
                      <SelectItem value="4-5">4-5 propiedades</SelectItem>
                      <SelectItem value="6+">Más de 6 propiedades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan@email.com"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+54 376 123-4567"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Indicador de fortaleza de contraseña */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{passwordStrength.text}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {/* Indicador de coincidencia de contraseñas */}
                {formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-10 flex items-center">
                    {formData.password === formData.confirmPassword ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Acepto los{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 transition-colors underline"
                >
                  términos y condiciones
                </Link>
                {" "}y la{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 transition-colors underline"
                >
                  política de privacidad
                </Link>
              </label>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Ya tienes cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="w-full transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
