import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PropertyDetailClient from './PropertyDetailClient';
import PropertySeo from './PropertySeo';
import { createServerSupabase } from '../../../lib/supabase/server';
import { resolveImagesServer } from '../../../lib/propertyImages/fetchBucketImagesServer';
import type { Metadata } from 'next';

async function fetchBucketImages(propertyId: string): Promise<string[]> {
  try {
    const supabase = createServerSupabase();
    // List folder `${propertyId}/`
    const { data, error } = await supabase.storage.from('property-images').list(propertyId, { limit: 30 });
    if (error || !data) return [];
    // Build public URLs
    const urls: string[] = [];
    for (const f of data) {
      if (!f.name) continue;
      const { data: pub } = supabase.storage.from('property-images').getPublicUrl(`${propertyId}/${f.name}`);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    return urls;
  } catch {
    return [];
  }
}

async function getProperty(id: string) {
  // Construye URL absoluta a /api sin depender de NEXT_PUBLIC_SITE_URL
  const h = headers();
  const host = h.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/properties/${id}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('API error');

  const property = await res.json();

  // Fallback de imágenes: si property.images está vacío, buscar en bucket
  if (!property.images || (Array.isArray(property.images) && property.images.length === 0)) {
    const bucketImages = await fetchBucketImages(id);
    if (bucketImages.length > 0) {
      property.images = bucketImages;
    }
  }

  return property;
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) return notFound();

  // Resolve images for JSON-LD
  const resolvedImages = await resolveImagesServer({
    imagesText: property.images,
    userId: property.userId,
    propertyId: params.id,
  });

  // JSON-LD RealEstateListing schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title ?? 'Propiedad',
    description: (property.description ?? '').toString().slice(0, 160) || 'Detalle de propiedad en Misiones Arrienda',
    image: resolvedImages,
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
      priceCurrency: 'USD',
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const property = await getProperty(params.id);
    if (!property) return { title: 'Propiedad no encontrada', robots: { index: false } };

    const title = `${property.title} – Misiones Arrienda`;
    const rawDesc = (property.description ?? '').toString();
    const description = rawDesc.slice(0, 160) || 'Detalle de propiedad en Misiones Arrienda';

    // Resolve images with priority bucket > API
    const resolvedImages = await resolveImagesServer({
      imagesText: property.images,
      userId: property.userId,
      propertyId: params.id,
    });

    const firstImage = resolvedImages.length > 0 ? resolvedImages[0] : undefined;

    return {
      title,
      description,
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
      alternates: { canonical: `/properties/${params.id}` },
      openGraph: {
        type: 'website',
        url: `/properties/${params.id}`,
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
