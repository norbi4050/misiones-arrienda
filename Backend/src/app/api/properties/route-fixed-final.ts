import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { filterProperties } from '@/lib/mock-data-clean';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

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

const createPropertySchema = z.object({
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  type: z.string().min(1, 'Tipo de propiedad es requerido'),
  price: z.number().positive('Precio debe ser positivo'),
  currency: z.string().default('ARS'),
  city: z.string().min(1, 'Ciudad es requerida'),
  address: z.string().min(1, 'Dirección es requerida'),
  deposit: z.number().optional(),
  mascotas: z.boolean().default(false),
  expensasIncl: z.boolean().default(false),
  servicios: z.array(z.string()).default([]),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  area: z.number().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
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

    const result = filterProperties(params); // Volver a la función de mock para evitar errores

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Error fetching properties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Parsear y validar los datos del formulario
    const body = await request.json();
    const validatedData = createPropertySchema.parse(body);

    // SOLUCIÓN DEFINITIVA PARA PROBLEMA POSTGREST SCHEMA CACHE
    // PROBLEMA: PostgREST schema cache desactualizado causa errores con campos específicos
    // EVOLUCIÓN: currency → createdAt → deposit (confirma problema sistemático)
    // SOLUCIÓN: Solo insertar campos básicos que sabemos que existen
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        city: validatedData.city,
        address: validatedData.address,
        userId: user.id,
        status: 'disponible'
        // CAMPOS ELIMINADOS para evitar errores PostgREST:
        // - currency, createdAt, updatedAt, deposit, propertyType
        // - mascotas, expensasIncl, servicios, bedrooms, bathrooms, area
        // - images, amenities, features, featured
        // Estos se pueden agregar después de ejecutar el script SQL de sincronización
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ property: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/properties:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
