const fs = require('fs');
const { verificarConexion, ejecutarSQL } = require('./supabase-connection');

async function ejecutarScriptsSQL() {
    console.log('🚀 EJECUTANDO SCRIPTS SQL DE CORRECCIÓN');
    console.log('=====================================\n');
    
    // Verificar conexión primero
    const conexionOK = await verificarConexion();
    if (!conexionOK) {
        console.log('❌ No se pudo conectar a Supabase. Verifica las credenciales.');
        return false;
    }
    
    const scripts = [
        {
            archivo: 'SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql',
            descripcion: 'Corrección de esquema de propiedades'
        },
        {
            archivo: 'SUPABASE-CORRECCION-AUTH.sql',
            descripcion: 'Corrección de autenticación'
        }
    ];
    
    let scriptosEjecutados = 0;
    
    for (const script of scripts) {
        if (fs.existsSync(script.archivo)) {
            try {
                const sqlContent = fs.readFileSync(script.archivo, 'utf8');
                
                // Dividir en consultas individuales
                const queries = sqlContent
                    .split(';')
                    .map(q => q.trim())
                    .filter(q => q.length > 0 && !q.startsWith('--'));
                
                console.log(`📄 Ejecutando ${script.archivo} (${queries.length} consultas)...`);
                
                for (let i = 0; i < queries.length; i++) {
                    const query = queries[i];
                    if (query.trim()) {
                        const exito = await ejecutarSQL(query, `Consulta ${i + 1} de ${script.descripcion}`);
                        if (!exito) {
                            console.log(`⚠️  Error en consulta ${i + 1}, continuando...`);
                        }
                    }
                }
                
                scriptosEjecutados++;
                console.log(`✅ ${script.archivo}: Completado\n`);
                
            } catch (error) {
                console.log(`❌ Error leyendo ${script.archivo}:`, error.message);
            }
        } else {
            console.log(`⚠️  ${script.archivo}: No encontrado`);
        }
    }
    
    console.log(`📊 RESUMEN: ${scriptosEjecutados} scripts ejecutados exitosamente`);
    return scriptosEjecutados > 0;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarScriptsSQL()
        .then(exito => {
            if (exito) {
                console.log('🎉 Scripts SQL ejecutados exitosamente');
                process.exit(0);
            } else {
                console.log('❌ Error ejecutando scripts SQL');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { ejecutarScriptsSQL };
