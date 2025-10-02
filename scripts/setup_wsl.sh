#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "[Kivo] Project root: ${PROJECT_ROOT}"

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "[Kivo] ${PYTHON_BIN} not found. Install Python 3.12 with 'sudo apt install python3 python3-venv python3-pip' or via pyenv." >&2
  exit 1
fi

PY_VERSION="$("${PYTHON_BIN}" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')"
PY_MAJOR="$("${PYTHON_BIN}" -c 'import sys; print(sys.version_info[0])')"
PY_MINOR="$("${PYTHON_BIN}" -c 'import sys; print(sys.version_info[1])')"
echo "[Kivo] Detected Python ${PY_VERSION}"

if [[ "${PY_MAJOR}" -ne 3 || "${PY_MINOR}" -lt 10 || "${PY_MINOR}" -gt 12 ]]; then
  cat <<'EOF'
[Kivo] Python 3.10–3.12 recommended. Install via:
  sudo apt update && sudo apt install -y python3.12 python3.12-venv
or use pyenv:
  curl https://pyenv.run | bash
  pyenv install 3.12.6
  pyenv global 3.12.6
Then re-run this script.
EOF
  exit 1
fi

VENV_PATH="${PROJECT_ROOT}/.venv"
VENV_PYTHON="${VENV_PATH}/bin/python"

if [[ ! -x "${VENV_PYTHON}" ]]; then
  echo "[Kivo] Creating virtual environment at ${VENV_PATH}"
  "${PYTHON_BIN}" -m venv "${VENV_PATH}"
fi

echo "[Kivo] Upgrading pip/setuptools/wheel"
"${VENV_PYTHON}" -m pip install --upgrade pip setuptools wheel

install_requirements() {
  local file="$1"
  if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
    echo "[Kivo] Installing dependencies from ${file}"
    if "${VENV_PYTHON}" -m pip install --prefer-binary -r "${PROJECT_ROOT}/${file}"; then
      ACTIVE_REQUIREMENTS="${file}"
      return 0
    fi
  fi
  return 1
}

ACTIVE_REQUIREMENTS=""
install_requirements "backend/requirements.txt" || \
install_requirements "backend/requirements-lite.txt" || \
install_requirements "backend/requirements-dev-minimal.txt" || {
  echo "[Kivo] Failed to install dependencies. Check pip output above and ensure system packages (build-essential, libffi-dev, python3-dev) are present." >&2
  exit 1
}

echo "[Kivo] Environment ready using ${ACTIVE_REQUIREMENTS}"
echo "[Kivo] Activate with: source ${VENV_PATH}/bin/activate"
echo "[Kivo] Run tests: python -m pytest backend/tests"
