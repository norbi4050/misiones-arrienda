/**
 * Constantes legales para Misiones Arrienda
 * 
 * IMPORTANTE: Esta información debe usarse ÚNICAMENTE en páginas legales
 * (/legal/terms, /legal/privacy, /legal/security, /legal/quality)
 * 
 * NO exponer en: footer, homepage, componentes UI generales
 */

export const LEGAL_INFO = {
  // Información del responsable
  responsable: {
    nombre: 'Carlos González Archilla',
    proyecto: 'Misiones Arrienda',
    tipoProyecto: 'Proyecto personal',
    cuit: '20-35015391-9',
    domicilioFiscal: {
      calle: 'French 1253',
      ciudad: 'Oberá',
      provincia: 'Misiones',
      codigoPostal: 'N3360',
      pais: 'Argentina'
    }
  },

  // Contacto legal
  contacto: {
    email: 'cgonzalezarchilla@gmail.com',
    telefono: '+54 9 011 3087 5304',
    horarioAtencion: 'Lunes a Viernes, 9:00 a 18:00 hs (GMT-3)'
  },

  // Marco legal aplicable
  marcoLegal: {
    jurisdiccion: 'Posadas, Misiones, Argentina',
    leyProteccionDatos: {
      nombre: 'Ley 25.326 de Protección de Datos Personales',
      numero: '25.326',
      organismo: 'Agencia de Acceso a la Información Pública (AAIP)',
      url: 'https://www.argentina.gob.ar/aaip'
    },
    leyDefensaConsumidor: {
      nombre: 'Ley 24.240 de Defensa del Consumidor',
      numero: '24.240'
    },
    leyComercioElectronico: {
      nombre: 'Ley 26.951 de Regulación de Comercio Electrónico',
      numero: '26.951'
    },
    codigoCivilComercial: {
      nombre: 'Código Civil y Comercial de la Nación',
      articulos: 'Arts. 1106-1112 (Contratos celebrados por adhesión)'
    }
  },

  // Fechas importantes
  fechas: {
    inicioOperaciones: '2024-01-01',
    ultimaActualizacionPoliticas: '2025-01-15'
  },

  // Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
  derechosARCO: {
    descripcion: 'Conforme a la Ley 25.326, los titulares de datos personales tienen derecho a:',
    derechos: [
      {
        nombre: 'Acceso',
        descripcion: 'Conocer qué datos personales tenemos sobre usted'
      },
      {
        nombre: 'Rectificación',
        descripcion: 'Corregir datos inexactos o incompletos'
      },
      {
        nombre: 'Cancelación',
        descripcion: 'Solicitar la eliminación de sus datos cuando corresponda'
      },
      {
        nombre: 'Oposición',
        descripcion: 'Oponerse al tratamiento de sus datos en determinadas circunstancias'
      },
      {
        nombre: 'Portabilidad',
        descripcion: 'Recibir sus datos en formato estructurado y de uso común'
      }
    ],
    procedimiento: 'Para ejercer estos derechos, envíe un correo a cgonzalezarchilla@gmail.com con asunto "Ejercicio de Derechos ARCO" incluyendo: nombre completo, DNI, descripción del derecho a ejercer y domicilio de notificación.'
  }
} as const

// Rutas canónicas
export const LEGAL_ROUTES = {
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  SECURITY: '/legal/security',
  QUALITY: '/legal/quality',
  COOKIES: '/legal/cookies'
} as const

// Rutas legacy que deben redirigir
export const LEGACY_ROUTES = {
  '/terms': LEGAL_ROUTES.TERMS,
  '/privacy': LEGAL_ROUTES.PRIVACY,
  '/terminos': LEGAL_ROUTES.TERMS,
  '/privacidad': LEGAL_ROUTES.PRIVACY,
  '/politica-privacidad': LEGAL_ROUTES.PRIVACY,
  '/terminos-condiciones': LEGAL_ROUTES.TERMS,
  '/seguridad': LEGAL_ROUTES.SECURITY,
  '/calidad': LEGAL_ROUTES.QUALITY,
  '/cookies': LEGAL_ROUTES.COOKIES,
  '/politica-cookies': LEGAL_ROUTES.COOKIES
} as const

// Helper para formatear fecha
export function formatLegalDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Helper para obtener dirección completa
export function getFullAddress(): string {
  const { calle, ciudad, provincia, codigoPostal, pais } = LEGAL_INFO.responsable.domicilioFiscal
  return `${calle}, ${ciudad} (${codigoPostal}), ${provincia}, ${pais}`
}
