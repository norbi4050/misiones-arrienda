# DOCUMENTACIÓN DEL BACKUP - LIMPIEZA ESQUEMAS SUPABASE

## 📋 INFORMACIÓN GENERAL

- **Fecha de creación**: 5/9/2025, 12:29:05
- **Propósito**: Backup completo antes de limpieza de esquemas duplicados
- **Versión**: 1.0
- **Estado**: CRÍTICO - OBLIGATORIO

## 🎯 OBJETIVO

Este backup se crea como medida de seguridad antes de ejecutar la limpieza de esquemas duplicados en Supabase. Contiene:

1. **Todas las tablas principales** (PascalCase)
2. **Todas las tablas duplicadas** (snake_case) si existen
3. **Políticas RLS** configuradas
4. **Índices** de la base de datos
5. **Scripts de restauración** completos

## 📁 CONTENIDO DEL BACKUP

### Archivos Incluidos:
- `BACKUP-COMPLETO-SUPABASE.sql` - Script principal de backup
- `RESTAURAR-BACKUP-SUPABASE.sql` - Script de restauración
- `DOCUMENTACION-BACKUP.md` - Esta documentación
- `VERIFICACION-BACKUP.sql` - Script de verificación

### Tablas Respaldadas:

#### Tablas Principales (PascalCase):
- User
- Property  
- Agent
- Favorite
- Conversation
- Message
- CommunityProfile

#### Tablas Duplicadas (snake_case) - Si existen:
- users
- properties
- agents
- favorites
- conversations
- messages

## 🚨 INSTRUCCIONES CRÍTICAS

### ANTES DE EJECUTAR LA LIMPIEZA:

1. **OBLIGATORIO**: Ejecutar el script `BACKUP-COMPLETO-SUPABASE.sql`
2. **VERIFICAR**: Que el backup se creó correctamente
3. **CONFIRMAR**: Que todas las tablas tienen datos respaldados
4. **PROBAR**: El script de restauración en entorno de desarrollo

### EN CASO DE EMERGENCIA:

1. **DETENER** inmediatamente cualquier operación de limpieza
2. **EJECUTAR** el script `RESTAURAR-BACKUP-SUPABASE.sql`
3. **VERIFICAR** que los datos se restauraron correctamente
4. **CONTACTAR** al equipo técnico si hay problemas

## ⚠️ ADVERTENCIAS IMPORTANTES

- **NO ELIMINAR** este directorio de backup hasta confirmar que la limpieza fue exitosa
- **MANTENER** una copia adicional del backup en ubicación segura
- **VERIFICAR** regularmente que el backup está íntegro
- **PROBAR** la restauración antes de proceder con la limpieza

## 🔄 PROCESO DE RESTAURACIÓN

En caso de necesitar restaurar el backup:

1. Ejecutar: `RESTAURAR-BACKUP-SUPABASE.sql`
2. Verificar con: `VERIFICACION-BACKUP.sql`
3. Confirmar integridad de datos
4. Reiniciar servicios si es necesario

## 📞 CONTACTO DE EMERGENCIA

En caso de problemas críticos durante la limpieza:
- Detener inmediatamente todas las operaciones
- Ejecutar restauración de backup
- Documentar el problema ocurrido
- Revisar logs de error detalladamente

---
*Backup creado automáticamente por el sistema de limpieza de esquemas duplicados*
*Fecha: 2025-09-05T15:29:05.430Z*
