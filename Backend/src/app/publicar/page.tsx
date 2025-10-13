// src/app/publicar/page.tsx

// FIX 304: Deshabilitar caché para página de publicación
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Wizard from './publish-wizard-improved'
export default Wizard
