# Quarantine: lib/supabase/browser.ts

**Fecha:** 2025-01-11  
**SHA1:** 22117084948F225C96715D13191D016AE13B529A  
**Razón:** Duplicado de cliente Supabase que crea múltiples instancias de GoTrueClient

## Archivo Original

`lib/supabase/browser.ts` — Cliente browser sin singleton

## Problema Detectado

- ❌ NO implementa patrón singleton
- ❌ NO define `storageKey` (usa default de Supabase)
- ❌ Crea nueva instancia en cada llamada
- ⚠️ Causa warning "Multiple GoTrueClient instances"

## Solución Aplicada

Convertido en shim que reexporta desde `src/lib/supabase/browser.ts` (singleton correcto)

## Rollback

Para revertir:
```bash
cp legacy/_quarantine/20250111-22117084948F225C96715D13191D016AE13B529A/lib-supabase-browser.ts lib/supabase/browser.ts
```

## Referencias

- Reporte Fase 1: `REPORTE-FASE-1-INVESTIGACION-GOTRUECLIENT-DUPLICADO-2025.md`
- Singleton correcto: `src/lib/supabase/browser.ts`
