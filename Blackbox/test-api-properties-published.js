#!/usr/bin/env node

/**
 * BLACKBOX - TEST API PROPERTIES CON DATOS PUBLISHED
 * Script para probar /api/properties después de insertar datos de prueba
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/properties';

console.log('🧪 BLACKBOX - TEST API PROPERTIES CON DATOS PUBLISHED\n');

// Función para hacer request HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Función principal de test
async function testAPI() {
  try {
    console.log(`🌐 Probando endpoint: ${BASE_URL}${API_ENDPOINT}`);
    console.log('⏳ Realizando petición...\n');

    const response = await makeRequest(`${BASE_URL}${API_ENDPOINT}`);

    console.log(`📊 STATUS CODE: ${response.status}`);

    if (response.status === 200) {
      console.log('✅ API RESPONDIENDO CORRECTAMENTE\n');

      // Verificar estructura de respuesta
      if (response.data && typeof response.data === 'object') {
        console.log('📋 ESTRUCTURA DE RESPUESTA:');

        if (response.data.properties) {
          console.log(`   🏠 Propiedades encontradas: ${response.data.properties.length}`);

          if (response.data.properties.length > 0) {
            console.log('   📝 Primera propiedad:');
            const firstProp = response.data.properties[0];
            console.log(`      🆔 ID: ${firstProp.id}`);
            console.log(`      📍 Ciudad: ${firstProp.city}`);
            console.log(`      🏷️  Tipo: ${firstProp.propertyType}`);
            console.log(`      💰 Precio: ${firstProp.price} ${firstProp.currency}`);
            console.log(`      📊 Status: ${firstProp.status}`);
            console.log(`      📅 Creado: ${firstProp.createdAt}`);
          } else {
            console.log('   ⚠️  No se encontraron propiedades (posible problema de RLS)');
          }
        }

        if (response.data.pagination) {
          console.log(`   📄 Paginación: Página ${response.data.pagination.page} de ${response.data.pagination.totalPages}`);
          console.log(`   📊 Total de propiedades: ${response.data.pagination.total}`);
        }

        if (response.data.meta) {
          console.log(`   🔧 Data Source: ${response.data.meta.dataSource}`);
          console.log(`   🔍 Filtros aplicados: ${JSON.stringify(response.data.meta.filters)}`);
        }

        console.log('\n📤 RESPUESTA COMPLETA:');
        console.log(JSON.stringify(response.data, null, 2));

      } else {
        console.log('⚠️  Respuesta no tiene estructura esperada');
        console.log('Respuesta:', response.data);
      }

    } else {
      console.log('❌ ERROR EN LA API');
      console.log('Respuesta:', response.data);
    }

  } catch (error) {
    console.log('❌ ERROR DE CONEXIÓN:');
    console.log('Error:', error.message);
    console.log('\n💡 POSIBLES CAUSAS:');
    console.log('   - El servidor no está ejecutándose');
    console.log('   - Puerto incorrecto (verificar que sea 3000)');
    console.log('   - Problemas de red o firewall');
  }
}

// Ejecutar test
testAPI().then(() => {
  console.log('\n✨ TEST COMPLETADO');
}).catch((error) => {
  console.log('\n❌ ERROR INESPERADO:', error);
});
