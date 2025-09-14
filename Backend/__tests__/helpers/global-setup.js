/**
 * 🧪 CONFIGURACIÓN GLOBAL DE SETUP
 */

module.exports = async () => {
  // Configuración global antes de ejecutar todos los tests
  console.log('🧪 Iniciando configuración global de tests...');
  
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  
  console.log('✅ Configuración global completada');
};
