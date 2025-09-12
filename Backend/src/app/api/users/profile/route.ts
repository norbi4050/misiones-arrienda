// src/app/api/users/profile/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

// Cliente con privilegios de servicio para operaciones administrativas
function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, will use fallback methods');
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
}

export async function GET(_req: NextRequest) {
  const supabase = await getServerSupabase();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("User")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error fetching profile:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // If profile exists, return it
    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile }, { status: 200 });
    }

    // Profile doesn't exist, create it automatically
    console.log('Profile not found for user:', user.id, 'Creating new profile...');
    
    const newProfile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      email: user.email!,
      phone: user.user_metadata?.phone || '',
      password: '', // Not stored in our User table for Supabase auth users
      avatar: user.user_metadata?.avatar_url || null,
      bio: null,
      occupation: null,
      age: null,
      verified: user.email_confirmed_at ? true : false,
      emailVerified: user.email_confirmed_at ? true : false,
      verificationToken: null,
      rating: 0,
      reviewCount: 0,
      userType: null,
      companyName: null,
      licenseNumber: null,
      propertyCount: null,
      createdAt: new Date(user.created_at),
      updatedAt: new Date()
    };

    // Try multiple approaches for profile creation
    let createdProfile = null;
    let lastError = null;

    // Approach 1: Try with service role client if available
    const serviceSupabase = getServiceSupabase();
    if (serviceSupabase) {
      try {
        console.log('Creating profile with service role for user:', user.id);
        
        const { data, error } = await serviceSupabase
          .from("User")
          .insert(newProfile)
          .select()
          .single();

        if (!error) {
          console.log('Profile created successfully with service role for user:', user.id);
          return NextResponse.json({ profile: data }, { status: 201 });
        }
        
        console.warn('Service role profile creation failed:', error.message);
        lastError = error;
      } catch (serviceError) {
        console.warn('Service client error:', serviceError);
        lastError = serviceError;
      }
    }

    // Approach 2: Try with regular authenticated client
    try {
      console.log('Attempting profile creation with regular client for user:', user.id);
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from("User")
        .insert(newProfile)
        .select()
        .single();
        
      if (!fallbackError) {
        console.log('Profile created successfully with regular client for user:', user.id);
        return NextResponse.json({ profile: fallbackProfile }, { status: 201 });
      }
      
      console.warn('Regular client profile creation failed:', fallbackError.message);
      lastError = fallbackError;
    } catch (regularError) {
      console.warn('Regular client error:', regularError);
      lastError = regularError;
    }

    // All methods failed - provide detailed error response
    console.error('All profile creation methods failed for user:', user.id, 'Last error:', lastError);
    
    const errorMessage = lastError instanceof Error ? lastError.message : 
                        (lastError as any)?.message || 'Unknown error';
    
    if (errorMessage.includes('permission denied')) {
      return NextResponse.json({
        error: 'Permission denied: Unable to create user profile. This may be due to database Row Level Security policies.',
        details: errorMessage,
        suggestion: 'Please contact support or check database permissions.'
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: `Failed to create profile: ${errorMessage}`,
      details: 'All creation methods failed'
    }, { status: 500 });

  } catch (error) {
    console.error('Unexpected error in profile GET:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await getServerSupabase();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: any = {};
    try { 
      body = await req.json(); 
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Transform data types to match database schema
    const transformedBody: any = { ...body };

    // Convert familySize to integer
    if (transformedBody.familySize !== undefined) {
      if (transformedBody.familySize === "") {
        transformedBody.family_size = null;
      } else {
        const familySizeNum = parseInt(transformedBody.familySize);
        transformedBody.family_size = isNaN(familySizeNum) ? null : familySizeNum;
      }
      delete transformedBody.familySize;
    }

    // Convert petFriendly to boolean
    if (transformedBody.petFriendly !== undefined) {
      transformedBody.pet_friendly = transformedBody.petFriendly === "true" || transformedBody.petFriendly === true;
      delete transformedBody.petFriendly;
    }

    // Convert moveInDate to date or null
    if (transformedBody.moveInDate !== undefined) {
      if (transformedBody.moveInDate === "" || transformedBody.moveInDate === "flexible") {
        transformedBody.move_in_date = null;
      } else {
        // Try to parse the date, if it fails, set to null
        const date = new Date(transformedBody.moveInDate);
        transformedBody.move_in_date = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      }
      delete transformedBody.moveInDate;
    }

    // Convert monthlyIncome to numeric
    if (transformedBody.monthlyIncome !== undefined) {
      if (transformedBody.monthlyIncome === "") {
        transformedBody.monthly_income = null;
      } else {
        // Remove any non-numeric characters except decimal point
        const cleanIncome = transformedBody.monthlyIncome.toString().replace(/[^\d.]/g, '');
        const incomeNum = parseFloat(cleanIncome);
        transformedBody.monthly_income = isNaN(incomeNum) ? null : incomeNum;
      }
      delete transformedBody.monthlyIncome;
    }

    // Rename camelCase fields to snake_case
    if (transformedBody.searchType !== undefined) {
      transformedBody.search_type = transformedBody.searchType;
      delete transformedBody.searchType;
    }

    if (transformedBody.budgetRange !== undefined) {
      transformedBody.budget_range = transformedBody.budgetRange;
      delete transformedBody.budgetRange;
    }

    if (transformedBody.profileImage !== undefined) {
      transformedBody.profile_image = transformedBody.profileImage;
      delete transformedBody.profileImage;
    }

    if (transformedBody.preferredAreas !== undefined) {
      transformedBody.preferred_areas = transformedBody.preferredAreas;
      delete transformedBody.preferredAreas;
    }

    if (transformedBody.employmentStatus !== undefined) {
      transformedBody.employment_status = transformedBody.employmentStatus;
      delete transformedBody.employmentStatus;
    }

    // Ensure we have required fields for upsert
    const payload = { 
      id: user.id, 
      email: user.email!,
      name: transformedBody.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      phone: transformedBody.phone || user.user_metadata?.phone || '',
      password: '', // Not used for Supabase auth users
      updatedAt: new Date(),
      ...transformedBody 
    };

    const { data, error } = await supabase
      .from("User")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ profile: data }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in profile PUT:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // PATCH uses the same logic as PUT for this implementation
  return PUT(req);
}
