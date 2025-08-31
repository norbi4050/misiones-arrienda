const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE ERRORES DE TYPESCRIPT - BACKEND');
console.log('==================================================\n');

// Verificar si estamos en el directorio correcto
const currentDir = process.cwd();
console.log(`📁 Directorio actual: ${currentDir}`);

// Verificar si existe package.json
const packageJsonPath = path.join(currentDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json encontrado');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log(`📦 Proyecto: ${packageJson.name}`);
        console.log(`🏷️  Versión: ${packageJson.version}`);
        
        // Mostrar scripts disponibles
        if (packageJson.scripts) {
            console.log('\n📜 Scripts disponibles:');
            Object.keys(packageJson.scripts).forEach(script => {
                console.log(`   - ${script}: ${packageJson.scripts[script]}`);
            });
        }
    } catch (error) {
        console.log('❌ Error leyendo package.json:', error.message);
    }
} else {
    console.log('❌ package.json no encontrado');
}

// Verificar si existe tsconfig.json
const tsconfigPath = path.join(currentDir, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
    console.log('✅ tsconfig.json encontrado');
} else {
    console.log('❌ tsconfig.json no encontrado');
}

// Verificar si existe node_modules
const nodeModulesPath = path.join(currentDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules encontrado');
} else {
    console.log('❌ node_modules no encontrado - ejecutar npm install');
}

// Intentar verificar errores de TypeScript
console.log('\n🔧 Intentando verificar errores de TypeScript...\n');

try {
    // Intentar con diferentes comandos
    const commands = [
        'npx tsc --noEmit',
        '.\\node_modules\\.bin\\tsc --noEmit',
        'node_modules\\.bin\\tsc.cmd --noEmit'
    ];
    
    let success = false;
    
    for (const cmd of commands) {
        try {
            console.log(`⚡ Ejecutando: ${cmd}`);
            const output = execSync(cmd, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                timeout: 60000 
            });
            console.log('✅ Compilación exitosa - No hay errores de TypeScript');
            success = true;
            break;
        } catch (error) {
            if (error.stdout || error.stderr) {
                console.log('📋 Errores encontrados:');
                console.log(error.stdout || error.stderr);
                success = true;
                break;
            } else {
                console.log(`❌ Comando falló: ${error.message}`);
            }
        }
    }
    
    if (!success) {
        console.log('\n🔍 Buscando archivos TypeScript para análisis manual...');
        
        // Buscar archivos .ts y .tsx
        function findTSFiles(dir, files = []) {
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    try {
                        const stat = fs.statSync(fullPath);
                        
                        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                            findTSFiles(fullPath, files);
                        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                            files.push(fullPath);
                        }
                    } catch (err) {
                        // Ignorar errores de acceso a archivos
                    }
                }
            } catch (err) {
                console.log(`Error accediendo al directorio ${dir}: ${err.message}`);
            }
            
            return files;
        }
        
        const tsFiles = findTSFiles(currentDir);
        console.log(`📄 Archivos TypeScript encontrados: ${tsFiles.length}`);
        
        if (tsFiles.length > 0) {
            console.log('\n📝 Primeros 10 archivos:');
            tsFiles.slice(0, 10).forEach(file => {
                console.log(`   - ${file.replace(currentDir, '.')}`);
            });
        }
    }
    
} catch (error) {
    console.log('❌ Error general:', error.message);
}

console.log('\n✨ Verificación completada');
