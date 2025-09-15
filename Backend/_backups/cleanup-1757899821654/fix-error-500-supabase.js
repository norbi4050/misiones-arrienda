/**
 * FIX ERROR 500: Resolver problema de variables de entorno Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 REPARANDO ERROR 500 - VARIABLES DE ENTORNO SUPABASE\n');

// 1. Crear archivo .env.local de ejemplo si no existe
const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('1️⃣ VERIFICANDO ARCHIVOS DE ENTORNO:');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local no encontrado');
  
  // Crear .env.local con valores de ejemplo
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Creado .env.local con valores de ejemplo');
  console.log('⚠️ IMPORTANTE: Debes configurar las variables reales de Supabase');
} else {
  console.log('✅ .env.local existe');
}

// 2. Crear versión temporal del layout sin Supabase para testing
console.log('\n2️⃣ CREANDO LAYOUT TEMPORAL SIN SUPABASE:');

const layoutPath = path.join(__dirname, 'src/app/layout.tsx');
const layoutBackupPath = path.join(__dirname, 'src/app/layout.backup-error500.tsx');

if (fs.existsSync(layoutPath)) {
  // Hacer backup del layout actual
  const currentLayout = fs.readFileSync(layoutPath, 'utf8');
  fs.writeFileSync(layoutBackupPath, currentLayout);
  console.log('✅ Backup del layout creado: layout.backup-error500.tsx');
  
  // Crear layout temporal sin Supabase
  const tempLayout = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { AIChatbot } from '@/components/ai-chatbot'
import { ConditionalWhatsAppButton } from '@/components/conditional-whatsapp-button'
import BuildBadge from '@/components/BuildBadge'
import { Toaster } from 'react-hot-toast'
// TEMPORAL: AuthProvider deshabilitado para resolver error 500
// import { AuthProvider } from '@/components/auth-provider'
// import { createServerSupabase } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Misiones Arrienda', template: '%s | Misiones Arrienda' },
  description: 'Casas, departamentos y locales en Misiones',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORAL: Sesión deshabilitada para resolver error 500
  // const supabase = await createServerSupabase()
  // const { data: { session } } = await supabase.auth.getSession()
  const session = null;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "Misiones Arrienda",
              "description": "Portal inmobiliario especializado en propiedades de Misiones",
              "url": "https://misionesarrienda.com.ar",
              "areaServed": {
                "@type": "State",
                "name": "Misiones, Argentina"
              },
              "serviceType": ["Alquiler de propiedades", "Venta de propiedades"],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+54-376-4123456",
                "contactType": "customer service",
                "availableLanguage": "Spanish"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {/* TEMPORAL: AuthProvider deshabilitado */}
        {/* <AuthProvider initialSession={session}> */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar initialSession={session} />
            {children}

            {/* WhatsApp Button Condicional - No en páginas de propiedades */}
            <ConditionalWhatsAppButton />

            {/* AI Chatbot */}
            <AIChatbot />

            {/* Build Badge para debugging */}
            <BuildBadge />

            {/* Toast Notifications Mejoradas */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  maxWidth: '400px',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                  },
                },
                loading: {
                  style: {
                    background: '#3b82f6',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#3b82f6',
                  },
                },
              }}
            />
          </ThemeProvider>
        {/* </AuthProvider> */}
      </body>
    </html>
  )
}
`;

  fs.writeFileSync(layoutPath, tempLayout);
  console.log('✅ Layout temporal creado (sin Supabase)');
}

// 3. Crear script de restauración
console.log('\n3️⃣ CREANDO SCRIPT DE RESTAURACIÓN:');

const restoreScript = `/**
 * RESTAURAR LAYOUT ORIGINAL
 * Ejecutar después de configurar variables de entorno
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 RESTAURANDO LAYOUT ORIGINAL...');

const layoutPath = path.join(__dirname, 'src/app/layout.tsx');
const layoutBackupPath = path.join(__dirname, 'src/app/layout.backup-error500.tsx');

if (fs.existsSync(layoutBackupPath)) {
  const originalLayout = fs.readFileSync(layoutBackupPath, 'utf8');
  fs.writeFileSync(layoutPath, originalLayout);
  console.log('✅ Layout original restaurado');
  
  // Limpiar backup
  fs.unlinkSync(layoutBackupPath);
  console.log('✅ Backup eliminado');
} else {
  console.log('❌ Backup no encontrado');
}

console.log('\\n🎯 PRÓXIMOS PASOS:');
console.log('1. Configurar variables de entorno en .env.local');
console.log('2. Reiniciar servidor: npm run dev');
console.log('3. Probar que el sitio carga sin error 500');
console.log('4. Ejecutar este script para restaurar AuthProvider');
`;

fs.writeFileSync(path.join(__dirname, 'restore-layout.js'), restoreScript);
console.log('✅ Script de restauración creado: restore-layout.js');

// 4. Instrucciones finales
console.log('\n4️⃣ INSTRUCCIONES PARA RESOLVER ERROR 500:');

const instructions = [
  '1. Configurar variables de entorno en .env.local:',
  '   - NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase',
  '   - NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima',
  '   - SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio',
  '',
  '2. Reiniciar el servidor:',
  '   - Detener: Ctrl+C',
  '   - Iniciar: npm run dev',
  '',
  '3. Verificar que el sitio carga sin error 500',
  '',
  '4. Una vez funcionando, restaurar AuthProvider:',
  '   - node restore-layout.js',
  '',
  '5. Probar que getBrowserSupabase funciona correctamente'
];

instructions.forEach(instruction => console.log(instruction));

console.log('\n✅ REPARACIÓN COMPLETADA');
console.log('🎯 El sitio debería cargar sin error 500 ahora');
console.log('⚠️ Recuerda configurar las variables de entorno reales');
