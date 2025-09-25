# Release Checklist — Misiones Arrienda v1

**Release Tag:** `release/v1-YYYYMMDD-HHMM`  
**Branch:** `feat/reconexion-flow`  
**Target:** Staging → Production  

## ✅ **CÓDIGO**

- [ ] Build limpio sin errores
- [ ] `npm run build` ejecuta correctamente
- [ ] `npm run snapshot:diff` muestra `removed: []` (sin archivos eliminados)
- [ ] Tests unitarios pasan: `npm test`
- [ ] Linting sin errores: `npm run lint`
- [ ] TypeScript compilation sin errores

## ✅ **BASE DE DATOS**

- [ ] Ejecutar `sql-audit/CREATE-USER-CONSENT-TABLE.sql`
- [ ] Ejecutar `sql-audit/CREATE-PAYMENTS-SUBSCRIPTIONS.sql`  
- [ ] Ejecutar `sql-audit/CREATE-ANALYTICS.sql`
- [ ] Ejecutar `sql-audit/CREATE-INDEXES-GEO.sql`
- [ ] Verificar RLS: `sql-audit/VERIFY-RLS.sql`
- [ ] Backup completo de base de datos antes del deploy
- [ ] Migrations son idempotentes (pueden ejecutarse múltiples veces)

## ✅ **VARIABLES DE ENTORNO**

### Staging
- [ ] `SUPABASE_URL` (staging database)
- [ ] `SUPABASE_ANON_KEY` 
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MP_ACCESS_TOKEN` (modo test)
- [ ] `MP_WEBHOOK_SECRET`
- [ ] `BASE_URL` (staging domain)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Production  
- [ ] `SUPABASE_URL` (production database)
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 
- [ ] `MP_ACCESS_TOKEN` (modo live)
- [ ] `MP_WEBHOOK_SECRET`
- [ ] `BASE_URL` (production domain)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ **SEO & ROBOTS**

### Staging
- [ ] `robots.txt` con `Disallow: /` (noindex)
- [ ] Meta robots noindex en páginas principales
- [ ] Sitemap accesible pero no indexable

### Production
- [ ] `robots.txt` permite indexación
- [ ] Meta robots permite indexación  
- [ ] Sitemap.xml accesible y válido
- [ ] JSON-LD structured data en propiedades

## ✅ **ANALYTICS & ADMIN**

- [ ] Panel `/admin/analytics` accesible solo para admin
- [ ] Analytics tracking funcional
- [ ] Privacy controls operativos
- [ ] Consent logging activo
- [ ] Rate limiting configurado

## ✅ **PAGOS & MERCADOPAGO**

### Staging
- [ ] MP_ACCESS_TOKEN en modo test
- [ ] Webhook URL apunta a staging
- [ ] Preferencias de pago en modo sandbox

### Production
- [ ] MP_ACCESS_TOKEN en modo live
- [ ] Webhook URL apunta a producción
- [ ] Preferencias de pago en modo live
- [ ] Webhook signature validation activa

## ✅ **SMOKE TESTS**

- [ ] Security smoke tests: `PASS`
- [ ] Performance tests: `PASS` 
- [ ] SEO checks: `PASS`
- [ ] A11y checks: `PASS`
- [ ] Map functionality: `PASS`
- [ ] Analytics tracking: `PASS`
- [ ] Payment flow: `PASS`

## ✅ **BACKUPS & ROLLBACK**

### Backups
- [ ] Dump lógico de base de datos: `backup-v1-YYYYMMDD.sql`
- [ ] Export de buckets Supabase: `storage-backup-v1-YYYYMMDD/`
- [ ] Snapshot de código: tag `pre-release-v1-YYYYMMDD`
- [ ] Variables de entorno documentadas

### Plan de Rollback
- [ ] Tag git de rollback preparado
- [ ] Script de revert de migraciones
- [ ] Backup de variables de entorno anterior
- [ ] Procedimiento de rollback documentado en `DEPLOY-PLAN.md`

## ✅ **DEPLOYMENT STEPS**

### Staging Deploy
1. [ ] Set environment variables
2. [ ] Run database migrations  
3. [ ] Deploy to Vercel staging
4. [ ] Point MercadoPago webhook to staging
5. [ ] Run smoke tests
6. [ ] Verify functionality

### Production Deploy (if staging OK)
1. [ ] Set production environment variables
2. [ ] Run production migrations (idempotent)
3. [ ] Deploy to Vercel production
4. [ ] Point custom domain
5. [ ] Point MercadoPago webhook to production
6. [ ] Run final smoke tests
7. [ ] Monitor for 30 minutes

## ✅ **POST-DEPLOYMENT**

- [ ] Health checks passing: `/api/health-db`
- [ ] Status page functional: `/status`
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] User acceptance testing completed
- [ ] Stakeholder notification sent

---

**Checklist completed by:** ________________  
**Date:** ________________  
**Approved for production:** ☐ Yes ☐ No  
**Notes:**

_____________________________________
_____________________________________
_____________________________________
