# Script para documentar todos los __init__.py

$files = @(
    "backend\app\__init__.py",
    "backend\app\api\__init__.py",
    "backend\app\api\v1\__init__.py",
    "backend\app\core\__init__.py",
    "backend\app\models\__init__.py",
    "backend\app\schemas\__init__.py",
    "backend\app\services\__init__.py",
    "backend\app\utils\__init__.py"
)

$contents = @{
    "backend\app\__init__.py" = '"""EcoCampus - Aplicación principal."""'
    "backend\app\api\__init__.py" = '"""API Routes - Contenedor de routers."""'
    "backend\app\api\v1\__init__.py" = '"""API v1 Routes - Endpoints de autenticación, contenedores, recolección e incidentes."""'
    "backend\app\core\__init__.py" = '"""Core - Configuración, seguridad y base de datos."""'
    "backend\app\models\__init__.py" = '"""Models - Modelos SQLAlchemy ORM."""'
    "backend\app\schemas\__init__.py" = '"""Schemas - Modelos Pydantic para validación."""'
    "backend\app\services\__init__.py" = '"""Services - Lógica de negocio."""'
    "backend\app\utils\__init__.py" = '"""Utils - Funciones auxiliares."""'
}

foreach ($file in $files) {
    $content = $contents[$file]
    Set-Content -Path $file -Value $content
    Write-Host "✅ $file"
}

Write-Host "Listo!"