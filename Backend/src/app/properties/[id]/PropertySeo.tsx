// Server component
import React from 'react';

function mapType(t?: string) {
  switch (t) {
    case 'HOUSE': return 'SingleFamilyResidence';
    case 'APARTMENT': return 'Apartment';
    case 'OFFICE': return 'Office';
    case 'WAREHOUSE': return 'Warehouse';
    case 'COMMERCIAL': return 'CommercialBuilding';
    case 'LAND': return 'Landform';
    case 'PH': return 'Apartment';
    case 'STUDIO': return 'Apartment';
    default: return 'Residence';
  }
}

export default function PropertySeo({ property }: { property: any }) {
  const images: string[] = Array.isArray(property?.images) ? property.images : [];
  const description = (property?.description ?? '').toString().slice(0,160);

  const ld: any = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    'name': property?.title ?? 'Propiedad',
    'description': description,
    ...(images.length ? { image: images } : {}),
    ...(property?.price && property?.currency ? {
      price: property.price,
      priceCurrency: property.currency,
      '@type': 'Offer'
    } : {}),
    'itemOffered': {
      '@type': mapType(property?.propertyType),
      'address': {
        '@type': 'PostalAddress',
        ...(property?.address ? { streetAddress: property.address } : {}),
        ...(property?.city ? { addressLocality: property.city } : {}),
        ...(property?.province ? { addressRegion: property.province } : {}),
        ...(property?.postalCode ? { postalCode: property.postalCode } : {}),
        'addressCountry': 'AR'
      },
      ...(property?.bedrooms ? { numberOfRooms: property.bedrooms } : {}),
      ...(property?.bathrooms ? { numberOfBathroomsTotal: property.bathrooms } : {}),
      ...(property?.area ? { floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } } : {}),
    },
    ...(property?.latitude && property?.longitude ? {
      'areaServed': {
        '@type': 'Place',
        'geo': { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude }
      }
    } : {}),
  };

  const json = JSON.stringify(ld);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
