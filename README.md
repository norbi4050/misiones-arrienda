# Misiones Arrienda

Una plataforma web moderna para alquiler de propiedades en la provincia de Misiones, Argentina.

## 🏠 Descripción

Misiones Arrienda es una aplicación web completa que conecta propietarios e inquilinos, facilitando el proceso de búsqueda y publicación de propiedades en alquiler. La plataforma incluye funcionalidades avanzadas como sistema de autenticación, gestión de propiedades, sistema de pagos y módulo de comunidad.

## ✨ Características Principales

- **Búsqueda Avanzada**: Filtros por ubicación, precio, tipo de propiedad y más
- **Gestión de Propiedades**: Publicación y administración de propiedades
- **Sistema de Autenticación**: Registro y login seguro de usuarios
- **Perfiles de Usuario**: Gestión de perfiles para propietarios e inquilinos
- **Sistema de Pagos**: Integración con MercadoPago
- **Módulo de Comunidad**: Interacción entre usuarios
- **Panel de Administración**: Gestión completa del sistema
- **Responsive Design**: Optimizado para todos los dispositivos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: MercadoPago
- **Deployment**: Vercel

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de MercadoPago (opcional)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/misiones-arrienda.git
   cd misiones-arrienda
   ```

2. **Navegar al directorio del proyecto**
   ```bash
   cd Backend
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno**
   
   Crear un archivo `.env.local` en la carpeta `Backend` con las siguientes variables:
   
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
   
   # MercadoPago (opcional)
   MERCADOPAGO_ACCESS_TOKEN=tu_mercadopago_access_token
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_mercadopago_public_key
   
   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

5. **Configurar la base de datos**
   
   Ejecutar los scripts SQL proporcionados en tu proyecto Supabase para crear las tablas necesarias.

6. **Ejecutar el proyecto**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
Backend/
├── src/
│   ├── app/                 # App Router de Next.js
│   │   ├── api/            # API Routes
│   │   ├── auth/           # Páginas de autenticación
│   │   ├── dashboard/      # Panel de usuario
│   │   ├── properties/     # Gestión de propiedades
│   │   └── ...
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes de UI
│   │   └── ...
│   ├── lib/               # Utilidades y configuraciones
│   ├── hooks/             # Custom hooks
│   └── types/             # Definiciones de tipos TypeScript
├── prisma/                # Esquemas y migraciones de base de datos
├── public/                # Archivos estáticos
└── ...
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar linter
- `npm run type-check` - Verificar tipos TypeScript

## 🌐 Deployment

### Vercel (Recomendado)

1. Conectar el repositorio con Vercel
2. Configurar las variables de entorno en el dashboard de Vercel
3. Desplegar automáticamente

### Variables de Entorno para Producción

Asegúrate de configurar todas las variables de entorno necesarias en tu plataforma de deployment.

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para consultas o soporte, puedes contactarnos a través de:

- Email: contacto@misionesarrienda.com
- Website: https://misionesarrienda.vercel.app

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el framework
- [Supabase](https://supabase.com/) por la base de datos y autenticación
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de estilos
- [shadcn/ui](https://ui.shadcn.com/) por los componentes de UI
