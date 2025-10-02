Param()

$ErrorActionPreference = 'Stop'

function Write-Info($message) {
    Write-Host "[Kivo] $message"
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Info "Project root: $projectRoot"

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Info 'Python executable not found. Install Python 3.12 from https://www.python.org/downloads/windows/ and retry.'
    exit 1
}

# Get Python version as JSON so PowerShell can parse it safely
$versionJson = & python -c "import json, sys; print(json.dumps({'major':sys.version_info.major,'minor':sys.version_info.minor,'micro':sys.version_info.micro,'text':sys.version.split()[0]}))"
$version = $versionJson | ConvertFrom-Json
Write-Info "Detected python version $($version.text)"

# Require Python 3.10 - 3.12
if ($version.major -ne 3 -or $version.minor -lt 10 -or $version.minor -gt 12) {
    Write-Info 'Python 3.10–3.12 required. Download 3.12 from https://www.python.org/downloads/windows/ or install via Microsoft Store (Python 3.12).'
    exit 1
}

$venvPath = Join-Path $projectRoot '.venv'
$venvPython = Join-Path $venvPath 'Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
    Write-Info "Creating virtual environment in $venvPath"
    & python -m venv $venvPath
    # recompute $venvPython after creation
    $venvPython = Join-Path $venvPath 'Scripts\python.exe'
}

if (-not (Test-Path $venvPython)) {
    Write-Info 'Virtual environment creation failed or python not present in venv. Aborting.'
    exit 1
}

Write-Info 'Upgrading pip, setuptools, wheel'
& $venvPython -m pip install --upgrade pip setuptools wheel

$requirementsLite = Join-Path $projectRoot 'backend\requirements-lite.txt'
$requirementsMinimal = Join-Path $projectRoot 'backend\requirements-dev-minimal.txt'

$activeRequirements = 'requirements-lite.txt'

try {
    Write-Info "Installing dependencies from $activeRequirements"
    & $venvPython -m pip install --prefer-binary -r $requirementsLite
    Write-Info "Successfully installed $activeRequirements"
}
catch {
    Write-Info "Installation from requirements-lite.txt failed: $($_.Exception.Message)"
    if (-not (Test-Path $requirementsMinimal)) {
        Write-Info 'requirements-dev-minimal.txt not found. Aborting.'
        exit 1
    }
    $activeRequirements = 'requirements-dev-minimal.txt'
    Write-Info "Attempting fallback install from $activeRequirements"
    try {
        & $venvPython -m pip install --prefer-binary -r $requirementsMinimal
        Write-Info "Successfully installed $activeRequirements"
    }
    catch {
        Write-Info "Fallback installation failed: $($_.Exception.Message)"
        Write-Info 'Please install Python 3.12 (https://www.python.org/downloads/windows/) or switch to WSL where binary wheels are available.'
        exit 1
    }
}

Write-Info 'Environment ready. To activate, run: .\.venv\Scripts\Activate.ps1'
Write-Info 'Remember to run tests with: python -m pytest backend\tests'
