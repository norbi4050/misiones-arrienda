# 🎯 GUÍA MANUAL DETALLADA: CREAR TABLA COMMUNITY_PROFILES EN SUPABASE

**Fecha:** 3 de Enero 2025  
**Objetivo:** Crear la tabla `community_profiles` paso a paso con instrucciones súper específicas  
**Tiempo estimado:** 10-15 minutos  

---

## 📋 REQUISITOS PREVIOS

✅ **Verificar que tienes:**
- Acceso a internet estable
- Navegador web actualizado (Chrome, Firefox, Edge, Safari)
- Credenciales de Supabase (las tienes en tu archivo .env)

---

## 🚀 PASO 1: ACCEDER AL DASHBOARD DE SUPABASE

### 1.1 Abrir el navegador
1. **Abre tu navegador web** (recomendado: Chrome o Firefox)
2. **Ve a la barra de direcciones** (donde escribes las URLs)
3. **Escribe exactamente:** `https://supabase.com`
4. **Presiona Enter**

### 1.2 Iniciar sesión
1. **Busca el botón "Sign In"** en la esquina superior derecha
2. **Haz clic en "Sign In"**
3. **Ingresa tus credenciales de Supabase:**
   - Email: (el email que usaste para crear tu cuenta)
   - Password: (tu contraseña de Supabase)
4. **Haz clic en "Sign In"**

### 1.3 Seleccionar tu proyecto
1. **Verás una lista de tus proyectos**
2. **Busca el proyecto que corresponde a:** `qfeyhaaxyemmnohqdele`
3. **Haz clic en el nombre del proyecto** para abrirlo

---

## 🗄️ PASO 2: NAVEGAR AL EDITOR DE TABLAS

### 2.1 Ir al Table Editor
1. **En el menú lateral izquierdo**, busca el ícono de tabla (parece una cuadrícula)
2. **Haz clic en "Table Editor"** 
3. **Espera a que cargue** (puede tomar unos segundos)

### 2.2 Verificar esquema público
1. **En la parte superior**, verifica que estés en el esquema **"public"**
2. **Si no está seleccionado "public":**
   - Haz clic en el dropdown del esquema
   - Selecciona "public"

---

## ➕ PASO 3: CREAR LA NUEVA TABLA

### 3.1 Iniciar creación de tabla
1. **Busca el botón "New table"** (generalmente en la esquina superior derecha)
2. **Haz clic en "New table"**
3. **Se abrirá un modal/ventana emergente**

### 3.2 Configurar información básica de la tabla
1. **En el campo "Name":**
   - **Borra cualquier texto que esté ahí**
   - **Escribe exactamente:** `community_profiles`
   - **NO uses espacios, mayúsculas, ni caracteres especiales**

2. **En el campo "Description" (opcional):**
   - **Escribe:** `Perfiles de usuarios para el módulo de comunidad`

3. **Verificar configuraciones:**
   - ✅ **"Enable Row Level Security (RLS)"** debe estar **MARCADO/ACTIVADO**
   - ✅ **"Enable Realtime"** puede estar marcado o no (opcional)

---

## 📊 PASO 4: CREAR LAS COLUMNAS DE LA TABLA

**IMPORTANTE:** Vas a crear **19 columnas** en total. Sigue cada paso exactamente.

### 4.1 Columna 1: id (Ya viene por defecto)
- **Esta columna YA EXISTE por defecto**
- **NO la modifiques**
- **Debe ser:** `id` tipo `uuid` con `gen_random_uuid()` como default

### 4.2 Columna 2: user_id
1. **Haz clic en "Add column"** o el botón "+"
2. **Completa los campos:**
   - **Name:** `user_id`
   - **Type:** Selecciona `uuid` del dropdown
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** NO marcar (debe estar desmarcado)
   - **Unique:** SÍ marcar
3. **Haz clic en "Save"** o "Add column"

### 4.3 Columna 3: display_name
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `display_name`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** NO marcar (debe estar desmarcado)
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.4 Columna 4: bio
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `bio`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar (puede estar vacío)
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.5 Columna 5: interests
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `interests`
   - **Type:** Selecciona `text[]` (array de texto)
   - **Default value:** `'{}'` (escribe exactamente esto con comillas simples)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.6 Columna 6: location
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `location`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.7 Columna 7: avatar_url
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `avatar_url`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.8 Columna 8: is_active
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `is_active`
   - **Type:** Selecciona `boolean`
   - **Default value:** `true` (escribe exactamente esto)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.9 Columna 9: created_at
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `created_at`
   - **Type:** Selecciona `timestamptz`
   - **Default value:** `now()` (escribe exactamente esto)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.10 Columna 10: updated_at
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `updated_at`
   - **Type:** Selecciona `timestamptz`
   - **Default value:** `now()` (escribe exactamente esto)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.11 Columna 11: age
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `age`
   - **Type:** Selecciona `integer` o `int4`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.12 Columna 12: gender
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `gender`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.13 Columna 13: occupation
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `occupation`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.14 Columna 14: phone
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `phone`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.15 Columna 15: email
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `email`
   - **Type:** Selecciona `text`
   - **Default value:** Deja vacío
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.16 Columna 16: social_links
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `social_links`
   - **Type:** Selecciona `jsonb`
   - **Default value:** `'{}'` (escribe exactamente esto con comillas simples)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.17 Columna 17: preferences
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `preferences`
   - **Type:** Selecciona `jsonb`
   - **Default value:** `'{}'` (escribe exactamente esto con comillas simples)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.18 Columna 18: verification_status
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `verification_status`
   - **Type:** Selecciona `text`
   - **Default value:** `'pending'` (escribe exactamente esto con comillas simples)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

### 4.19 Columna 19: last_active
1. **Haz clic en "Add column"**
2. **Completa los campos:**
   - **Name:** `last_active`
   - **Type:** Selecciona `timestamptz`
   - **Default value:** `now()` (escribe exactamente esto)
   - **Primary:** NO marcar
   - **Nullable:** SÍ marcar
   - **Unique:** NO marcar
3. **Haz clic en "Save"**

---

## 🔗 PASO 5: CREAR LA RELACIÓN CON AUTH.USERS

### 5.1 Crear Foreign Key para user_id
1. **Busca la columna `user_id` en tu tabla**
2. **Haz clic en el ícono de configuración** (engranaje) de esa columna
3. **Busca la sección "Foreign Key" o "References"**
4. **Configura:**
   - **Referenced table:** `auth.users`
   - **Referenced column:** `id`
   - **On delete:** `CASCADE`
5. **Haz clic en "Save"**

**ALTERNATIVA si no encuentras la opción:**
1. **Ve al menú "SQL Editor"** en el menú lateral
2. **Ejecuta este comando:**
```sql
ALTER TABLE public.community_profiles 
ADD CONSTRAINT community_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 📊 PASO 6: CREAR ÍNDICES PARA OPTIMIZACIÓN

### 6.1 Ir al SQL Editor
1. **En el menú lateral izquierdo**, busca "SQL Editor"
2. **Haz clic en "SQL Editor"**
3. **Se abrirá una ventana con un editor de código**

### 6.2 Ejecutar script de índices
1. **Borra cualquier código que esté en el editor**
2. **Copia y pega exactamente este código:**

```sql
-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_is_active ON public.community_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_community_profiles_location ON public.community_profiles(location);
CREATE INDEX IF NOT EXISTS idx_community_profiles_interests ON public.community_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_community_profiles_verification_status ON public.community_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_community_profiles_last_active ON public.community_profiles(last_active);
```

3. **Haz clic en el botón "Run"** (generalmente en la esquina inferior derecha)
4. **Espera a que aparezca "Success"** en la parte inferior

---

## ⚡ PASO 7: CREAR FUNCIÓN Y TRIGGER PARA UPDATED_AT

### 7.1 Crear función para actualizar updated_at
1. **En el mismo SQL Editor**, **borra el código anterior**
2. **Copia y pega exactamente este código:**

```sql
-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

3. **Haz clic en "Run"**
4. **Espera a que aparezca "Success"**

### 7.2 Crear trigger
1. **Borra el código anterior**
2. **Copia y pega exactamente este código:**

```sql
-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_community_profiles_updated_at ON public.community_profiles;
CREATE TRIGGER update_community_profiles_updated_at
    BEFORE UPDATE ON public.community_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

3. **Haz clic en "Run"**
4. **Espera a que aparezca "Success"**

---

## 🔒 PASO 8: CONFIGURAR POLÍTICAS RLS (ROW LEVEL SECURITY)

### 8.1 Verificar que RLS está habilitado
1. **Ve de vuelta al "Table Editor"**
2. **Selecciona tu tabla `community_profiles`**
3. **Verifica que RLS esté habilitado** (debe aparecer un indicador)

### 8.2 Crear políticas de seguridad
1. **Ve al SQL Editor nuevamente**
2. **Borra cualquier código anterior**
3. **Copia y pega exactamente este código:**

```sql
-- Política 1: Ver perfiles activos (SELECT)
DROP POLICY IF EXISTS "Ver perfiles activos" ON public.community_profiles;
CREATE POLICY "Ver perfiles activos" ON public.community_profiles
    FOR SELECT USING (is_active = true);

-- Política 2: Crear propio perfil (INSERT)
DROP POLICY IF EXISTS "Crear propio perfil" ON public.community_profiles;
CREATE POLICY "Crear propio perfil" ON public.community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política 3: Actualizar propio perfil (UPDATE)
DROP POLICY IF EXISTS "Actualizar propio perfil" ON public.community_profiles;
CREATE POLICY "Actualizar propio perfil" ON public.community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política 4: Eliminar propio perfil (DELETE)
DROP POLICY IF EXISTS "Eliminar propio perfil" ON public.community_profiles;
CREATE POLICY "Eliminar propio perfil" ON public.community_profiles
    FOR DELETE USING (auth.uid() = user_id);
```

4. **Haz clic en "Run"**
5. **Espera a que aparezca "Success"**

---

## 📝 PASO 9: AGREGAR COMENTARIOS PARA DOCUMENTACIÓN

### 9.1 Documentar la tabla
1. **En el SQL Editor**, **borra el código anterior**
2. **Copia y pega exactamente este código:**

```sql
-- Comentarios para documentación
COMMENT ON TABLE public.community_profiles IS 'Perfiles de usuarios para el módulo de comunidad';
COMMENT ON COLUMN public.community_profiles.user_id IS 'Referencia al usuario autenticado';
COMMENT ON COLUMN public.community_profiles.display_name IS 'Nombre a mostrar en la comunidad';
COMMENT ON COLUMN public.community_profiles.interests IS 'Array de intereses del usuario';
COMMENT ON COLUMN public.community_profiles.social_links IS 'Enlaces a redes sociales (JSON)';
COMMENT ON COLUMN public.community_profiles.preferences IS 'Preferencias del usuario (JSON)';
```

3. **Haz clic en "Run"**
4. **Espera a que aparezca "Success"**

---

## ✅ PASO 10: VERIFICACIÓN FINAL

### 10.1 Verificar la tabla creada
1. **Ve de vuelta al "Table Editor"**
2. **Busca tu tabla `community_profiles` en la lista**
3. **Haz clic en ella**
4. **Verifica que veas todas las 19 columnas:**
   - ✅ id
   - ✅ user_id
   - ✅ display_name
   - ✅ bio
   - ✅ interests
   - ✅ location
   - ✅ avatar_url
   - ✅ is_active
   - ✅ created_at
   - ✅ updated_at
   - ✅ age
   - ✅ gender
   - ✅ occupation
   - ✅ phone
   - ✅ email
   - ✅ social_links
   - ✅ preferences
   - ✅ verification_status
   - ✅ last_active

### 10.2 Verificar políticas RLS
1. **En la tabla, busca la pestaña "Policies" o "RLS"**
2. **Verifica que veas 4 políticas:**
   - ✅ Ver perfiles activos
   - ✅ Crear propio perfil
   - ✅ Actualizar propio perfil
   - ✅ Eliminar propio perfil

---

## 🎉 ¡COMPLETADO!

### ✅ Lo que has logrado:
- ✅ Tabla `community_profiles` creada con 19 columnas
- ✅ Relación con `auth.users` configurada
- ✅ 6 índices para optimización creados
- ✅ Función y trigger para `updated_at` implementados
- ✅ 4 políticas RLS configuradas
- ✅ Documentación agregada

### 🚀 Próximos pasos:
1. **Ejecutar testing:** `Blackbox/132-Ejecutar-Testing-Post-Creacion-Community-Profiles.bat`
2. **Verificar APIs del módulo comunidad**
3. **Testing completo del flujo de perfiles**

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Si algo sale mal:
1. **Refresca la página** del navegador
2. **Verifica que estés en el proyecto correcto**
3. **Revisa que RLS esté habilitado**
4. **Si hay errores en SQL, copia exactamente el código proporcionado**

### Si necesitas ayuda:
- **Revisa el archivo:** `Blackbox/127-Script-SQL-Crear-Tabla-Community-Profiles.sql`
- **Ejecuta el testing:** `Blackbox/131-Testing-Post-Creacion-Tabla-Community-Profiles.js`

---

**¡La tabla `community_profiles` está lista para usar en tu módulo de comunidad!** 🎯
