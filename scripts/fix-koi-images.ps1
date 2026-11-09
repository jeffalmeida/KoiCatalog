# Resolve imagens pendentes (bekko, goshiki, ki-utsuri) via curl p/ arquivo + análise local.
$ErrorActionPreference = "Stop"
$outDir = "P:\koi\public\images\koi"
$tmpDir = "$env:TEMP\koi_fix"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$targets = @(
  @{ Slug = "bekko";     Search = "bekko koi" },
  @{ Slug = "goshiki";   Search = "goshiki koi" },
  @{ Slug = "ki-utsuri"; Search = "ki utsuri koi" }
)

$ua = "KoiFlashcards/1.0 (contact: none)"

foreach ($t in $targets) {
  $dest = Join-Path $outDir "$($t.Slug).jpg"
  if (Test-Path $dest) { Write-Host "SKIP $($t.Slug)"; continue }

  $q = [uri]::EscapeDataString($t.Search)
  $apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$q&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=800&format=json"
  $apiFile = Join-Path $tmpDir "$($t.Slug)_api.json"

  # 1. Busca com curl (mais tolerante)
  $ok = $false
  for ($a = 1; $a -le 5; $a++) {
    & curl.exe -s -A $ua --max-time 40 -o $apiFile $apiUrl
    if ((Test-Path $apiFile) -and ((Get-Item $apiFile).Length -gt 100)) {
      $raw = Get-Content $apiFile -Raw -ErrorAction SilentlyContinue
      if ($raw -match '"pages"') { $ok = $true; break }
    }
    Start-Sleep -Seconds (8 * $a)
  }
  if (-not $ok) { Write-Host "ERR api $($t.Slug)"; continue }

  # 2. Parse e escolha
  $resp = Get-Content $apiFile -Raw | ConvertFrom-Json
  if (-not $resp.query -or -not $resp.query.pages) { Write-Host "NONE $($t.Slug)"; continue }

  $chosen = $null
  foreach ($p in ($resp.query.pages.PSObject.Properties.Value | Sort-Object { if ($_.index) { [int]$_.index } else { 99 } })) {
    if (-not $p.imageinfo) { continue }
    $info = $p.imageinfo[0]
    if ($info.mime -ne "image/jpeg") { continue }
    if ($info.thumbwidth -lt 300 -or $info.thumbwidth -gt 2400) { continue }
    $lc = $p.title.ToLowerInvariant()
    if ($lc -match "logo|icon|diagram|drawing|tattoo|mosaic|tile|statue|painting|pond|garden|aerial|lake|pet|hand|luftbild") { continue }
    $url = $info.thumburl; if (-not $url) { $url = $info.url }
    $score = 0
    if ($lc -match [regex]::Escape($t.Slug)) { $score += 5 }
    if ($lc -match "koi") { $score += 2 }
    if ($info.thumbwidth -ge 600) { $score += 1 }
    if ($null -eq $chosen -or $score -gt $chosen.score) { $chosen = @{ Url = $url; Title = $p.title; Score = $score } }
  }
  if (-not $chosen) { Write-Host "NONE good $($t.Slug)"; Start-Sleep -Seconds 4; continue }

  Write-Host "GET $($t.Slug) score=$($chosen.Score) <- $($chosen.Title)"
  $dlok = $false
  for ($a = 1; $a -le 4; $a++) {
    & curl.exe -s -L -A $ua --max-time 60 -o $dest $chosen.Url
    if (Test-Path $dest) {
      $sz = (Get-Item $dest).Length
      $head = Get-Content $dest -TotalCount 1 -ErrorAction SilentlyContinue
      if ($sz -gt 5000 -and $head -notmatch "<html|Wikimedia|Error") { Write-Host "  OK -> $sz bytes"; $dlok = $true; break }
    }
    Remove-Item $dest -ErrorAction SilentlyContinue
    Start-Sleep -Seconds (8 * $a)
  }
  if (-not $dlok) { Write-Host "  FAIL $($t.Slug)" }
  Start-Sleep -Seconds 5
}
Write-Host "DONE"