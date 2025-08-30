#!/bin/bash
# Script de testing del servidor Next.js

echo "🚀 INICIANDO TESTING DEL SERVIDOR"
echo "================================="

cd Backend

echo "📦 Instalando dependencias..."
npm install

echo "🔧 Verificando configuración..."
if [ -f ".env.local" ]; then
    echo "✅ Archivo .env.local presente"
else
    echo "❌ Archivo .env.local faltante"
    exit 1
fi

echo "🚀 Iniciando servidor de desarrollo..."
echo "📍 URL: http://localhost:3000"
echo "📍 Formulario: http://localhost:3000/publicar"
echo ""
echo "⚠️  IMPORTANTE: Mantener esta ventana abierta"
echo "⚠️  Para detener el servidor: Ctrl+C"
echo ""

npm run dev
