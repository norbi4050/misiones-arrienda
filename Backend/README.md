# Misiones Arrienda

Una plataforma moderna de alquiler de propiedades desarrollada con Next.js 14, TypeScript, Prisma y PostgreSQL.

## 🚀 Características

- **Búsqueda Inteligente**: Sistema de filtros avanzados para propiedades
- **Gestión de Usuarios**: Perfiles de inquilinos y propietarios
- **Sistema de Pagos**: Integración con MercadoPago
- **Chatbot IA**: Asistente virtual para consultas
- **Responsive Design**: Optimizado para todos los dispositivos
- **Dashboard Completo**: Panel de administración y estadísticas

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Pagos**: MercadoPago API
- **Email**: Nodemailer
- **Deployment**: Vercel

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` con tus valores:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/misiones_arrienda"
   MERCADOPAGO_ACCESS_TOKEN="your_token"
   NEXTAUTH_SECRET="your_secret"
   ```

4. **Configurar base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🚀 Deployment en Vercel

1. **Preparar el proyecto**
   - El proyecto ya está optimizado para Vercel
   - Configuración en `vercel.json`
   - Variables de entorno en `.env.example`

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Variables de entorno en Vercel**
   - `DATABASE_URL`: URL de PostgreSQL
   - `MERCADOPAGO_ACCESS_TOKEN`: Token de MercadoPago
   - `NEXTAUTH_SECRET`: Secret para autenticación
   - `NEXTAUTH_URL`: URL de producción

## 📁 Estructura del Proyecto

```
src/
├── app/                 # App Router (Next.js 14)
│   ├── api/            # API Routes
│   ├── login/          # Página de login
│   ├── register/       # Página de registro
│   └── ...
├── components/         # Componentes React
│   ├── ui/            # Componentes UI base
│   └── ...
├── lib/               # Utilidades y configuraciones
└── types/             # Tipos TypeScript

prisma/
├── schema.prisma      # Esquema de base de datos
└── seed.ts           # Datos de prueba

public/               # Archivos estáticos
```

## 🔑 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de PostgreSQL | ✅ |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de MercadoPago | ✅ |
| `NEXTAUTH_SECRET` | Secret para NextAuth | ✅ |
| `NEXTAUTH_URL` | URL base de la aplicación | ✅ |
| `SMTP_HOST` | Servidor SMTP para emails | ❌ |
| `SMTP_USER` | Usuario SMTP | ❌ |
| `SMTP_PASS` | Contraseña SMTP | ❌ |

## 🧪 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # Linter
npm run db:push      # Aplicar cambios DB
npm run db:studio    # Prisma Studio
npm run db:seed      # Poblar DB con datos
```

## 📊 API Endpoints

### Propiedades
- `GET /api/properties` - Listar propiedades
- `GET /api/properties/[id]` - Obtener propiedad
- `POST /api/properties` - Crear propiedad

### Usuarios
- `GET /api/users/[id]` - Obtener usuario
- `PUT /api/users/[id]` - Actualizar usuario

### Pagos
- `POST /api/payments/create-preference` - Crear preferencia de pago

### Consultas
- `POST /api/inquiries` - Crear consulta

## 🔒 Seguridad

- Headers de seguridad configurados
- Validación de datos con Zod
- Sanitización de inputs
- Rate limiting en APIs
- CORS configurado

## 🐛 Troubleshooting

### Error de Base de Datos
```bash
npx prisma generate
npx prisma db push
```

### Error de Build
```bash
rm -rf .next
npm run build
```

### Error de MercadoPago
- Verificar token de acceso
- Comprobar configuración de webhook

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte, crear un issue en el repositorio o contactar al equipo de desarrollo.
