#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "==> Detecting Python runtime"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Error: python3 not found on PATH. Install Python 3.10+ and retry."
  exit 1
fi

PY_VERSION="$($PYTHON_BIN -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')"
PY_MAJOR="$($PYTHON_BIN -c 'import sys; print(sys.version_info[0])')"
PY_MINOR="$($PYTHON_BIN -c 'import sys; print(sys.version_info[1])')"
echo "Detected Python ${PY_VERSION}"

if (( PY_MAJOR < 3 || (PY_MAJOR == 3 && PY_MINOR < 10) )); then
  echo "Warning: Python 3.10+ recommended. Current version may miss binary wheels."
fi

echo "==> Creating virtual environment"
$PYTHON_BIN -m venv "$PROJECT_ROOT/.venv"
source "$PROJECT_ROOT/.venv/bin/activate"

echo "==> Upgrading installer tooling"
python -m pip install --upgrade pip setuptools wheel

echo "==> Installing backend dependencies (full set)"
if python -m pip install --prefer-binary -r "$PROJECT_ROOT/backend/requirements.txt"; then
  ACTIVE_REQUIREMENTS="requirements.txt"
else
  echo "Full dependency installation failed. Falling back to lite mode..."
  if python -m pip install --prefer-binary -r "$PROJECT_ROOT/backend/requirements-lite.txt"; then
    ACTIVE_REQUIREMENTS="requirements-lite.txt"
    echo "Lite mode enabled: analytics will use heuristic pipeline (reduced clustering accuracy)."
    echo "For full analytics install Python 3.10-3.12 or a Linux environment with binary wheels."
  else
    echo "Lite dependency installation also failed. Review pip output and install prerequisites (consider Python 3.12 via pyenv or WSL)."
    exit 1
  fi
fi

echo "==> Installing Flutter dependencies"
if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter SDK not found. Install from https://docs.flutter.dev/get-started/install"
else
  (cd "$PROJECT_ROOT/mobile" && flutter pub get)
fi

echo "==> Setup complete (using $ACTIVE_REQUIREMENTS)"

cat <<NOTE
Next steps:
1. Activate the virtual environment: source "$PROJECT_ROOT/.venv/bin/activate"
2. Start backend: (cd "$PROJECT_ROOT/backend" && uvicorn app.main:app --reload)
3. Run mobile app: (cd "$PROJECT_ROOT/mobile" && flutter create . && flutter pub get && flutter run)
NOTE
