import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPropertyById, mockProperties } from '@/lib/mock-data-clean';
import { 
  generatePropertyMetaTags,
  generatePropertyJsonLd,
  generateBreadcrumbJsonLd,
  createJsonLdScript
} from '@/lib/structured-data';
import ImageCarousel from '@/components/ui/ImageCarousel';
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
  Share2
} from 'lucide-react';

interface PropertyDetailPageProps {
  params: { id: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const property = getPropertyById(params.id);

  if (!property) {
    return {
      title: 'Propiedad no encontrada - Misiones Arrienda',
      description: 'La propiedad que buscas no existe o ha sido removida.',
    };
  }

  // Usar el sistema completo de SEO
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://misiones-arrienda.vercel.app';
  const metaTags = generatePropertyMetaTags(property, baseUrl);

  return metaTags;
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const property = getPropertyById(params.id);

  if (!property) {
    notFound();
  }

  // Parse images from JSON string
  const images = JSON.parse(property.images || '[]');
  const amenities = JSON.parse(property.amenities || '[]');
  const features = JSON.parse(property.features || '[]');

  // Get similar properties
  const similarProperties = mockProperties
    .filter(prop => 
      prop.id !== property.id &&
      prop.city === property.city &&
      prop.propertyType === property.propertyType &&
      prop.status === 'AVAILABLE'
    )
    .slice(0, 3);

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

  // Generar JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://misiones-arrienda.vercel.app';
  const propertyJsonLd = generatePropertyJsonLd(property, baseUrl);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Inicio', url: baseUrl },
    { name: 'Propiedades', url: `${baseUrl}/properties` },
    { name: property.title, url: `${baseUrl}/properties/${property.id}` }
  ]);

  return (
    <>
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
              <ImageCarousel
                images={images.map((src: string, index: number) => ({
                  src,
                  alt: `${property.title} - Imagen ${index + 1}`
                }))}
                className="w-full"
                showThumbnails={images.length > 1}
                enableZoom={true}
              />
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{property.address}, {property.city}, {property.province}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <Badge variant="secondary">
                  {getPropertyTypeLabel(property.propertyType)}
                </Badge>
                <Badge variant={property.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                  {property.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
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
                <p className="text-gray-700 leading-relaxed">
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
                {property.yearBuilt && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Año de construcción: {property.yearBuilt}
                    </span>
                  </div>
                )}
                {property.floor && (
                  <div className="text-sm text-gray-600">
                    Piso: {property.floor}
                    {property.totalFloors && ` de ${property.totalFloors}`}
                  </div>
                )}
                {property.lotArea && (
                  <div className="text-sm text-gray-600">
                    Terreno: {property.lotArea} m²
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price & Contact */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatPrice(property.price, property.currency)}
                  </div>
                  {property.oldPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      {formatPrice(property.oldPrice, property.currency)}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">por mes</div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar consulta
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-sm text-gray-600">
                    Publicado el {new Date(property.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Propiedades similares
                  </h3>
                  <div className="space-y-4">
                    {similarProperties.map((similar) => {
                      const similarImages = JSON.parse(similar.images || '[]');
                      return (
                        <Link
                          key={similar.id}
                          href={`/properties/${similar.id}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={similarImages[0] || '/images/placeholder-property.jpg'}
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
                                {formatPrice(similar.price, similar.currency)}
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
