@echo off
echo ========================================
echo SOLUCION DEFINITIVA CURRENCY FIELD
echo ========================================
echo.
echo El problema de currency se debe a que el cliente de Prisma
echo no esta sincronizado con la base de datos de Supabase.
echo.
echo PASO 1: Navegando a la carpeta Backend...
cd Backend
echo.
echo PASO 2: Sincronizando schema desde Supabase...
npx prisma db pull
echo.
echo PASO 3: Generando cliente de Prisma...
npx prisma generate
echo.
echo PASO 4: Probando la aplicacion...
echo Iniciando servidor de desarrollo...
npm run dev
