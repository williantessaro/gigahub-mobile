param(
    [string]$BaseApk = "release/gigahub-mobile-base.apk",
    [string]$OutputApk = "release/gigahub-mobile.apk",
    [string]$DistDir = "dist",
    [string]$Keystore = "C:\Users\Will\.android\debug.keystore",
    [string]$StorePass = "android",
    [string]$KeyAlias = "androiddebugkey"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Empacotando e Assinando APK do GigaHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Copiar Base APK
Write-Host "1. Copiando base APK ($BaseApk) para $OutputApk..." -ForegroundColor Yellow
Copy-Item -Path $BaseApk -Destination $OutputApk -Force

# 2. Atualizar arquivos dentro do ZIP do APK usando Java ZipFileSystem
Write-Host "2. Atualizando assets da web dentro do APK..." -ForegroundColor Yellow
$javaExe = "$env:JAVA_HOME\bin\java.exe"
if (-not (Test-Path $javaExe)) {
    throw "Java nao encontrado em $javaExe"
}

& $javaExe UpdateApk.java $OutputApk $DistDir

# 3. Assinar com jarsigner
Write-Host "3. Assinando APK com jarsigner..." -ForegroundColor Yellow
$jarsigner = "$env:JAVA_HOME\bin\jarsigner.exe"
if (-not (Test-Path $jarsigner)) {
    throw "jarsigner nao encontrado em $jarsigner"
}

& $jarsigner -keystore $Keystore -storepass $StorePass -keypass $StorePass -sigalg SHA256withRSA -digestalg SHA-256 $OutputApk $KeyAlias

# 4. Verificar assinatura
Write-Host "4. Verificando assinatura do APK..." -ForegroundColor Yellow
$verifyOutput = & $jarsigner -verify $OutputApk 2>&1
Write-Host ($verifyOutput | Out-String)

if ($verifyOutput -match "jar verified") {
    $apkSize = (Get-Item $OutputApk).Length
    $sizeMb = [math]::Round($apkSize / 1048576, 2)
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "APK compilado e assinado com sucesso!" -ForegroundColor Green
    Write-Host ("Arquivo: " + $OutputApk + " (" + $sizeMb + " MB)") -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    throw "Falha na verificacao da assinatura do APK."
}
