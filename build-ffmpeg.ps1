# Downloads FFmpeg/FFprobe static binaries (run this before `bun tauri build`)
# Download from gyan.dev (essentials build, no external dependencies)

$zipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = Join-Path $PSScriptRoot "src-tauri\binaries\ffmpeg.zip"
$binDir = Join-Path $PSScriptRoot "src-tauri\binaries"

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

Write-Host "Downloading FFmpeg essentials build..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UserAgent "Mozilla/5.0"

Write-Host "Extracting..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $binDir -Force

$extracted = Get-ChildItem -Path $binDir -Directory | Where-Object { $_.Name -like "ffmpeg-*" } | Select-Object -First 1
if ($extracted) {
    Copy-Item -Path "$($extracted.FullName)\bin\ffmpeg.exe" -Destination $binDir -Force
    Copy-Item -Path "$($extracted.FullName)\bin\ffprobe.exe" -Destination $binDir -Force
    Remove-Item -Path $extracted.FullName -Recurse -Force
}
Remove-Item -Path $zipPath -Force

Write-Host "FFmpeg binaries ready!" -ForegroundColor Green