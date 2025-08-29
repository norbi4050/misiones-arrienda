-- =====================================================
-- SUPABASE TABLE EDITOR: ESQUEMA COMPLETO
-- =====================================================
-- SQL para crear todas las tablas necesarias en Supabase
-- Basado en el schema de Prisma actualizado
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- HABILITAR EXTENSIONES NECESARIAS
-- =====================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de texto
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CREAR ENUMS
-- =====================================================

-- Enums para el módulo Comunidad
CREATE TYPE "CommunityRole" AS ENUM ('BUSCO', 'OFREZCO');
CREATE TYPE "PetPref" AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
CREATE TYPE "SmokePref" AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
CREATE TYPE "Diet" AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
CREATE TYPE "RoomType" AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');

-- =====================================================
-- TABLA: profiles (Supabase Auth)
-- =====================================================

CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID PRIMARY KEY,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) DEFAULT NOW()
);

-- =====================================================
-- TABLA: Agent
-- =====================================================

CREATE TABLE IF NOT EXISTS "Agent" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "license" TEXT UNIQUE NOT NULL,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW()
);

-- =====================================================
-- TABLA: User
-- =====================================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "occupation" TEXT,
    "age" INTEGER,
    "verified" BOOLEAN DEFAULT FALSE,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    "verificationToken" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    
    -- Nuevos campos para tipos de usuario
    "userType" TEXT, -- inquilino, dueno_directo, inmobiliaria
    "companyName" TEXT, -- Solo para inmobiliarias
    "licenseNumber" TEXT, -- Solo para inmobiliarias
    "propertyCount" TEXT, -- Solo para dueños directos
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW()
);

-- =====================================================
-- TABLA: Property (PRINCIPAL)
-- =====================================================

CREATE TABLE IF NOT EXISTS "Property" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'ARS', -- Moneda de la propiedad (ARS, USD, EUR, etc.)
    "oldPrice" DOUBLE PRECISION,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "garages" INTEGER DEFAULT 0,
    "area" DOUBLE PRECISION NOT NULL,
    "lotArea" DOUBLE PRECISION,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "propertyType" TEXT NOT NULL, -- APARTMENT, HOUSE, COMMERCIAL, LAND, OFFICE, WAREHOUSE, PH, STUDIO
    "status" TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, SOLD, MAINTENANCE, RESERVED, EXPIRED
    "images" TEXT NOT NULL, -- JSON string of array
    "virtualTourUrl" TEXT,
    "amenities" TEXT NOT NULL, -- JSON string of array
    "features" TEXT NOT NULL, -- JSON string of array
    "yearBuilt" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "featured" BOOLEAN DEFAULT FALSE,
    
    -- Campos de contacto agregados para alinear con API
    "contact_name" TEXT,
    "contact_phone" TEXT NOT NULL,
    "contact_email" TEXT,
    
    -- Campos para sistema de caducidad
    "expiresAt" TIMESTAMPTZ(6),
    "highlightedUntil" TIMESTAMPTZ(6),
    "isPaid" BOOLEAN DEFAULT FALSE,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    -- Relación con el usuario propietario
    "userId" TEXT NOT NULL,
    
    -- Hacer agentId opcional para evitar errores
    "agentId" TEXT,
    
    -- Foreign Keys
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL
);

-- =====================================================
-- TABLA: Inquiry
-- =====================================================

CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- GENERAL, VISIT, FINANCING, OFFER
    "visitDate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    "propertyId" TEXT NOT NULL,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

-- =====================================================
-- TABLA: UserReview
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserReview" (
    "id" TEXT PRIMARY KEY,
    "rating" INTEGER NOT NULL, -- 1-5 estrellas
    "comment" TEXT NOT NULL,
    "category" TEXT NOT NULL, -- TENANT, LANDLORD
    "verified" BOOLEAN DEFAULT FALSE, -- Si el review es de un alquiler verificado
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    -- Relaciones
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "rentalId" TEXT,
    
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("reviewedId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =====================================================
-- TABLA: RentalHistory
-- =====================================================

CREATE TABLE IF NOT EXISTS "RentalHistory" (
    "id" TEXT PRIMARY KEY,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, TERMINATED
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    -- Relaciones
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    
    FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

-- =====================================================
-- TABLA: UserInquiry
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserInquiry" (
    "id" TEXT PRIMARY KEY,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- GENERAL, VISIT, FINANCING, OFFER
    "visitDate" TIMESTAMPTZ(6),
    "status" TEXT DEFAULT 'PENDING', -- PENDING, RESPONDED, CLOSED
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

-- =====================================================
-- TABLA: Favorite
-- =====================================================

CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
    
    UNIQUE("userId", "propertyId")
);

-- =====================================================
-- TABLA: SearchHistory
-- =====================================================

CREATE TABLE IF NOT EXISTS "SearchHistory" (
    "id" TEXT PRIMARY KEY,
    "searchTerm" TEXT NOT NULL,
    "filters" TEXT, -- JSON string con filtros aplicados
    "resultsCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =====================================================
-- TABLAS PARA SISTEMA DE PAGOS MEJORADO
-- =====================================================

-- TABLA: Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT PRIMARY KEY,
    
    -- Información del plan
    "planType" TEXT NOT NULL, -- basic, featured, premium
    "planName" TEXT NOT NULL,
    "planPrice" DOUBLE PRECISION NOT NULL,
    "planDuration" INTEGER NOT NULL, -- días
    
    -- Estado de la suscripción
    "status" TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED, SUSPENDED
    
    -- Fechas
    "startDate" TIMESTAMPTZ(6) DEFAULT NOW(),
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "renewalDate" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    
    -- Configuración
    "autoRenew" BOOLEAN DEFAULT FALSE,
    "renewalAttempts" INTEGER DEFAULT 0,
    "maxRenewalAttempts" INTEGER DEFAULT 3,
    
    -- Relaciones
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE
);

-- TABLA: Payment
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT PRIMARY KEY,
    
    -- Identificadores de MercadoPago
    "mercadopagoId" TEXT UNIQUE NOT NULL, -- ID del pago en MercadoPago
    "preferenceId" TEXT, -- ID de la preferencia
    "externalReference" TEXT NOT NULL, -- Referencia externa personalizada
    
    -- Información del pago
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'ARS',
    "status" TEXT NOT NULL, -- pending, approved, rejected, cancelled, refunded, etc.
    "statusDetail" TEXT, -- Detalle del estado
    "paymentMethodId" TEXT, -- visa, mastercard, efectivo, etc.
    "paymentTypeId" TEXT, -- credit_card, debit_card, ticket, etc.
    "installments" INTEGER DEFAULT 1,
    
    -- Fechas importantes
    "dateCreated" TIMESTAMPTZ(6) DEFAULT NOW(),
    "dateApproved" TIMESTAMPTZ(6),
    "dateLastUpdated" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    -- Información del pagador
    "payerEmail" TEXT NOT NULL,
    "payerName" TEXT,
    "payerIdentification" TEXT, -- JSON con tipo y número de identificación
    
    -- Relaciones
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    
    -- Metadata adicional
    "metadata" TEXT, -- JSON con información adicional
    "webhookData" TEXT, -- JSON con datos del webhook
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE,
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL
);

-- TABLA: PaymentMethod
CREATE TABLE IF NOT EXISTS "PaymentMethod" (
    "id" TEXT PRIMARY KEY,
    
    -- Información del método de pago
    "type" TEXT NOT NULL, -- credit_card, debit_card, bank_transfer, etc.
    "brand" TEXT, -- visa, mastercard, amex, etc.
    "lastFourDigits" TEXT, -- Últimos 4 dígitos de la tarjeta
    "expirationMonth" INTEGER,
    "expirationYear" INTEGER,
    "holderName" TEXT,
    
    -- Identificadores de MercadoPago
    "mercadopagoCardId" TEXT, -- ID de la tarjeta en MercadoPago
    "mercadopagoCustomerId" TEXT, -- ID del customer en MercadoPago
    
    -- Estado
    "isActive" BOOLEAN DEFAULT TRUE,
    "isDefault" BOOLEAN DEFAULT FALSE,
    
    -- Relaciones
    "userId" TEXT NOT NULL,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- TABLA: PaymentAnalytics
CREATE TABLE IF NOT EXISTS "PaymentAnalytics" (
    "id" TEXT PRIMARY KEY,
    
    -- Período de análisis
    "date" TIMESTAMPTZ(6) NOT NULL,
    "period" TEXT NOT NULL, -- daily, weekly, monthly
    
    -- Métricas de pagos
    "totalPayments" INTEGER DEFAULT 0,
    "successfulPayments" INTEGER DEFAULT 0,
    "failedPayments" INTEGER DEFAULT 0,
    "pendingPayments" INTEGER DEFAULT 0,
    
    -- Métricas financieras
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "successfulAmount" DOUBLE PRECISION DEFAULT 0,
    "averageAmount" DOUBLE PRECISION DEFAULT 0,
    
    -- Métricas por método de pago
    "creditCardPayments" INTEGER DEFAULT 0,
    "debitCardPayments" INTEGER DEFAULT 0,
    "bankTransferPayments" INTEGER DEFAULT 0,
    "cashPayments" INTEGER DEFAULT 0,
    
    -- Métricas por plan
    "basicPlanPayments" INTEGER DEFAULT 0,
    "featuredPlanPayments" INTEGER DEFAULT 0,
    "premiumPlanPayments" INTEGER DEFAULT 0,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    UNIQUE("date", "period")
);

-- TABLA: PaymentNotification
CREATE TABLE IF NOT EXISTS "PaymentNotification" (
    "id" TEXT PRIMARY KEY,
    
    -- Información del webhook
    "mercadopagoId" TEXT NOT NULL, -- ID del pago en MercadoPago
    "topic" TEXT NOT NULL, -- payment, merchant_order, etc.
    "type" TEXT NOT NULL, -- payment, merchant_order, etc.
    
    -- Estado del procesamiento
    "status" TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    "attempts" INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    
    -- Datos del webhook
    "webhookData" TEXT NOT NULL, -- JSON completo del webhook
    "errorMessage" TEXT, -- Mensaje de error si falló el procesamiento
    
    -- Relación con el pago (opcional, puede no existir aún)
    "paymentId" TEXT,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "processedAt" TIMESTAMPTZ(6),
    
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL
);

-- =====================================================
-- TABLAS PARA MÓDULO COMUNIDAD (ESTILO FLATMATES)
-- =====================================================

-- TABLA: UserProfile (Comunidad)
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT PRIMARY KEY,
    
    -- Vinculación con User existente
    "userId" TEXT UNIQUE NOT NULL,
    
    -- Información básica del perfil
    "role" "CommunityRole" NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "budgetMin" INTEGER NOT NULL, -- Presupuesto mínimo en ARS
    "budgetMax" INTEGER NOT NULL, -- Presupuesto máximo en ARS
    "bio" TEXT,
    "photos" TEXT[], -- Array de URLs de fotos
    
    -- Preferencias de convivencia
    "age" INTEGER,
    "petPref" "PetPref" DEFAULT 'INDIFERENTE',
    "smokePref" "SmokePref" DEFAULT 'INDIFERENTE',
    "diet" "Diet" DEFAULT 'NINGUNA',
    "scheduleNotes" TEXT, -- horarios de trabajo/estudio
    "tags" TEXT[], -- limpio, sociable, gym, gamer, etc.
    
    -- Configuración
    "acceptsMessages" BOOLEAN DEFAULT TRUE,
    "highlightedUntil" TIMESTAMPTZ(6),
    "isSuspended" BOOLEAN DEFAULT FALSE,
    
    -- Campos para sistema de caducidad
    "expiresAt" TIMESTAMPTZ(6),
    "isPaid" BOOLEAN DEFAULT FALSE,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- TABLA: Room
CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT PRIMARY KEY,
    
    -- Relación con el perfil propietario
    "ownerId" TEXT NOT NULL,
    
    -- Información de la habitación
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL, -- Precio mensual en ARS
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "type" "RoomType" NOT NULL,
    "amenities" TEXT[], -- wifi, cochera, patio, etc.
    "photos" TEXT[], -- Array de URLs de fotos
    "rules" TEXT, -- no fiestas, etc.
    
    -- Estado
    "isActive" BOOLEAN DEFAULT TRUE,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE CASCADE
);

-- TABLA: Like
CREATE TABLE IF NOT EXISTS "Like" (
    "id" TEXT PRIMARY KEY,
    
    -- Relaciones
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("fromId") REFERENCES "UserProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("toId") REFERENCES "UserProfile"("id") ON DELETE CASCADE,
    
    UNIQUE("fromId", "toId")
);

-- TABLA: Conversation
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY,
    
    -- Participantes (siempre 2 en MVP)
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    
    -- Estado
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastMessageAt" TIMESTAMPTZ(6),
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("aId") REFERENCES "UserProfile"("id") ON DELETE CASCADE,
    FOREIGN KEY ("bId") REFERENCES "UserProfile"("id") ON DELETE CASCADE,
    
    UNIQUE("aId", "bId")
);

-- TABLA: Message
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY,
    
    -- Relaciones
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    
    -- Contenido
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE,
    FOREIGN KEY ("senderId") REFERENCES "UserProfile"("id") ON DELETE CASCADE
);

-- TABLA: Report
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT PRIMARY KEY,
    
    -- Relación con el perfil reportado
    "targetId" TEXT NOT NULL,
    
    -- Información del reporte
    "reason" TEXT NOT NULL, -- spam, contenido_inapropiado, acoso, etc.
    "details" TEXT,
    "reporterEmail" TEXT, -- Email del reportador (puede ser anónimo)
    
    -- Estado
    "status" TEXT DEFAULT 'PENDING', -- PENDING, REVIEWED, RESOLVED, DISMISSED
    "adminNotes" TEXT,
    
    "createdAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT NOW(),
    
    FOREIGN KEY ("targetId") REFERENCES "UserProfile"("id") ON DELETE CASCADE
);

-- =====================================================
-- AGREGAR FOREIGN KEY PARA RentalHistory -> UserReview
-- =====================================================

ALTER TABLE "UserReview" 
ADD CONSTRAINT "fk_rental_review" 
FOREIGN KEY ("rentalId") REFERENCES "RentalHistory"("id") ON DELETE SET NULL;

-- =====================================================
-- CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para Property
CREATE INDEX IF NOT EXISTS "idx_property_city_province" ON "Property"("city", "province");
CREATE INDEX IF NOT EXISTS "idx_property_price" ON "Property"("price");
CREATE INDEX IF NOT EXISTS "idx_property_type" ON "Property"("propertyType");
CREATE INDEX IF NOT EXISTS "idx_property_status" ON "Property"("status");
CREATE INDEX IF NOT EXISTS "idx_property_featured" ON "Property"("featured");
CREATE INDEX IF NOT EXISTS "idx_property_user" ON "Property"("userId");

-- Índices para SearchHistory
CREATE INDEX IF NOT EXISTS "idx_search_user_date" ON "SearchHistory"("userId", "createdAt");

-- Índices para Payment
CREATE INDEX IF NOT EXISTS "idx_payment_mercadopago" ON "Payment"("mercadopagoId");
CREATE INDEX IF NOT EXISTS "idx_payment_user_status" ON "Payment"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_payment_property" ON "Payment"("propertyId");
CREATE INDEX IF NOT EXISTS "idx_payment_status_date" ON "Payment"("status", "dateCreated");

-- Índices para Subscription
CREATE INDEX IF NOT EXISTS "idx_subscription_user_status" ON "Subscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_subscription_property_status" ON "Subscription"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "idx_subscription_end_date" ON "Subscription"("endDate", "status");
CREATE INDEX IF NOT EXISTS "idx_subscription_renewal" ON "Subscription"("renewalDate");

-- Índices para PaymentMethod
CREATE INDEX IF NOT EXISTS "idx_payment_method_user_active" ON "PaymentMethod"("userId", "isActive");

-- Índices para PaymentAnalytics
CREATE INDEX IF NOT EXISTS "idx_analytics_date" ON "PaymentAnalytics"("date");
CREATE INDEX IF NOT EXISTS "idx_analytics_period" ON "PaymentAnalytics"("period");

-- Índices para PaymentNotification
CREATE INDEX IF NOT EXISTS "idx_notification_mercadopago" ON "PaymentNotification"("mercadopagoId");
CREATE INDEX IF NOT EXISTS "idx_notification_status_attempts" ON "PaymentNotification"("status", "attempts");
CREATE INDEX IF NOT EXISTS "idx_notification_created" ON "PaymentNotification"("createdAt");

-- Índices para UserProfile (Comunidad)
CREATE INDEX IF NOT EXISTS "idx_userprofile_role_city" ON "UserProfile"("role", "city");
CREATE INDEX IF NOT EXISTS "idx_userprofile_budget" ON "UserProfile"("budgetMin", "budgetMax");
CREATE INDEX IF NOT EXISTS "idx_userprofile_highlighted" ON "UserProfile"("highlightedUntil");
CREATE INDEX IF NOT EXISTS "idx_userprofile_suspended" ON "UserProfile"("isSuspended");

-- Índices para Room
CREATE INDEX IF NOT EXISTS "idx_room_city_type" ON "Room"("city", "type");
CREATE INDEX IF NOT EXISTS "idx_room_price" ON "Room"("price");
CREATE INDEX IF NOT EXISTS "idx_room_active" ON "Room"("isActive");

-- Índices para Like
CREATE INDEX IF NOT EXISTS "idx_like_from" ON "Like"("fromId");
CREATE INDEX IF NOT EXISTS "idx_like_to" ON "Like"("toId");

-- Índices para Conversation
CREATE INDEX IF NOT EXISTS "idx_conversation_a_active" ON "Conversation"("aId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_conversation_b_active" ON "Conversation"("bId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_conversation_last_message" ON "Conversation"("lastMessageAt");

-- Índices para Message
CREATE INDEX IF NOT EXISTS "idx_message_conversation_date" ON "Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_message_sender" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "idx_message_read" ON "Message"("isRead");

-- Índices para Report
CREATE INDEX IF NOT EXISTS "idx_report_target_status" ON "Report"("targetId", "status");
CREATE INDEX IF NOT EXISTS "idx_report_status_date" ON "Report"("status", "createdAt");

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ESQUEMA COMPLETO CREADO EXITOSAMENTE';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TABLAS PRINCIPALES CREADAS:';
  RAISE NOTICE '✅ profiles - Perfiles de Supabase Auth';
  RAISE NOTICE '✅ User - Usuarios del sistema';
  RAISE NOTICE '✅ Agent - Agentes inmobiliarios';
  RAISE NOTICE '✅ Property - Propiedades (TABLA PRINCIPAL)';
  RAISE NOTICE '✅ Inquiry - Consultas de propiedades';
  RAISE NOTICE '✅ UserReview - Reviews de usuarios';
  RAISE NOTICE '✅ RentalHistory - Historial de alquileres';
  RAISE NOTICE '✅ UserInquiry - Consultas de usuarios';
  RAISE NOTICE '✅ Favorite - Favoritos';
  RAISE NOTICE '✅ SearchHistory - Historial de búsquedas';
  RAISE NOTICE '';
  RAISE NOTICE '💳 SISTEMA DE PAGOS CREADO:';
  RAISE NOTICE '✅ Payment - Pagos de MercadoPago';
  RAISE NOTICE '✅ Subscription - Suscripciones';
  RAISE NOTICE '✅ PaymentMethod - Métodos de pago';
  RAISE NOTICE '✅ PaymentAnalytics - Analytics de pagos';
  RAISE NOTICE '✅ PaymentNotification - Webhooks';
  RAISE NOTICE '';
  RAISE NOTICE '👥 MÓDULO COMUNIDAD CREADO:';
  RAISE NOTICE '✅ UserProfile - Perfiles de comunidad';
  RAISE NOTICE '✅ Room - Habitaciones';
  RAISE NOTICE '✅ Like - Likes entre usuarios';
  RAISE NOTICE '✅ Conversation - Conversaciones';
  RAISE NOTICE '✅ Message - Mensajes';
  RAISE NOTICE '✅ Report - Reportes';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 ENUMS CREADOS:';
  RAISE NOTICE '✅ CommunityRole, PetPref, SmokePref, Diet, RoomType';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ÍNDICES OPTIMIZADOS:';
  RAISE NOTICE '✅ 25+ índices para consultas rápidas';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 BASE DE DATOS LISTA PARA PRODUCCIÓN';
END $$;
