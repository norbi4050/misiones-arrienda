import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Configurar Prisma con manejo SSL mejorado
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Tipos para el diagnóstico
interface TestResult {
  name: string;
  status: "success" | "failed";
  result?: string | unknown;
  error?: string;
  code?: string;
}

interface DiagnosticsData {
  timestamp: string;
  environment: string;
  databaseUrl: string;
  directUrl: string;
  tests: TestResult[];
  responseTime?: string;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log("🔍 Health check iniciado...");
    
    // Verificar que Prisma puede conectarse
    await prisma.$connect();
    console.log("✅ Prisma conectado");
    
    // Ejecutar query de prueba para verificar conexión
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as db_version`;
    console.log("✅ Query ejecutado exitosamente");
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        connected: true,
        serverTime: (result as any)[0]?.current_time,
        version: (result as any)[0]?.db_version?.split(' ')[0] + ' ' + (result as any)[0]?.db_version?.split(' ')[1],
        message: "Database connection successful"
      }
    });
    
  } catch (error: any) {
    console.error("❌ Database health check failed:", error);
    
    const responseTime = Date.now() - startTime;
    let errorDetails: any = {
      connected: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      responseTime: `${responseTime}ms`
    };
    
    // Manejo específico para errores SSL
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN' || error.message.includes('self-signed certificate')) {
      errorDetails = {
        ...errorDetails,
        sslIssue: true,
        solution: "SSL certificate issue detected. This is common in development with Supabase.",
        recommendations: [
          "Verify Supabase project is active",
          "Check DATABASE_URL credentials",
          "In production, SSL works correctly",
          "For development, consider using connection pooling"
        ]
      };
    }
    
    return NextResponse.json({ 
      ok: false, 
      timestamp: new Date().toISOString(),
      database: errorDetails
    }, { status: 500 });
    
  } finally {
    try {
      await prisma.$disconnect();
      console.log("🔌 Prisma desconectado");
    } catch (disconnectError) {
      console.warn("⚠️ Error al desconectar Prisma:", disconnectError);
    }
  }
}

// Endpoint adicional para diagnóstico avanzado
export async function POST() {
  const startTime = Date.now();
  
  try {
    console.log("🔧 Diagnóstico avanzado iniciado...");
    
    // Intentar múltiples configuraciones
    const diagnostics: DiagnosticsData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      directUrl: process.env.DIRECT_URL ? 'configured' : 'missing',
      tests: []
    };
    
    // Test 1: Conexión básica
    try {
      await prisma.$connect();
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      diagnostics.tests.push({
        name: "Basic Connection",
        status: "success",
        result: "Connected successfully"
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: "Basic Connection",
        status: "failed",
        error: error.message,
        code: error.code
      });
    }
    
    // Test 2: Query de información del servidor
    try {
      const serverInfo = await prisma.$queryRaw`SELECT version() as version, current_database() as database`;
      diagnostics.tests.push({
        name: "Server Information",
        status: "success",
        result: serverInfo
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: "Server Information", 
        status: "failed",
        error: error.message
      });
    }
    
    // Test 3: Verificar tablas
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      diagnostics.tests.push({
        name: "Tables Check",
        status: "success",
        result: `Found ${(tables as any[]).length} tables`
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: "Tables Check",
        status: "failed", 
        error: error.message
      });
    }
    
    const responseTime = Date.now() - startTime;
    diagnostics.responseTime = `${responseTime}ms`;
    
    return NextResponse.json({
      ok: true,
      diagnostics
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error.message,
      code: error.code
    }, { status: 500 });
    
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn("⚠️ Error al desconectar Prisma en diagnóstico:", disconnectError);
    }
  }
}
