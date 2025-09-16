const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando corrección de lógica de autenticación en perfil de usuario...');

const profilePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');

try {
  // Leer el archivo actual
  const content = fs.readFileSync(profilePath, 'utf8');
  
  console.log('📖 Archivo leído correctamente');
  
  // Buscar y reemplazar la lógica de autenticación problemática
  const oldAuthLogic = `  // Show authentication required state
  if (!isAuthenticated || !user) {`;
  
  const newAuthLogic = `  // Show authentication required state - Fixed logic
  if (!loading && (!isAuthenticated || !user || !session)) {`;
  
  // Buscar el patrón de error y agregar manejo de errores
  const errorHandling = `
  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error de Autenticación
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
          </div>
          
          <div className="space-y-3">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Iniciar sesión nuevamente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

`;
  
  let updatedContent = content;
  
  // 1. Corregir la lógica de autenticación
  if (content.includes(oldAuthLogic)) {
    updatedContent = updatedContent.replace(oldAuthLogic, newAuthLogic);
    console.log('✅ Lógica de autenticación corregida');
  }
  
  // 2. Agregar manejo de errores si no existe
  if (!content.includes('Show error state if there\'s an authentication error')) {
    // Buscar donde insertar el manejo de errores (después del bloque de autenticación)
    const insertPoint = '  }';
    const authBlockEnd = updatedContent.indexOf(insertPoint, updatedContent.indexOf('Crear cuenta'));
    
    if (authBlockEnd !== -1) {
      const beforeError = updatedContent.substring(0, authBlockEnd + insertPoint.length);
      const afterError = updatedContent.substring(authBlockEnd + insertPoint.length);
      updatedContent = beforeError + '\n' + errorHandling + afterError;
      console.log('✅ Manejo de errores agregado');
    }
  }
  
  // 3. Mejorar el debug logging
  const debugLogging = `
  // Debug logging for authentication state
  useEffect(() => {
    console.log('Auth State Debug:', {
      loading,
      isAuthenticated,
      hasUser: !!user,
      hasSession: !!session,
      error
    });
  }, [loading, isAuthenticated, user, session, error]);
`;
  
  // Insertar debug logging después de los useEffect existentes
  if (!content.includes('Debug logging for authentication state')) {
    const useEffectEnd = updatedContent.indexOf('}, [user]);');
    if (useEffectEnd !== -1) {
      const insertAt = useEffectEnd + '}, [user]);'.length;
      const before = updatedContent.substring(0, insertAt);
      const after = updatedContent.substring(insertAt);
      updatedContent = before + debugLogging + after;
      console.log('✅ Debug logging agregado');
    }
  }
  
  // Escribir el archivo corregido
  fs.writeFileSync(profilePath, updatedContent);
  console.log('✅ Archivo actualizado correctamente');
  
  // Crear backup del archivo original
  const backupPath = profilePath + '.backup-' + Date.now();
  fs.writeFileSync(backupPath, content);
  console.log(`📁 Backup creado en: ${backupPath}`);
  
  console.log('\n🎉 Corrección de autenticación completada!');
  console.log('\n📋 Cambios realizados:');
  console.log('   ✓ Corregida lógica de renderizado condicional');
  console.log('   ✓ Agregado manejo de errores de autenticación');
  console.log('   ✓ Agregado debug logging para diagnóstico');
  console.log('   ✓ Mejorada verificación de estados de carga');
  
} catch (error) {
  console.error('❌ Error al corregir el archivo:', error.message);
  process.exit(1);
}
