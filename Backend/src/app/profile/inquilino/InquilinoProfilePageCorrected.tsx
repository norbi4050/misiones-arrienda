"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
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
  const { user, profile, loading, isAuthenticated, error, updateProfile, updateAvatar } = useUser();
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Debug logging - remover después de arreglar
  useEffect(() => {
    }, [user, profile, loading, isAuthenticated, error]);

  // Update profile data when user or profile changes
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        search_type: profile.search_type || '',
        budget_range: profile.budget_range || '',
        preferred_areas: profile.preferred_areas || '',
        family_size: profile.family_size || null,
        pet_friendly: profile.pet_friendly || false,
        move_in_date: profile.move_in_date || '',
        employment_status: profile.employment_status || '',
        monthly_income: profile.monthly_income || null,
        profile_image: profile.profile_image || '',
        verified: profile.verified || false,
        rating: profile.rating || 0,
        reviewCount: 0 // Este campo se puede obtener de otra API
      });
    } else if (user) {
      // Fallback a datos básicos del usuario si no hay perfil
      setProfileData({
        name: user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: '',
        location: '',
        bio: '',
        search_type: '',
        budget_range: '',
        preferred_areas: '',
        family_size: null,
        pet_friendly: false,
        move_in_date: '',
        employment_status: '',
        monthly_income: null,
        profile_image: '',
        verified: false,
        rating: 0,
        reviewCount: 0
      });
    }
  }, [user, profile]);

  const handleSaveProfile = async (data: Partial<ProfileData>) => {
    try {
      await updateProfile(data);
      setProfileData(prev => ({ ...prev, ...data }));
      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Error al actualizar el perfil");
    }
  };

  const handleAvatarChange = async (imageUrl: string) => {
    try {
      await updateAvatar(imageUrl);
      setProfileData(prev => ({ ...prev, profile_image: imageUrl }));
      toast.success("Avatar actualizado correctamente");
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || "Error al actualizar el avatar");
    }
  };

  // Mostrar loading mientras se carga la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si hay error de autenticación, mostrar mensaje de error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Error de Autenticación
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {error}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full">
                Iniciar sesión nuevamente
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay usuario autenticado después de cargar, mostrar mensaje de login
  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Accedé a tu Perfil
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Iniciá sesión para ver y editar tu perfil de inquilino.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Crear cuenta
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar el perfil del usuario autenticado
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del perfil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <ProfileAvatar
                  src={profileData.profile_image}
                  name={profileData.name || 'Usuario'}
                  userId={user.id}
                  size="xl"
                  showUpload={true}
                  onImageChange={handleAvatarChange}
                />
              </div>

              {/* Información del usuario */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {profileData.name || 'Sin nombre'}
                  </h1>
                  {profileData.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verificado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {profileData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                  {user.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Miembro desde {new Date(user.created_at).getFullYear()}</span>
                    </div>
                  )}
                  {profileData.employment_status && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{profileData.employment_status}</span>
                    </div>
                  )}
                </div>

                {profileData.bio && (
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {profileData.bio}
                  </p>
                )}

                {/* Acciones rápidas */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("profile")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs del perfil */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Acciones rápidas */}
                <QuickActionsGrid />

                {/* Actividad reciente */}
                <RecentActivity
                  userId={user.id}
                  limit={5}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Estadísticas del perfil */}
                <ProfileStats
                  userId={user.id}
                  userData={{
                    name: profileData.name || '',
                    email: profileData.email || '',
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
