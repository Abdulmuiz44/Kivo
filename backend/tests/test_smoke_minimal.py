import time

from fastapi.testclient import TestClient

from app.main import app


def test_smoke_research_endpoint():
    client = TestClient(app)
    response = client.post(
        "/research/run",
        json={"topic": "smoke test"},
    )
    assert response.status_code == 202
    run_id = response.json()["run_id"]

    for _ in range(30):
        status = client.get(f"/research/{run_id}/status")
        assert status.status_code == 200
        if status.json()["status"] == "completed":
            break
        time.sleep(0.1)
    else:
        raise AssertionError("Research run did not complete in time")

    summary = client.get(f"/research/{run_id}/summary")
    assert summary.status_code == 200
    assert summary.json()["run_id"] == run_id
