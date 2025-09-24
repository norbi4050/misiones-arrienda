// DEPRECATED: ver docs/DECISION-DUPLICADOS.md
// Este archivo es una versión legacy mantenida por compatibilidad
// Usar en su lugar: src/lib/supabase/server.ts

"use client";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
