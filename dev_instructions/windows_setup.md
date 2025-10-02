# Windows Setup Guide for Kivo

This guide provides three supported paths to obtain a compatible Python 3.12 environment on Windows so you can run the Kivo backend locally. Choose the option that best matches your preferred workflow.

---

## Option A — Official Python.org Installer (recommended)

1. Download the 64-bit installer for Python 3.12.x: [python-3.12.6-amd64.exe](https://www.python.org/ftp/python/3.12.6/python-3.12.6-amd64.exe).
2. Run the installer:
   - Check **“Add Python to PATH”** on the first screen.
   - Choose **Install Now** (or Customize if you need a different location).
3. Open a new PowerShell window and verify the install:
   ```powershell
   python --version
   ```
   You should see `Python 3.12.x`.
4. Create and activate a virtual environment in the project folder:
   ```powershell
   cd C:\path\to\Kivo
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
5. Upgrade packaging tools and install dependencies:
   ```powershell
   python -m pip install --upgrade pip setuptools wheel
   python -m pip install -r backend\requirements.txt
   ```

---

## Option B — Microsoft Store Python 3.12

1. Install Python 3.12 via the Microsoft Store: [Python 3.12](https://apps.microsoft.com/detail/9ncvdn91xzqp).
2. After the Store install completes, open a new PowerShell window:
   ```powershell
   python --version
   ```
   Confirm it reports `Python 3.12.x`.
3. Set up a virtual environment and install dependencies (same steps as Option A):
   ```powershell
   cd C:\path\to\Kivo
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip setuptools wheel
   python -m pip install -r backend\requirements.txt
   ```

---

## Option C — Windows Subsystem for Linux (WSL) with Ubuntu

1. Enable WSL (requires Windows 10/11 64-bit):
   ```powershell
   wsl --install
   ```
   Reboot if prompted. Launch **Ubuntu** from the Start menu to complete initial setup.
2. Inside the Ubuntu shell, install dependencies for Python builds:
   ```bash
   sudo apt update
   sudo apt install -y build-essential curl git python3-venv python3-pip
   ```
   > If you prefer pyenv for version management, install it with:
   > ```bash
   > curl https://pyenv.run | bash
   > ```
   > Follow the instructions to add pyenv to your shell, then run:
   > ```bash
   > pyenv install 3.12.6
   > pyenv global 3.12.6
   > ```
3. Clone or navigate to your Kivo project directory (e.g., `/mnt/c/Users/YourName/Documents/Github/Kivo`).
4. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
5. Install backend dependencies:
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   python -m pip install -r backend/requirements.txt
   ```

After completing any option, run the helper scripts described in the project README or execute backend tests with:
```powershell
python -m pytest backend\tests
```
from PowerShell, or the equivalent command inside WSL.
