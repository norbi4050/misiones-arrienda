# 📚 DOCUMENTACIÓN COMPLETA DE APIs - MISIONES ARRIENDA

## 🎯 INFORMACIÓN GENERAL

**Proyecto:** Misiones Arrienda - Plataforma de Alquiler de Propiedades  
**Versión:** 2025  
**Framework:** Next.js 14 con App Router  
**Base de Datos:** Supabase (PostgreSQL)  
**Autenticación:** Supabase Auth  

---

## 🔐 AUTENTICACIÓN

Todas las APIs protegidas requieren autenticación mediante Supabase Auth. El token se envía automáticamente a través de cookies HTTP-only.

### Headers Requeridos
```
Content-Type: application/json
Cookie: sb-[project-id]-auth-token=[token]
```

---

## 📋 ÍNDICE DE APIs

### 🔐 Autenticación
- [POST /api/auth/login](#post-apiauthlogin)
- [POST /api/auth/register](#post-apiauthregister)
- [POST /api/auth/logout](#post-apiauthlogout)

### 👤 Gestión de Usuarios
- [GET /api/users/profile](#get-apiusersprofile)
- [PUT /api/users/profile](#put-apiusersprofile)
- [PATCH /api/users/profile](#patch-apiusersprofile)
- [GET /api/users/stats](#get-apiusersstats)
- [GET /api/users/activity](#get-apiusersactivity)
- [GET /api/users/favorites](#get-apiusersfavorites)
- [POST /api/users/favorites](#post-apiusersfavorites)
- [DELETE /api/users/favorites](#delete-apiusersfavorites)

### 🏠 Gestión de Propiedades
- [GET /api/properties](#get-apiproperties)
- [POST /api/properties](#post-apiproperties)
- [GET /api/properties/[id]](#get-apipropertiesid)
- [PUT /api/properties/[id]](#put-apipropertiesid)
- [DELETE /api/properties/[id]](#delete-apipropertiesid)

### 💳 Pagos
- [POST /api/payments/create-preference](#post-apipaymentscreatereference)
- [POST /api/payments/webhook](#post-apipaymentswebhook)

### 👑 Administración
- [GET /api/admin/stats](#get-apiadminstats)
- [GET /api/admin/activity](#get-apiadminactivity)

---

## 🔐 APIs DE AUTENTICACIÓN

### POST /api/auth/login

Autentica un usuario en el sistema.

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "user_metadata": {
      "name": "Nombre Usuario",
      "userType": "inquilino"
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**Errores:**
- `400` - Datos inválidos
- `401` - Credenciales incorrectas
- `500` - Error interno del servidor

---

### POST /api/auth/register

Registra un nuevo usuario en el sistema.

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "name": "Nombre Completo",
  "userType": "inquilino", // "inquilino" | "dueno_directo" | "inmobiliaria"
  "phone": "+54911234567",
  "companyName": "Empresa SA", // Solo para inmobiliarias
  "licenseNumber": "LIC-123" // Solo para inmobiliarias
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid",
    "email": "nuevo@ejemplo.com"
  }
}
```

---

### POST /api/auth/logout

Cierra la sesión del usuario actual.

**Endpoint:** `POST /api/auth/logout`

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## 👤 APIs DE GESTIÓN DE USUARIOS

### GET /api/users/profile

Obtiene el perfil del usuario autenticado.

**Endpoint:** `GET /api/users/profile`

**Autenticación:** Requerida

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "name": "Nombre Usuario",
    "email": "usuario@ejemplo.com",
    "phone": "+54911234567",
    "profile_image": "https://storage.url/avatar.jpg",
    "bio": "Descripción del usuario",
    "userType": "inquilino",
    "verified": true,
    "rating": 4.8,
    "reviewCount": 25,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `401` - No autenticado
- `404` - Perfil no encontrado
- `500` - Error interno

---

### PUT /api/users/profile

Actualiza completamente el perfil del usuario.

**Endpoint:** `PUT /api/users/profile`

**Autenticación:** Requerida

**Body:**
```json
{
  "name": "Nuevo Nombre",
  "phone": "+54911234567",
  "bio": "Nueva descripción",
  "profile_image": "https://storage.url/new-avatar.jpg"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "profile": {
    // ... perfil actualizado
  }
}
```

---

### PATCH /api/users/profile

Actualiza parcialmente el perfil del usuario.

**Endpoint:** `PATCH /api/users/profile`

**Autenticación:** Requerida

**Body (campos opcionales):**
```json
{
  "name": "Solo cambiar nombre",
  "bio": "Solo cambiar bio"
}
```

---

### GET /api/users/stats

Obtiene estadísticas del usuario autenticado.

**Endpoint:** `GET /api/users/stats`

**Autenticación:** Requerida

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "stats": {
    "totalProperties": 5,
    "activeProperties": 3,
    "totalViews": 1250,
    "totalFavorites": 45,
    "totalMessages": 23,
    "averageRating": 4.8,
    "totalReviews": 12,
    "joinDate": "2024-06-15T00:00:00Z",
    "lastActivity": "2025-01-15T14:30:00Z"
  }
}
```

---

### GET /api/users/activity

Obtiene la actividad reciente del usuario.

**Endpoint:** `GET /api/users/activity`

**Autenticación:** Requerida

**Query Parameters:**
- `limit` (opcional): Número de actividades (default: 10, max: 50)
- `offset` (opcional): Offset para paginación (default: 0)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "activities": [
    {
      "id": "uuid",
      "type": "property_view",
      "description": "Viste la propiedad 'Casa en Posadas'",
      "metadata": {
        "propertyId": "uuid",
        "propertyTitle": "Casa en Posadas"
      },
      "createdAt": "2025-01-15T14:30:00Z"
    },
    {
      "id": "uuid",
      "type": "favorite_added",
      "description": "Agregaste una propiedad a favoritos",
      "metadata": {
        "propertyId": "uuid"
      },
      "createdAt": "2025-01-15T13:15:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 10,
    "offset
