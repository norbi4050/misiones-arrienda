import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { filterProperties } from '@/lib/mock-data-clean';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  city: z.string().optional(),
  province: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  maxBedrooms: z.coerce.number().optional(),
  minBathrooms: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = searchSchema.parse({
      city: searchParams.get('city') || undefined,
      province: searchParams.get('province') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      minBedrooms: searchParams.get('minBedrooms') || undefined,
      maxBedrooms: searchParams.get('maxBedrooms') || undefined,
      minBathrooms: searchParams.get('minBathrooms') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      featured: searchParams.get('featured') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 12,
    });

    // Use mock data instead of database
    const result = filterProperties(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Error fetching properties' }, { status: 500 });
  }
}
