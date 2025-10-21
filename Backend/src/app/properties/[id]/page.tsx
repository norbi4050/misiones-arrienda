import 'server-only';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createServerSupabase } from '@/lib/supabase/server';
import { 
  generatePropertyMetaTags,
  generatePropertyJsonLd,
  generateBreadcrumbJsonLd,
  createJsonLdScript
} from '@/lib/structured-data';
import { generatePropertyShareMetaTags } from '@/lib/share/metatags';
import ImageCarousel from '@/components/ui/ImageCarousel';
import PropertyLocationMap from '@/components/property/PropertyLocationMap';
import PropertyContactForm from '@/components/ui/PropertyContactForm';
import ContactPanel from '@/components/contact/ContactPanel';
import ContactButton from '@/components/ui/ContactButton';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { PropertyShareBar } from '@/components/share';
import OwnerActions from '@/components/ui/OwnerActions';
import { PropertyViewTracker } from '@/components/property/PropertyViewTracker';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Ruler, 
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Heart,
  Share2,
  Send,
  User,
  AlertTriangle,
  Star,
  Building2,
  ExternalLink
} from 'lucide-react';

interface PropertyDetailPageProps {
  params: { id: string };
}

// Obtener imágenes finales con bucket-first + fallback
async function getImagesFinal(property: any) {
  const supabase = createServerSupabase();

  // 1) bucket-first
  const { data: list } = await supabase
    .storage.from('property-images')
    .list(`${property.user_id}/${property.id}`, { limit: 50 });
  
  const v = Math.floor(new Date(property.updated_at).getTime() / 1000);
  const bucketUrls =
    (list ?? [])
      .filter(o => o?.name)
      .map(o =>
        supabase.storage
          .from('property-images')
          .getPublicUrl(`${property.user_id}/${property.id}/${o.name}`).data.publicUrl + `?v=${v}`
      );

  // 2) fallback: images_urls (array de paths relativo al bucket)
  const fromImagesUrls =
    Array.isArray(property.images_urls)
      ? property.images_urls.map((key: string) =>
          supabase.storage.from('property-images').getPublicUrl(key).data.publicUrl + `?v=${v}`
        )
      : [];

  // 3) demo/placeholder si todo vacío
  const final = bucketUrls.length ? bucketUrls : fromImagesUrls;
  return final;
}

// Obtener propiedad desde API unificada
async function getPropertyFromAPI(id: string) {
  try {
    // Evitar depender de NEXT_PUBLIC_BASE_URL. Construir URL absoluta usando headers
    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = (h.get('x-forwarded-proto') ?? 'http')
    const base = `${proto}://${host}`

    const res = await fetch(`${base}/api/properties/${id}`, { 
      cache: 'no-store' 
    });

    // Parsear respuesta según shape actual de la API
    if (res.status === 404) {
      return null; // notFound()
    }
    
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    
    // Esperado: { ok: true, property, agent }
    if (!result.ok || !result.property) {
      return null;
    }

    return {
      property: result.property,
      agent: result.agent || null
    };
  } catch (error) {
    console.error('Error fetching property from API:', error);
    return null;
  }
}

// Obtener propiedades similares desde API
async function getSimilarProperties(property: any) {
  try {
    const supabase = createServerSupabase();
    
    const { data: similar, error } = await supabase
      .from('properties')
      .select('id, title, price, currency, bedrooms, bathrooms, images, city')
      .eq('city', property.city)
      .eq('property_type', property.property_type)
      .neq('id', property.id)
      .limit(3);

    if (error) {
      console.error('Error fetching similar properties:', error);
      return [];
    }

    return similar || [];
  } catch (error) {
    console.error('Error in getSimilarProperties:', error);
    return [];
  }
}

// Generate metadata for SEO (B5 Enhanced)
export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const result = await getPropertyFromAPI(params.id);

  if (!result) {
    return {
      title: 'Propiedad no encontrada - Misiones Arrienda',
      description: 'La propiedad que buscas no existe o ha sido removida.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { property } = result;

  // Obtener imágenes finales usando bucket-first
  const realImages = await getImagesFinal(property);

  // B5: Usar nuevo helper con canonical URLs y OG images
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const metaTags = await generatePropertyShareMetaTags(property, baseUrl, realImages);
    return metaTags;
  } catch (error) {
    console.error('[B5] Error generating share metatags, falling back to legacy:', error);
    // Fallback al sistema anterior si falla B5
    return generatePropertyMetaTags(property, baseUrl, realImages);
  }
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  // Usar API unificada en lugar de consulta directa
  const result = await getPropertyFromAPI(params.id);

  if (!result) {
    notFound();
  }

  const { property, agent } = result;

  // Obtener usuario autenticado para verificar si es el dueño
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === property.user_id;

  // Obtener información del plan del usuario si es el dueño
  let userPlanInfo = null;
  if (isOwner && user) {
    const { data: planLimits } = await supabase
      .rpc('get_user_plan_limits', { user_uuid: user.id });

    if (planLimits && planLimits.length > 0) {
      userPlanInfo = {
        planTier: planLimits[0].plan_tier,
        allowFeatured: planLimits[0].allow_featured
      };
    }
  }

  // Obtener imágenes finales usando bucket-first
  const realImages = await getImagesFinal(property);

  // Parse amenities and features
  const amenities = property.amenities ? JSON.parse(property.amenities) : [];
  const features = property.features ? JSON.parse(property.features) : [];

  // Get similar properties
  const similarProperties = await getSimilarProperties(property);

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'APARTMENT': 'Departamento',
      'HOUSE': 'Casa',
      'COMMERCIAL': 'Comercial',
      'LAND': 'Terreno',
      'OFFICE': 'Oficina',
      'WAREHOUSE': 'Depósito',
      'PH': 'PH',
      'STUDIO': 'Monoambiente'
    };
    return types[type] || type;
  };

  // Generar JSON-LD structured data con imágenes reales
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = (h.get('x-forwarded-proto') ?? 'http')
  const baseUrl = `${proto}://${host}`
  
  const propertyJsonLd = generatePropertyJsonLd(property, baseUrl, realImages);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Inicio', url: baseUrl },
    { name: 'Propiedades', url: `${baseUrl}/properties` },
    { name: property.title, url: `${baseUrl}/properties/${property.id}` }
  ]);

  return (
    <>
      {/* B7: Track property view */}
      <PropertyViewTracker propertyId={property.id} propertyTitle={property.title} />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLdScript(propertyJsonLd)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={createJsonLdScript(breadcrumbJsonLd)}
      />
      
      <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/properties" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a propiedades
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Carousel */}
            <div className="mb-8">
              {realImages.length > 0 ? (
                <>
                  <ImageCarousel
                    images={realImages.map((src: string, index: number) => ({
                      src,
                      alt: `${property.title} - Imagen ${index + 1}`
                    }))}
                    className="w-full"
                    showThumbnails={realImages.length > 1}
                    enableZoom={true}
                  />
                  
                  {/* Indicador de fuente de imágenes */}
                  <div className="mt-2 text-xs text-gray-500">
                    {realImages[0].includes('supabase.co') ? (
                      <span className="text-green-600">✓ Imágenes verificadas</span>
                    ) : realImages[0].includes('placeholder') ? (
                      <span className="text-orange-600">⚠ Sin imágenes disponibles</span>
                    ) : (
                      <span className="text-blue-600">📁 Imágenes de archivo</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Placeholder cuando no hay imágenes */}
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🏠</div>
                      <div className="text-lg font-medium">Sin imágenes disponibles</div>
                      <div className="text-sm">Esta propiedad no tiene fotos cargadas</div>
                    </div>
                  </div>
                  
                  {/* Estado "Sin imágenes" */}
                  <div className="mt-2 text-amber-600 text-sm flex items-center gap-2">
                    ⚠️ Sin imágenes disponibles
                  </div>
                </>
              )}
            </div>

            {/* FASE 6: Banner de Inmobiliaria */}
            {property.owner_type === 'inmobiliaria' && property.owner_id && !isOwner && (
              <Link
                href={`/inmobiliaria/${property.owner_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Publicado por</p>
                      <p className="font-semibold text-gray-900">
                        {property.owner_company_name || 'Inmobiliaria'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="text-sm font-medium hidden sm:inline">Ver perfil completo</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )}

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words overflow-wrap-anywhere">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="break-words">{property.address}, {property.city}, {property.province}</span>
                  </div>
                </div>
                {!isOwner && (
                  <div className="flex items-center space-x-2">
                    <FavoriteButton propertyId={property.id} />
                  </div>
                )}
              </div>

              {/* B5: ShareBar - Arriba del fold */}
              {!isOwner && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Compartir esta propiedad
                    </h3>
                  </div>
                  <PropertyShareBar
                    propertyId={property.id}
                    propertyData={{
                      id: property.id,
                      title: property.title,
                      description: property.description,
                      price: property.price,
                      currency: property.currency || 'ARS',
                      city: property.city,
                      province: property.province,
                      imageUrl: realImages[0] || '/placeholder-apartment-1.jpg',
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      area: property.area,
                    }}
                    context="detail"
                    className="justify-start"
                  />
                </div>
              )}

              <div className="flex items-center flex-wrap gap-2 mb-6">
                {/* Badge de Tipo de Operación - NUEVO */}
                {property.operation_type === 'alquiler' && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    🏠 Alquiler
                  </Badge>
                )}
                {property.operation_type === 'venta' && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    💰 Venta
                  </Badge>
                )}
                {property.operation_type === 'ambos' && (
                  <>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      🏠 Alquiler
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      💰 Venta
                    </Badge>
                  </>
                )}
                
                <Badge variant="secondary">
                  {getPropertyTypeLabel(property.property_type)}
                </Badge>
                <Badge variant={property.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {property.status === 'PUBLISHED' ? 'Disponible' : property.status || 'Estado desconocido'}
                </Badge>
                {property.featured && (
                  <Badge variant="destructive">Destacada</Badge>
                )}
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {property.bedrooms} dormitorios
                  </span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {property.bathrooms} baños
                  </span>
                </div>
                {property.garages > 0 && (
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {property.garages} cocheras
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Ruler className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {property.area} m²
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Descripción
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Comodidades
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Características
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                {property.year_built && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Año de construcción: {property.year_built}
                    </span>
                  </div>
                )}
                {property.floor && (
                  <div className="text-sm text-gray-600">
                    Piso: {property.floor}
                    {property.total_floors && ` de ${property.total_floors}`}
                  </div>
                )}
                {property.lot_area && (
                  <div className="text-sm text-gray-600">
                    Terreno: {property.lot_area} m²
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">Ubicación</h2>
              
              {property.latitude && property.longitude ? (
                <>
                  <PropertyLocationMap 
                    lat={property.latitude} 
                    lng={property.longitude} 
                    className="h-72 rounded-xl overflow-hidden border" 
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Zona aproximada. La ubicación exacta se comparte con el interesado.
                  </p>
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {property.address || property.city}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          No informada
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">
                        La ubicación exacta no está disponible en el mapa. 
                        Contactá al propietario para obtener más detalles sobre la ubicación.
                      </p>
                      <ContactButton 
                        propertyId={property.id}
                        ownerId={property.user_id}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Contact Form - Solo para no dueños */}
            {!isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Contactar al anunciante
                </h2>
                
                {/* Agent Info */}
                {agent && (
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {agent.full_name || 'Propietario'}
                      </h3>
                      <p className="text-sm text-gray-600">Anunciante</p>
                      {/* Advertencia para usuarios nuevos */}
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                        <span className="text-xs text-orange-600">
                          Usuario nuevo - Verificar referencias
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Panel - Client Component */}
                <ContactPanel 
                  propertyId={property.id} 
                  ownerId={property.user_id}
                  propertyCity={property.city}
                />

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Sé específico en tu consulta. Menciona fechas de interés, 
                    presupuesto y cualquier pregunta particular sobre la propiedad.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price & Contact - Solo para no dueños */}
            {!isOwner && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatPrice(property.price, property.currency || 'ARS')}
                    </div>
                    {property.old_price && (
                      <div className="text-lg text-gray-500 line-through">
                        {formatPrice(property.old_price, property.currency || 'ARS')}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">por mes</div>
                  </div>

                  <ContactPanel 
                    propertyId={property.id} 
                    ownerId={property.user_id}
                    propertyCity={property.city}
                  />

                  <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-gray-600">
                      Publicado el {new Date(property.created_at).toLocaleDateString('es-AR')}
                    </p>
                    {agent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Por: {agent.full_name || 'Propietario'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Actions - Solo para dueños */}
            {isOwner && (
              <OwnerActions
                propertyId={property.id}
                featured={property.featured || false}
                userPlanTier={userPlanInfo?.planTier || 'free'}
                allowFeatured={userPlanInfo?.allowFeatured || false}
                className="mb-6"
              />
            )}

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Propiedades similares
                  </h3>
                  <div className="space-y-4">
                    {similarProperties.map((similar: any) => {
                      let similarImages = [];
                      try {
                        similarImages = similar.images && similar.images.trim() ? JSON.parse(similar.images) : [];
                      } catch (e) {
                        console.warn('Error parsing similar property images:', e);
                        similarImages = [];
                      }
                      return (
                        <Link
                          key={similar.id}
                          href={`/properties/${similar.id}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={similarImages[0] || '/placeholder-apartment-1.jpg'}
                                alt={similar.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {similar.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatPrice(similar.price, similar.currency || 'ARS')}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {similar.bedrooms} dorm • {similar.bathrooms} baños
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
