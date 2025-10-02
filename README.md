# Kivo

Kivo is an open-source research assistant focused on community insights from Reddit and X. It provides a Flutter-based Android chat client backed by a FastAPI service that runs fully locally with free tooling.

## Project Layout

- `backend/`: FastAPI service, research pipeline, and storage.
- `mobile/`: Flutter client with chat UI and backend integration.
- `examples/`: Sample research outputs.
- `scripts/`: Automation utilities including development setup.

## Quickstart

1. Run `scripts/dev_setup.sh` (macOS/Linux) or follow inline comments for Windows to install Python, pip packages, and Flutter dependencies.
2. Start the backend with `uvicorn app.main:app --reload` from `backend/`.
3. From `mobile/`, run `flutter create .` once to generate platform folders, then `flutter pub get` and `flutter run` targeting an Android emulator or device.

## Windows Users

- Read the step-by-step environment guide in [`dev_instructions/windows_setup.md`](dev_instructions/windows_setup.md).
- To automate dependency setup on PowerShell: `powershell -ExecutionPolicy Bypass -File .\scripts\setup_windows_env.ps1`.
- For WSL users: `bash ./scripts/setup_wsl.sh` inside the repository.

## License

Released under the [MIT License](LICENSE).
