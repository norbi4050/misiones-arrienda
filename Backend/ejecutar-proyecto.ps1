# Misiones Arrienda - Ejecutar Proyecto (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    MISIONES ARRIENDA - POWERSHELL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar a la carpeta del script
Set-Location $PSScriptRoot

Write-Host "Ubicacion actual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCION:" -ForegroundColor Yellow
    Write-Host "1. Ve a https://nodejs.org" -ForegroundColor White
    Write-Host "2. Descarga e instala Node.js" -ForegroundColor White
    Write-Host "3. Reinicia tu computadora" -ForegroundColor White
    Write-Host "4. Intenta de nuevo" -ForegroundColor White
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar npm
Write-Host "Verificando npm..." -ForegroundColor Green
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: npm no funciona" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERROR: package.json no encontrado" -ForegroundColor Red
    Write-Host "Asegurate de estar en la carpeta Backend" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ package.json encontrado" -ForegroundColor Green
Write-Host ""

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Green
Write-Host "(Esto puede tomar unos minutos la primera vez)" -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Falló la instalación de dependencias" -ForegroundColor Red
    Write-Host ""
    Write-Host "POSIBLES SOLUCIONES:" -ForegroundColor Yellow
    Write-Host "1. Verifica tu conexión a internet" -ForegroundColor White
    Write-Host "2. Ejecuta PowerShell como administrador" -ForegroundColor White
    Write-Host "3. Elimina la carpeta node_modules y intenta de nuevo" -ForegroundColor White
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# Configurar base de datos
Write-Host "Configurando base de datos..." -ForegroundColor Green

try {
    Write-Host "- Generando cliente Prisma..." -ForegroundColor Cyan
    npm run db:generate
    
    Write-Host "- Creando base de datos..." -ForegroundColor Cyan
    npm run db:push
    
    Write-Host "- Poblando con datos de ejemplo..." -ForegroundColor Cyan
    npm run db:seed
    
    Write-Host "✅ Base de datos configurada" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Falló la configuración de la base de datos" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    INICIANDO SERVIDOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si ves 'Ready - started server', el proyecto está funcionando" -ForegroundColor Yellow
Write-Host "Luego abre tu navegador en: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para detener el servidor, presiona Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Abrir navegador automáticamente después de 5 segundos
Start-Job -ScriptBlock {
    Start-Sleep 5
    Start-Process "http://localhost:3000"
}

# Iniciar servidor
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Falló el inicio del servidor" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "El servidor se ha detenido" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Presiona Enter para salir"
