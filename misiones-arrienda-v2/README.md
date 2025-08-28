# Misiones Arrienda v2

Una plataforma moderna de alquiler de propiedades para la provincia de Misiones, Argentina. Construida con Next.js 14, TypeScript, Tailwind CSS, Supabase y Prisma.

## 🚀 Características

- **Interfaz Moderna**: Diseño responsive con Tailwind CSS
- **Autenticación Segura**: Sistema de autenticación con Supabase
- **Base de Datos**: PostgreSQL con Prisma ORM
- **TypeScript**: Tipado estático para mayor seguridad
- **SSR/SSG**: Renderizado del lado del servidor con Next.js 14
- **Middleware**: Protección de rutas automática

## 🛠️ Tecnologías

- [Next.js 14](https://nextjs.org/) - Framework de React
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS
- [Supabase](https://supabase.com/) - Backend como servicio
- [Prisma](https://www.prisma.io/) - ORM para base de datos
- [Radix UI](https://www.radix-ui.com/) - Componentes accesibles

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd misiones-arrienda-v2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   DATABASE_URL=tu_url_de_base_de_datos
   ```

4. **Configurar la base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

```
misiones-arrienda-v2/
├── src/
│   ├── app/                 # App Router de Next.js 14
│   │   ├── layout.tsx       # Layout principal
│   │   ├── page.tsx         # Página de inicio
│   │   ├── login/           # Páginas de autenticación
│   │   ├── register/
│   │   ├── dashboard/       # Panel de usuario
│   │   └── properties/      # Páginas de propiedades
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              # Componentes de UI
│   │   └── navbar.tsx       # Barra de navegación
│   ├── lib/                 # Utilidades y configuraciones
│   │   ├── supabase/        # Configuración de Supabase
│   │   ├── prisma.ts        # Cliente de Prisma
│   │   └── utils.ts         # Utilidades generales
│   └── middleware.ts        # Middleware de Next.js
├── prisma/
│   └── schema.prisma        # Esquema de base de datos
├── public/                  # Archivos estáticos
└── package.json
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Ejecutar linter
- `npx prisma studio` - Abrir Prisma Studio
- `npx prisma generate` - Generar cliente de Prisma

## 🌐 Configuración de Supabase

1. Crear un proyecto en [Supabase](https://supabase.com/)
2. Obtener la URL del proyecto y la clave anónima
3. Configurar las variables de entorno
4. Ejecutar las migraciones de base de datos

## 📱 Funcionalidades Principales

### Para Usuarios
- Registro e inicio de sesión
- Búsqueda de propiedades
- Filtros avanzados
- Favoritos
- Historial de búsquedas
- Perfil de usuario

### Para Propietarios
- Publicar propiedades
- Gestionar anuncios
- Dashboard de propietario
- Estadísticas de visualizaciones

### Administración
- Panel de administración
- Gestión de usuarios
- Moderación de contenido
- Estadísticas de la plataforma

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno
3. Desplegar automáticamente

### Netlify
1. Conectar el repositorio a Netlify
2. Configurar las variables de entorno
3. Configurar el comando de build: `npm run build`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- Email: info@misionesarrienda.com
- Website: [misionesarrienda.com](https://misionesarrienda.com)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el excelente framework
- [Supabase](https://supabase.com/) por el backend como servicio
- [Tailwind CSS](https://tailwindcss.com/) por el framework de CSS
- [Vercel](https://vercel.com/) por el hosting
