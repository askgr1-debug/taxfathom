<#
  publish.ps1 — TaxFathom automated publishing
  ------------------------------------------------------------
  Imports new drafts from the writing workflow, validates the column JSON,
  commits anything new, pushes to GitHub, and lets Cloudflare Pages deploy.

  Usage:
    manual:    powershell -ExecutionPolicy Bypass -File "D:\TAX_BLOG\publish.ps1"
    scheduled: register in Task Scheduler, or call at the end of the writing run

  Behavior:
    - No changes -> exits quietly, no empty commit
    - Validation failure -> stops BEFORE committing (a column without a cited
      primary source must never reach the site)
    - Log: D:\TAX_BLOG\logs\publish-YYYYMMDD.log
#>

$Repo = "D:\TAX_BLOG"
$LogDir = Join-Path $Repo "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force $LogDir | Out-Null }
$Log = Join-Path $LogDir ("publish-" + (Get-Date -Format "yyyyMMdd") + ".log")

function Log($m) {
  $l = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Host $l
  try { Add-Content -Path $Log -Value $l -Encoding UTF8 } catch {}
}

# Task Scheduler runs with a minimal PATH; merge machine + user PATH.
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")

Log "===== publish start ====="
Set-Location $Repo

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Log "* node not found - aborting"; exit 1 }
if (-not (Get-Command git  -ErrorAction SilentlyContinue)) { Log "* git not found - aborting"; exit 1 }

# 1) Pull in anything new from D:\TAX_Writing\output (skips what already exists)
Log "1) importing drafts"
$imp = (& node scripts/import-drafts.mjs 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) {
  Log ("* import failed (exit $LASTEXITCODE): " + $imp.Trim())
  exit 1
}
Log ("   " + (($imp.Trim() -split "`r?`n" | Where-Object { $_ -ne "" }) -join "  |  "))

# 2) Validate every column (sources, schema, forbidden credential claims)
Log "2) validating columns"
$check = (& node scripts/check-articles.mjs 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) {
  Log ("* validation FAILED - nothing published: " + $check.Trim())
  exit 1
}
Log ("   " + (($check.Trim() -split "`r?`n" | Where-Object { $_ -ne "" }) -join "  |  "))

# 3) Anything to publish?
$changed = @(& git status --porcelain | Where-Object { $_ -ne "" })
if ($changed.Count -eq 0) { Log "no changes - nothing to publish."; Log "===== end ====="; exit 0 }
$nGuides = @($changed | Where-Object { $_ -match 'src/columns' }).Count
Log "3) changes: $($changed.Count) file(s) ($nGuides column(s))"

# 4) Commit and push
& git add -A | Out-Null
$msg = "content: publish {0} ({1} column(s))" -f (Get-Date -Format "yyyy-MM-dd HH:mm"), $nGuides
& git commit -q -m $msg
if ($LASTEXITCODE -ne 0) { Log "* commit failed (exit $LASTEXITCODE) - aborting"; exit 1 }
Log "4) committed: $msg"

& git push origin main *>> $Log
if ($LASTEXITCODE -ne 0) { Log "* push failed (exit $LASTEXITCODE) - check GitHub auth / network"; exit 1 }
Log "5) pushed -> Cloudflare builds and deploys (live in 1-3 min)"
Log "===== end (published) ====="
