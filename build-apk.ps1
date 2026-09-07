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

# 3. Alinhar e Assinar com uber-apk-signer (suporta v1, v2, v3 e zipalign para Android 11+)
Write-Host "3. Alinhando e assinando APK com uber-apk-signer..." -ForegroundColor Yellow
$signerJar = "uber-apk-signer.jar"
if (-not (Test-Path $signerJar)) {
    throw "uber-apk-signer.jar nao encontrado em $signerJar"
}

$signOutput = & $javaExe -jar $signerJar -a $OutputApk --ksDebug $Keystore --overwrite --allowResign --verbose 2>&1
Write-Host ($signOutput | Out-String)

# 4. Verificar assinatura e zipalign
Write-Host "4. Verificando zipalign e assinatura v1/v2/v3..." -ForegroundColor Yellow
$verifyOutput = & $javaExe -jar $signerJar -y -a $OutputApk 2>&1
Write-Host ($verifyOutput | Out-String)

if ($verifyOutput -match "zipalign verified" -and $verifyOutput -match "signature verified") {
    $apkSize = (Get-Item $OutputApk).Length
    $sizeMb = [math]::Round($apkSize / 1048576, 2)
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "APK compilado, alinhado e assinado com sucesso (v1+v2+v3)!" -ForegroundColor Green
    Write-Host ("Arquivo: " + $OutputApk + " (" + $sizeMb + " MB)") -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    throw "Falha na verificacao da assinatura/zipalign do APK."
}
