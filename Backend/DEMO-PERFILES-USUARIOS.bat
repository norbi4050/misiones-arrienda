@echo off
echo.
echo ========================================
echo   🌟 DEMO: SISTEMA DE PERFILES USUARIOS
echo   Misiones Arrienda - Calificaciones
echo ========================================
echo.

echo 📋 NUEVA FUNCIONALIDAD IMPLEMENTADA:
echo.
echo ✅ Perfiles públicos de inquilinos
echo ✅ Sistema de calificaciones 1-5 estrellas  
echo ✅ Reviews y comentarios de propietarios
echo ✅ Historial de alquileres verificados
echo ✅ Badges de verificación de usuarios
echo ✅ Navegación integrada en navbar
echo.

echo 🚀 INICIANDO SERVIDOR...
echo.

cd /d "%~dp0"

echo 📦 Instalando dependencias...
call npm install > nul 2>&1

echo 🔧 Generando cliente Prisma...
call npx prisma generate > nul 2>&1

echo 🗄️ Actualizando base de datos...
call npx prisma db push > nul 2>&1

echo 🌱 Poblando datos de ejemplo...
call npx tsx prisma/seed-sqlite.ts > nul 2>&1

echo.
echo ✅ SERVIDOR LISTO!
echo.
echo 🌐 PÁGINAS DISPONIBLES:
echo.
echo 📍 Página Principal:     http://localhost:3000
echo 🏠 Propiedades:          http://localhost:3000/properties  
echo 👥 NUEVO - Perfiles:     http://localhost:3000/profiles
echo 👤 Perfil Individual:    http://localhost:3000/profile/1
echo 📝 Publicar:             http://localhost:3000/publicar
echo 🏢 Dashboard:            http://localhost:3000/dashboard
echo.

echo 🎯 TESTING DE PERFILES:
echo.
echo 1️⃣ Ir a http://localhost:3000/profiles
echo    - Ver 4 perfiles de usuarios con calificaciones
echo    - Leer explicación del sistema de reviews
echo    - Observar badges de verificación
echo.
echo 2️⃣ Hacer clic en "Ver Perfil Completo" de cualquier usuario
echo    - Ver perfil detallado con foto y biografía
echo    - Leer reviews de propietarios anteriores  
echo    - Observar sistema de estrellas funcionando
echo.
echo 3️⃣ Verificar navegación desde navbar
echo    - Nuevo enlace "Perfiles" en menú principal
echo    - Funciona en desktop y mobile
echo.

echo 💡 BENEFICIOS IMPLEMENTADOS:
echo.
echo 🏆 Para Propietarios:
echo    - Conocer historial del inquilino
echo    - Leer comentarios de otros propietarios
echo    - Reducir riesgos en alquileres
echo.
echo ⭐ Para Inquilinos:  
echo    - Construir reputación profesional
echo    - Acceso preferencial a propiedades
echo    - Diferenciarse de otros candidatos
echo.

echo 🚀 Iniciando servidor Next.js...
echo.
echo ⚠️  IMPORTANTE: Mantén esta ventana abierta
echo    El servidor se ejecutará en http://localhost:3000
echo.
echo 🔄 Para detener: Presiona Ctrl+C
echo.

start http://localhost:3000/profiles

call npm run dev
