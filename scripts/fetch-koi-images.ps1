# Completa as imagens faltantes via busca de texto no Commons
$outDir = "P:\koi\public\images\koi"
$missing = @(
  @{ Slug = "bekko";    Search = "bekko koi" },
  @{ Slug = "shusui";   Search = "shusui koi" },
  @{ Slug = "ki-utsuri";Search = "utsuri koi" }
)

$headers = @{ "User-Agent" = "KoiFlashcards/1.0" }

foreach ($v in $missing) {
  $dest = Join-Path $outDir "$($v.Slug).jpg"
  if (Test-Path $dest) { Write-Host "SKIP $($v.Slug)"; continue }

  $q = [uri]::EscapeDataString($v.Search)
  $url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$q&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url%7Cmime%7Csize&iiurlwidth=800&format=json"

  $resp = $null
  for ($a = 1; $a -le 5; $a++) {
    try { $resp = Invoke-RestMethod -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 30; break }
    catch { Start-Sleep -Seconds (6 * $a) }
  }
  if (-not $resp) { Write-Host "ERR $($v.Slug)"; continue }

  $chosen = $null
  foreach ($p in ($resp.query.pages.PSObject.Properties.Value | Sort-Object index)) {
    $info = $p.imageinfo[0]
    if ($info.mime -ne "image/jpeg") { continue }
    if ($info.thumbwidth -lt 300 -or $info.thumbwidth -gt 2200) { continue }
    $lc = $p.title.ToLowerInvariant()
    if ($lc -match "logo|icon|diagram|drawing|art|tattoo|mosaic|tile|statue|painting|pond|garden|aerial|lake") { continue }
    $score = 0
    if ($lc -match [regex]::Escape($v.Slug)) { $score = 4 }
    if ($chosen -eq $null -or $score -gt $chosen.score) {
      $chosen = @{ Url = $info.thumburl; Title = $p.title; Score = $score }
    }
  }
  if (-not $chosen) { Write-Host "NONE $($v.Slug)"; Start-Sleep -Seconds 3; continue }

  Write-Host "GET $($v.Slug) score=$($chosen.Score) <- $($chosen.Title)"
  $ok = $false
  for ($a = 1; $a -le 4; $a++) {
    & curl.exe -s -L -A "KoiFlashcards/1.0" --max-time 60 -o $dest $chosen.Url
    if (Test-Path $dest) {
      $sz = (Get-Item $dest).Length
      $first = Get-Content $dest -TotalCount 1 -ErrorAction SilentlyContinue
      if ($sz -gt 5000 -and $first -notmatch "<html|Wikimedia|Error") { Write-Host "  OK -> $sz bytes"; $ok = $true; break }
    }
    Remove-Item $dest -ErrorAction SilentlyContinue
    Start-Sleep -Seconds (7 * $a)
  }
  if (-not $ok) { Write-Host "  FAIL $($v.Slug)" }
  Start-Sleep -Seconds 4
}
Write-Host "DONE"