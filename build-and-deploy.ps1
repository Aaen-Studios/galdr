# Builds the Tauri app and generates the updater signature.
# Run after `build-ffmpeg.ps1` (downloads FFmpeg binaries).

$version = "0.1.0"
$root = $PSScriptRoot
$msiZip = "$root\src-tauri\target\release\bundle\msi\galdr_${version}_x64_en-US.msi.zip"

# 1. Build
Write-Host "Building Tauri app..." -ForegroundColor Cyan
bun tauri build
if (-not $?) { exit 1 }

# 2. Create .msi.zip if missing (Tauri v2 doesn't always produce it)
if (-not (Test-Path $msiZip)) {
    Write-Host "Creating .msi.zip..." -ForegroundColor Cyan
    Compress-Archive -Path "$root\src-tauri\target\release\bundle\msi\galdr_${version}_x64_en-US.msi" `
        -DestinationPath $msiZip -Force
}

# 3. Sign
Write-Host "Signing update..." -ForegroundColor Cyan
$sigOutput = & bun x tauri signer sign `
    --private-key-path "$root\src-tauri\updater.key" `
    "$msiZip" 2>&1 | Out-String

if ($LASTEXITCODE -ne 0) {
    Write-Host "Signing with alternative method..." -ForegroundColor Yellow
    $sigOutput = & bun run tauri signer sign `
        --private-key-path "$root\src-tauri\updater.key" `
        "$msiZip" 2>&1 | Out-String
}

Write-Host "Signature:" -ForegroundColor Green
Write-Host $sigOutput

# 4. Create update.json
$pubDate = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
$updateJson = @"
{
  "version": "$version",
  "notes": "Initial release",
  "pub_date": "$pubDate",
  "platforms": {
    "windows-x86_64": {
      "signature": "PASTE_SIGNATURE_HERE",
      "url": "https://github.com/ellipog/galdr/releases/download/v$version/galdr_${version}_x64_en-US.msi.zip"
    }
  }
}
"@
Set-Content -Path "$root\update.json" -Value $updateJson -Encoding UTF8

Write-Host "Done!" -ForegroundColor Green
Write-Host "Build artifacts:" -ForegroundColor Cyan
Get-ChildItem -Path "$root\src-tauri\target\release\bundle\msi\" -Name
Get-ChildItem -Path "$root\src-tauri\target\release\bundle\nsis\" -Name
Write-Host "`nupdate.json created — paste the signature from above into it" -ForegroundColor Yellow