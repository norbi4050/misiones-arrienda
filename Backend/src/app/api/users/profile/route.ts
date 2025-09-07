// src/app/api/users/profile/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Next 13/14: set acepta objeto con name/value/opciones
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // eliminar = set con maxAge pasado
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function GET(_req: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile: data }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  const payload = { id: session.user.id, ...body };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data }, { status: 200 });
}
