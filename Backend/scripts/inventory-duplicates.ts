#!/usr/bin/env node

/**
 * Script de inventario de duplicados
 * Identifica grupos de archivos con mismo nombre base pero hash distinto
 * NO borra ni mueve archivos, solo documenta
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface FileInfo {
  path: string
  name: string
  baseName: string
  hash: string
  size: number
  modified: Date
}

interface DuplicateGroup {
  baseName: string
  files: FileInfo[]
  modern: FileInfo | null
  legacy: FileInfo[]
}

/**
 * Calcula hash MD5 de un archivo
 */
function calculateFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('md5').update(content).digest('hex')
  } catch (error) {
    return 'ERROR'
  }
}

/**
 * Determina si un archivo es "moderno" basado en patrones
 */
function isModernFile(fileInfo: FileInfo): boolean {
  const modernPatterns = [
    // Archivos sin sufijos son más modernos
    /^[^-]+\.(ts|tsx|js|jsx)$/,
    // Archivos con sufijos modernos
    /-client\.(ts|tsx)$/,
    /-server\.(ts|tsx)$/,
    /-universal\.(ts|tsx)$/,
    /-improved\.(ts|tsx)$/,
    /-enhanced\.(ts|tsx)$/
  ]

  const legacyPatterns = [
    /-original\./,
    /-backup\./,
    /-old\./,
    /-legacy\./,
    /-fixed\./,
    /-corregido\./,
    /-temp\./,
    /-debug\./,
    /-simple\./,
    /-minimal\./,
    /-safe\./,
    /-alternative\./,
    /route-[a-z]+-[a-z]+\.ts$/  // route-backup-original.ts, etc.
  ]

  // Si coincide con patrón legacy, no es moderno
  if (legacyPatterns.some(pattern => pattern.test(fileInfo.name))) {
    return false
  }

  // Si coincide con patrón moderno, es moderno
  if (modernPatterns.some(pattern => pattern.test(fileInfo.name))) {
    return true
  }

  // Por defecto, archivos sin sufijos son más modernos
  return !fileInfo.name.includes('-')
}

/**
 * Obtiene el nombre base de un archivo (sin sufijos)
 */
function getBaseName(fileName: string): string {
  // Remover extensión
  const nameWithoutExt = fileName.replace(/\.(ts|tsx|js|jsx|md|json)$/, '')
  
  // Remover sufijos comunes
  return nameWithoutExt
    .replace(/-original$/, '')
    .replace(/-backup.*$/, '')
    .replace(/-old$/, '')
    .replace(/-legacy$/, '')
    .replace(/-fixed$/, '')
    .replace(/-corregido.*$/, '')
    .replace(/-temp$/, '')
    .replace(/-debug$/, '')
    .replace(/-simple$/, '')
    .replace(/-minimal.*$/, '')
    .replace(/-safe$/, '')
    .replace(/-alternative$/, '')
    .replace(/-enhanced$/, '')
    .replace(/-improved$/, '')
}

/**
 * Escanea directorio recursivamente
 */
function scanDirectory(dirPath: string, baseDir: string = ''): FileInfo[] {
  const files: FileInfo[] = []
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.join(baseDir, entry.name)
      
      if (entry.isDirectory()) {
        // Saltar directorios que no nos interesan
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
          continue
        }
        
        files.push(...scanDirectory(fullPath, relativePath))
      } else if (entry.isFile()) {
        // Solo archivos de código y configuración
        if (/\.(ts|tsx|js|jsx|md|json)$/.test(entry.name)) {
          const stats = fs.statSync(fullPath)
          
          files.push({
            path: relativePath,
            name: entry.name,
            baseName: getBaseName(entry.name),
            hash: calculateFileHash(fullPath),
            size: stats.size,
            modified: stats.mtime
          })
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error)
  }
  
  return files
}

/**
 * Agrupa archivos por nombre base
 */
function groupDuplicates(files: FileInfo[]): DuplicateGroup[] {
  const groups = new Map<string, FileInfo[]>()
  
  // Agrupar por nombre base
  for (const file of files) {
    if (!groups.has(file.baseName)) {
      groups.set(file.baseName, [])
    }
    groups.get(file.baseName)!.push(file)
  }
  
  // Filtrar solo grupos con múltiples archivos
  const duplicateGroups: DuplicateGroup[] = []
  
  for (const [baseName, groupFiles] of groups) {
    if (groupFiles.length > 1) {
      // Ordenar por modernidad (modernos primero)
      const sortedFiles = groupFiles.sort((a, b) => {
        const aModern = isModernFile(a)
        const bModern = isModernFile(b)
        
        if (aModern && !bModern) return -1
        if (!aModern && bModern) return 1
        
        // Si ambos son modernos o legacy, ordenar por fecha
        return b.modified.getTime() - a.modified.getTime()
      })
      
      const modern = sortedFiles.find(f => isModernFile(f)) || sortedFiles[0]
      const legacy = sortedFiles.filter(f => f !== modern)
      
      duplicateGroups.push({
        baseName,
        files: sortedFiles,
        modern,
        legacy
      })
    }
  }
  
  return duplicateGroups.sort((a, b) => a.baseName.localeCompare(b.baseName))
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 INVENTARIO DE DUPLICADOS')
  console.log('===========================\n')
  
  const startTime = Date.now()
  
  // Escanear proyecto
  console.log('Escaneando archivos...')
  const files = scanDirectory('.')
  
  console.log(`📁 ${files.length} archivos encontrados`)
  
  // Agrupar duplicados
  console.log('Agrupando duplicados...')
  const duplicateGroups = groupDuplicates(files)
  
  console.log(`🔄 ${duplicateGroups.length} grupos de duplicados encontrados\n`)
  
  // Mostrar resultados
  if (duplicateGroups.length === 0) {
    console.log('✅ No se encontraron duplicados')
    return
  }
  
  console.log('📋 GRUPOS DE DUPLICADOS ENCONTRADOS:')
  console.log('=====================================\n')
  
  for (const group of duplicateGroups) {
    console.log(`📂 Grupo: ${group.baseName}`)
    console.log(`   Archivos: ${group.files.length}`)
    
    if (group.modern) {
      console.log(`   ✅ Moderno: ${group.modern.path}`)
    }
    
    if (group.legacy.length > 0) {
      console.log(`   📜 Legacy:`)
      for (const legacy of group.legacy) {
        console.log(`      - ${legacy.path}`)
      }
    }
    
    console.log('')
  }
  
  // Generar JSON para procesamiento posterior
  const outputData = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    duplicateGroups: duplicateGroups.length,
    groups: duplicateGroups.map(group => ({
      baseName: group.baseName,
      modern: group.modern ? {
        path: group.modern.path,
        hash: group.modern.hash,
        size: group.modern.size,
        modified: group.modern.modified
      } : null,
      legacy: group.legacy.map(f => ({
        path: f.path,
        hash: f.hash,
        size: f.size,
        modified: f.modified
      }))
    }))
  }
  
  // Guardar resultados
  const outputPath = 'docs/evidencias/duplicates-inventory.json'
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
  
  const endTime = Date.now()
  console.log(`⏱️  Tiempo total: ${endTime - startTime}ms`)
  console.log(`💾 Resultados guardados en: ${outputPath}`)
  
  // Mostrar estadísticas
  console.log('\n📊 ESTADÍSTICAS:')
  console.log(`   Total archivos: ${files.length}`)
  console.log(`   Grupos duplicados: ${duplicateGroups.length}`)
  console.log(`   Archivos legacy: ${duplicateGroups.reduce((sum, g) => sum + g.legacy.length, 0)}`)
  
  console.log('\n✅ Inventario completado exitosamente')
  console.log('📋 Siguiente paso: Revisar docs/DECISION-DUPLICADOS.md')
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

export { main as inventoryDuplicates }
