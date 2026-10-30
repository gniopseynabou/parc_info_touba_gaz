# ==============================================================================
# Script de Restauration de la Base de Données — Touba Gaz IT
# Base : parc_info_touba_gaz (MySQL)
# Compatible Windows PowerShell 5.1 & PowerShell 7+
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbName = "",
    [string]$DbUser = "",
    [string]$DbPassword = "",
    [string]$DbHost = "",
    [string]$DbPort = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# 1. Charger automatiquement les variables de .env.local si non fournies
$envFile = Join-Path "$PSScriptRoot\.." ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            if (-not $DbHost -and $key -eq "DB_HOST") { $DbHost = $val }
            if (-not $DbPort -and $key -eq "DB_PORT") { $DbPort = $val }
            if (-not $DbUser -and $key -eq "DB_USER") { $DbUser = $val }
            if (-not $DbPassword -and $key -eq "DB_PASSWORD") { $DbPassword = $val }
            if (-not $DbName -and $key -eq "DB_NAME") { $DbName = $val }
        }
    }
}

if (-not $DbHost) { $DbHost = "127.0.0.1" }
if (-not $DbPort) { $DbPort = "3306" }
if (-not $DbUser) { $DbUser = "root" }
if (-not $DbName) { $DbName = "parc_info_touba_gaz" }

$resolvedBackupFile = [System.IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path $resolvedBackupFile)) {
    Write-Host "[ERREUR] Le fichier de sauvegarde specifie est introuvable : $resolvedBackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TOUBA GAZ IT - RESTAURATION DE LA BASE DE DONNEES" -ForegroundColor Yellow
Write-Host "Base cible : $DbName" -ForegroundColor White
Write-Host "Fichier source : $resolvedBackupFile" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Recherche de l'exécutable mysql
$mysqlPath = ""
$foundCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($foundCmd) {
    $mysqlPath = $foundCmd.Source
}

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
    Write-Host "[ERREUR] L'executable mysql est introuvable." -ForegroundColor Red
    exit 1
}

if (-not $Force) {
    $confirmation = Read-Host "Etes-vous certain de vouloir ecraser la base '$DbName' avec cette sauvegarde ? (O/N)"
    if ($confirmation -ne "O" -and $confirmation -ne "o") {
        Write-Host "Operation annulee par l'utilisateur." -ForegroundColor Yellow
        exit 0
    }
}

# Fichier temporaire d'options client
$tempCnf = Join-Path $env:TEMP "mysql_restore_$([System.IO.Path]::GetRandomFileName()).cnf"
try {
    $cnfContent = "[client]`nhost=$DbHost`nport=$DbPort`nuser=$DbUser`n"
    if ($DbPassword) {
        $cnfContent += "password=$DbPassword`n"
    }
    Set-Content -Path $tempCnf -Value $cnfContent -Encoding ASCII

    $cmd = "Get-Content `"$resolvedBackupFile`" | & `"$mysqlPath`" --defaults-extra-file=`"$tempCnf`" $DbName"
    Invoke-Expression $cmd

    Write-Host "[SUCCES] La base de donnees a ete restauree avec succes !" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Echec de la restauration : $_" -ForegroundColor Red
    exit 1
} finally {
    if (Test-Path $tempCnf) {
        Remove-Item -Path $tempCnf -Force -ErrorAction SilentlyContinue
    }
}
