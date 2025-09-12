"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProfileForm } from "@/components/ui/profile-form";
import { QuickActionsGrid } from "@/components/ui/quick-actions-grid";
import { ProfileStatsImproved } from "@/components/ui/profile-stats-improved";
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
  Heart,
  Camera,
  Save,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function InquilinoProfilePageFixed() {
  const { user, loading, session, isAuthenticated, error, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      const newProfileData = {
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
        profile_image: user.profile_image || '',
        verified: (user as any).verified || false,
        rating: (user as any).rating || 0,
        reviewCount: (user as any).reviewCount || 0,
      };
      
      setProfileData(newProfileData);
    }
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Acceso</h2>
            <p className="text-gray-600 mb-4">
              {error || "No tienes permisos para acceder a esta página"}
            </p>
            <Link href="/auth/login">
              <Button>Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = async (data: Partial<ProfileData>) => {
    try {
      setIsSaving(true);
      await updateProfile(data);
      setProfileData(prev => ({ ...prev, ...data }));
      setHasUnsavedChanges(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    try {
      await handleSaveProfile({ profile_image: url });
      setProfileData(prev => ({ ...prev, profile_image: url }));
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error('Error al actualizar la foto de perfil');
    }
  };

  const handleDataChange = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
    setHasUnsavedChanges(true);
  };

  const calculateProfileCompletion = () => {
    const requiredFields = ['name', 'email', 'phone', 'location', 'bio', 'search_type', 'budget_range'];
    const filledFields = requiredFields.filter(field => {
      const value = profileData[field as keyof ProfileData];
      return value && value.toString().trim() !== '';
    });
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600 mt-1">Gestiona tu información personal y preferencias</p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Cambios sin guardar</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Alert */}
        {completionPercentage < 80 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{completionPercentage}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Completa tu perfil</h3>
                  <p className="text-sm text-blue-700">
                    Un perfil completo te ayuda a encontrar mejores propiedades y genera más confianza.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Completar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <ProfileAvatar
                          src={profileData.profile_image}
                          name={profileData.name}
                          size="lg"
                          userId={user?.id || ''}
                          onImageChange={handleAvatarChange}
                          showUpload={true}
                        />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {profileData.name || 'Usuario'}
                      </h2>
                      <p className="text-gray-600 text-sm mb-2">{profileData.email}</p>
                      {profileData.location && (
                        <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{profileData.location}</span>
                        </div>
                      )}
                      
                      {/* Verification Badge */}
                      <div className="flex justify-center mb-4">
                        <Badge 
                          variant={profileData.verified ? "default" : "secondary"}
                          className="text-xs"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {profileData.verified ? 'Verificado' : 'Sin verificar'}
                        </Badge>
                      </div>

                      {/* Profile Completion */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Perfil completo</span>
                          <span>{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {profileData.bio && (
                        <p className="text-gray-600 text-sm">{profileData.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats and Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Statistics */}
                <ProfileStatsImproved 
                  stats={{
                    profileViews: undefined, // Will be loaded by hook
                    favoriteCount: undefined, // Will be loaded by hook
                    messageCount: undefined, // Will be loaded by hook
                    rating: profileData.rating || 0,
                    reviewCount: profileData.reviewCount || 0,
                    joinDate: user?.created_at,
                    responseRate: undefined, // Will be loaded by hook
                    verificationLevel: profileData.verified ? 'email' : 'none'
                  }}
                />

                {/* Quick Actions */}
                <QuickActionsGrid />
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
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
                  <p className="text-gray-500">
                    Aquí podrás ver tu historial detallado de actividad, búsquedas, 
                    mensajes y interacciones con propiedades.
                  </p>
                </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Nuevas propiedades</p>
                        <p className="text-sm text-gray-500">Recibe alertas de propiedades que coincidan con tus criterios</p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mensajes</p>
                        <p className="text-sm text-gray-500">Notificaciones de nuevos mensajes</p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Perfil público</p>
                        <p className="text-sm text-gray-500">Permite que otros usuarios vean tu perfil</p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mostrar teléfono</p>
                        <p className="text-sm text-gray-500">Permite que propietarios vean tu número</p>
                      </div>
                      <input type="checkbox" className="toggle" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
