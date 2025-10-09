# Secrets Checklist — Misiones Arrienda v1

## 📋 **VARIABLES DE ENTORNO REQUERIDAS**

### **Supabase Configuration**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### **Next.js Public Variables**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **MercadoPago Integration**
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `MP_PUBLIC_KEY`

### **Application Configuration**
- `BASE_URL`
- `VERCEL_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### **Analytics & Monitoring**
- `ANALYTICS_ENCRYPTION_KEY`

### **Email Service (if configured)**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`

## 🔒 **SECURITY NOTES**

- **NEVER** commit actual values to repository
- Use `.env.local` for development
- Use Vercel environment variables for production
- Rotate secrets regularly (quarterly recommended)
- Service role key should only be used server-side
- Webhook secrets must match MercadoPago configuration

## ✅ **DEPLOYMENT CHECKLIST**

### **Staging Environment**
- [ ] All variables present
- [ ] MP_ACCESS_TOKEN in test mode
- [ ] BASE_URL pointing to staging domain
- [ ] SUPABASE_URL pointing to staging database

### **Production Environment**
- [ ] All variables present
- [ ] MP_ACCESS_TOKEN in live mode
- [ ] BASE_URL pointing to production domain
- [ ] SUPABASE_URL pointing to production database
- [ ] All secrets rotated from staging

## 🚨 **CRITICAL SECURITY REQUIREMENTS**

1. **Service Role Key**: Only accessible to server-side code
2. **Webhook Secrets**: Must validate all incoming webhooks
3. **Public Keys**: Safe to expose in client-side code
4. **Database URLs**: Should use SSL connections
5. **API Keys**: Never log or expose in error messages

---

**Last Updated:** January 2025  
**Environment:** Production Ready  
**Status:** ✅ APPROVED FOR RELEASE
