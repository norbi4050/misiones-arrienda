'use client';
import { useState, useEffect } from 'react';
import { PropertyCard } from '@/components/property-card';
import { FilterSectionWrapper } from '@/components/filter-section-wrapper';
import { getProperties } from '@/lib/api';
import { Property } from '@/types/property';

type Filters = {
  city: string;
  type: string;
  min: string;
  max: string;
  bedrooms: string;
  bathrooms: string;
  featured: string;
};

interface EldoradoClientProps {
  initial: Partial<Filters>;
  initialProperties: Property[];
}

export default function EldoradoClient({ initial, initialProperties }: EldoradoClientProps) {
  const [filters, setFilters] = useState<Filters>({
    city: initial.city ?? 'Eldorado',
    type: initial.type ?? '',
    min: initial.min ?? '',
    max: initial.max ?? '',
    bedrooms: initial.bedrooms ?? '',
    bathrooms: initial.bathrooms ?? '',
    featured: initial.featured ?? '',
  });

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);

  // Sincronizar con URL changes si el usuario navega
  useEffect(() => {
    const url = new URL(window.location.href);
    const next = {
      city: url.searchParams.get('city') ?? 'Eldorado',
      type: url.searchParams.get('type') ?? '',
      min: url.searchParams.get('min') ?? '',
      max: url.searchParams.get('max') ?? '',
      bedrooms: url.searchParams.get('bedrooms') ?? '',
      bathrooms: url.searchParams.get('bathrooms') ?? '',
      featured: url.searchParams.get('featured') ?? '',
    };
    setFilters(next);
  }, []);

  // Manejar cambios de filtros
  const handleFilterChange = async (newFilters: any) => {
    setLoading(true);
    try {
      const response = await getProperties({
        city: 'Eldorado',
        ...newFilters
      });
      setProperties(response.properties);
    } catch (error) {
      console.error('Error fetching filtered properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <nav className="text-sm mb-4 opacity-90">
            <a href="/" className="hover:underline">Inicio</a>
            <span className="mx-2">›</span>
            <span>Eldorado</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Propiedades en Eldorado
          </h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Descubre las mejores opciones de alquiler en la ciudad del conocimiento.
            Eldorado combina desarrollo industrial con calidad de vida.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">{properties.length}</div>
              <div className="text-sm opacity-90">Propiedades Disponibles</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">
                ${properties.length > 0
                  ? Math.min(...properties.map((p: Property) => p.price)).toLocaleString()
                  : '0'
                }
              </div>
              <div className="text-sm opacity-90">Desde</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">
                {new Set(properties.map((p: Property) => p.propertyType)).size}
              </div>
              <div className="text-sm opacity-90">Tipos de Propiedad</div>
            </div>
          </div>
        </div>
      </div>

      {/* About Eldorado Section */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ¿Por qué elegir Eldorado?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Ciudad del Conocimiento
                </h3>
                <p className="text-gray-600 mb-4">
                  Eldorado es reconocida como la "Ciudad del Conocimiento" por su fuerte
                  desarrollo educativo e industrial. Cuenta con importantes instituciones
                  educativas y empresas que generan empleo de calidad.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Desarrollo Industrial
                </h3>
                <p className="text-gray-600">
                  La ciudad alberga importantes industrias forestales y manufactureras,
                  ofreciendo oportunidades laborales y crecimiento económico sostenido.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Calidad de Vida
                </h3>
                <p className="text-gray-600 mb-4">
                  Eldorado ofrece un equilibrio perfecto entre desarrollo urbano y
                  naturaleza, con excelentes servicios públicos, centros de salud
                  y espacios recreativos.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Conectividad
                </h3>
                <p className="text-gray-600">
                  Estratégicamente ubicada sobre la Ruta Nacional 12, Eldorado
                  cuenta con excelente conectividad con otras ciudades de Misiones
                  y el resto del país.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Propiedades Disponibles en Eldorado
          </h2>
          <p className="text-gray-600">
            Explora nuestra selección de propiedades en alquiler en Eldorado.
            Utiliza los filtros para encontrar exactamente lo que buscas.
          </p>
        </div>

        <FilterSectionWrapper onFilterChange={handleFilterChange} />

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Cargando propiedades...</div>
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {properties.map((property: Property) => (
            <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                price={Number(property.price)}
                images={property.images}
                city={property.city}
                province={property.province}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={Number(property.area)}
                userId={property.userId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay propiedades disponibles en Eldorado
            </h3>
            <p className="text-gray-600 mb-6">
              Actualmente no tenemos propiedades disponibles en Eldorado, pero puedes explorar otras ciudades.
            </p>
            <div className="space-x-4">
              <a
                href="/posadas"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Ver Posadas
              </a>
              <a
                href="/obera"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Ver Oberá
              </a>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Tienes una propiedad en Eldorado?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Publica tu propiedad en Misiones Arrienda y llega a miles de inquilinos potenciales.
          </p>
          <a
            href="/publicar"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Publicar Propiedad
          </a>
        </div>
      </div>
    </div>
  );
}
