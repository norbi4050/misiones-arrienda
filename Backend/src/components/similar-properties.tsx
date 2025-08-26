"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/property-card";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home, MapPin } from "lucide-react";

interface SimilarPropertiesProps {
  currentProperty: Property;
  maxProperties?: number;
}

export function SimilarProperties({
  currentProperty,
  maxProperties = 6,
}: SimilarPropertiesProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadSimilarProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProperty.id]);

  const loadSimilarProperties = async () => {
    try {
      setLoading(true);

      // Try to fetch from API first
      const response = await fetch(
        `/api/properties/similar/${currentProperty.id}?limit=${maxProperties}`
      );

      if (response.ok) {
        const data = await response.json();
        setSimilarProperties((data?.properties as Property[]) || []);
      } else {
        // Fallback to mock similar properties
        setSimilarProperties(generateMockSimilarProperties());
      }
    } catch (error) {
      console.error("Error loading similar properties:", error);
      setSimilarProperties(generateMockSimilarProperties());
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mock seguro: parte del currentProperty (spread) y NO agrega campos ajenos
  const generateMockSimilarProperties = (): Property[] => {
    const city = String(currentProperty.city ?? "");
    const propType = currentProperty.propertyType;

    const base: Property[] = [
      {
        ...currentProperty,
        id: "similar-1",
        title: "Casa moderna con jardín",
        description:
          "Hermosa casa de 3 dormitorios con amplio jardín y parrilla.",
        price: Math.round((currentProperty.price ?? 0) * 0.85),
        latitude: (currentProperty.latitude ?? -27.3621) + 0.01,
        longitude: (currentProperty.longitude ?? -55.9008) + 0.01,
        images:
          currentProperty.images?.length
            ? currentProperty.images
            : ["/placeholder-house-2.jpg"],
        featured: false,
      },
      {
        ...currentProperty,
        id: "similar-2",
        title: "Departamento luminoso céntrico",
        description:
          "Moderno departamento con excelente ubicación y mucha luz natural.",
        price: Math.round((currentProperty.price ?? 0) * 1.15),
        latitude: (currentProperty.latitude ?? -27.3621) - 0.01,
        longitude: (currentProperty.longitude ?? -55.9008) - 0.01,
        images:
          currentProperty.images?.length
            ? currentProperty.images
            : ["/placeholder-apartment-2.jpg"],
        featured: true,
        bedrooms: (currentProperty.bedrooms ?? 1) + 1,
      },
      {
        ...currentProperty,
        id: "similar-3",
        title: "Casa familiar con piscina",
        description: "Amplia casa familiar con piscina y quincho.",
        price: Math.round((currentProperty.price ?? 0) * 1.3),
        latitude: (currentProperty.latitude ?? -27.3621) + 0.02,
        longitude: (currentProperty.longitude ?? -55.9008) - 0.01,
        images:
          currentProperty.images?.length
            ? currentProperty.images
            : ["/placeholder-house-4.jpg"],
        featured: false,
        bathrooms: Math.max((currentProperty.bathrooms ?? 1) + 1, 1),
        area: Math.max((currentProperty.area ?? 50) + 50, 50),
      },
    ];

    return base
      .filter(
        (p) =>
          String(p.city ?? "") === city &&
          p.propertyType === propType &&
          p.id !== currentProperty.id
      )
      .slice(0, maxProperties);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + 3 >= similarProperties.length ? 0 : prev + 3
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, similarProperties.length - 3) : prev - 3
    );
  };

  const visibleProperties = similarProperties.slice(
    currentIndex,
    currentIndex + 3
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay propiedades similares disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            No encontramos propiedades similares en {currentProperty.city} en
            este momento.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/properties")}
          >
            Ver todas las propiedades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentIndex + 1}-
            {Math.min(currentIndex + 3, similarProperties.length)} de{" "}
            {similarProperties.length}
          </span>

          {similarProperties.length > 3 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                disabled={currentIndex + 3 >= similarProperties.length}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProperties.map((property) => (
          <div key={property.id} className="group">
            <PropertyCard
              id={property.id}
              title={property.title}
              price={property.price}
              type={property.propertyType}
              location={`${property.city}, ${property.province}`}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              area={property.area}
              image={property.images?.[0] ?? "/placeholder-apartment-1.jpg"}
              featured={property.featured}
            />
          </div>
        ))}
      </div>

      {similarProperties.length > 3 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({
              length: Math.ceil(similarProperties.length / 3),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * 3)}
                className={`w-2 h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / 3) === index
                    ? "bg-blue-500 w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() =>
            (window.location.href = `/properties?city=${encodeURIComponent(
              String(currentProperty.city ?? "")
            )}&type=${encodeURIComponent(
              String(currentProperty.propertyType ?? "")
            )}`)
          }
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          Ver más propiedades en {currentProperty.city}
        </Button>
      </div>
    </div>
  );
}
