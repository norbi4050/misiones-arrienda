import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

interface AuditCheck {
  check: string;
  status: string;
  details: string;
  critical: boolean;
}

export async function GET() {
  const supabase = await getServerSupabase();
  
  try {
    const auditResults = {
      timestamp: new Date().toISOString(),
      checks: [] as AuditCheck[]
    };

    // 1. Verificar estructura de tabla User
    console.log("🔍 Verificando estructura de tabla User...");
    try {
      const { data: userSchema, error: schemaError } = await supabase
        .from('User')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        auditResults.checks.push({
          check: "Tabla User - Estructura",
          status: "❌ ERROR",
          details: schemaError.message,
          critical: true
        });
      } else {
        auditResults.checks.push({
          check: "Tabla User - Estructura", 
          status: "✅ OK",
          details: "Tabla User accesible",
          critical: false
        });
      }
    } catch (error: any) {
      auditResults.checks.push({
        check: "Tabla User - Estructura",
        status: "❌ ERROR",
        details: `Error de conexión: ${error.message}`,
        critical: true
      });
    }

    // 2. Verificar campos específicos necesarios
    console.log("🔍 Verificando campos requeridos...");
    try {
      const { data: testUser, error: fieldsError } = await supabase
        .from('User')
        .select('id, name, email, phone, bio, avatar, verified, createdAt, updatedAt')
        .limit(1);
      
      if (fieldsError) {
        auditResults.checks.push({
          check: "Campos Requeridos",
          status: "❌ ERROR", 
          details: `Campos faltantes: ${fieldsError.message}`,
          critical: true
        });
      } else {
        auditResults.checks.push({
          check: "Campos Requeridos",
          status: "✅ OK",
          details: "Todos los campos necesarios existen: name, email, phone, bio",
          critical: false
        });
      }
    } catch (error: any) {
      auditResults.checks.push({
        check: "Campos Requeridos",
        status: "❌ ERROR",
        details: `Error verificando campos: ${error.message}`,
        critical: true
      });
    }

    // 3. Verificar autenticación actual
    console.log("🔍 Verificando autenticación...");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        auditResults.checks.push({
          check: "Autenticación",
          status: "⚠️ WARNING",
          details: "No hay usuario autenticado para pruebas",
          critical: false
        });
      } else {
        auditResults.checks.push({
          check: "Autenticación",
          status: "✅ OK",
          details: `Usuario autenticado: ${user.email}`,
          critical: false
        });

        // 4. Probar UPDATE real si hay usuario
        console.log("🔍 Probando UPDATE real...");
        try {
          const testUpdate = {
            updatedAt: new Date().toISOString()
          };

          const { data: updateResult, error: updateError } = await supabase
            .from('User')
            .update(testUpdate)
            .eq('id', user.id)
            .select('id, updatedAt');

          if (updateError) {
            auditResults.checks.push({
              check: "UPDATE Test",
              status: "❌ ERROR",
              details: `Error en UPDATE: ${updateError.message}`,
              critical: true
            });
          } else {
            auditResults.checks.push({
              check: "UPDATE Test",
              status: "✅ OK",
              details: `UPDATE exitoso. updatedAt: ${updateResult[0]?.updatedAt}`,
              critical: false
            });
          }
        } catch (error: any) {
          auditResults.checks.push({
            check: "UPDATE Test",
            status: "❌ ERROR",
            details: `Error probando UPDATE: ${error.message}`,
            critical: true
          });
        }
      }
    } catch (error: any) {
      auditResults.checks.push({
        check: "Autenticación",
        status: "❌ ERROR",
        details: `Error verificando auth: ${error.message}`,
        critical: true
      });
    }

    // 5. Verificar variables de entorno
    console.log("🔍 Verificando variables de entorno...");
    const envVars = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    auditResults.checks.push({
      check: "Variables de Entorno",
      status: envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY ? "✅ OK" : "❌ ERROR",
      details: `URL: ${envVars.SUPABASE_URL}, ANON: ${envVars.SUPABASE_ANON_KEY}, SERVICE: ${envVars.SUPABASE_SERVICE_ROLE}`,
      critical: envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY ? false : true
    });

    // Resumen final
    const criticalErrors = auditResults.checks.filter(c => c.critical && c.status.includes("ERROR"));
    const warnings = auditResults.checks.filter(c => c.status.includes("WARNING"));
    const successes = auditResults.checks.filter(c => c.status.includes("OK"));

    const summary = {
      total_checks: auditResults.checks.length,
      critical_errors: criticalErrors.length,
      warnings: warnings.length,
      successes: successes.length,
      overall_status: criticalErrors.length === 0 ? "🟢 READY" : "🔴 NEEDS_FIXES"
    };

    return NextResponse.json({
      audit: auditResults,
      summary,
      recommendations: criticalErrors.length > 0 ? 
        "❌ Hay errores críticos que deben resolverse antes de usar el perfil de inquilino" :
        "✅ Supabase está configurado correctamente para las actualizaciones del perfil"
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error en auditoría de Supabase:', error);
    return NextResponse.json({
      error: "Error interno en auditoría",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
