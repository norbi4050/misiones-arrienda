"use client";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useSupabaseAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    companyName: "",
    licenseNumber: ""
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Inicializar datos de edición cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        companyName: user.companyName || "",
        licenseNumber: user.licenseNumber || ""
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setUpdateMessage(null);
    if (user) {
      setEditData({
        name: user.name || "",
        companyName: user.companyName || "",
        licenseNumber: user.licenseNumber || ""
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setUpdateLoading(true);
    setUpdateMessage(null);

    try {
      // Actualizar metadatos del usuario en Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: editData.name,
          userType: user.userType,
          ...(user.userType === 'inmobiliaria' && {
            companyName: editData.companyName,
            licenseNumber: editData.licenseNumber
          })
        }
      });

      if (error) throw error;

      setUpdateMessage("✅ Perfil actualizado correctamente");
      setIsEditing(false);
      
      // Recargar la página para mostrar los datos actualizados
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

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

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ¡Bienvenido, {user.name}!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Has iniciado sesión correctamente. Tu sesión se mantiene activa entre pestañas.</p>
                  </div>
                </div>
              </div>
            </div>

            {updateMessage && (
              <div className={`mb-6 p-4 rounded-md ${updateMessage.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <p className="text-sm">{updateMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Mi Perfil</h2>
                  <button
                    onClick={handleEditToggle}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      isEditing 
                        ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{user.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Email:</label>
                    <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de usuario:</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">
                      {user.userType === 'dueno_directo' ? 'Dueño Directo' : 
                       user.userType === 'inmobiliaria' ? 'Inmobiliaria' : 
                       user.userType || 'Inquilino'}
                    </p>
                  </div>

                  {user.userType === 'inmobiliaria' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Empresa:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="companyName"
                            value={editData.companyName}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">{user.companyName || 'No especificado'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Matrícula:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="licenseNumber"
                            value={editData.licenseNumber}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">{user.licenseNumber || 'No especificado'}</p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">ID:</label>
                    <p className="text-sm text-gray-900 font-mono text-xs mt-1">{user.id}</p>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6">
                    <button
                      onClick={handleSave}
                      disabled={updateLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      {updateLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Disponibles</h2>
                <div className="space-y-3">
                  <a
                    href="/"
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Ir al inicio
                  </a>
                  <a
                    href="/properties"
                    className="block w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Ver propiedades
                  </a>
                  <a
                    href="/publicar"
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Publicar propiedad
                  </a>
                  <a
                    href={`/profile/${user.userType || 'inquilino'}`}
                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Mi perfil
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Sistema de Autenticación Mejorado
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      ✅ Sesión persistente entre pestañas<br/>
                      ✅ Redirecciones automáticas<br/>
                      ✅ Estado de autenticación sincronizado<br/>
                      ✅ Perfil editable con actualización en tiempo real<br/>
                      ✅ Logout seguro con limpieza de sesión
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
