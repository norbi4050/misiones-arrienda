"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/property-card";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Versión para forzar recompilación en Vercel si quedara cacheado
export const __SIMILAR_PROPS_VERSION = "v3-fix-dedup";

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

      // 1) Intentar API
      const res = await fetch(
        `/api/properties/similar/${currentProperty.id}?limit=${maxProperties}`
      );

      if (res.ok) {
        const data = await res.json();
        // si el backend devuelve strings "libres", el cast asegura el tipo en FE
        setSimilarProperties((data?.properties as Property[]) || []);
      } else {
        // 2) Fallback mock
        setSimilarProperties(generateMockSimilarProperties());
      }
    } catch (e) {
      console.error("Error loading similar properties:", e);
      setSimilarProperties(generateMockSimilarProperties());
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ Importante: partimos SIEMPRE del spread de currentProperty.
  // No tocar `status`, `listingType` ni `propertyType` a mano.
  const generateMockSimilarProperties = (): Property[] => {
    const city = String(currentProperty.city ?? "");
    const propType = currentProperty.propertyType;

    const base: Property[] = [
      {
        ...currentProperty,
        id: "similar-1",
        title: "Casa moderna con jardín",
        description: "Hermosa casa con jardín y parrilla.",
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
        description: "Moderno departamento con excelente ubicación.",
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

    // Filtrar: misma ciudad y tipo, y no incluirse a sí misma
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

  const visible = similarProperties.slice(currentIndex, currentIndex + 3);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Propiedades Similares</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (similarProperties.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Propiedades Similares</h2>
        <p className="text-muted-foreground">
          No encontramos propiedades similares en {currentProperty.city} en este
          momento.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/properties")}
        >
          Ver todas las propiedades
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Propiedades Similares</h2>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1}-
          {Math.min(currentIndex + 3, similarProperties.length)} de{" "}
          {similarProperties.length}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {similarProperties.length > 3 && (
          <Button variant="outline" size="icon" onClick={prevSlide}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {visible.map((property) => (
            <PropertyCard 
              key={property.id}
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
          ))}
        </div>

        {similarProperties.length > 3 && (
          <Button variant="outline" size="icon" onClick={nextSlide}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {similarProperties.length > 3 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({
            length: Math.ceil(similarProperties.length / 3),
          }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * 3)}
              className={`w-2 h-2 rounded-full transition-all ${
                Math.floor(currentIndex / 3) === i
                  ? "bg-blue-500 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Ir a página ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
          onClick={() => {
            const city = encodeURIComponent(String(currentProperty.city ?? ""));
            const type = encodeURIComponent(
              String(currentProperty.propertyType ?? "")
            );
            window.location.href = `/properties?city=${city}&type=${type}`;
          }}
        >
          Ver más propiedades en {currentProperty.city}
        </Button>
      </div>
    </section>
  );
}
