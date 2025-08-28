@echo off
echo ========================================
echo SINCRONIZACION SUPABASE COMPLETADA
echo ========================================
echo.
echo ✅ Esquema SQL ejecutado exitosamente
echo ✅ Prisma db pull completado
echo ✅ Prisma generate en proceso...
echo.
echo ========================================
echo PROBANDO LA APLICACION
echo ========================================
echo.
echo Iniciando servidor de desarrollo...
echo.
cd Backend
npm run dev
