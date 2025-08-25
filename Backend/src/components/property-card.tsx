"use client"

import { MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import Image from "next/image"
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
  featured?: boolean
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
  featured = false
}: PropertyCardProps) {
  return (
    <Link href={`/property/${id}`} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="aspect-[4/3] overflow-hidden relative">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {featured && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white z-10">
              Destacado
            </Badge>
          )}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FavoriteButton 
              propertyId={id}
              size="sm"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            />
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
          
          <Button 
            className="w-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" 
            variant="default"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/property/${id}`
            }}
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </Link>
  )
}
