"use client"

import { MapPin, Bed, Bath, Square, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Destacado
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{type}</Badge>
          <span className="text-2xl font-bold text-blue-600">
            ${price.toLocaleString()}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {location}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {bedrooms} hab
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            {bathrooms} baños
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            {area} m²
          </div>
        </div>
        
        <Link href={`/property/${id}`}>
          <Button className="w-full mt-4" variant="outline">
            Ver detalles
          </Button>
        </Link>
      </div>
    </div>
  )
}
