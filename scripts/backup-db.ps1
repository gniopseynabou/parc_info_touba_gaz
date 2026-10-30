# ==============================================================================
# Script de Sauvegarde Automatisée de la Base de Données — Touba Gaz IT
# Base : parc_info_touba_gaz (MySQL)
# ==============================================================================

param (
    [string]$DbName = "parc_info_touba_gaz",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$DbHost = "localhost",
    [string]$BackupDir = "$PSScriptRoot\..\backups"
)

$ErrorActionPreference = "Stop"

# Créer le répertoire de sauvegarde s'il n'existe pas
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_${DbName}_${Timestamp}.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TOUBA GAZ IT — SAUVEGARDE DE LA BASE DE DONNÉES" -ForegroundColor Green
Write-Host "Base : $DbName" -ForegroundColor White
Write-Host "Date : $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "Destination : $BackupFile" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Recherche de l'exécutable mysqldump
$mysqldumpPath = (Get-Command mysqldump -ErrorAction SilentlyContinue)?.Source

if (-not $mysqldumpPath) {
    # Chemins habituels (XAMPP, Laragon, MySQL Server, WAMP)
    $possiblePaths = @(
        "C:\xampp\mysql\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql*\bin\mysqldump.exe",
        "C:\wamp64\bin\mysql\mysql*\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server *\bin\mysqldump.exe"
    )

    foreach ($path in $possiblePaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $mysqldumpPath = $found.FullName
            break
        }
    }
}

if (-not $mysqldumpPath) {
    Write-Host "[ERREUR] L'utilitaire 'mysqldump' n'a pas été trouvé." -ForegroundColor Red
    Write-Host "Veuillez vérifier que MySQL est installé et présent dans le PATH système." -ForegroundColor Yellow
    exit 1
}

Write-Host "Utilitaire mysqldump détecté : $mysqldumpPath" -ForegroundColor Gray

# Construction des arguments mysqldump
$argsList = @(
    "-h", $DbHost,
    "-u", $DbUser,
    "--single-transaction",
    "--quick",
    "--routines",
    "--triggers",
    "--result-file=$BackupFile",
    $DbName
)

if ($DbPassword -and $DbPassword.Length -gt 0) {
    $argsList += "-p$DbPassword"
}

try {
    Start-Process -FilePath $mysqldumpPath -ArgumentList $argsList -NoNewWindow -Wait
    
    if (Test-Path $BackupFile) {
        $fileSize = (Get-Item $BackupFile).Length / 1KB
        Write-Host "[SUCCÈS] Sauvegarde générée avec succès !" -ForegroundColor Green
        Write-Host "Taille du fichier : $([math]::Round($fileSize, 2)) Ko" -ForegroundColor White
        Write-Host "Chemin : $BackupFile" -ForegroundColor White

        # Rotation des sauvegardes : supprimer les fichiers de plus de 30 jours
        $limitDate = (Get-Date).AddDays(-30)
        Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql" | Where-Object { $_.CreationTime -lt $limitDate } | Remove-Item -Force
        Write-Host "[ROTATION] Purge automatique des sauvegardes de plus de 30 jours effectuée." -ForegroundColor Gray
    } else {
        throw "Le fichier de sauvegarde n'a pas été créé."
    }
} catch {
    Write-Host "[ERREUR] Échec de la sauvegarde : $_" -ForegroundColor Red
    exit 1
}
