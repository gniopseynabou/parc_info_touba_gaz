# ==============================================================================
# Script de Sauvegarde Automatisée de la Base de Données — Touba Gaz IT
# Base : parc_info_touba_gaz (MySQL)
# Compatible Windows PowerShell 5.1 & PowerShell 7+
# Gère les espaces dans les chemins de fichiers (ex: "Touba Gaz")
# ==============================================================================

param (
    [string]$DbName = "",
    [string]$DbUser = "",
    [string]$DbPassword = "",
    [string]$DbHost = "",
    [string]$DbPort = "",
    [string]$BackupDir = "$PSScriptRoot\..\backups"
)

$ErrorActionPreference = "Stop"

# 1. Charger automatiquement les variables de .env.local si non fournies en paramètre
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

# Valeurs par défaut si non définies
if (-not $DbHost) { $DbHost = "127.0.0.1" }
if (-not $DbPort) { $DbPort = "3306" }
if (-not $DbUser) { $DbUser = "root" }
if (-not $DbName) { $DbName = "parc_info_touba_gaz" }

# Créer le répertoire de sauvegarde s'il n'existe pas
$resolvedBackupDir = [System.IO.Path]::GetFullPath($BackupDir)
if (-not (Test-Path $resolvedBackupDir)) {
    New-Item -ItemType Directory -Path $resolvedBackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $resolvedBackupDir "backup_${DbName}_${Timestamp}.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "TOUBA GAZ IT - SAUVEGARDE DE LA BASE DE DONNEES" -ForegroundColor Green
Write-Host "Base : $DbName" -ForegroundColor White
Write-Host "Hote : ${DbHost}:${DbPort} | Utilisateur : $DbUser" -ForegroundColor White
Write-Host "Date : $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host "Destination : $BackupFile" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Recherche de l'exécutable mysqldump compatible PS 5.1
$mysqldumpPath = ""
$foundCmd = Get-Command mysqldump -ErrorAction SilentlyContinue
if ($foundCmd) {
    $mysqldumpPath = $foundCmd.Source
}

if (-not $mysqldumpPath) {
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
    Write-Host "[ERREUR] L'utilitaire mysqldump est introuvable." -ForegroundColor Red
    Write-Host "Verifiez que MySQL est installe et accessible dans le PATH systeme." -ForegroundColor Yellow
    exit 1
}

Write-Host "Utilitaire mysqldump detecte : $mysqldumpPath" -ForegroundColor Gray

# Créer un fichier de configuration temporaire sécurisé pour éviter l'exposition du mot de passe
$tempCnf = Join-Path $env:TEMP "mysql_backup_$([System.IO.Path]::GetRandomFileName()).cnf"
try {
    $cnfContent = "[client]`nhost=$DbHost`nport=$DbPort`nuser=$DbUser`n"
    if ($DbPassword) {
        $cnfContent += "password=$DbPassword`n"
    }
    Set-Content -Path $tempCnf -Value $cnfContent -Encoding ASCII

    # Exécution avec redirection sécurisée
    $pwdArg = if ($DbPassword) { "-p$DbPassword" } else { "" }
    $cmd = "& `"$mysqldumpPath`" --defaults-extra-file=`"$tempCnf`" --single-transaction --quick --routines --triggers `"$DbName`" --result-file=`"$BackupFile`""
    
    Invoke-Expression $cmd
    
    if (Test-Path $BackupFile) {
        $fileSize = (Get-Item $BackupFile).Length / 1KB
        Write-Host "[SUCCES] Sauvegarde generee avec succes !" -ForegroundColor Green
        Write-Host "Taille du fichier : $([math]::Round($fileSize, 2)) Ko" -ForegroundColor White
        Write-Host "Chemin : $BackupFile" -ForegroundColor White

        # Rotation des sauvegardes : supprimer les fichiers de plus de 30 jours (RG12)
        $limitDate = (Get-Date).AddDays(-30)
        Get-ChildItem -Path $resolvedBackupDir -Filter "backup_${DbName}_*.sql" | Where-Object { $_.CreationTime -lt $limitDate } | Remove-Item -Force
        Write-Host "[ROTATION] Purge automatique des sauvegardes de plus de 30 jours effectuee." -ForegroundColor Gray
    } else {
        throw "Le fichier de sauvegarde n a pas pu etre cree."
    }
} catch {
    Write-Host "[ERREUR] Echec de la sauvegarde : $_" -ForegroundColor Red
    exit 1
} finally {
    if (Test-Path $tempCnf) {
        Remove-Item -Path $tempCnf -Force -ErrorAction SilentlyContinue
    }
}
