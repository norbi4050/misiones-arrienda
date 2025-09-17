import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPropertyById } from '@/lib/api'
import { PropertyDetailClient } from './property-detail-client'

interface Props {
  params: { id: string }
}

// Generar metadatos dinámicos para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getPropertyById(params.id)

  if (!property) {
    return {
      title: 'Propiedad no encontrada - Misiones Arrienda',
      description: 'La propiedad que buscas no existe o fue removida.'
    }
  }

  const title = `${property.title} - ${property.city}, Misiones | Misiones Arrienda`
  const description = `${property.description.substring(0, 160)}... Precio: $${property.price.toLocaleString()}. ${property.bedrooms} hab, ${property.bathrooms} baños, ${property.area}m².`

  return {
    title,
    description,
    keywords: `${property.city}, ${property.province}, ${property.propertyType}, ${property.listingType === 'SALE' ? 'venta' : 'alquiler'}, ${property.bedrooms} dormitorios, inmobiliaria misiones`,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Misiones Arrienda',
      images: [
        {
          url: property.images[0] || '/placeholder-apartment-1.jpg',
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [property.images[0] || '/placeholder-apartment-1.jpg'],
    },
    alternates: {
      canonical: `https://misionesarrienda.com.ar/property/${params.id}`,
    },
  }
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getPropertyById(params.id)

  if (!property) {
    notFound()
  }

  return (
    <>
      <PropertyDetailClient property={property} />

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": property.title,
            "description": property.description,
            "url": `https://misionesarrienda.com.ar/property/${property.id}`,
            "image": property.images,
            "price": {
              "@type": "PriceSpecification",
              "price": property.price,
              "priceCurrency": "ARS"
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": property.address,
              "addressLocality": property.city,
              "addressRegion": property.province,
              "postalCode": property.postalCode,
              "addressCountry": "AR"
            },
            "geo": property.latitude && property.longitude ? {
              "@type": "GeoCoordinates",
              "latitude": property.latitude,
              "longitude": property.longitude
            } : undefined,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": property.area,
              "unitCode": "MTK"
            },
            "numberOfRooms": property.bedrooms,
            "numberOfBathroomsTotal": property.bathrooms,
            "yearBuilt": property.yearBuilt,
            "propertyType": property.propertyType,
            "listingAgent": property.agent ? {
              "@type": "RealEstateAgent",
              "name": property.agent.name,
              "telephone": property.agent.phone,
              "email": property.agent.email
            } : undefined
          })
        }}
      />
    </>
  )
}
