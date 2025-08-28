# 🏠 Misiones Arrienda - Plataforma Inmobiliaria

Una plataforma completa de alquiler de propiedades para la provincia de Misiones, Argentina, con sistema de pagos integrado, módulo de comunidad y funcionalidades avanzadas.

## 🚀 Características Principales

- **🏘️ Gestión de Propiedades**: Publicación, búsqueda y gestión completa de propiedades
- **👥 Sistema de Usuarios**: Perfiles diferenciados (inquilinos, dueños directos, inmobiliarias)
- **💳 Pagos Integrados**: Sistema completo con MercadoPago para planes premium
- **🤝 Módulo Comunidad**: Búsqueda de compañeros de cuarto estilo Flatmates
- **🖼️ Carga de Imágenes**: Sistema avanzado con drag & drop y storage optimizado
- **📱 Responsive**: Diseño adaptable a todos los dispositivos
- **🔐 Autenticación**: Sistema completo con Supabase Auth
- **📊 Analytics**: Seguimiento de eventos y métricas de uso

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Radix UI** - Componentes accesibles
- **React Hook Form** - Manejo de formularios
- **Zustand** - Gestión de estado

### Backend
- **Supabase** - Backend as a Service
- **Prisma** - ORM y gestión de base de datos
- **PostgreSQL** - Base de datos principal
- **Edge Functions** - Funciones serverless

### Servicios Externos
- **MercadoPago** - Procesamiento de pagos
- **Vercel** - Hosting y deployment
- **GitHub Actions** - CI/CD

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de MercadoPago (para pagos)
- Cuenta de Vercel (para deployment)

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/misiones-arrienda.git
cd misiones-arrienda/Backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Database (Prisma + Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-super-seguro

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key

# Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=tu-app-password
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones
npm run db:deploy

# Generar cliente Prisma
npm run db:generate
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Obtén las credenciales de API

### 2. Ejecutar Migración Bootstrap

En el SQL Editor de Supabase, ejecuta el archivo:
```sql
-- Contenido de prisma/migrations/20250103000000_bootstrap/migration.sql
```

### 3. Configurar Storage

Los buckets se crean automáticamente con la migración:
- `property-images` - Imágenes de propiedades
- `profile-images` - Fotos de perfil
- `community-images` - Imágenes del módulo comunidad

### 4. Configurar Edge Functions (Opcional)

```bash
# Instalar Supabase CLI
npm install -g @supabase/cli

# Hacer login
supabase login

# Vincular proyecto
supabase link --project-ref tu-project-ref

# Desplegar funciones
supabase functions deploy
```

## 💳 Configuración de MercadoPago

### 1. Crear Cuenta de Desarrollador

1. Ve a [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crea una aplicación
3. Obtén las credenciales de prueba y producción

### 2. Configurar Webhooks

URL del webhook: `https://tu-dominio.com/api/payments/webhook`

Eventos a suscribir:
- `payment`
- `merchant_order`

## 🚀 Deployment

### Deployment Automático con Vercel

1. **Conectar con GitHub:**
   ```bash
   # Push a main branch
   git push origin main
   ```

2. **Configurar Variables de Entorno en Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings > Environment Variables
   - Agrega todas las variables del `.env.local`

3. **Variables Adicionales para GitHub Actions:**
   ```env
   DATABASE_URL=tu-database-url
   DIRECT_URL=tu-direct-url
   VERCEL_TOKEN=tu-vercel-token
   VERCEL_ORG_ID=tu-org-id
   VERCEL_PROJECT_ID=tu-project-id
   SUPABASE_ACCESS_TOKEN=tu-supabase-token
   SUPABASE_PROJECT_REF=tu-project-ref
   ```

### Deployment Manual

```bash
# Build del proyecto
npm run build

# Deploy a Vercel
npx vercel --prod
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run start           # Servidor de producción
npm run lint            # Linter

# Base de Datos
npm run db:deploy       # Ejecutar migraciones
npm run db:generate     # Generar cliente Prisma
npm run db:push         # Push schema a DB
npm run db:studio       # Abrir Prisma Studio
npm run db:seed         # Ejecutar seeds
```

## 🏗️ Estructura del Proyecto

```
Backend/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── (auth)/            # Rutas de autenticación
│   │   ├── api/               # API Routes
│   │   ├── comunidad/         # Módulo comunidad
│   │   ├── dashboard/         # Dashboard de usuario
│   │   ├── profile/           # Perfiles de usuario
│   │   └── publicar/          # Publicación de propiedades
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   └── ...               # Componentes específicos
│   ├── lib/                  # Utilidades y configuración
│   ├── hooks/                # Custom hooks
│   └── types/                # Definiciones de tipos
├── prisma/                   # Schema y migraciones
├── supabase/                 # Edge Functions
├── .github/workflows/        # GitHub Actions
└── public/                   # Archivos estáticos
```

## 🔐 Autenticación y Autorización

### Tipos de Usuario

1. **Inquilino**: Busca propiedades para alquilar
2. **Dueño Directo**: Publica sus propias propiedades
3. **Inmobiliaria**: Gestiona múltiples propiedades

### Rutas Protegidas

- `/dashboard` - Dashboard personal
- `/publicar` - Publicar propiedades
- `/profile/*` - Gestión de perfil
- `/comunidad/publicar` - Publicar en comunidad

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:
- Los usuarios solo pueden ver/editar sus propios datos
- Las propiedades públicas son visibles para todos
- Los pagos y suscripciones son privados por usuario

## 💰 Sistema de Pagos

### Planes Disponibles

1. **Básico** (Gratis):
   - 3 imágenes por propiedad
   - Listado estándar
   - 30 días de duración

2. **Destacado** ($500 ARS):
   - 5 imágenes por propiedad
   - Listado destacado
   - 60 días de duración

3. **Premium** ($1000 ARS):
   - 10 imágenes por propiedad
   - Listado premium
   - 90 días de duración
   - Estadísticas avanzadas

### Flujo de Pago

1. Usuario selecciona plan
2. Se crea preferencia en MercadoPago
3. Usuario completa pago
4. Webhook actualiza estado
5. Propiedad se activa automáticamente

## 🤝 Módulo Comunidad

Sistema estilo Flatmates para encontrar compañeros de cuarto:

### Funcionalidades

- **Perfiles de Usuario**: Información personal y preferencias
- **Búsqueda Avanzada**: Filtros por ubicación, presupuesto, preferencias
- **Sistema de Likes**: Match entre usuarios compatibles
- **Mensajería**: Chat en tiempo real
- **Publicación de Habitaciones**: Ofrecer espacios disponibles

### Preferencias Configurables

- Mascotas (acepta/no acepta/indiferente)
- Fumador (fumador/no fumador/indiferente)
- Dieta (vegetariano/vegano/celíaco/ninguna)
- Horarios y estilo de vida
- Tags personalizables

## 🖼️ Sistema de Carga de Imágenes

### Características

- **Drag & Drop**: Interfaz intuitiva
- **Múltiples Formatos**: JPEG, PNG, WebP
- **Validación**: Tamaño máximo 5MB
- **Preview**: Vista previa inmediata
- **Storage Optimizado**: Supabase Storage con CDN
- **Límites Dinámicos**: Según plan del usuario

### Implementación

```typescript
import { ImageUpload } from '@/components/ui/image-upload'

// Para múltiples imágenes (propiedades)
<ImageUpload
  value={images}
  onChange={setImages}
  maxImages={5}
  maxSizeMB={5}
/>

// Para foto de perfil única
<ProfileImageUpload
  value={profileImage}
  onChange={setProfileImage}
/>
```

## 📊 Analytics y Métricas

### Eventos Tracked

- Registro de usuarios
- Publicación de propiedades
- Búsquedas realizadas
- Pagos procesados
- Interacciones en comunidad

### Métricas Disponibles

- Usuarios activos
- Propiedades publicadas
- Conversión de pagos
- Engagement en comunidad

## 🔧 Desarrollo

### Convenciones de Código

- **TypeScript**: Tipado estricto
- **ESLint**: Linting automático
- **Prettier**: Formateo de código
- **Conventional Commits**: Mensajes de commit estandarizados

### Testing

```bash
# Ejecutar tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Debugging

- **Next.js DevTools**: Debugging de React
- **Prisma Studio**: Exploración de base de datos
- **Supabase Dashboard**: Logs y métricas
- **Vercel Analytics**: Métricas de producción

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**:
   ```bash
   # Verificar variables de entorno
   npm run db:generate
   ```

2. **Problemas con Supabase Auth**:
   - Verificar URLs de redirect
   - Confirmar configuración de RLS

3. **Errores de build**:
   ```bash
   # Limpiar cache
   rm -rf .next
   npm run build
   ```

4. **Problemas con imágenes**:
   - Verificar políticas de Storage
   - Confirmar buckets creados

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Prisma](https://prisma.io/docs)
- [API de MercadoPago](https://developers.mercadopago.com)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollo**: BlackBox AI
- **Diseño**: Equipo Misiones Arrienda
- **QA**: Equipo de Testing

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@misionesarrienda.com
- GitHub Issues: [Crear Issue](https://github.com/tu-usuario/misiones-arrienda/issues)

---

**Desarrollado con ❤️ para la comunidad de Misiones, Argentina**
