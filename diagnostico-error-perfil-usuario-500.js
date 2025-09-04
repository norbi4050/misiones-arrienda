const fs = require('fs');

console.log('🔍 DIAGNÓSTICO ERROR 500 - PERFIL USUARIO');
console.log('==========================================\n');

// Análisis del error basado en los logs proporcionados
const errorAnalysis = {
  timestamp: new Date().toISOString(),
  error: {
    status: 500,
    endpoint: '/api/users/profile',
    method: 'PUT',
    supabaseError: {
      status: 400,
      operation: 'PATCH',
      table: 'users',
      url: 'https://qfeyhaaxyemmnohqdele.supabase.co/rest/v1/users?id=eq.6403f9d2-e846-4c70-87e0-e051127d9500&select=*'
    }
  },
  possibleCauses: [
    'Campos inexistentes en la tabla users de Supabase',
    'Tipos de datos incorrectos en la actualización',
    'Políticas RLS bloqueando la actualización',
    'Campos requeridos faltantes',
    'Validaciones de esquema fallando'
  ],
  investigation: []
};

console.log('📊 ANÁLISIS DEL ERROR:');
console.log('- Status Code: 500 (Internal Server Error)');
console.log('- Supabase Status: 400 (Bad Request)');
console.log('- Usuario ID: 6403f9d2-e846-4c70-87e0-e051127d9500');
console.log('- Operación: PATCH en tabla users\n');

// Verificar estructura del endpoint
console.log('🔧 VERIFICANDO ENDPOINT /api/users/profile...');

try {
  const routeContent = fs.readFileSync('Backend/src/app/api/users/profile/route.ts', 'utf8');
  
  // Extraer campos que se están actualizando
  const updateMatch = routeContent.match(/\.update\(\s*\{([^}]+)\}/s);
  if (updateMatch) {
    const updateFields = updateMatch[1];
    console.log('✅ Campos que se intentan actualizar:');
    
    const fields = updateFields.split(',').map(field => {
      const [key, value] = field.split(':');
      return key.trim();
    });
    
    fields.forEach(field => {
      if (field && !field.includes('//')) {
        console.log(`   - ${field}`);
      }
    });
    
    errorAnalysis.investigation.push({
      step: 'endpoint_analysis',
      status: 'completed',
      fields_found: fields.filter(f => f && !f.includes('//')),
      timestamp: new Date().toISOString()
    });
  }
} catch (error) {
  console.log('❌ Error leyendo el archivo del endpoint:', error.message);
  errorAnalysis.investigation.push({
    step: 'endpoint_analysis',
    status: 'failed',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

console.log('\n🗃️ VERIFICANDO ESQUEMA DE SUPABASE...');

// Verificar schema de Prisma para comparar
try {
  const schemaContent = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');
  
  // Buscar modelo User
  const userModelMatch = schemaContent.match(/model\s+User\s*\{([^}]+)\}/s);
  if (userModelMatch) {
    const userModel = userModelMatch[1];
    console.log('✅ Campos en el modelo User de Prisma:');
    
    const lines = userModel.split('\n');
    const fields = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@') && trimmed.includes(' ')) {
        const fieldName = trimmed.split(' ')[0];
        if (fieldName && !['id', 'created_at', 'updated_at'].includes(fieldName)) {
          fields.push(fieldName);
          console.log(`   - ${fieldName}`);
        }
      }
    });
    
    errorAnalysis.investigation.push({
      step: 'prisma_schema_analysis',
      status: 'completed',
      fields_found: fields,
      timestamp: new Date().toISOString()
    });
  }
} catch (error) {
  console.log('❌ Error leyendo el schema de Prisma:', error.message);
  errorAnalysis.investigation.push({
    step: 'prisma_schema_analysis',
    status: 'failed',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

console.log('\n🔍 POSIBLES PROBLEMAS IDENTIFICADOS:');

const commonIssues = [
  {
    issue: 'Campo search_type vs searchType',
    description: 'Inconsistencia entre camelCase y snake_case',
    severity: 'high',
    solution: 'Verificar mapeo de campos en Supabase'
  },
  {
    issue: 'Campo budget_range vs budgetRange',
    description: 'Inconsistencia entre camelCase y snake_case',
    severity: 'high',
    solution: 'Verificar mapeo de campos en Supabase'
  },
  {
    issue: 'Campos que no existen en Supabase',
    description: 'Intentando actualizar campos inexistentes',
    severity: 'critical',
    solution: 'Crear campos faltantes o remover del update'
  },
  {
    issue: 'Políticas RLS restrictivas',
    description: 'Row Level Security bloqueando updates',
    severity: 'medium',
    solution: 'Revisar políticas de la tabla users'
  }
];

commonIssues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue.issue}`);
  console.log(`   Descripción: ${issue.description}`);
  console.log(`   Severidad: ${issue.severity}`);
  console.log(`   Solución: ${issue.solution}\n`);
});

errorAnalysis.investigation.push({
  step: 'common_issues_identified',
  status: 'completed',
  issues: commonIssues,
  timestamp: new Date().toISOString()
});

console.log('🛠️ RECOMENDACIONES INMEDIATAS:');
console.log('1. Verificar que todos los campos existen en la tabla users de Supabase');
console.log('2. Revisar el mapeo entre camelCase (frontend) y snake_case (database)');
console.log('3. Verificar políticas RLS para operaciones UPDATE');
console.log('4. Implementar validación de campos antes del update');
console.log('5. Agregar logging detallado para identificar el campo problemático\n');

// Generar reporte
const reportContent = `# REPORTE DIAGNÓSTICO - ERROR 500 PERFIL USUARIO

## Resumen del Error
- **Timestamp**: ${errorAnalysis.timestamp}
- **Endpoint**: ${errorAnalysis.error.endpoint}
- **Status**: ${errorAnalysis.error.status}
- **Supabase Status**: ${errorAnalysis.error.supabaseError.status}

## Análisis Técnico
${errorAnalysis.investigation.map(inv => `
### ${inv.step}
- **Status**: ${inv.status}
- **Timestamp**: ${inv.timestamp}
${inv.fields_found ? `- **Campos encontrados**: ${inv.fields_found.join(', ')}` : ''}
${inv.error ? `- **Error**: ${inv.error}` : ''}
`).join('')}

## Problemas Identificados
${commonIssues.map((issue, index) => `
${index + 1}. **${issue.issue}**
   - Descripción: ${issue.description}
   - Severidad: ${issue.severity}
   - Solución: ${issue.solution}
`).join('')}

## Próximos Pasos
1. Implementar solución para mapeo de campos
2. Verificar esquema de Supabase
3. Actualizar políticas RLS si es necesario
4. Testing exhaustivo del endpoint corregido

---
*Reporte generado automáticamente el ${new Date().toLocaleString()}*
`;

fs.writeFileSync('REPORTE-DIAGNOSTICO-ERROR-PERFIL-500-FINAL.md', reportContent);

console.log('📄 Reporte guardado en: REPORTE-DIAGNOSTICO-ERROR-PERFIL-500-FINAL.md');
console.log('\n✅ DIAGNÓSTICO COMPLETADO');
console.log('🔧 Ejecuta la solución con: node solucion-error-perfil-usuario-500.js');
