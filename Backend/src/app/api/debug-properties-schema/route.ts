import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    
    // Get actual columns from properties table
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 });
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      available_columns: columns,
      has_cover_url: columns.includes('cover_url'),
      sample_property: data?.[0] || null
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 });
  }
}
