"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ProfileAvatar from "@/components/ui/profile-avatar-enhanced";
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
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Heart
} from "lucide-react";
import { cn } from "@/utils";
import toast from "react-hot-toast";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  search_type: string;
  budget_range: string;
  preferred_areas: string;
  family_size: number | null;
  pet_friendly: boolean;
  move_in_date: string;
  employment_status: string;
  monthly_income: number | null;
  profile_image?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
}

export default function InquilinoProfilePage() {
  const { user, loading, session, isAuthenticated, error, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: (user as any).location || '',
        bio: user.bio || '',
        search_type: (user as any).search_type || '',
        budget_range: (user as any).budget_range || '',
        preferred_areas: (user as any).preferred_areas || '',
        family_size: (user as any).family_size || null,
        pet_friendly: (user as any).pet_friendly || false,
        move_in_date: (user as any).move_in_date || '',
        employment_status: (user as any).employment_status || '',
        monthly_income: (user as any).monthly_income || null,
        profile_image: user.avatar || '',
        verified: (user as any).verified || false,
        rating: (user as any).rating || 0,
        reviewCount: (user as any).reviewCount || 0
      });
    }
  }, [user]);
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

  const handleSaveProfile = async (data: Partial<ProfileData>) => {
    try {
      await updateProfile(data);
      setProfileData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
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
                    onUploadComplete={handleAvatarChange}
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
                        {profileData.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{profileData.location}</span>
                          </div>
                        )}
                        {profileData.employment_status && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span className="capitalize">{profileData.employment_status}</span>
                          </div>
                        )}
                        {profileData.family_size && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{profileData.family_size} personas</span>
                          </div>
                        )}
                      </div>
                      {profileData.bio && (
                        <p className="text-gray-700 mt-3 max-w-2xl">
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
              onSave={handleSaveProfile}
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
                    <Bell className="w-5 h-5" />
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
