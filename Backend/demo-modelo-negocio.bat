@echo off
echo ========================================
echo   DEMO MODELO DE NEGOCIO - MISIONES ARRIENDA
echo ========================================
echo.
echo FUNCIONALIDADES A PROBAR:
echo ✅ 1. Página principal con propiedades destacadas
echo ✅ 2. Badges "Destacado" rojos (Plan Premium $5.000-$10.000/mes)
echo ✅ 3. Filtros avanzados por tipo, precio, ubicación
echo ✅ 4. Página /publicar con 3 pasos y selección de planes
echo ✅ 5. Formularios de login/register para propietarios
echo ✅ 6. Sistema de consultas en detalles de propiedades
echo.
echo MODELO DE NEGOCIO:
echo 💰 Plan Básico: $0 (Gratis)
echo 💰 Plan Destacado: $5.000/mes (Badge rojo + más visibilidad)
echo 💰 Plan Full: $10.000/mes (Premium + video + agente)
echo.
echo Iniciando servidor...
echo El navegador se abrirá automáticamente en http://localhost:3000
echo.
echo Para detener el servidor presiona Ctrl+C
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000
npm run dev
