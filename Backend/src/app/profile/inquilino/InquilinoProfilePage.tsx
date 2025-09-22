"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProfileAvatar from "@/components/ui/profile-avatar";
import { ProfileForm } from "@/components/ui/profile-form";
import { QuickActionsGrid } from "@/components/ui/quick-actions-grid";
import { ProfileStatsImproved as ProfileStats } from "@/components/ui/profile-stats-improved";
import { RecentActivity } from "@/components/ui/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Info,
  Shield,
  HelpCircle,
  ChevronRight,
  MapPin,
  Calendar,
  Home,
  Users,
  Heart,
  Phone
} from "lucide-react";
import { cn } from "@/utils";
import toast from "react-hot-toast";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  profile_image?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  // Campos del formulario
  firstName?: string;
  lastName?: string;
}

export default function InquilinoProfilePage() {
  const router = useRouter();
  const { user, loading, session, isAuthenticated, error, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del perfil desde API (SSoT)
  useEffect(() => {
    const loadProfileFromAPI = async () => {
      if (!user || !isAuthenticated) return;

      try {
        console.log('🔄 Cargando perfil desde API para user.id:', user.id);
        
        const response = await fetch('/api/users/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store' // Anti-caché
        });

        if (!response.ok) {
          console.error('❌ Error al cargar perfil:', response.status);
          return;
        }

        const result = await response.json();
        console.log('✅ Perfil cargado desde API:', result.profile);
        
        setProfileData({
          name: result.profile.name || '',
          email: result.profile.email || user.email || '',
          phone: result.profile.phone || '',
          bio: result.profile.bio || '',
          profile_image: result.profile.avatar || '',
          verified: result.profile.verified || false,
          rating: 0, // Estos vienen de otros endpoints
          reviewCount: 0
        });

      } catch (error) {
        console.error('❌ Error loading profile from API:', error);
        // Fallback a datos de auth si falla el API
        setProfileData({
          name: (user as any).name || '',
          email: user.email || '',
          phone: (user as any).phone || '',
          bio: (user as any).bio || '',
          profile_image: (user as any).avatar || '',
          verified: (user as any).verified || false,
          rating: 0,
          reviewCount: 0
        });
      }
    };

    loadProfileFromAPI();
  }, [user, isAuthenticated]);
  // Debug logging for authentication state
  useEffect(() => {
    }, [loading, isAuthenticated, user, session, error]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a permission error
  if (error && error.includes('Permission denied')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2 text-red-800">Error de Permisos</h1>
          <p className="text-red-600 mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="destructive"
            >
              Reintentar
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !session || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Accedé a tu Perfil</h1>
          <p className="text-gray-600 mb-6">
            Iniciá sesión para ver y editar tu perfil de inquilino.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error de Autenticación
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Iniciar sesión nuevamente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (data: any) => {
    setIsSubmitting(true);
    try {
      console.log('📝 Datos recibidos del formulario:', data);
      
      // Mapear campos del formulario a la estructura de BD
      const mappedData = {
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        phone: data.phone || '',
        bio: data.bio || ''
        // Email no se incluye porque es solo lectura
      };
      
      console.log('🔄 Datos mapeados para BD:', mappedData);

      // Hacer PATCH request al API
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al actualizar perfil');
      }

      const result = await response.json();
      console.log('✅ Respuesta del servidor:', result);
      
      // Actualizar estado local con los datos del servidor
      setProfileData(prev => ({
        ...prev,
        name: result.profile.name,
        phone: result.profile.phone,
        bio: result.profile.bio,
        profile_image: result.profile.avatar || prev.profile_image
      }));

      // Mostrar mensaje de éxito
      toast.success('✅ Perfil actualizado correctamente');
      
      // Refrescar la página para sincronizar todos los componentes
      router.refresh();

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      toast.error(`❌ ${error instanceof Error ? error.message : 'Error al guardar el perfil'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    try {
      // Actualizar el estado local inmediatamente
      setProfileData(prev => ({ ...prev, profile_image: url }));

      // Actualizar el perfil en la base de datos usando el hook
      await updateProfile({ profile_image: url });

      // Mostrar mensaje de éxito
      toast.success('Avatar actualizado correctamente');
    } catch (error) {
      console.error('Error updating avatar in profile:', error);
      toast.error('Error al guardar el avatar en el perfil');

      // Revertir el cambio local si falla la actualización
      setProfileData(prev => ({ ...prev, profile_image: profileData.profile_image }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                {/* Avatar */}
                <div className="relative">
                  <ProfileAvatar
                    src={profileData.profile_image}
                    name={profileData.name}
                    userId={user.id}
                    size="xl"
                    className="ring-4 ring-white shadow-xl"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1 md:mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profileData.name || 'Usuario'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        {profileData.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{profileData.phone}</span>
                          </div>
                        )}
                      </div>
                      {profileData.bio && (
                        <p className="text-black mt-3 max-w-2xl line-clamp-3 break-words overflow-hidden font-semibold">
                          {profileData.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {profileData.verified && (
                          <Badge className="bg-green-100 text-green-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          Inquilino
                        </Badge>
                      </div>
                      {profileData.rating && profileData.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                          <span className="text-sm font-medium">
                            {profileData.rating.toFixed(1)} ({profileData.reviewCount} reseñas)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <QuickActionsGrid userId={user.id} />

                {/* Recent Activity - Now using real data */}
                <RecentActivity maxItems={5} />
              </div>

              <div className="space-y-6">
                <ProfileStats
                  stats={{
                    profileViews: undefined, // Will be loaded by useUserStats hook
                    favoriteCount: undefined, // Will be loaded by useUserFavorites hook
                    messageCount: undefined, // Will be loaded by useUserStats hook
                    rating: profileData.rating || 0,
                    reviewCount: profileData.reviewCount || 0,
                    joinDate: user.created_at,
                    responseRate: undefined, // Will be loaded by useUserStats hook
                    verificationLevel: profileData.verified ? 'email' : 'none'
                  }}
                  showRefresh={true}
                />
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileForm
              initialData={profileData}
              onSubmit={handleSaveProfile}
              isSubmitting={isSubmitting}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Próximamente: Historial detallado de tu actividad
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Notificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Configuración de notificaciones próximamente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacidad y Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Configuración de privacidad próximamente
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
