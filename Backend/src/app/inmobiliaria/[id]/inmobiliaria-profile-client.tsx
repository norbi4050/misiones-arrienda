'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Facebook, 
  Instagram, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgencyShareBar } from '@/components/share';
import { analytics } from '@/lib/analytics/track';
import AgencyStats from '@/components/inmobiliarias/AgencyStats';
import BusinessHours from '@/components/inmobiliarias/BusinessHours';
import TeamMemberCard from '@/components/inmobiliarias/TeamMemberCard';
import AgencyLocationMap from '@/components/inmobiliarias/AgencyLocationMap';
import { parseBusinessHours } from '@/types/inmobiliaria';

// Tipos
interface InmobiliariaProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  verified: boolean;
  phone: string | null;
  commercial_phone: string | null;
  address: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  description: string | null;
  business_hours: any | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  show_phone_public: boolean;
  show_address_public: boolean;
  show_team_public: boolean;
  show_hours_public: boolean;
  show_map_public: boolean;
  show_stats_public: boolean;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  operation_type: string;
  cover_url: string | null;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface TeamMember {
  id: string;
  agency_id: string;
  name: string;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgencyStats {
  total_properties: number;
  active_properties: number;
  average_price: number;
  properties_this_month: number;
}

interface Props {
  profile: InmobiliariaProfile;
  initialProperties: Property[];
  totalProperties: number;
  teamMembers?: TeamMember[];
  stats?: AgencyStats | null;
}

export default function InmobiliariaProfileClient({
  profile,
  initialProperties,
  totalProperties,
  teamMembers = [],
  stats = null,
}: Props) {
  // ✅ VALIDACIÓN: Prevenir errores de hooks si profile es inválido
  if (!profile || !profile.id || !profile.company_name) {
    console.error('[InmobiliariaProfile] Invalid profile data received:', profile);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Perfil no disponible
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar el perfil de la inmobiliaria.
          </p>
          <a
            href="/properties"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Ver todas las propiedades
          </a>
        </div>
      </div>
    );
  }

  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const pageSize = 12;
  const totalPages = Math.ceil(totalProperties / pageSize);
  const hasMore = page < totalPages;

  // B7: Track profile view on mount
  useEffect(() => {
    try {
      analytics.profileView(profile.id, profile.company_name);
    } catch (error) {
      // Silently fail - tracking should never break UX
      console.debug('Analytics tracking failed:', error);
    }
  }, [profile.id, profile.company_name]);

  // Cargar más propiedades
  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/inmobiliarias/${profile.id}/properties?page=${page + 1}&pageSize=${pageSize}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setProperties((prev) => [...prev, ...data.items]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Truncar descripción
  const truncatedDescription = profile.description
    ? profile.description.length > 300
      ? profile.description.substring(0, 300) + '...'
      : profile.description
    : null;

  const shouldShowExpandButton = profile.description && profile.description.length > 300;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              {profile.logo_url ? (
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={profile.logo_url}
                    alt={`Logo de ${profile.company_name}`}
                    fill
                    sizes="(max-width: 768px) 96px, 128px"
                    priority
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile.company_name}
                </h1>
                {profile.verified && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Verificado
                  </Badge>
                )}
              </div>

              {/* B5: ShareBar para inmobiliaria */}
              <div className="mt-4 mb-4">
                <AgencyShareBar
                  agencyId={profile.id}
                  agencyData={{
                    id: profile.id,
                    title: profile.company_name,
                    description: profile.description || undefined,
                    imageUrl: profile.logo_url || undefined,
                  }}
                  context="profile"
                  className="justify-start"
                />
              </div>

              {/* Contacto */}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </a>
                )}

                {/* FASE 5: Teléfono comercial - Solo mostrar si es diferente del teléfono principal */}
                {profile.commercial_phone && profile.commercial_phone !== profile.phone && (
                  <a
                    href={`tel:${profile.commercial_phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{profile.commercial_phone}</span>
                    <span className="text-xs text-gray-500">(Comercial)</span>
                  </a>
                )}
                
                {profile.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.address}</span>
                  </div>
                )}

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Sitio web</span>
                  </a>
                )}
              </div>

              {/* Redes sociales */}
              {(profile.facebook || profile.instagram || profile.tiktok) && (
                <div className="flex gap-3 mt-4">
                  {profile.facebook && (
                    <a
                      href={profile.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 transition"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={profile.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-600 transition"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información de la inmobiliaria */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sobre nosotros */}
            {profile.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Sobre nosotros</h2>
                  <div className="text-gray-600 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {showFullDescription || !shouldShowExpandButton
                      ? profile.description
                      : truncatedDescription}
                  </div>
                  {shouldShowExpandButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-3 w-full"
                    >
                      {showFullDescription ? (
                        <>
                          Ver menos <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Ver más <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* FASE 5: Estadísticas */}
            {profile.show_stats_public && stats && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                <AgencyStats stats={stats} />
              </div>
            )}

            {/* FASE 5: Horarios de Atención */}
            {profile.show_hours_public && profile.business_hours && parseBusinessHours(profile.business_hours) && (
              <BusinessHours
                hours={parseBusinessHours(profile.business_hours)!}
                timezone={profile.timezone}
              />
            )}

            {/* FASE 5: Equipo */}
            {profile.show_team_public && teamMembers.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Nuestro Equipo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {teamMembers.map((member) => (
                      <TeamMemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FASE 5: Mapa de Ubicación */}
            {profile.show_map_public && profile.latitude && profile.longitude && (
              <AgencyLocationMap
                location={{
                  latitude: profile.latitude,
                  longitude: profile.longitude,
                  address: profile.address || '',
                }}
                agencyName={profile.company_name}
              />
            )}
          </div>

          {/* Columna derecha - Propiedades */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Propiedades publicadas
              </h2>
              <p className="text-gray-600">
                {totalProperties} {totalProperties === 1 ? 'propiedad' : 'propiedades'} disponibles
              </p>
            </div>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sin propiedades disponibles
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Esta inmobiliaria aún no tiene propiedades publicadas.
                  </p>
                  <Link href="/properties">
                    <Button>Ver todas las propiedades</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid de propiedades */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Imagen */}
                        <div className="relative h-48 bg-gray-200">
                          {property.cover_url ? (
                            <Image
                              src={property.cover_url}
                              alt={property.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-white/90">
                              {property.operation_type === 'venta' ? 'Venta' : 'Alquiler'}
                            </Badge>
                          </div>
                        </div>

                        {/* Contenido */}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                            {property.title}
                          </h3>
                          
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="line-clamp-1">{property.location}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-blue-600">
                              ${property.price.toLocaleString()}
                            </div>
                            {(property.bedrooms || property.bathrooms) && (
                              <div className="flex gap-3 text-sm text-gray-600">
                                {property.bedrooms && (
                                  <span>{property.bedrooms} dorm</span>
                                )}
                                {property.bathrooms && (
                                  <span>{property.bathrooms} baños</span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Botón cargar más */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      size="lg"
                      variant="outline"
                    >
                      {loading ? 'Cargando...' : 'Cargar más propiedades'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
