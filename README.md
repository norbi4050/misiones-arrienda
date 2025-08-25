# 🏠 Misiones Arrienda - Portal Inmobiliario

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

Portal inmobiliario especializado en la provincia de Misiones, Argentina. Plataforma completa con sistema de monetización, gestión de propiedades y funcionalidades premium.

## 🚀 Características Principales

### 💰 **Modelo de Negocio Implementado**
- **Plan Básico**: Gratuito - Publicación básica
- **Plan Destacado**: $5.000/mes - Badge "Destacado" + mayor visibilidad
- **Plan Full**: $10.000/mes - Premium + video + agente asignado

### 🏠 **Funcionalidades**
- ✅ Portal especializado en Misiones (Posadas, Eldorado)
- ✅ Sistema de diferenciación premium con badges
- ✅ Filtros avanzados de búsqueda
- ✅ Proceso de publicación en 3 pasos
- ✅ Integración con MercadoPago
- ✅ Sistema de consultas por email
- ✅ Autenticación para propietarios
- ✅ Dashboard de gestión
- ✅ Chatbot con IA integrado
- ✅ Sistema de perfiles de usuarios

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Base de Datos**: Prisma ORM con SQLite
- **Autenticación**: Sistema personalizado
- **Pagos**: MercadoPago Integration
- **Email**: Supabase Functions
- **Deployment**: Vercel Ready

## 📦 Instalación y Configuración

### Método Rápido (Recomendado)
```bash
# Ejecutar el script automático
./EJECUTAR-MISIONES-ARRIENDA.bat
```

### Método Manual
```bash
# 1. Navegar a la carpeta Backend
cd Backend

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
echo DATABASE_URL="file:./dev.db" > .env
npx prisma generate
npx prisma db push

# 4. Iniciar servidor de desarrollo
npm run dev
```

## 🌐 Uso

1. **Acceder a la aplicación**: http://localhost:3000
2. **Explorar propiedades**: Ver listado con propiedades destacadas
3. **Publicar propiedad**: Usar el enlace "Publicar" en la navbar
4. **Seleccionar plan**: Elegir entre Básico, Destacado o Full
5. **Procesar pago**: Integración con MercadoPago

## 📁 Estructura del Proyecto

```
Misiones-Arrienda/
├── 📄 README.md                    # Este archivo
├── 📄 README-FINAL.md              # Documentación detallada
├── 🚀 EJECUTAR-MISIONES-ARRIENDA.bat # Script de inicio rápido
├── 📋 TODO.md                      # Lista de tareas
└── Backend/                        # Aplicación principal
    ├── src/
    │   ├── app/                    # App Router de Next.js
    │   │   ├── page.tsx           # Página principal
    │   │   ├── publicar/          # Proceso de publicación
    │   │   ├── login/             # Autenticación
    │   │   └── api/               # API Routes
    │   ├── components/            # Componentes React
    │   ├── lib/                   # Utilidades y configuración
    │   └── types/                 # Definiciones TypeScript
    ├── prisma/                    # Esquema y seeds de BD
    ├── public/                    # Archivos estáticos
    └── 📄 package.json           # Dependencias del proyecto
```

## 🎯 Potencial de Ingresos

| Plan | Precio Mensual | Propiedades Estimadas | Ingresos Mensuales |
|------|----------------|----------------------|-------------------|
| Destacado | $5.000 | 50 | $250.000 |
| Full | $10.000 | 20 | $200.000 |
| **Total** | - | **70** | **$450.000** |

## 🏆 Diferencial Competitivo

- **🎯 Local**: Especializado en Misiones vs portales nacionales
- **✨ Confiable**: Diseño profesional con datos reales
- **💰 Monetizable**: Sistema de planes completamente implementado
- **📈 Escalable**: Arquitectura sólida con Next.js y Prisma

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
cd Backend
vercel --prod
```

### Netlify
```bash
# Usar configuración incluida
# netlify.toml ya configurado
```

## 📊 Estado del Proyecto

- ✅ **Desarrollo**: Completado
- ✅ **Testing**: Exhaustivo realizado
- ✅ **Documentación**: Completa
- ✅ **Deployment**: Listo para producción
- ✅ **Monetización**: Sistema implementado

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

**Proyecto**: Misiones Arrienda  
**Especialización**: Portal Inmobiliario - Provincia de Misiones  
**Estado**: ✅ Listo para lanzamiento comercial

---

⭐ **¡Dale una estrella si este proyecto te resulta útil!**
