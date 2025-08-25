import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

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

    // Build where clause for filtering
    const where: any = {};
    
    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }
    
    if (params.province) {
      where.province = { contains: params.province, mode: 'insensitive' };
    }
    
    if (params.minPrice || params.maxPrice) {
      where.price = {};
      if (params.minPrice) where.price.gte = params.minPrice;
      if (params.maxPrice) where.price.lte = params.maxPrice;
    }
    
    if (params.minBedrooms || params.maxBedrooms) {
      where.bedrooms = {};
      if (params.minBedrooms) where.bedrooms.gte = params.minBedrooms;
      if (params.maxBedrooms) where.bedrooms.lte = params.maxBedrooms;
    }
    
    if (params.minBathrooms) {
      where.bathrooms = { gte: params.minBathrooms };
    }
    
    if (params.propertyType) {
      where.propertyType = params.propertyType;
    }
    
    if (params.featured !== undefined) {
      where.featured = params.featured;
    }

    // Get total count for pagination
    const total = await prisma.property.count({ where });
    
    // Calculate pagination
    const pages = Math.ceil(total / params.limit);
    const skip = (params.page - 1) * params.limit;
    
    // Get properties with pagination
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: [
        { featured: 'desc' }, // Featured properties first
        { createdAt: 'desc' }  // Then by newest
      ],
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    const result = {
      properties,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Error fetching properties' }, { status: 500 });
  }
}
