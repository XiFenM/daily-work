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

function Test-PythonCommand([string]$Command, [string[]]$Arguments) {
  try {
    $version = (& $Command @Arguments --version 2>&1).Trim()
    return $LASTEXITCODE -eq 0 -and $version -match '^Python 3\.'
  } catch {
    return $false
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
  $hasPython = $false
  if ($env:DAILY_WORK_PYTHON) {
    $hasPython = Test-PythonCommand $env:DAILY_WORK_PYTHON @()
  }
  $pythonCommand = Find-Command "python.exe"
  if (-not $hasPython -and $pythonCommand) {
    $hasPython = Test-PythonCommand $pythonCommand.Source @()
  }
  $pyLauncher = Find-Command "py.exe"
  if (-not $hasPython -and $pyLauncher) {
    $hasPython = Test-PythonCommand $pyLauncher.Source @("-3")
  }
  if (-not $hasPython) {
    Install-WingetPackage "Python.Python.3.13"
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

$pythonPath = $null
$pythonArgs = @()
if ($env:DAILY_WORK_PYTHON -and (Test-PythonCommand $env:DAILY_WORK_PYTHON @())) {
  $pythonPath = $env:DAILY_WORK_PYTHON
} else {
  $python = Find-Command "python.exe"
  if ($python -and (Test-PythonCommand $python.Source @())) {
    $pythonPath = $python.Source
  } else {
    $python = Find-Command "py.exe"
    if ($python -and (Test-PythonCommand $python.Source @("-3"))) {
      $pythonPath = $python.Source
      $pythonArgs = @("-3")
    }
  }
}
if (-not $pythonPath) {
  throw "Python 3 is required to materialize central Skills; see docs/environment-setup.md."
}
$pythonVersion = (& $pythonPath @pythonArgs --version 2>&1).Trim()
if ($pythonArgs.Count -eq 0) {
  $env:DAILY_WORK_PYTHON = $pythonPath
} elseif (Test-Path Env:DAILY_WORK_PYTHON) {
  Remove-Item Env:DAILY_WORK_PYTHON
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
Write-Host "  Python: $pythonVersion"
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
