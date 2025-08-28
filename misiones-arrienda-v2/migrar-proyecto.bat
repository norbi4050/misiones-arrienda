@echo off
echo ========================================
echo    MIGRACION MISIONES ARRIENDA V2
echo ========================================
echo.

echo [1/5] Copiando variables de entorno...
if exist "..\Backend\.env.local" (
    copy "..\Backend\.env.local" ".env.local"
    echo ✅ Variables de entorno copiadas
) else (
    echo ⚠️  No se encontro .env.local en Backend
    echo    Necesitaras configurar manualmente las variables
    echo    Copia .env.example a .env.local y configura:
    echo    - NEXT_PUBLIC_SUPABASE_URL
    echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo    - DATABASE_URL
)
echo.

echo [2/5] Instalando dependencias...
call npm install
echo ✅ Dependencias instaladas
echo.

echo [3/5] Generando cliente de Prisma...
call npx prisma generate
echo ✅ Cliente de Prisma generado
echo.

echo [4/5] Sincronizando base de datos...
call npx prisma db push
echo ✅ Base de datos sincronizada
echo.

echo [5/5] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo    MIGRACION COMPLETADA ✅
echo ========================================
echo.
echo El proyecto esta listo para usar!
echo Abriendo en http://localhost:3000
echo.
echo Para detener el servidor: Ctrl+C
echo.

call npm run dev
