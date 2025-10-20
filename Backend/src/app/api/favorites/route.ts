import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Obtener favoritos con datos completos de propiedades
    // Usar nombre explícito del FK (favorites_property_id_fkey)
    const { data, error } = await supabase
      .from("favorites")
      .select(`
        property_id,
        properties!favorites_property_id_fkey (
          id,
          title,
          price,
          currency,
          property_type,
          bedrooms,
          bathrooms,
          area,
          address,
          city,
          latitude,
          longitude,
          images,
          cover_path,
          featured,
          status,
          created_at,
          updated_at,
          user_id
        )
      `)
      .eq("user_id", user.id)
      .eq("properties.status", "PUBLISHED");

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Formatear propiedades con cover_url resuelto
    const properties = (data ?? []).map((fav: any) => {
      const property = Array.isArray(fav.properties) ? fav.properties[0] : fav.properties;
      
      // Aplicar regla de prioridad cover_url
      let imageUrls = [];
      try {
        imageUrls = property.images && typeof property.images === 'string' 
          ? JSON.parse(property.images) 
          : Array.isArray(property.images) 
            ? property.images 
            : [];
      } catch (e) {
        console.warn('Error parsing images for property:', property.id);
        imageUrls = [];
      }

      // Construir cover_url desde cover_path o usar primera imagen
      const cover_url = property.cover_path 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${property.cover_path}`
        : imageUrls?.[0] ?? '/placeholder-apartment-1.jpg';

      return {
        id: property.id,
        title: property.title,
        price: property.price,
        currency: property.currency || 'ARS',
        propertyType: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        address: property.address,
        city: property.city,
        latitude: property.latitude,
        longitude: property.longitude,
        images: imageUrls,
        cover_url: cover_url,
        featured: property.featured,
        status: property.status,
        created_at: property.created_at,
        updated_at: property.updated_at,
        user_id: property.user_id
      };
    });

    return NextResponse.json({
      ok: true,
      properties: properties,
      propertyIds: properties.map((p: any) => p.id), // FIX: Add propertyIds array for FavoriteButton
      count: properties.length
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { propertyId } = body;
    
    // Validar que propertyId esté presente
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json({ error: "propertyId must be a valid UUID" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Verificar que la propiedad existe y está activa
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, user_id, status")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Verificar que la propiedad esté activa/disponible
    if (!['PUBLISHED', 'AVAILABLE'].includes(property.status)) {
      return NextResponse.json({ error: "Property is not available for favorites" }, { status: 400 });
    }

    // Verificar que el usuario no sea el propietario
    if (property.user_id === user.id) {
      return NextResponse.json({ error: "Cannot favorite your own property" }, { status: 400 });
    }

    // Intentar insertar el favorito
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, property_id: propertyId })
      .select("id")  // Force error if RLS fails
      .single();

    // Manejar error de clave duplicada (ya está en favoritos)
    if (error && /duplicate key value/.test(error.message)) {
      // Ya existe, esto está bien - devolver éxito (idempotente)
      return NextResponse.json({ ok: true, message: "Property already in favorites" });
    }

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Property added to favorites" });
  } catch (error) {
    console.error('Unexpected error in POST /api/favorites:', error);
    
    // Manejar error de JSON malformado
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
