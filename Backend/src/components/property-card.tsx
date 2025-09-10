"use client"

import { MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/favorite-button"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchBucketImages, parseImagesText, resolveImages } from "@/lib/propertyImages"

interface PropertyCardProps {
  id: string
  title: string
  price: number
  images: unknown
  city: string
  province: string
  bedrooms: number
  bathrooms: number
  area: number
  userId: string
}

export function PropertyCard({
  id,
  title,
  price,
  images,
  city,
  province,
  bedrooms,
  bathrooms,
  area,
  userId,
}: PropertyCardProps) {
  const [bucketImages, setBucketImages] = useState<string[]>([])
  const [resolvedImages, setResolvedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadImages() {
      if (!id || !userId) {
        setLoading(false)
        return
      }
      try {
        const fetchedBucketImages = await fetchBucketImages(userId, id)
        setBucketImages(fetchedBucketImages)
      } catch (error) {
        console.error('Error fetching bucket images:', error)
        setBucketImages([])
      } finally {
        setLoading(false)
      }
    }
    loadImages()
  }, [id, userId])

  useEffect(() => {
    const apiImages = parseImagesText(images)
    const combinedImages = resolveImages(bucketImages, apiImages)
    setResolvedImages(combinedImages)
  }, [bucketImages, images])

  const normalizeSrc = (s: string): string =>
    s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') ? s : `/${s}`

  const cover = normalizeSrc(resolvedImages[0] ?? '/placeholder-apartment-1.jpg')

  return (
    <Link href={`/properties/${id}`} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        {/* Contenedor con altura fija para que la imagen no sea gigante */}
        <div className="relative w-full h-56 sm:h-56 md:h-60 lg:h-64 overflow-hidden rounded-md">
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              // fallback de runtime si la URL falla
              const img = document.querySelector(`img[alt="${title}"]`) as HTMLImageElement
              if (img && img.src !== '/placeholder-apartment-1.jpg') {
                img.src = '/placeholder-apartment-1.jpg'
              }
            }}
          />

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

        {/* Más contenido visible para validar */}
        <div className="p-3">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">
            {city}, {province}
          </div>

          {/* Property details with icons */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            {bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{bathrooms}</span>
              </div>
            )}
            {area > 0 && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4" />
                <span>{area}m²</span>
              </div>
            )}
          </div>

          <div className="text-blue-600 font-bold mt-1">${Number(price ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  )
}
