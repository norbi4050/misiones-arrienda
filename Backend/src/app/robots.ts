import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://misionesarrienda.com.ar'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/_next/',
          '/private/',
          // APIs de desarrollo y debug
          '/api/debug-*',
          '/api/test-*',
          '/api/audit-*',
          '/api/fix-*',
          '/api/sync-*',
          '/api/actualizar-*',
          '/api/diagnostico-*',
          '/api/execute-*',
          '/api/investigate-*',
          '/api/limpiar-*',
          '/api/properties/create-simple*',
          '/api/properties/create-bypass*',
          '/api/properties/create-sql-direct*',
          '/api/properties/create-supabase*',
          // Páginas de desarrollo
          '/test-simple*',
          '/page-debug*',
          '/page-simple*',
          '/page-temp-fix*',
          '/layout-debug*',
          '/layout-minimal*',
          '/layout-temp*',
          '/comunidad/page-simple*',
          '/comunidad/page-new*',
          '/comunidad/page-enterprise*',
          // Recursos internos
          '/docs/evidencias/*',
          '/sql-audit/*',
          '/__tests__/*',
          '/scripts/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/private/',
          // APIs de desarrollo y debug
          '/api/debug-*',
          '/api/test-*',
          '/api/audit-*',
          '/api/fix-*',
          '/api/sync-*',
          '/api/actualizar-*',
          '/api/diagnostico-*',
          '/api/execute-*',
          '/api/investigate-*',
          '/api/limpiar-*',
          '/api/properties/create-simple*',
          '/api/properties/create-bypass*',
          '/api/properties/create-sql-direct*',
          '/api/properties/create-supabase*',
          // Páginas de desarrollo
          '/test-simple*',
          '/page-debug*',
          '/page-simple*',
          '/page-temp-fix*',
          '/layout-debug*',
          '/layout-minimal*',
          '/layout-temp*',
          '/comunidad/page-simple*',
          '/comunidad/page-new*',
          '/comunidad/page-enterprise*',
          // Recursos internos
          '/docs/evidencias/*',
          '/sql-audit/*',
          '/__tests__/*',
          '/scripts/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
