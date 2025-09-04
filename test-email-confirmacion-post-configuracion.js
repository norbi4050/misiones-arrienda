
/**
 * 🧪 TESTING EMAIL CONFIRMACIÓN POST-CONFIGURACIÓN
 * ================================================
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qfeyhaaxyemmnohqdele.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'
);

async function testEmailConfirmation() {
    console.log('🧪 TESTING EMAIL CONFIRMACIÓN...');
    
    const testEmail = 'test-' + Date.now() + '@gmail.com';
    const testPassword = 'TestPassword123!';
    
    try {
        // Intentar registro
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (error) {
            console.log('❌ ERROR EN REGISTRO:', error.message);
            return false;
        }
        
        console.log('✅ REGISTRO EXITOSO');
        console.log('📧 Email de confirmación enviado a:', testEmail);
        console.log('👤 Usuario creado:', data.user?.id);
        
        return true;
        
    } catch (error) {
        console.log('❌ ERROR INESPERADO:', error.message);
        return false;
    }
}

// Ejecutar testing
testEmailConfirmation()
    .then(success => {
        if (success) {
            console.log('\n✅ TESTING COMPLETADO - EMAIL CONFIRMACIÓN FUNCIONANDO');
        } else {
            console.log('\n❌ TESTING FALLIDO - REVISAR CONFIGURACIÓN SMTP');
        }
    })
    .catch(console.error);
