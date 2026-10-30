# ==============================================================================
# Script de Restauration de la Base de Données — Touba Gaz IT
# Base : parc_info_touba_gaz (MySQL)
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbName = "parc_info_touba_gaz",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$DbHost = "localhost"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERREUR] Le fichier de sauvegarde spécifié est introuvable : $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TOUBA GAZ IT — RESTAURATION DE LA BASE DE DONNÉES" -ForegroundColor Yellow
Write-Host "Base cible : $DbName" -ForegroundColor White
Write-Host "Fichier source : $BackupFile" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Recherche de l'exécutable mysql
$mysqlPath = (Get-Command mysql -ErrorAction SilentlyContinue)?.Source

if (-not $mysqlPath) {
    $possiblePaths = @(
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\laragon\bin\mysql\mysql*\bin\mysql.exe",
        "C:\wamp64\bin\mysql\mysql*\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server *\bin\mysql.exe"
    )

    foreach ($path in $possiblePaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $mysqlPath = $found.FullName
            break
        }
    }
}

if (-not $mysqlPath) {
    Write-Host "[ERREUR] L'exécutable 'mysql' est introuvable." -ForegroundColor Red
    exit 1
}

$confirmation = Read-Host "Êtes-vous certain de vouloir écraser la base '$DbName' avec cette sauvegarde ? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "Opération annulée par l'utilisateur." -ForegroundColor Yellow
    exit 0
}

try {
    $cmd = "& `"$mysqlPath`" -h $DbHost -u $DbUser"
    if ($DbPassword -and $DbPassword.Length -gt 0) {
        $cmd += " -p$DbPassword"
    }
    $cmd += " $DbName < `"$BackupFile`""

    Invoke-Expression $cmd
    Write-Host "[SUCCÈS] La base de données a été restaurée avec succès !" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Échec de la restauration : $_" -ForegroundColor Red
    exit 1
}
