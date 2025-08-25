# 🏠 MisionesArrienda1 - Portal Inmobiliario

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black?style=flat-square&logo=vercel)](https://vercel.com/)

Portal inmobiliario especializado en la provincia de Misiones, Argentina. Plataforma completa con sistema de monetización, gestión de propiedades y funcionalidades premium.

## 🚀 Características Principales

### 💰 **Modelo de Negocio Implementado**
- **Plan Básico**: Gratuito - Publicación básica
- **Plan Destacado**: $5.000/mes - Badge "Destacado" + mayor visibilidad
- **Plan Full**: $10.000/mes - Premium + video + agente asignado

### 🏠 **Funcionalidades Completas**
- ✅ Portal especializado en Misiones (Posadas, Eldorado, Puerto Iguazú)
- ✅ Sistema de diferenciación premium con badges
- ✅ Filtros avanzados de búsqueda
- ✅ Proceso de publicación en 3 pasos
- ✅ Integración con MercadoPago
- ✅ Sistema de consultas por email
- ✅ Autenticación completa para propietarios
- ✅ Dashboard de gestión con favoritos
- ✅ Chatbot con IA integrado
- ✅ Sistema de perfiles de usuarios
- ✅ SEO optimizado con sitemap
- ✅ Responsive design completo

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Base de Datos**: Prisma ORM con SQLite
- **Autenticación**: Sistema JWT personalizado
- **Pagos**: MercadoPago Integration
- **Email**: Supabase Functions + Nodemailer
- **Deployment**: Vercel Ready
- **Analytics**: Sistema de analytics integrado

## 📦 Instalación Rápida

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/misionesarrienda1.git
cd misionesarrienda1

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Configurar base de datos
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 🌐 Deployment en Vercel

### Método Automático (Recomendado)

1. **Fork o clona este repositorio**
2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio
   - Vercel detectará automáticamente Next.js

3. **Configura variables de entorno en Vercel**:
   ```
   DATABASE_URL=file:./dev.db
   JWT_SECRET=tu-jwt-secret-super-seguro
   SUPABASE_URL=tu-supabase-url
   SUPABASE_ANON_KEY=tu-supabase-anon-key
   ```

4. **Deploy automático** ✅

### Método CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📁 Estructura del Proyecto

```
misionesarrienda1/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── page.tsx           # Página principal
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Autenticación
│   │   ├── dashboard/         # Panel de usuario
│   │   ├── property/          # Detalles de propiedades
│   │   └── payment/           # Procesamiento de pagos
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── property-grid.tsx # Grid de propiedades
│   │   ├── navbar.tsx        # Navegación
│   │   └── ai-chatbot.tsx    # Chatbot IA
│   ├── lib/                   # Utilidades y configuración
│   │   ├── prisma.ts         # Cliente Prisma
│   │   ├── mercadopago.ts    # Integración MP
│   │   └── email-service.ts  # Servicio de email
│   ├── hooks/                 # Custom hooks
│   └── types/                 # Definiciones TypeScript
├── prisma/                    # Esquema y seeds de BD
├── public/                    # Assets estáticos
├── package.json              # Dependencias
├── vercel.json               # Configuración Vercel
└── README.md                 # Este archivo
```

## 🎯 Potencial de Ingresos

| Plan | Precio Mensual | Propiedades Estimadas | Ingresos Mensuales |
|------|----------------|----------------------|-------------------|
| Destacado | $5.000 | 50 | $250.000 |
| Full | $10.000 | 20 | $200.000 |
| **Total** | - | **70** | **$450.000** |

## 🏆 Diferencial Competitivo

- **🎯 Especialización Local**: Enfocado 100% en Misiones vs portales nacionales
- **✨ Diseño Profesional**: UI/UX moderna con datos reales
- **💰 Monetización Completa**: Sistema de planes implementado y funcional
- **📈 Escalabilidad**: Arquitectura sólida con Next.js 14 y Prisma
- **🤖 IA Integrada**: Chatbot inteligente para consultas
- **📱 Mobile First**: Completamente responsive

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
npm run db:push      # Aplicar cambios a BD
npm run db:studio    # Prisma Studio
npm run db:seed      # Poblar BD con datos
```

## 🌟 Funcionalidades Destacadas

### Sistema de Autenticación
- Registro y login completo
- Verificación por email
- JWT tokens seguros
- Protección de rutas

### Dashboard de Usuario
- Gestión de propiedades
- Sistema de favoritos
- Historial de búsquedas
- Estadísticas personales

### Integración de Pagos
- MercadoPago completamente integrado
- Planes de suscripción
- Webhooks para confirmación
- Manejo de estados de pago

### SEO Optimizado
- Sitemap automático
- Meta tags dinámicos
- URLs amigables
- Robots.txt configurado

## 📊 Estado del Proyecto

- ✅ **Desarrollo**: Completado al 100%
- ✅ **Testing**: Exhaustivo realizado
- ✅ **Documentación**: Completa y actualizada
- ✅ **Deployment**: Listo para producción
- ✅ **Monetización**: Sistema completamente funcional
- ✅ **SEO**: Optimizado para buscadores

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

**Proyecto**: MisionesArrienda1  
**Especialización**: Portal Inmobiliario - Provincia de Misiones  
**Estado**: ✅ Listo para lanzamiento comercial  
**Deployment**: ✅ Vercel Ready

---

⭐ **¡Dale una estrella si este proyecto te resulta útil!**

🚀 **Deploy inmediato en Vercel con un click**
