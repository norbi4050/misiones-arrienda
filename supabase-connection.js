const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Crear cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Función para ejecutar consulta SQL
async function ejecutarSQL(query, descripcion) {
    console.log(`🔄 Ejecutando: ${descripcion}`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
        
        if (error) {
            console.log(`❌ Error en ${descripcion}:`, error.message);
            return false;
        }
        
        console.log(`✅ ${descripcion}: Ejecutado exitosamente`);
        return true;
    } catch (err) {
        console.log(`❌ Error ejecutando ${descripcion}:`, err.message);
        return false;
    }
}

// Función para verificar conexión
async function verificarConexion() {
    console.log('🔍 Verificando conexión a Supabase...');
    
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        
        if (error) {
            console.log('❌ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (err) {
        console.log('❌ Error de conexión:', err.message);
        return false;
    }
}

module.exports = {
    supabase,
    ejecutarSQL,
    verificarConexion
};
