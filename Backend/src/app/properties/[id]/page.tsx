import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PropertyDetailClient from './PropertyDetailClient';
import PropertySeo from './PropertySeo';
import { createServerSupabase } from '../../../lib/supabase/server';

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
  return (
    <>
      <PropertySeo property={property} />
      <PropertyDetailClient initialProperty={property} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const property = await getProperty(params.id);
    if (!property) return { title: 'Propiedad no encontrada' };

    const title = `${property.title ?? 'Propiedad'} · ${property.city ?? ''}`.trim();
    const rawDesc = (property.description ?? '').toString();
    const description = rawDesc.slice(0, 160) || 'Detalle de propiedad en Misiones Arrienda';

    // Get first image with fallback to bucket images
    const images: string[] = Array.isArray(property.images) ? property.images : [];
    let firstImage = images[0];

    // If no images in property.images, try to fetch from bucket
    if (!firstImage) {
      const bucketImages = await fetchBucketImages(params.id);
      firstImage = bucketImages[0];
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: firstImage ? [{ url: firstImage }] : undefined,
      },
      twitter: {
        card: firstImage ? 'summary_large_image' : 'summary',
        title,
        description,
        images: firstImage ? [firstImage] : undefined,
      },
    };
  } catch {
    return { title: 'Propiedad | Misiones Arrienda' };
  }
}
