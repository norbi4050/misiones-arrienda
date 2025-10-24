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
  ChevronDown,
  ChevronUp,
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
import HeroSection from '@/components/inmobiliarias/hero/HeroSection';
import PropertyTabs from '@/components/inmobiliarias/filters/PropertyTabs';
import PropertyFilters, { SortOption } from '@/components/inmobiliarias/filters/PropertyFilters';
import { NewBadge } from '@/components/inmobiliarias/filters/PropertyBadges';
import { parseBusinessHours, InmobiliariaProfile as InmobiliariaProfileType } from '@/types/inmobiliaria';
import { normalizeFacebookUrl, normalizeInstagramUrl, normalizeTikTokUrl } from '@/lib/social-urls';

// Usar el tipo de inmobiliaria importado
type InmobiliariaProfile = InmobiliariaProfileType;

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
  created_at?: string;
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
  // ✅ HOOKS PRIMERO - Antes de cualquier return condicional
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Filter states
  const [activeTab, setActiveTab] = useState<'all' | 'venta' | 'alquiler'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(initialProperties || []);

  const pageSize = 12;
  const totalPages = Math.ceil(totalProperties / pageSize);
  const hasMore = page < totalPages;

  // Calculate counts for tabs
  const tabCounts = {
    all: properties.length,
    venta: properties.filter(p => p.operation_type === 'venta').length,
    alquiler: properties.filter(p => p.operation_type === 'alquiler').length,
  };

  // B7: Track profile view on mount
  useEffect(() => {
    try {
      analytics.profileView(profile.id, profile.company_name);
    } catch (error) {
      // Silently fail - tracking should never break UX
      console.debug('Analytics tracking failed:', error);
    }
  }, [profile?.id, profile?.company_name]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...properties];

    // Filter by operation type
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.operation_type === activeTab);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'recent':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredProperties(filtered);
  }, [properties, activeTab, sortBy]);

  // ✅ VALIDACIÓN: Después de los hooks
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <HeroSection
        profile={profile}
        stats={stats}
        totalProperties={totalProperties}
      />

      {/* Contact Info Bar - Enhanced design */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Contacto - Better spacing and hover effects */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{profile.phone}</span>
                </a>
              )}

              {profile.commercial_phone && profile.commercial_phone !== profile.phone && (
                <a
                  href={`tel:${profile.commercial_phone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{profile.commercial_phone}</span>
                  <span className="text-xs text-gray-500 ml-1">(Comercial)</span>
                </a>
              )}

              {profile.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="p-1.5 rounded-lg bg-gray-100">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{profile.address}</span>
                </div>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Sitio web</span>
                </a>
              )}

              {/* Redes sociales - Enhanced with better hover states */}
              {(profile.facebook || profile.instagram) && (
                <div className="flex gap-2 ml-2">
                  {profile.facebook && normalizeFacebookUrl(profile.facebook) && (
                    <a
                      href={normalizeFacebookUrl(profile.facebook)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {profile.instagram && normalizeInstagramUrl(profile.instagram) && (
                    <a
                      href={normalizeInstagramUrl(profile.instagram)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 hover:scale-105"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ShareBar */}
            <div className="flex-shrink-0">
              <AgencyShareBar
                agencyId={profile.id}
                agencyData={{
                  id: profile.id,
                  title: profile.company_name,
                  description: profile.description || undefined,
                  imageUrl: profile.logo_url || undefined,
                }}
                context="profile"
                className="justify-center md:justify-end"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información de la inmobiliaria */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sobre nosotros - Enhanced card design */}
            {profile.description && (
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                    Sobre nosotros
                  </h2>
                  <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {showFullDescription || !shouldShowExpandButton
                      ? profile.description
                      : truncatedDescription}
                  </div>
                  {shouldShowExpandButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-4 w-full hover:bg-gray-100 transition-colors"
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

            {/* FASE 5: Equipo - Enhanced card */}
            {profile.show_team_public && teamMembers.length > 0 && (
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                    Nuestro Equipo
                  </h3>
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
          <div className="lg:col-span-2" id="properties-section">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                Propiedades publicadas
              </h2>

              {/* Tabs de filtro */}
              {properties.length > 0 && (
                <div className="mb-6">
                  <PropertyTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={tabCounts}
                  />
                </div>
              )}

              {/* Filtros y contadores */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-700 font-medium">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'propiedad' : 'propiedades'}
                  {activeTab !== 'all' && ` en ${activeTab}`}
                </p>

                {properties.length > 1 && (
                  <PropertyFilters sortBy={sortBy} onSortChange={setSortBy} />
                )}
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-16 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Sin propiedades disponibles
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    {activeTab === 'all'
                      ? 'Esta inmobiliaria aún no tiene propiedades publicadas.'
                      : `No hay propiedades de ${activeTab} disponibles en este momento.`
                    }
                  </p>
                  {activeTab === 'all' ? (
                    <Link href="/properties">
                      <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                        Ver todas las propiedades
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setActiveTab('all')}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      Ver todas las propiedades
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid de propiedades - Enhanced cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProperties.map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
                        {/* Imagen */}
                        <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                          {property.cover_url ? (
                            <Image
                              src={property.cover_url}
                              alt={property.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Badges de tipo y nuevo */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            {property.created_at && <NewBadge createdAt={property.created_at} />}
                            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm shadow-md">
                              {property.operation_type === 'venta' ? 'Venta' : 'Alquiler'}
                            </Badge>
                          </div>
                        </div>

                        {/* Contenido */}
                        <CardContent className="p-5">
                          <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">
                            {property.title}
                          </h3>

                          <div className="flex items-center text-gray-600 text-sm mb-4">
                            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-500" />
                            <span className="line-clamp-1">{property.location}</span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="text-2xl font-bold text-blue-600">
                              ${property.price.toLocaleString()}
                            </div>
                            {(property.bedrooms || property.bathrooms) && (
                              <div className="flex gap-3 text-sm text-gray-600 font-medium">
                                {property.bedrooms && (
                                  <span className="flex items-center gap-1">
                                    {property.bedrooms} dorm
                                  </span>
                                )}
                                {property.bathrooms && (
                                  <span className="flex items-center gap-1">
                                    {property.bathrooms} baños
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Botón cargar más - Enhanced */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      size="lg"
                      variant="outline"
                      className="shadow-md hover:shadow-lg transition-all hover:scale-105 px-8"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                          Cargando...
                        </>
                      ) : (
                        'Cargar más propiedades'
                      )}
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
