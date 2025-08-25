# Misiones Arrienda - Plataforma de Alquileres

🏠 **Plataforma completa de alquileres para la provincia de Misiones, Argentina**

## 🚀 Características Principales

- ✅ **Sistema de Autenticación Completo** - Registro, login, verificación de email
- ✅ **Dashboard Personalizado** - Panel de usuario con favoritos e historial
- ✅ **Búsqueda Avanzada** - Filtros por ubicación, precio, tipo de propiedad
- ✅ **Integración MercadoPago** - Pagos seguros y webhooks
- ✅ **Responsive Design** - Optimizado para móviles y desktop
- ✅ **SEO Optimizado** - Sitemap, robots.txt, meta tags
- ✅ **Base de Datos Robusta** - Prisma + SQLite/PostgreSQL

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Autenticación**: JWT, bcryptjs
- **Pagos**: MercadoPago API
- **Email**: Nodemailer
- **Deployment**: Vercel

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/Misiones-arrienda.git
cd Misiones-arrienda
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-jwt-secret-super-seguro"
MERCADOPAGO_ACCESS_TOKEN="tu-token-de-mercadopago"
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-password-de-app"
```

4. **Configurar base de datos**
```bash
npx prisma db push
npx prisma db seed
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/                 # App Router de Next.js
│   │   ├── api/            # API Routes
│   │   ├── auth/           # Páginas de autenticación
│   │   ├── dashboard/      # Panel de usuario
│   │   └── property/       # Páginas de propiedades
│   ├── components/         # Componentes React
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades y servicios
│   └── types/             # Definiciones TypeScript
├── prisma/                # Schema y seeds de base de datos
├── public/                # Archivos estáticos
└── package.json
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run db:push      # Actualizar base de datos
npm run db:seed      # Poblar con datos de prueba
```

## 🌐 Deployment en Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno en Vercel**
3. **Deploy automático** - Cada push a main despliega automáticamente

### Variables de Entorno para Producción
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="production-jwt-secret"
MERCADOPAGO_ACCESS_TOKEN="prod-token"
EMAIL_USER="production-email"
EMAIL_PASS="production-password"
```

## 🧪 Testing

```bash
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
```

## 📊 Funcionalidades

### Autenticación
- [x] Registro de usuarios
- [x] Login/Logout
- [x] Verificación de email
- [x] Protección de rutas

### Propiedades
- [x] Listado con filtros
- [x] Detalle de propiedad
- [x] Búsqueda por ubicación
- [x] Sistema de favoritos

### Pagos
- [x] Integración MercadoPago
- [x] Webhooks de confirmación
- [x] Páginas de éxito/error

### Dashboard
- [x] Perfil de usuario
- [x] Propiedades favoritas
- [x] Historial de búsquedas

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Proyecto**: [https://github.com/tu-usuario/Misiones-arrienda](https://github.com/tu-usuario/Misiones-arrienda)
- **Demo**: [https://misiones-arrienda.vercel.app](https://misiones-arrienda.vercel.app)

---

⭐ **¡Dale una estrella si te gusta el proyecto!**
