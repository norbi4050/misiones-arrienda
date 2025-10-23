# ⚙️ Configuración de Variables de Entorno en Vercel

## 🚨 ACCIÓN REQUERIDA

Para que el panel de administración funcione correctamente en producción, **DEBES** configurar estas variables de entorno en Vercel.

## Variables Requeridas

### 1. SUPER_ADMIN_EMAIL
```
SUPER_ADMIN_EMAIL=misionesarrienda@gmail.com
```
- **Propósito**: Email del super administrador que siempre tiene acceso
- **Ambientes**: Production, Preview, Development

### 2. ADMIN_EMAILS
```
ADMIN_EMAILS=misionesarrienda@gmail.com
```
- **Propósito**: Lista de emails con permisos de admin (separados por comas)
- **Ambientes**: Production, Preview, Development
- **Ejemplo múltiples**: `admin1@email.com,admin2@email.com,admin3@email.com`

### 3. SUPABASE_SERVICE_ROLE_KEY
```
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
```
- **Propósito**: Permite bypass de RLS para operaciones admin
- **Dónde obtenerla**: Supabase Dashboard → Project Settings → API → service_role (secret)
- **⚠️ IMPORTANTE**: Esta key da acceso TOTAL a la base de datos. Nunca la expongas en el cliente.
- **Ambientes**: Production, Preview, Development

## 📋 Pasos para Configurar en Vercel

### Opción 1: Desde Vercel Dashboard (Recomendado)

1. **Acceder a Vercel Dashboard**
   - Ve a https://vercel.com/dashboard
   - Selecciona tu proyecto: `misiones-arrienda`

2. **Ir a Environment Variables**
   - Click en **Settings** (configuración)
   - Click en **Environment Variables** en el menú lateral

3. **Agregar cada variable**

   Para cada variable (SUPER_ADMIN_EMAIL, ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY):

   a. Click en **Add New**

   b. Llenar el formulario:
      - **Name**: `SUPER_ADMIN_EMAIL` (o la variable correspondiente)
      - **Value**: `misionesarrienda@gmail.com` (o el valor correspondiente)
      - **Environments**: Seleccionar TODOS:
        - ✅ Production
        - ✅ Preview
        - ✅ Development

   c. Click en **Save**

4. **Redeploy el proyecto**
   - Ve a **Deployments**
   - En el último deployment exitoso, click en los tres puntos (•••)
   - Click en **Redeploy**
   - ✅ Marca "Use existing Build Cache" (más rápido)
   - Click en **Redeploy**

### Opción 2: Desde CLI (Avanzado)

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Ir al directorio del proyecto
cd Backend

# Agregar variables de entorno
vercel env add SUPER_ADMIN_EMAIL
# Cuando pregunte el valor: misionesarrienda@gmail.com
# Cuando pregunte el ambiente: seleccionar Production, Preview, Development

vercel env add ADMIN_EMAILS
# Cuando pregunte el valor: misionesarrienda@gmail.com

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Cuando pregunte el valor: tu_service_role_key_de_supabase

# Redeploy
vercel --prod
```

## ✅ Verificación

Después de configurar las variables y redeploy:

### 1. Verificar que las variables existen
```bash
vercel env ls
```

Deberías ver:
```
SUPER_ADMIN_EMAIL         Production, Preview, Development
ADMIN_EMAILS             Production, Preview, Development
SUPABASE_SERVICE_ROLE_KEY Production, Preview, Development
```

### 2. Probar acceso como Admin

1. Ir a https://misionesarrienda.com.ar/login
2. Iniciar sesión con: `misionesarrienda@gmail.com`
3. Ir a https://misionesarrienda.com.ar/admin
4. ✅ Deberías ver el panel de administración

### 3. Probar bloqueo para usuarios normales

1. Crear/usar cuenta con otro email (ej: `test@example.com`)
2. Ir a https://misionesarrienda.com.ar/admin
3. ✅ Deberías ser redirigido a `/` (home) automáticamente
4. ✅ NO deberías ver ningún mensaje de error que revele que existe un panel admin

### 4. Revisar logs de seguridad

En Vercel Dashboard:
1. Ve a **Deployments**
2. Click en el deployment activo
3. Click en **Runtime Logs**
4. Busca logs como:
   ```
   [MIDDLEWARE] Admin access granted: misionesarrienda@gmail.com -> /admin/dashboard
   ```
   o
   ```
   [SECURITY] Non-admin user attempted to access admin route: user@test.com -> /admin
   ```

## 🔐 Obtener SUPABASE_SERVICE_ROLE_KEY

1. **Ir a Supabase Dashboard**
   - https://supabase.com/dashboard/project/tu-proyecto-id

2. **Navegar a Project Settings**
   - Click en el ícono de engranaje (⚙️) en el sidebar
   - Click en **Settings**
   - Click en **API**

3. **Copiar Service Role Key**
   - Buscar la sección **Project API keys**
   - Encontrar `service_role` key (es una key muy larga)
   - Click en **Reveal** / **Copy**
   - ⚠️ Esta es la key **secreta** - no la compartas

4. **Pegar en Vercel**
   - Usar este valor para la variable `SUPABASE_SERVICE_ROLE_KEY`

## 🚨 Troubleshooting

### Problema: "Acceso Restringido" incluso siendo admin

**Solución**:
1. Verificar que el email en Vercel sea exactamente: `misionesarrienda@gmail.com`
2. Verificar que las variables estén en el ambiente correcto (Production)
3. Hacer un nuevo deploy después de agregar las variables
4. Verificar logs en Vercel para ver qué email está siendo detectado

### Problema: Panel de admin carga pero no muestra datos

**Solución**:
1. Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
2. Verificar que la key sea la correcta (copiar de nuevo de Supabase)
3. Revisar logs de error en Vercel Runtime Logs

### Problema: Variables configuradas pero no funcionan

**Solución**:
1. **IMPORTANTE**: Después de agregar variables, siempre hacer un nuevo deploy
2. Las variables NO se aplican retroactivamente a deployments existentes
3. Hacer un "Redeploy" del último deployment exitoso

## 📝 Checklist Final

Antes de dar por completada la configuración:

- [ ] Variable `SUPER_ADMIN_EMAIL` agregada en Vercel
- [ ] Variable `ADMIN_EMAILS` agregada en Vercel
- [ ] Variable `SUPABASE_SERVICE_ROLE_KEY` agregada en Vercel
- [ ] Las 3 variables marcadas para Production, Preview, Development
- [ ] Redeploy realizado después de agregar variables
- [ ] Probado acceso como admin → ✅ funciona
- [ ] Probado acceso como usuario normal → ✅ bloqueado
- [ ] Logs de seguridad visibles en Vercel Runtime Logs

## 🆘 Soporte

Si tienes problemas:
1. Revisa este documento completo
2. Revisa [ADMIN-SECURITY.md](./ADMIN-SECURITY.md) para más detalles de seguridad
3. Revisa logs en Vercel Runtime Logs
4. Verifica que el email usado sea exactamente `misionesarrienda@gmail.com`
