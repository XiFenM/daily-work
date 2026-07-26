[CmdletBinding()]
param(
  [switch]$InstallSystemDeps,
  [switch]$WithBrowser,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$requiredPnpm = "11.9.0"

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Find-Command([string]$Name) {
  return Get-Command $Name -ErrorAction SilentlyContinue
}

function Install-WingetPackage([string]$Id) {
  if (-not (Find-Command "winget.exe")) {
    throw "winget is unavailable. Install $Id manually; see docs/environment-setup.md."
  }

  & winget.exe install --exact --id $Id --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget failed to install $Id (exit code $LASTEXITCODE)."
  }
}

if ($InstallSystemDeps) {
  $existingNode = Find-Command "node.exe"
  $nodeNeedsUpgrade = $true
  if ($existingNode) {
    $existingNodeVersion = (& node.exe --version).Trim()
    $existingNodeMajor = [int](($existingNodeVersion -replace "^v", "").Split(".")[0])
    $nodeNeedsUpgrade = $existingNodeMajor -lt 24
  }
  if ($nodeNeedsUpgrade) {
    Install-WingetPackage "OpenJS.NodeJS.LTS"
  }
  if (-not (Find-Command "git.exe")) {
    Install-WingetPackage "Git.Git"
  }
  if (-not (Find-Command "ffmpeg.exe")) {
    Install-WingetPackage "Gyan.FFmpeg"
  }
  Refresh-ProcessPath
}

$node = Find-Command "node.exe"
if (-not $node) {
  throw "Node.js 24+ is required; see docs/environment-setup.md."
}

$nodeVersion = (& node.exe --version).Trim()
$nodeMajor = [int](($nodeVersion -replace "^v", "").Split(".")[0])
if ($nodeMajor -lt 24) {
  throw "Node.js 24+ is required; current version is $nodeVersion."
}

$git = Find-Command "git.exe"
if (-not $git) {
  throw "Git is required. Install it or rerun with -InstallSystemDeps."
}

$ffmpeg = Find-Command "ffmpeg.exe"
if (-not $ffmpeg) {
  Write-Warning "FFmpeg is missing; final audio/video QA will be unavailable."
}

$pnpm = Find-Command "pnpm.cmd"
$npx = Find-Command "npx.cmd"
if ($pnpm) {
  $pnpmCommand = $pnpm.Source
  $pnpmPrefix = @()
  $pnpmVersion = (& $pnpmCommand --version).Trim()
  $pnpmMajor = [int]$pnpmVersion.Split(".")[0]
  if ($pnpmMajor -lt 11) {
    if (-not $npx) {
      throw "pnpm 11+ is required; current version is $pnpmVersion and npx is unavailable."
    }
    Write-Warning "Global pnpm is too old; using pnpm@$requiredPnpm through npx."
    $pnpmCommand = $npx.Source
    $pnpmPrefix = @("--yes", "pnpm@$requiredPnpm")
    $pnpmVersion = $requiredPnpm
  }
} elseif ($npx) {
  Write-Warning "Global pnpm is missing; using pnpm@$requiredPnpm through npx."
  $pnpmCommand = $npx.Source
  $pnpmPrefix = @("--yes", "pnpm@$requiredPnpm")
  $pnpmVersion = $requiredPnpm
} else {
  throw "npm/npx is missing from the Node.js installation."
}

Write-Host "Windows environment"
Write-Host "  Node:   $nodeVersion"
Write-Host "  pnpm:   $pnpmVersion"
Write-Host "  Git:    $(& git.exe --version)"
Write-Host "  FFmpeg: $(if ($ffmpeg) { (& ffmpeg.exe -version | Select-Object -First 1) } else { 'not installed' })"

if ($CheckOnly) {
  exit 0
}

Push-Location $repoRoot
try {
  $bootstrapArgs = @("bootstrap")
  if ($WithBrowser) {
    $bootstrapArgs += @("--", "--with-browser")
  }

  & $pnpmCommand @pnpmPrefix @bootstrapArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Repository bootstrap failed (exit code $LASTEXITCODE)."
  }
} finally {
  Pop-Location
}
