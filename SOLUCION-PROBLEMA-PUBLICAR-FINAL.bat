@echo off
echo ========================================
echo SOLUCION PROBLEMA PUBLICAR - FINAL
echo ========================================
echo.
echo PROBLEMA IDENTIFICADO Y SOLUCIONADO:
echo - Error PostgREST: campo currency no encontrado
echo - Tabla "Property" vs "properties" (mayusculas/minusculas)
echo - API corregida para usar tabla "properties"
echo - "deposito" corregido a "deposit"
echo - "user_id" corregido a "userId"
echo.
echo PASO 1: Navegando a Backend...
cd Backend
echo.
echo PASO 2: Regenerando cliente Prisma...
npx prisma generate
echo.
echo PASO 3: Iniciando servidor...
echo.
echo ========================================
echo INSTRUCCIONES ADICIONALES:
echo ========================================
echo.
echo Si aun tienes problemas con el campo currency:
echo 1. Ve a tu dashboard de Supabase
echo 2. Ejecuta el script SQL: SOLUCION-SUPABASE-CURRENCY-FIELD-FINAL.sql
echo 3. O ve a Settings - Data API - Reload schema cache
echo.
echo AHORA PUEDES PROBAR PUBLICAR UNA PROPIEDAD
echo.
npm run dev
