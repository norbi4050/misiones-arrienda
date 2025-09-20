import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PropertyDetailClient from './PropertyDetailClient';
import PropertySeo from './PropertySeo';
import type { Metadata } from 'next';

async function getProperty(id: string) {
  // Construye URL absoluta a /api sin depender de NEXT_PUBLIC_SITE_URL
  const h = await headers();
  const host = h.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/properties/${id}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('API error');

  const property = await res.json();
  return property;
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  // JSON-LD RealEstateListing schema usando imagesSigned si está disponible
  const images = property.imagesSigned?.map((img: any) => img.url) || [];
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title ?? 'Propiedad',
    description: (property.description ?? '').toString().slice(0, 160) || 'Detalle de propiedad en Misiones Arrienda',
    image: images,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city ?? '',
      addressRegion: property.province ?? '',
      postalCode: property.postalCode ?? '',
      addressCountry: 'AR',
    },
    offers: {
      '@type': 'Offer',
      price: property.price ?? '',
      priceCurrency: property.currency || 'ARS',
    },
    numberOfRooms: property.bedrooms ?? undefined,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area ?? undefined,
      unitCode: 'MTK',
    },
    datePosted: property.createdAt ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <PropertySeo property={property} />
      <PropertyDetailClient initialProperty={property} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const property = await getProperty(id);
    if (!property) return { title: 'Propiedad no encontrada', robots: { index: false } };

    const title = `${property.title} – Misiones Arrienda`;
    const rawDesc = (property.description ?? '').toString();
    const description = rawDesc.slice(0, 160) || 'Detalle de propiedad en Misiones Arrienda';

    // Usar imagesSigned para metadata si está disponible
    const images = property.imagesSigned?.map((img: any) => img.url) || [];
    const firstImage = images.length > 0 ? images[0] : undefined;

    return {
      title,
      description,
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
      alternates: { canonical: `/properties/${id}` },
      openGraph: {
        type: 'website',
        url: `/properties/${id}`,
        title,
        description,
        images: firstImage ? [{ url: firstImage, width: 1200, height: 630 }] : undefined,
      },
      twitter: {
        card: firstImage ? 'summary_large_image' : 'summary',
        title,
        description,
        images: firstImage ? [firstImage] : undefined,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return { title: 'Propiedad | Misiones Arrienda', robots: { index: false } };
  }
}
