# Misiones Arrienda

Plataforma de alquiler de propiedades para la provincia de Misiones, Argentina.

## 🚀 Ejecutar el Proyecto

```bash
cd Backend
npm install
npm run dev
```

El proyecto estará disponible en: http://localhost:3000

## 📁 Estructura del Proyecto

```
Misiones-Arrienda/
├── Backend/                    ← PROYECTO PRINCIPAL
│   ├── src/app/
│   │   ├── page.tsx           ← Página principal
│   │   ├── properties/        ← Listado de propiedades
│   │   ├── publicar/          ← Publicar propiedades
│   │   ├── login/             ← Iniciar sesión
│   │   ├── register/          ← Registro
│   │   └── dashboard/         ← Panel de usuario
│   ├── package.json
│   └── next.config.js
├── README.md                   ← Este archivo
└── LIMPIAR-PROYECTO-FINAL.bat  ← Script de limpieza
```

## ✨ Funcionalidades

- ✅ **Página principal** con búsqueda y filtros
- ✅ **Listado de propiedades** con mapa interactivo
- ✅ **Publicar propiedades** con planes gratuitos y premium
- ✅ **Sistema de autenticación** completo
- ✅ **Dashboard de usuario** con favoritos
- ✅ **Integración con MercadoPago** para pagos
- ✅ **Responsive design** para móviles

## 🔧 Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: MercadoPago
- **Mapas**: Leaflet
- **Deployment**: Vercel

## 📱 Páginas Principales

- `/` - Página principal
- `/properties` - Listado de propiedades
- `/publicar` - Publicar propiedad
- `/login` - Iniciar sesión
- `/register` - Registro
- `/dashboard` - Panel de usuario

## 🛠️ Comandos Útiles

```bash
# Instalar dependencias
cd Backend && npm install

# Ejecutar en desarrollo
cd Backend && npm run dev

# Construir para producción
cd Backend && npm run build

# Limpiar archivos innecesarios
.\LIMPIAR-PROYECTO-FINAL.bat
```

## 📝 Notas

- El proyecto principal está en la carpeta `Backend/`
- Las páginas de properties y publicar están completamente funcionales
- El sistema de autenticación está integrado con Supabase
- Los pagos están configurados con MercadoPago

---

**Desarrollado para la provincia de Misiones, Argentina** 🇦🇷
