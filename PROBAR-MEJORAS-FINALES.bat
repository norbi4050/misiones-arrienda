@echo off
echo.
echo ========================================
echo 🚀 PROBANDO MEJORAS FINALES IMPLEMENTADAS
echo ========================================
echo.

echo 📋 MEJORAS IMPLEMENTADAS:
echo ✅ 1. Páginas individuales de propiedades
echo ✅ 2. Toast notifications mejoradas
echo ✅ 3. Loading states profesionales
echo ✅ 4. Mejoras visuales y animaciones
echo ✅ 5. Validación de formularios completa
echo ✅ 6. Sistema de emails mejorado
echo ✅ 7. Búsqueda inteligente avanzada
echo.

echo 🔧 Iniciando servidor de desarrollo...
cd Backend
echo.

echo 📦 Verificando dependencias...
if not exist node_modules (
    echo 📥 Instalando dependencias...
    npm install
)

echo.
echo 🌐 Iniciando servidor en http://localhost:3000
echo.
echo 📋 PÁGINAS PARA PROBAR:
echo.
echo 🏠 Página principal: http://localhost:3000
echo 🔍 Búsqueda inteligente: Prueba escribir "Casa en Posadas"
echo 📝 Login: http://localhost:3000/login
echo 📝 Registro: http://localhost:3000/register
echo 👥 Perfiles: http://localhost:3000/profiles
echo 🏢 Propiedades: Haz clic en cualquier propiedad
echo.
echo 🧪 FUNCIONALIDADES A PROBAR:
echo.
echo ✨ Animaciones y hover effects en las tarjetas
echo 🔄 Loading states en formularios
echo 📧 Toast notifications al enviar formularios
echo 🔍 Sugerencias de búsqueda inteligente
echo 📱 Responsive design en móvil
echo ❤️ Botones de favoritos
echo 📤 Compartir propiedades
echo 💬 Formularios de contacto
echo.
echo ⚠️  NOTA: Presiona Ctrl+C para detener el servidor
echo.

npm run dev

pause
