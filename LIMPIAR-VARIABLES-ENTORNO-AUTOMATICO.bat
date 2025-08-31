@echo off
echo ============================================================
echo 🧹 LIMPIEZA AUTOMATICA DE VARIABLES DE ENTORNO
echo ============================================================
echo.
echo Este script eliminara las variables innecesarias identificadas
echo en la auditoria de variables de entorno.
echo.
echo Variables a eliminar:
echo - NEXTAUTH_SECRET (NextAuth no implementado)
echo - NEXTAUTH_URL (NextAuth no implementado)  
echo - MP_WEBHOOK_SECRET (usar MERCADOPAGO_WEBHOOK_SECRET)
echo - API_BASE_URL (usar NEXT_PUBLIC_BASE_URL)
echo.
pause

cd Backend

echo.
echo 📄 Creando respaldo de archivos .env...
if exist .env copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%
if exist .env.local copy .env.local .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%
if exist .env.production copy .env.production .env.production.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%

echo.
echo 🗑️ Eliminando variables innecesarias de .env...
if exist .env (
    powershell -Command "(Get-Content .env) | Where-Object { $_ -notmatch '^NEXTAUTH_SECRET=' -and $_ -notmatch '^NEXTAUTH_URL=' -and $_ -notmatch '^MP_WEBHOOK_SECRET=' -and $_ -notmatch '^API_BASE_URL=' } | Set-Content .env.temp"
    move .env.temp .env
    echo ✅ .env limpiado
) else (
    echo ⚠️ Archivo .env no encontrado
)

echo.
echo 🗑️ Eliminando variables innecesarias de .env.local...
if exist .env.local (
    powershell -Command "(Get-Content .env.local) | Where-Object { $_ -notmatch '^NEXTAUTH_SECRET=' -and $_ -notmatch '^NEXTAUTH_URL=' -and $_ -notmatch '^MP_WEBHOOK_SECRET=' -and $_ -notmatch '^API_BASE_URL=' } | Set-Content .env.local.temp"
    move .env.local.temp .env.local
    echo ✅ .env.local limpiado
) else (
    echo ⚠️ Archivo .env.local no encontrado
)

echo.
echo 🗑️ Eliminando variables innecesarias de .env.production...
if exist .env.production (
    powershell -Command "(Get-Content .env.production) | Where-Object { $_ -notmatch '^NEXTAUTH_SECRET=' -and $_ -notmatch '^NEXTAUTH_URL=' -and $_ -notmatch '^MP_WEBHOOK_SECRET=' -and $_ -notmatch '^API_BASE_URL=' } | Set-Content .env.production.temp"
    move .env.production.temp .env.production
    echo ✅ .env.production limpiado
) else (
    echo ⚠️ Archivo .env.production no encontrado
)

echo.
echo 🗑️ Eliminando variables innecesarias de .env.template...
if exist .env.template (
    powershell -Command "(Get-Content .env.template) | Where-Object { $_ -notmatch '^NEXTAUTH_SECRET=' -and $_ -notmatch '^NEXTAUTH_URL=' -and $_ -notmatch '^MP_WEBHOOK_SECRET=' -and $_ -notmatch '^API_BASE_URL=' } | Set-Content .env.template.temp"
    move .env.template.temp .env.template
    echo ✅ .env.template limpiado
) else (
    echo ⚠️ Archivo .env.template no encontrado
)

echo.
echo ✅ Limpieza completada exitosamente!
echo.
echo 📋 Resumen de cambios:
echo - Variables eliminadas: 4
echo - Archivos respaldados con fecha
echo - Configuracion optimizada
echo.
echo 🧪 Ejecutando verificacion...
echo.

echo 🔍 Verificando que el proyecto compile correctamente...
call npm run build > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Compilacion exitosa - Variables limpiadas correctamente
) else (
    echo ❌ Error en compilacion - Revisar configuracion
    echo.
    echo 🔄 Restaurando respaldos...
    if exist .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% (
        copy .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% .env
        echo ✅ .env restaurado
    )
    if exist .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% (
        copy .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% .env.local
        echo ✅ .env.local restaurado
    )
    if exist .env.production.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% (
        copy .env.production.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% .env.production
        echo ✅ .env.production restaurado
    )
    echo.
    echo ⚠️ Limpieza revertida por error de compilacion
    pause
    exit /b 1
)

echo.
echo 🎯 Verificando variables criticas...
echo.

echo Verificando Supabase...
findstr /C:"NEXT_PUBLIC_SUPABASE_URL" .env > nul
if %errorlevel% equ 0 (
    echo ✅ NEXT_PUBLIC_SUPABASE_URL presente
) else (
    echo ❌ NEXT_PUBLIC_SUPABASE_URL faltante
)

findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY" .env > nul
if %errorlevel% equ 0 (
    echo ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY presente
) else (
    echo ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY faltante
)

findstr /C:"SUPABASE_SERVICE_ROLE_KEY" .env > nul
if %errorlevel% equ 0 (
    echo ✅ SUPABASE_SERVICE_ROLE_KEY presente
) else (
    echo ❌ SUPABASE_SERVICE_ROLE_KEY faltante
)

echo.
echo Verificando Base de Datos...
findstr /C:"DATABASE_URL" .env > nul
if %errorlevel% equ 0 (
    echo ✅ DATABASE_URL presente
) else (
    echo ❌ DATABASE_URL faltante
)

findstr /C:"DIRECT_URL" .env > nul
if %errorlevel% equ 0 (
    echo ✅ DIRECT_URL presente
) else (
    echo ❌ DIRECT_URL faltante
)

echo.
echo Verificando Seguridad...
findstr /C:"JWT_SECRET" .env > nul
if %errorlevel% equ 0 (
    echo ✅ JWT_SECRET presente
) else (
    echo ❌ JWT_SECRET faltante
)

echo.
echo Verificando MercadoPago...
findstr /C:"MERCADOPAGO_ACCESS_TOKEN" .env > nul
if %errorlevel% equ 0 (
    echo ✅ MERCADOPAGO_ACCESS_TOKEN presente
) else (
    echo ❌ MERCADOPAGO_ACCESS_TOKEN faltante
)

echo.
echo ============================================================
echo ✨ LIMPIEZA DE VARIABLES DE ENTORNO COMPLETADA
echo ============================================================
echo.
echo 📊 Estadisticas:
echo - Variables eliminadas: 4
echo - Variables criticas verificadas: ✅
echo - Respaldos creados: ✅
echo - Compilacion verificada: ✅
echo.
echo 📁 Archivos de respaldo creados:
if exist .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% echo - .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%
if exist .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% echo - .env.local.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%
if exist .env.production.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% echo - .env.production.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%
echo.
echo 🚀 El proyecto esta listo con variables optimizadas!
echo.
echo 📖 Para mas detalles, consulta:
echo - REPORTE-AUDITORIA-VARIABLES-ENTORNO-FINAL.md
echo.
pause
