import time

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_run_lifecycle_pipeline():
    response = client.post(
        "/research/run",
        json={"topic": "test topic"},
    )
    assert response.status_code == 202
    run_id = response.json()["run_id"]

    status_payload = None
    for _ in range(20):
        status_response = client.get(f"/research/{run_id}/status")
        assert status_response.status_code == 200
        status_payload = status_response.json()
        if status_payload["status"] == "completed":
            break
        time.sleep(0.1)

    assert status_payload is not None
    assert status_payload["status"] == "completed"

    summary_response = client.get(f"/research/{run_id}/summary")
    assert summary_response.status_code == 200
    summary_json = summary_response.json()
    assert summary_json["run_id"] == run_id

    payload_response = client.get(f"/research/{run_id}/json")
    assert payload_response.status_code == 200
    payload_json = payload_response.json()
    assert payload_json["payload"]["pipeline_mode"] == "lite"
