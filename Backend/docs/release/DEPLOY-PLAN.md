# Deployment Plan — Misiones Arrienda v1

**Release Tag:** `release/v1-YYYYMMDD-HHMM`  
**Branch:** `feat/reconexion-flow`  
**Strategy:** Staging → Production (Blue-Green)  

## 🎯 **OVERVIEW**

This deployment plan covers the release of Misiones Arrienda v1 from staging to production environment using Vercel as the hosting platform.

## 📋 **PRE-DEPLOYMENT CHECKLIST**

- [ ] All items in `RELEASE-CHECKLIST.md` completed
- [ ] Release tag created: `scripts/release-tag.ps1`
- [ ] Change report generated: `scripts/change-report-v1.json`
- [ ] Database backup completed
- [ ] Storage backup completed
- [ ] Rollback plan prepared

## 🚀 **STAGING DEPLOYMENT**

### Step 1: Environment Setup
```bash
# Set staging environment variables in Vercel
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key
MP_ACCESS_TOKEN=TEST-staging-token
MP_WEBHOOK_SECRET=staging_webhook_secret
BASE_URL=https://staging.misiones-arrienda.com
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
```

### Step 2: Database Migrations
```sql
-- Execute in staging database
\i sql-audit/CREATE-USER-CONSENT-TABLE.sql
\i sql-audit/CREATE-PAYMENTS-SUBSCRIPTIONS.sql
\i sql-audit/CREATE-ANALYTICS.sql
\i sql-audit/CREATE-INDEXES-GEO.sql
\i sql-audit/VERIFY-RLS.sql
```

### Step 3: Deploy to Vercel Staging
```bash
# Deploy to staging
vercel --prod --env staging
# Or via Vercel dashboard: Deploy from feat/reconexion-flow branch
```

### Step 4: Configure MercadoPago Webhook
```bash
# Point webhook to staging
curl -X PUT https://api.mercadopago.com/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer $MP_ACCESS_TOKEN" \
  -d '{
    "url": "https://staging.misiones-arrienda.com/api/payments/webhook"
  }'
```

### Step 5: Staging Smoke Tests
```powershell
# Run all smoke tests against staging
$env:BASE_URL = "https://staging.misiones-arrienda.com"
powershell -ExecutionPolicy Bypass -File scripts/security-smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-sprint-d.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-analytics.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-map.ps1
```

### Step 6: Staging Validation
- [ ] Health check: `GET /api/health-db` returns 200
- [ ] Status page: `GET /status` functional
- [ ] Security smoke tests: PASS
- [ ] Performance acceptable (< 2s TTFB)
- [ ] SEO meta tags present
- [ ] Analytics tracking functional
- [ ] Payment flow working (test mode)
- [ ] Map functionality operational

---

## 🌟 **PRODUCTION DEPLOYMENT** (Execute only if staging OK)

### Step 1: Production Environment Setup
```bash
# Set production environment variables in Vercel
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key
MP_ACCESS_TOKEN=APP_USR-prod-live-token
MP_WEBHOOK_SECRET=prod_webhook_secret
BASE_URL=https://misiones-arrienda.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
```

### Step 2: Production Database Migrations (Idempotent)
```sql
-- Execute in production database (idempotent)
\i sql-audit/CREATE-USER-CONSENT-TABLE.sql
\i sql-audit/CREATE-PAYMENTS-SUBSCRIPTIONS.sql
\i sql-audit/CREATE-ANALYTICS.sql
\i sql-audit/CREATE-INDEXES-GEO.sql
\i sql-audit/VERIFY-RLS.sql
```

### Step 3: Deploy to Vercel Production
```bash
# Deploy to production
vercel --prod --env production
# Or via Vercel dashboard: Deploy from feat/reconexion-flow branch to production
```

### Step 4: Configure Custom Domain
```bash
# Point custom domain to production deployment
# Via Vercel dashboard: Add domain misiones-arrienda.com
# Configure DNS: CNAME misiones-arrienda.com -> cname.vercel-dns.com
```

### Step 5: Configure Production MercadoPago Webhook
```bash
# Point webhook to production
curl -X PUT https://api.mercadopago.com/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer $MP_ACCESS_TOKEN" \
  -d '{
    "url": "https://misiones-arrienda.com/api/payments/webhook"
  }'
```

### Step 6: Production Smoke Tests
```powershell
# Run all smoke tests against production
$env:BASE_URL = "https://misiones-arrienda.com"
powershell -ExecutionPolicy Bypass -File scripts/security-smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-sprint-d.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-analytics.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests-map.ps1
```

### Step 7: Production Validation
- [ ] Health check: `GET /api/health-db` returns 200
- [ ] Status page: `GET /status` functional
- [ ] Custom domain resolves correctly
- [ ] SSL certificate active
- [ ] Security smoke tests: PASS
- [ ] Performance acceptable (< 1.5s TTFB)
- [ ] SEO indexable (robots.txt allows)
- [ ] Analytics tracking functional
- [ ] Payment flow working (live mode)
- [ ] Map functionality operational
- [ ] All critical user journeys working

### Step 8: Post-Deployment Monitoring (30 minutes)
- [ ] Error rate < 1%
- [ ] Response time < 2s average
- [ ] No critical errors in logs
- [ ] Database connections stable
- [ ] Payment webhooks processing
- [ ] Analytics events flowing

---

## 🔄 **ROLLBACK PLAN**

### Immediate Rollback (< 5 minutes)
```bash
# Revert to previous Vercel deployment
vercel rollback --url misiones-arrienda.com

# Or via Vercel dashboard: 
# Go to Deployments → Select previous stable deployment → Promote to Production
```

### Database Rollback (if needed)
```sql
-- Restore from backup (if migrations need rollback)
pg_restore --clean --no-acl --no-owner -h prod-host -U postgres -d prod_db backup-pre-v1.sql
```

### Environment Variables Rollback
```bash
# Restore previous environment variables from backup
# Via Vercel dashboard: Environment Variables → Restore from backup
```

### MercadoPago Webhook Rollback
```bash
# Point webhook back to previous URL
curl -X PUT https://api.mercadopago.com/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer $MP_ACCESS_TOKEN" \
  -d '{
    "url": "https://previous-version.misiones-arrienda.com/api/payments/webhook"
  }'
```

---

## 📊 **SUCCESS CRITERIA**

### Technical Metrics
- [ ] Uptime > 99.9%
- [ ] Response time < 1.5s (P95)
- [ ] Error rate < 0.5%
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Business Metrics
- [ ] Property search functional
- [ ] User registration working
- [ ] Payment processing operational
- [ ] Message system active
- [ ] Analytics data flowing

### Security Metrics
- [ ] All security endpoints return 401/403 without auth
- [ ] RLS policies enforced
- [ ] Rate limiting active
- [ ] File upload validation working

---

## 📞 **EMERGENCY CONTACTS**

- **DevOps Lead:** [Contact Info]
- **Database Admin:** [Contact Info]  
- **MercadoPago Support:** [Contact Info]
- **Vercel Support:** [Contact Info]

---

## 📝 **DEPLOYMENT LOG**

| Step | Status | Time | Notes |
|------|--------|------|-------|
| Staging Deploy | ⏳ | | |
| Staging Tests | ⏳ | | |
| Production Deploy | ⏳ | | |
| Production Tests | ⏳ | | |
| Monitoring | ⏳ | | |

**Deployment completed by:** ________________  
**Date:** ________________  
**Final Status:** ☐ Success ☐ Rollback Required  
**Notes:**

_____________________________________
_____________________________________
