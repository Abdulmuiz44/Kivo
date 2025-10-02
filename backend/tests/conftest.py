import pytest


@pytest.fixture(scope="session")
def require_full_pipeline():
    """Skip tests if heavy numeric dependencies are unavailable."""

    for lib in ("numpy", "sklearn", "pandas"):
        pytest.importorskip(lib, reason=f"{lib} is required for full pipeline tests")
