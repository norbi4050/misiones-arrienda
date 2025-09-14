/**
 * 🧪 CONFIGURACIÓN GLOBAL DE TEARDOWN
 */

module.exports = async () => {
  // Limpieza global después de ejecutar todos los tests
  console.log('🧪 Ejecutando limpieza global de tests...');
  
  // Aquí se puede agregar limpieza de recursos globales
  // como cerrar conexiones de base de datos, limpiar archivos temporales, etc.
  
  console.log('✅ Limpieza global completada');
};
