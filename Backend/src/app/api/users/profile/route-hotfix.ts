// --- route.ts (HOTFIX) ---
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const AUTH_COOKIE = "misiones-arrienda-auth";   // tu storageKey

function getChunkAware(store: ReturnType<typeof cookies>, base: string) {
  const baseVal = store.get(base)?.value;
  if (baseVal) return baseVal;
  const parts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const v = store.get(`${base}.${i}`)?.value;
    if (!v) break;
    parts.push(v);
  }
  return parts.length ? parts.join("") : undefined;
}

function getServerSupabase(req: NextRequest) {
  const store = cookies();
  const authHeader = req.headers.get("authorization") ?? undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
      cookies: {
        get: (name: string) => getChunkAware(store, name),
        set: () => {},   // no-op para este handler
        remove: () => {},
      },
    }
  );
}

// Asegurá que NO haya `export const runtime = 'edge'` en este archivo.

export async function GET(req: NextRequest) {
  const store = cookies();
  const supabase = getServerSupabase(req);

  const { data: { user }, error } = await supabase.auth.getUser();

  // Headers diagnósticos NO sensibles (ayuda a validar deploy)
  const diagnostics = new Headers();
  diagnostics.set("x-auth-hdr", String(!!req.headers.get("authorization")));
  
  let chunkCount = 0;
  for (let i = 0; i < 12; i++) {
    if (store.get(`${AUTH_COOKIE}.${i}`)?.value) chunkCount++;
  }
  
  diagnostics.set("x-cookie-chunks", String(chunkCount));
  diagnostics.set("x-build", process.env.VERCEL_GIT_COMMIT_SHA || "local");

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: diagnostics });
  }
  return NextResponse.json({ ok: true, userId: user.id }, { headers: diagnostics });
}
