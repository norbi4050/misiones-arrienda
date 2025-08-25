# Plan de Limpieza del Proyecto Misiones Arrienda

## Información Recopilada:
- El proyecto tiene una estructura Next.js con TypeScript en la carpeta Backend/
- Hay múltiples archivos de documentación redundantes y reportes obsoletos
- Existen archivos temporales de deployment y testing que ya no son necesarios
- Hay archivos duplicados y versiones antiguas de componentes
- Múltiples scripts .bat que parecen ser de pruebas anteriores

## Plan de Eliminación:

### 1. Archivos Temporales y de Cache (Backend/)
- FORCE-DEPLOYMENT-FINAL.txt
- FORCE-UPDATE-TIMESTAMP.txt
- npm (archivo suelto)
- package.json.json (duplicado)

### 2. Archivos de Documentación Redundantes (Raíz del proyecto)
- Todos los archivos .md de reportes y análisis antiguos
- Scripts .bat de deployment y testing obsoletos
- Archivos de configuración duplicados

### 3. Archivos de Código Duplicados/Obsoletos (Backend/src/)
- route-fixed.ts (versiones corregidas que ya están implementadas)
- route-clean.ts (versiones limpias que ya están implementadas)
- seed-fixed.ts, seed-clean.ts, seed-sqlite.ts, seed-users.ts (múltiples versiones)
- email-service-fixed.ts, email-service-enhanced.ts (versiones antiguas)
- mock-data-clean.ts (versión limpia ya implementada)
- stats-section-fixed.tsx (versión corregida ya implementada)
- schema-inmobiliarias.prisma (esquema alternativo no usado)

### 4. Archivos HTML Estáticos Obsoletos (Backend/)
- index.html, login.html, register.html, property-detail.html (reemplazados por Next.js)

### 5. Archivos de Configuración Duplicados
- vercel.json (tanto en raíz como en Backend/)
- netlify.toml (configuración no usada)

### 6. Scripts y Archivos de Testing Obsoletos
- Todos los archivos .bat de testing y deployment
- Archivos de diagnóstico y corrección automática

## Archivos a Conservar:
- Backend/src/ (código fuente principal)
- Backend/package.json, package-lock.json
- Backend/tsconfig.json, tailwind.config.ts
- Backend/next.config.js, postcss.config.js
- Backend/prisma/schema.prisma, prisma/seed.ts
- Backend/.gitignore, .vercelignore
- Backend/vercel.json
- README.md principal
- .gitignore principal
