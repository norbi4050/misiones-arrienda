import { NextResponse } from "next/server";

export async function GET() {
  const keys = ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  return NextResponse.json({ 
    present: Object.fromEntries(keys.map(k => [k, !!process.env[k]])) 
  });
}
