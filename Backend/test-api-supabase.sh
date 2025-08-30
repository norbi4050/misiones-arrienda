#!/bin/bash
# Script de testing API con Supabase
# Proyecto: Misiones Arrienda

echo "🧪 TESTING API PROPERTIES CON SUPABASE"
echo "======================================"

# Variables
BASE_URL="http://localhost:3000"
SUPABASE_URL="https://qfeyhaaxyemmnohqdele.supabase.co"

echo "📊 Base URL: $BASE_URL"
echo "📊 Supabase URL: $SUPABASE_URL"

# Test 1: Verificar que el servidor esté corriendo
echo ""
echo "🔌 Test 1: Verificando servidor local..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" || echo "❌ Servidor no disponible"

# Test 2: Probar endpoint GET /api/properties
echo ""
echo "📡 Test 2: GET /api/properties"
curl -X GET "$BASE_URL/api/properties" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" || echo "❌ Error en GET"

# Test 3: Probar endpoint POST /api/properties
echo ""
echo "📡 Test 3: POST /api/properties (con contact_phone)"
curl -X POST "$BASE_URL/api/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Casa Test API Supabase",
    "description": "Propiedad de prueba para testing API con Supabase",
    "price": 180000,
    "currency": "ARS",
    "type": "HOUSE",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 140,
    "address": "Av. API Test 789",
    "city": "Posadas",
    "contact_phone": "+54 376 555123",
    "amenities": ["Piscina", "Jardín"],
    "images": []
  }' \
  -w "\nStatus: %{http_code}\n" || echo "❌ Error en POST"

# Test 4: Verificar en Supabase Dashboard
echo ""
echo "📊 Test 4: Verificación manual requerida"
echo "1. Abrir: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele/editor"
echo "2. Ir a la tabla 'Property'"
echo "3. Verificar que se crearon los registros de prueba"
echo "4. Confirmar que el campo 'contact_phone' tiene valores"

echo ""
echo "✅ Tests de API completados"
echo "📋 Revisar los códigos de estado HTTP arriba"
echo "📋 200/201 = Éxito, 4xx/5xx = Error"
