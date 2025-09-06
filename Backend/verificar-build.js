// Script simple para verificar que el build funciona
const { execSync } = require('child_process');

try {
  console.log('🔍 Verificando build de Next.js...');

  // Ejecutar build
  const result = execSync('npm run build', {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log('✅ Build exitoso!');
  console.log('Resultado:', result);

} catch (error) {
  console.log('❌ Error en build:');
  console.log('Código de salida:', error.status);
  console.log('Mensaje:', error.message);
  if (error.stdout) console.log('Stdout:', error.stdout);
  if (error.stderr) console.log('Stderr:', error.stderr);
}
