"use client"

import { MapPin, Bed, Bath, Square, Building2, ExternalLink, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import PropertyImage from "@/components/ui/property-image"
import Link from "next/link"

interface PropertyCardProps {
  id: string
  title: string
  price: number
  type: string
  location: string
  bedrooms: number
  bathrooms: number
  area: number
  image: string
  imageUrls?: string[]
  coverUrl?: string
  cover_url?: string  // Nueva prop del API
  userId?: string
  featured?: boolean
  operation_type?: string  // NUEVO: tipo de operación (alquiler/venta/ambos)
  // FASE 6: Owner info para link a perfil de inmobiliaria
  owner_id?: string
  owner_type?: string
  owner_company_name?: string
  // PUBLIC LISTING: Flags de autenticación requerida
  requires_auth_for_contact?: boolean
  requires_auth_for_full_images?: boolean
}

export function PropertyCard({
  id,
  title,
  price,
  type,
  location,
  bedrooms,
  bathrooms,
  area,
  image,
  imageUrls,
  coverUrl,
  cover_url,
  userId,
  featured = false,
  operation_type,
  owner_id,
  owner_type,
  owner_company_name,
  requires_auth_for_contact = false,
  requires_auth_for_full_images = false
}: PropertyCardProps) {
  // Paso 4: Usar cover_url en TODAS las cards, priorizando la nueva prop
  const src = cover_url ?? coverUrl ?? image ?? imageUrls?.[0] ?? '/placeholder-apartment-1.jpg';
  
  // FASE 6: Determinar si mostrar link a perfil de inmobiliaria
  const showAgencyLink = owner_type === 'inmobiliaria' && owner_id;
  
  // Log de diagnóstico para auditoría
  console.debug('[Card] src=', src, 'id=', id, 'cover_url=', cover_url);
  
  return (
    <Link href={`/properties/${id}`} prefetch={false} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="aspect-[4/3] overflow-hidden relative">
          <PropertyImage
            src={src}
            alt={title}
            fallback="/placeholder-apartment-1.jpg"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Badges en la imagen */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {featured && (
              <Badge className="bg-red-500 text-white">
                Destacado
              </Badge>
            )}
            {/* Badge de tipo de operación */}
            {operation_type === 'alquiler' && (
              <Badge className="bg-blue-500 text-white text-xs">
                🏠 Alquiler
              </Badge>
            )}
            {operation_type === 'venta' && (
              <Badge className="bg-green-500 text-white text-xs">
                💰 Venta
              </Badge>
            )}
            {operation_type === 'ambos' && (
              <Badge className="bg-purple-500 text-white text-xs">
                🔄 Alquiler/Venta
              </Badge>
            )}
          </div>
          
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
            <FavoriteButton propertyId={id} />
          </div>
          
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="group-hover:bg-blue-100 transition-colors duration-300">
              {type}
            </Badge>
            <span className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
              ${price.toLocaleString()}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {title}
          </h3>
          
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
            {location}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1 text-gray-400" />
              {bedrooms} hab
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1 text-gray-400" />
              {bathrooms} baños
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1 text-gray-400" />
              {area} m²
            </div>
          </div>
          
          {/* FASE 6: Link a perfil de inmobiliaria */}
          {showAgencyLink && (
            <Link
              href={`/inmobiliaria/${owner_id}`}
              prefetch={false}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors mb-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Building2 className="w-3 h-3" />
              <span>Ver perfil de {owner_company_name || 'la inmobiliaria'}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          {/* PUBLIC LISTING: Badge indicando que requiere login */}
          {requires_auth_for_contact && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Lock className="h-3 w-3" />
              <span>Inicia sesión para contactar</span>
            </div>
          )}

          {requires_auth_for_full_images && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Lock className="h-3 w-3" />
              <span>+{/* Calculado dinámicamente */} fotos más</span>
            </div>
          )}

          <Button 
            className="w-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" 
            variant="default"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/properties/${id}`
            }}
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </Link>
  )
}
