@echo off
echo ========================================
echo SOLUCION PROBLEMA PUBLICAR - FINAL
echo ========================================
echo.
echo PROBLEMA IDENTIFICADO Y SOLUCIONADO:
echo - Desajuste entre nombres de campos API vs Schema
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
echo AHORA PUEDES PROBAR PUBLICAR UNA PROPIEDAD
echo.
npm run dev
