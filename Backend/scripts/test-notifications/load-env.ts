/**
 * Helper: Cargar variables de entorno
 *
 * Este archivo carga las variables del .env para que los scripts
 * de testing puedan acceder a las configuraciones
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar .env desde la raíz del proyecto Backend
const envPath = resolve(__dirname, '../../.env')
config({ path: envPath })

console.log('✅ Variables de entorno cargadas desde:', envPath)

export {}
