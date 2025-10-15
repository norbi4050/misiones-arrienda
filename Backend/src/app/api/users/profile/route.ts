// ⬅️ PARCHE DE DIAGNÓSTICO (1 deploy)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // evita caching
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const CUSTOM_AUTH_COOKIE = "misiones-arrienda-auth";

function getChunkAware(store: ReturnType<typeof cookies>, base: string): string | undefined {
  const direct = store.get(base)?.value;
  if (direct) return direct;
  const parts: string[] = [];
  for (let i = 0; i < 12; i++) {
    const v = store.get(`${base}.${i}`)?.value;
    if (!v) break;
    parts.push(v);
  }
  return parts.length ? parts.join("") : undefined;
}

function aliasCookieGet(store: ReturnType<typeof cookies>, name: string) {
  return getChunkAware(store, name) ?? getChunkAware(store, CUSTOM_AUTH_COOKIE);
}

function countChunks(store: ReturnType<typeof cookies>, base: string) {
  let n = 0;
  for (let i = 0; i < 12; i++) {
    if (store.get(`${base}.${i}`)?.value) n++; else break;
  }
  return n;
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
        get: (name: string) => aliasCookieGet(store, name),
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function GET(req: NextRequest) {
  const store = cookies();
  const supabase = getServerSupabase(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  const hdrs = new Headers();
  hdrs.set("x-auth-hdr", String(!!req.headers.get("authorization")));
  hdrs.set("x-cookie-chunks", String(countChunks(store, CUSTOM_AUTH_COOKIE)));
  hdrs.set("x-has-base", String(!!store.get(CUSTOM_AUTH_COOKIE)));
  hdrs.set("x-build", process.env.VERCEL_GIT_COMMIT_SHA || "local");
  hdrs.set("cache-control", "no-store");

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: hdrs });
  }

  return NextResponse.json({ ok: true, userId: user.id }, { headers: hdrs });
}
