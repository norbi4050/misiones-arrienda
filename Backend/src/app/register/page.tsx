"use client";
import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { User, Building2, Search } from "lucide-react";
import { ProfileImageUpload } from "@/components/ui/image-upload";
import { ConsentCheckbox } from "@/components/ui/ConsentCheckbox";
import { logConsent, CURRENT_POLICY_VERSION } from "@/lib/consent/logConsent";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "inquilino" as "inquilino" | "dueno_directo" | "inmobiliaria",
    companyName: "",
    licenseNumber: "",
    profileImage: ""
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estado para consentimiento
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  
  const { register, isAuthenticated, isLoading } = useSupabaseAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setConsentError(null);
    setLoading(true);

    try {
      // Validar consentimiento
      if (!checkedTerms || !checkedPrivacy) {
        setConsentError("Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar");
        setLoading(false);
        return;
      }

      // Validar que las contraseñas coincidan
      if (formData.password !== formData.confirmPassword) {
        setMsg("Error: Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      // Validar longitud mínima de contraseña
      if (formData.password.length < 6) {
        setMsg("Error: La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      // Preparar los metadatos del usuario
      const userData = {
        name: formData.name,
        userType: formData.userType,
        profileImage: formData.profileImage,
        ...(formData.userType === 'inmobiliaria' && {
          companyName: formData.companyName,
          licenseNumber: formData.licenseNumber
        })
      };

      const result = await register(formData.email, formData.password, userData);
      
      if (result.success) {
        setMsg("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.");
      } else {
        setMsg(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case 'inmobiliaria':
        return { 
          icon: Building2, 
          title: "Inmobiliaria", 
          description: "Gestiona múltiples propiedades",
          color: "border-purple-500 bg-purple-50"
        };
      case 'dueno_directo':
        return { 
          icon: User, 
          title: "Dueño Directo", 
          description: "Alquila tu propia propiedad",
          color: "border-green-500 bg-green-50"
        };
      case 'inquilino':
      default:
        return { 
          icon: Search, 
          title: "Inquilino", 
          description: "Busca tu hogar ideal",
          color: "border-blue-500 bg-blue-50"
        };
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Únete a Misiones Arrienda
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foto de perfil (opcional)
            </label>
            <ProfileImageUpload
              value={formData.profileImage}
              onChange={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
              disabled={loading}
              className="mb-4"
            />
          </div>

          {/* Selector de tipo de usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Qué tipo de usuario eres?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(['inquilino', 'dueno_directo', 'inmobiliaria'] as const).map((type) => {
                const info = getUserTypeInfo(type);
                const Icon = info.icon;
                return (
                  <label
                    key={type}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.userType === type
                        ? info.color
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type}
                      checked={formData.userType === type}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-3 ${
                        formData.userType === type 
                          ? type === 'inmobiliaria' ? 'text-purple-600' : 
                            type === 'dueno_directo' ? 'text-green-600' : 'text-blue-600'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {info.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {info.description}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Campos básicos */}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                type="text"
                name="name"
                required
                placeholder="Nombre completo"
                value={formData.name}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          {/* Campos adicionales para inmobiliaria */}
          {formData.userType === 'inmobiliaria' && (
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="Nombre de la inmobiliaria"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="licenseNumber"
                  placeholder="Número de matrícula (opcional)"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* Consentimiento legal */}
          <ConsentCheckbox
            checkedTerms={checkedTerms}
            checkedPrivacy={checkedPrivacy}
            onChangeTerms={setCheckedTerms}
            onChangePrivacy={setCheckedPrivacy}
            error={consentError}
            className="mt-6"
          />

          <div>
            <button
              type="submit"
              disabled={loading || !checkedTerms || !checkedPrivacy}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>

          {msg && (
            <div className={`mt-4 p-4 rounded-md ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm">{msg}</p>
            </div>
          )}

          <div className="text-center">
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
